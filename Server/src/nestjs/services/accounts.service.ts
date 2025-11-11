import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account, AccountDocument } from '../schemas/account.schema';
import { CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';

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
  ) {}

  private toObjectId(id: string | Types.ObjectId | undefined): Types.ObjectId | undefined {
    if (!id) return undefined;
    if (id instanceof Types.ObjectId) return id;
    return new Types.ObjectId(id);
  }

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const accountData: Partial<Account> = {
      name: createAccountDto.name,
      organizationId: this.toObjectId(createAccountDto.organizationId),
    };

    if (createAccountDto.dynamicFields && typeof createAccountDto.dynamicFields === 'object') {
      accountData.dynamicFields = createAccountDto.dynamicFields;
    }

    const created = new this.accountModel(accountData);
    return created.save();
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
    const updateData: Record<string, any> = { ...updateAccountDto };

    if (updateAccountDto.organizationId) {
      updateData.organizationId = this.toObjectId(updateAccountDto.organizationId);
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

  remove(id: string) {
    return this.accountModel.findByIdAndDelete(id).exec();
  }

  async deleteMany(ids: (string | number)[]) {
    const objectIds = ids
      .map((id) => (typeof id === 'string' ? id : id.toString()))
      .map((id) => new Types.ObjectId(id));

    const result = await this.accountModel.deleteMany({ _id: { $in: objectIds } }).exec();
    return { deletedCount: result.deletedCount };
  }
}

