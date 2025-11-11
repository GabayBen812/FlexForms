import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { ContactRelationship, ContactRelationshipDocument } from '../schemas/contact-relationship.schema';
import { CreateContactRelationshipDto, UpdateContactRelationshipDto } from '../dto/contact.dto';

@Injectable()
export class ContactRelationshipService {
  constructor(
    @InjectModel(ContactRelationship.name)
    private readonly relationshipModel: Model<ContactRelationshipDocument>,
  ) {}

  async create(dto: CreateContactRelationshipDto, session?: ClientSession): Promise<ContactRelationship> {
    const relationship = new this.relationshipModel({
      sourceContactId: new Types.ObjectId(dto.sourceContactId),
      targetContactId: new Types.ObjectId(dto.targetContactId),
      relation: dto.relation,
      note: dto.note,
      priority: dto.priority,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });

    return relationship.save({ session });
  }

  async upsert(dto: CreateContactRelationshipDto, session?: ClientSession): Promise<ContactRelationship> {
    return this.relationshipModel
      .findOneAndUpdate(
        {
          sourceContactId: new Types.ObjectId(dto.sourceContactId),
          targetContactId: new Types.ObjectId(dto.targetContactId),
        },
        {
          $set: {
            relation: dto.relation,
            note: dto.note,
            priority: dto.priority,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          },
        },
        { upsert: true, new: true, session },
      )
      .exec();
  }

  async findByContact(contactId: string): Promise<ContactRelationship[]> {
    if (!Types.ObjectId.isValid(contactId)) {
      return [];
    }

    return this.relationshipModel
      .find({
        $or: [
          { sourceContactId: new Types.ObjectId(contactId) },
          { targetContactId: new Types.ObjectId(contactId) },
        ],
      })
      .lean<ContactRelationship[]>()
      .exec();
  }

  async findByContacts(contactIds: string[]): Promise<ContactRelationship[]> {
    const validIds = contactIds.filter(id => Types.ObjectId.isValid(id));
    if (!validIds.length) {
      return [];
    }

    return this.relationshipModel
      .find({
        $or: [
          { sourceContactId: { $in: validIds.map(id => new Types.ObjectId(id)) } },
          { targetContactId: { $in: validIds.map(id => new Types.ObjectId(id)) } },
        ],
      })
      .lean<ContactRelationship[]>()
      .exec();
  }

  async update(id: string, dto: UpdateContactRelationshipDto): Promise<ContactRelationship | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.relation !== undefined) {
      updatePayload.relation = dto.relation;
    }

    if (dto.note !== undefined) {
      updatePayload.note = dto.note;
    }

    if (dto.priority !== undefined) {
      updatePayload.priority = dto.priority;
    }

    if (dto.startDate !== undefined) {
      updatePayload.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }

    if (dto.endDate !== undefined) {
      updatePayload.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    return this.relationshipModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .lean<ContactRelationship>()
      .exec();
  }

  async remove(id: string, session?: ClientSession): Promise<ContactRelationship | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.relationshipModel.findByIdAndDelete(id, { session }).lean<ContactRelationship>().exec();
  }

  async removeByPair(sourceContactId: string, targetContactId: string, session?: ClientSession): Promise<void> {
    if (!Types.ObjectId.isValid(sourceContactId) || !Types.ObjectId.isValid(targetContactId)) {
      return;
    }

    await this.relationshipModel
      .deleteMany(
        {
          sourceContactId: new Types.ObjectId(sourceContactId),
          targetContactId: new Types.ObjectId(targetContactId),
        },
        { session },
      )
      .exec();
  }

  async removeAllForContact(contactId: string, session?: ClientSession): Promise<void> {
    if (!Types.ObjectId.isValid(contactId)) {
      return;
    }

    await this.relationshipModel
      .deleteMany(
        {
          $or: [
            { sourceContactId: new Types.ObjectId(contactId) },
            { targetContactId: new Types.ObjectId(contactId) },
          ],
        },
        { session },
      )
      .exec();
  }
}


