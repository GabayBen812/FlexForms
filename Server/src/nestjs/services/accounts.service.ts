import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account, AccountDocument } from '../schemas/account.schema';
import { CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';
import { Contact, ContactDocument } from '../schemas/contact.schema';

interface FindAllQuery {
  page?: number | string;
  pageSize?: number | string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
  ) {}

  private toObjectId(id: string | Types.ObjectId | undefined): Types.ObjectId | undefined {
    if (!id) return undefined;
    if (id instanceof Types.ObjectId) return id;
    return new Types.ObjectId(id);
  }

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    if (!createAccountDto.organizationId) {
      throw new Error('OrganizationId is required');
    }

    const organizationId = this.toObjectId(createAccountDto.organizationId);
    if (!organizationId) {
      throw new Error('Invalid organizationId');
    }

    const accountData: Partial<Account> = {
      name: createAccountDto.name,
      organizationId: organizationId,
      linked_contacts: [],
    };

    if (createAccountDto.linked_contacts && Array.isArray(createAccountDto.linked_contacts) && createAccountDto.linked_contacts.length > 0) {
      accountData.linked_contacts = createAccountDto.linked_contacts
        .filter(contactId => contactId && Types.ObjectId.isValid(contactId))
        .map(contactId => new Types.ObjectId(contactId));
    }

    if (createAccountDto.dynamicFields && typeof createAccountDto.dynamicFields === 'object') {
      accountData.dynamicFields = createAccountDto.dynamicFields;
    }

    const created = new this.accountModel(accountData);
    const savedAccount = await created.save();

    // Update contacts' accountId to maintain bidirectional relationship
    if (accountData.linked_contacts && accountData.linked_contacts.length > 0) {
      await this.contactModel.updateMany(
        { _id: { $in: accountData.linked_contacts } },
        { accountId: savedAccount._id },
      ).exec();
    }

    return savedAccount;
  }

  async findAll(organizationId: string, query: FindAllQuery = {}) {
    const filter: Record<string, any> = {
      organizationId: this.toObjectId(organizationId),
    };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    Object.keys(query).forEach((key) => {
      if (key.startsWith('dynamicFields.') && query[key] !== undefined && query[key] !== '') {
        if (query[key] === 'true' || query[key] === 'false') {
          filter[key] = query[key] === 'true';
        } else {
          filter[key] = { $regex: query[key], $options: 'i' };
        }
      }
    });

    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const pageSize = Number(query.pageSize) > 0 ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;

    const sort: Record<string, 1 | -1> = {};
    if (query.sortBy) {
      sort[query.sortBy] = query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const [data, totalCount] = await Promise.all([
      this.accountModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.accountModel.countDocuments(filter),
    ]);

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  findOne(id: string) {
    return this.accountModel.findById(id).exec();
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    // Get the current account to check the old linked_contacts
    const currentAccount = await this.accountModel.findById(id).lean<Account>().exec();
    if (!currentAccount) {
      return null;
    }

    const updateData: Record<string, any> = { ...updateAccountDto };

    if (updateAccountDto.organizationId) {
      updateData.organizationId = this.toObjectId(updateAccountDto.organizationId);
    }

    // Handle linked_contacts update - maintain bidirectional relationship
    if (updateAccountDto.linked_contacts !== undefined) {
      const newContactIds = updateAccountDto.linked_contacts && Array.isArray(updateAccountDto.linked_contacts)
        ? updateAccountDto.linked_contacts
            .filter(contactId => contactId && Types.ObjectId.isValid(contactId))
            .map(contactId => new Types.ObjectId(contactId))
        : [];
      const oldContactIds = currentAccount.linked_contacts && Array.isArray(currentAccount.linked_contacts)
        ? currentAccount.linked_contacts.map(contactId => contactId instanceof Types.ObjectId ? contactId : new Types.ObjectId(contactId))
        : [];

      updateData.linked_contacts = newContactIds;

      // Find contacts to remove and add
      const contactsToRemove = oldContactIds.filter(oldId => 
        !newContactIds.some(newId => newId.equals(oldId))
      );
      const contactsToAdd = newContactIds.filter(newId => 
        !oldContactIds.some(oldId => oldId.equals(newId))
      );

      // Remove accountId from contacts that are no longer linked
      if (contactsToRemove.length > 0) {
        await this.contactModel.updateMany(
          { _id: { $in: contactsToRemove } },
          { $unset: { accountId: '' } },
        ).exec();
      }

      // Set accountId on contacts that are newly linked
      if (contactsToAdd.length > 0) {
        await this.contactModel.updateMany(
          { _id: { $in: contactsToAdd } },
          { accountId: new Types.ObjectId(id) },
        ).exec();
      }
    }

    if (updateAccountDto.dynamicFields && typeof updateAccountDto.dynamicFields === 'object') {
      const dynamicFieldsUpdate: Record<string, any> = {};
      Object.keys(updateAccountDto.dynamicFields).forEach((key) => {
        dynamicFieldsUpdate[`dynamicFields.${key}`] = updateAccountDto.dynamicFields?.[key];
      });
      delete updateData.dynamicFields;
      Object.assign(updateData, dynamicFieldsUpdate);
    }

    return this.accountModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string) {
    // Get the account to find its linked_contacts
    const account = await this.accountModel.findById(id).lean<Account>().exec();
    if (account && account.linked_contacts && account.linked_contacts.length > 0) {
      const contactIds = account.linked_contacts.map(contactId => 
        contactId instanceof Types.ObjectId ? contactId : new Types.ObjectId(contactId)
      );
      // Remove accountId from linked contacts
      await this.contactModel.updateMany(
        { _id: { $in: contactIds } },
        { $unset: { accountId: '' } },
      ).exec();
    }

    return this.accountModel.findByIdAndDelete(id).exec();
  }
}

