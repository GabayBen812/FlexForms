import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, Types } from 'mongoose';
import { Contact, ContactDocument, ContactStatus, ContactType } from '../schemas/contact.schema';
import { CreateContactDto, UpdateContactDto } from '../dto/contact.dto';
import { buildDynamicFieldsUpdate, ensureValidDynamicFields } from '../utils/contact-dynamic-fields.util';
import { Account, AccountDocument } from '../schemas/account.schema';

export interface ContactQueryOptions {
  organizationId: string;
  type?: ContactType;
  status?: ContactStatus;
  search?: string;
  dynamicFieldFilters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface ContactSearchResult {
  data: Contact[];
  totalCount: number;
  totalPages: number;
}

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
  ) {}

  async create(createContactDto: CreateContactDto, session?: ClientSession): Promise<ContactDocument> {
    const dynamicFields = ensureValidDynamicFields(createContactDto.dynamicFields);

    const contactData: Record<string, unknown> = {
      firstname: createContactDto.firstname,
      lastname: createContactDto.lastname,
      type: createContactDto.type,
      organizationId: new Types.ObjectId(createContactDto.organizationId),
      idNumber: createContactDto.idNumber,
      email: createContactDto.email,
      phone: createContactDto.phone,
      address: createContactDto.address,
      profileImageUrl: createContactDto.profileImageUrl,
      status: createContactDto.status,
      dynamicFields: dynamicFields ?? {},
    };

    if (createContactDto.accountId && Types.ObjectId.isValid(createContactDto.accountId)) {
      contactData.accountId = new Types.ObjectId(createContactDto.accountId);
    }

    const contact = new this.contactModel(contactData);
    const savedContact = await contact.save({ session });

    // Update account's linked_contacts after contact is saved
    if (createContactDto.accountId && Types.ObjectId.isValid(createContactDto.accountId)) {
      await this.accountModel.findByIdAndUpdate(
        createContactDto.accountId,
        { $addToSet: { linked_contacts: savedContact._id } },
        { session },
      ).exec();
    }

    return savedContact;
  }

  async findById(id: string): Promise<Contact | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.contactModel.findById(id).lean<Contact>().exec();
  }

  async update(id: string, updateContactDto: UpdateContactDto, session?: ClientSession): Promise<Contact | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    // Get the current contact to check the old accountId
    const currentContact = await this.contactModel.findById(id).lean<Contact>().exec();
    if (!currentContact) {
      return null;
    }

    const updatePayload: Record<string, unknown> = {};

    if (updateContactDto.firstname !== undefined) {
      updatePayload.firstname = updateContactDto.firstname;
    }

    if (updateContactDto.lastname !== undefined) {
      updatePayload.lastname = updateContactDto.lastname;
    }

    if (updateContactDto.type !== undefined) {
      updatePayload.type = updateContactDto.type;
    }

    if (updateContactDto.idNumber !== undefined) {
      updatePayload.idNumber = updateContactDto.idNumber;
    }

    if (updateContactDto.email !== undefined) {
      updatePayload.email = updateContactDto.email;
    }

    if (updateContactDto.phone !== undefined) {
      updatePayload.phone = updateContactDto.phone;
    }

    if (updateContactDto.address !== undefined) {
      updatePayload.address = updateContactDto.address;
    }
    if (updateContactDto.profileImageUrl !== undefined) {
      updatePayload.profileImageUrl = updateContactDto.profileImageUrl;
    }

    if (updateContactDto.status !== undefined) {
      updatePayload.status = updateContactDto.status;
    }

    // Handle accountId update - maintain bidirectional relationship
    if (updateContactDto.accountId !== undefined) {
      const newAccountId = updateContactDto.accountId 
        ? (Types.ObjectId.isValid(updateContactDto.accountId) ? new Types.ObjectId(updateContactDto.accountId) : null)
        : null;
      const oldAccountId = currentContact.accountId 
        ? (currentContact.accountId instanceof Types.ObjectId ? currentContact.accountId : new Types.ObjectId(currentContact.accountId))
        : null;

      updatePayload.accountId = newAccountId;

      // Remove contact from old account's linked_contacts
      if (oldAccountId && (!newAccountId || !oldAccountId.equals(newAccountId))) {
        await this.accountModel.findByIdAndUpdate(
          oldAccountId,
          { $pull: { linked_contacts: new Types.ObjectId(id) } },
          { session },
        ).exec();
      }

      // Add contact to new account's linked_contacts
      if (newAccountId && (!oldAccountId || !newAccountId.equals(oldAccountId))) {
        await this.accountModel.findByIdAndUpdate(
          newAccountId,
          { $addToSet: { linked_contacts: new Types.ObjectId(id) } },
          { session },
        ).exec();
      }
    }

    if (updateContactDto.dynamicFields) {
      const dynamicFieldsUpdate = buildDynamicFieldsUpdate(updateContactDto.dynamicFields);

      if (dynamicFieldsUpdate) {
        Object.assign(updatePayload, dynamicFieldsUpdate);
      }
    }

    return this.contactModel
      .findByIdAndUpdate(id, updatePayload, { new: true, session })
      .lean<Contact>()
      .exec();
  }

  async remove(id: string, session?: ClientSession): Promise<Contact | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    // Get the contact to find its accountId
    const contact = await this.contactModel.findById(id).lean<Contact>().exec();
    if (contact && contact.accountId) {
      const accountId = contact.accountId instanceof Types.ObjectId 
        ? contact.accountId 
        : new Types.ObjectId(contact.accountId);
      // Remove contact from account's linked_contacts
      await this.accountModel.findByIdAndUpdate(
        accountId,
        { $pull: { linked_contacts: new Types.ObjectId(id) } },
        { session },
      ).exec();
    }

    return this.contactModel.findByIdAndDelete(id, { session }).lean<Contact>().exec();
  }

  async search(options: ContactQueryOptions): Promise<ContactSearchResult> {
    const filter = this.buildFilterQuery(options);
    const limit = Math.min(options.limit ?? 50, 100);
    const offset = options.offset ?? 0;

    const [data, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ lastname: 1, firstname: 1 })
        .lean<Contact[]>()
        .exec(),
      this.contactModel.countDocuments(filter).exec(),
    ]);

    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    return { data, totalCount: total, totalPages };
  }

  private buildFilterQuery(options: ContactQueryOptions): FilterQuery<ContactDocument> {
    const filter: FilterQuery<ContactDocument> = {
      organizationId: new Types.ObjectId(options.organizationId),
    };

    if (options.type) {
      filter.type = options.type;
    }

    if (options.status) {
      filter.status = options.status;
    }

    if (options.search) {
      const regex = new RegExp(options.search.trim(), 'i');
      filter.$or = [{ firstname: regex }, { lastname: regex }, { idNumber: regex }, { email: regex }, { phone: regex }];
    }

    if (options.dynamicFieldFilters) {
      Object.entries(options.dynamicFieldFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }
        filter[`dynamicFields.${key}`] = value;
      });
    }

    return filter;
  }
}


