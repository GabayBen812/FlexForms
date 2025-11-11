import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, Types } from 'mongoose';
import { Contact, ContactDocument, ContactStatus, ContactType } from '../schemas/contact.schema';
import { CreateContactDto, UpdateContactDto } from '../dto/contact.dto';
import { buildDynamicFieldsUpdate, ensureValidDynamicFields } from '../utils/contact-dynamic-fields.util';

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
  constructor(@InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>) {}

  async create(createContactDto: CreateContactDto, session?: ClientSession): Promise<ContactDocument> {
    const dynamicFields = ensureValidDynamicFields(createContactDto.dynamicFields);

    const contact = new this.contactModel({
      firstname: createContactDto.firstname,
      lastname: createContactDto.lastname,
      type: createContactDto.type,
      organizationId: new Types.ObjectId(createContactDto.organizationId),
      idNumber: createContactDto.idNumber,
      email: createContactDto.email,
      phone: createContactDto.phone,
      address: createContactDto.address,
      status: createContactDto.status,
      dynamicFields: dynamicFields ?? {},
    });

    return contact.save({ session });
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

    if (updateContactDto.status !== undefined) {
      updatePayload.status = updateContactDto.status;
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


