import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Parent, ParentDocument } from '../schemas/parent.schema';
import { CreateParentDto, UpdateParentDto } from '../dto/parent.dto';
import { KidService } from './kid.service';
import { ContactService } from './contact.service';
import { ContactRelationshipService } from './contact-relationship.service';
import { ContactType } from '../schemas/contact.schema';
import { ContactRelation } from '../schemas/contact-relationship.schema';
import { namespaceDynamicFields } from '../utils/contact-dynamic-fields.util';
import { isUnifiedContactsEnabled } from '../utils/feature-flags.util';

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent.name) private readonly parentModel: Model<ParentDocument>,
    @Inject(forwardRef(() => KidService))
    private readonly kidService: KidService,
    private readonly contactService: ContactService,
    private readonly contactRelationshipService: ContactRelationshipService,
  ) {}

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    const session = await this.parentModel.db.startSession();
    session.startTransaction();

    try {
      let contactId: Types.ObjectId | undefined;
      if (this.isContactSyncEnabled()) {
        contactId = await this.createContactForParent(
          {
            firstname: createParentDto.firstname,
            lastname: createParentDto.lastname,
            organizationId: createParentDto.organizationId,
            idNumber: createParentDto.idNumber,
            dynamicFields: this.mapParentDynamicFields(createParentDto.dynamicFields),
          },
          session,
        );
      }

      const parentData: Record<string, unknown> = {
        firstname: createParentDto.firstname,
        lastname: createParentDto.lastname,
        organizationId: new Types.ObjectId(createParentDto.organizationId),
        linked_kids: [],
      };

      if (createParentDto.idNumber) {
        parentData.idNumber = createParentDto.idNumber;
      }

      if (contactId) {
        parentData.contactId = contactId;
      }

      if (createParentDto.linked_kids && Array.isArray(createParentDto.linked_kids) && createParentDto.linked_kids.length > 0) {
        parentData.linked_kids = createParentDto.linked_kids
          .filter(kidId => kidId && Types.ObjectId.isValid(kidId))
          .map(kidId => new Types.ObjectId(kidId));
      }

      if (createParentDto.dynamicFields && typeof createParentDto.dynamicFields === 'object') {
        parentData.dynamicFields = createParentDto.dynamicFields;
      }

      const createdParent = new this.parentModel(parentData);
      const savedParent = (await createdParent.save({ session })) as ParentDocument;

      if (savedParent.linked_kids && savedParent.linked_kids.length > 0) {
        const kidIds = savedParent.linked_kids.map(k => k.toString());
        await this.kidService.addParentToKids(kidIds, savedParent._id.toString(), session);
        await this.ensureParentRelationships(savedParent, kidIds, session);
      }

      await session.commitTransaction();
      return savedParent;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(organizationId: string): Promise<Parent[]> {
    return this.parentModel.find({ organizationId: new Types.ObjectId(organizationId) }).exec();
  }

  async findOne(id: string): Promise<Parent | null> {
    return this.parentModel.findById(id).exec();
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent | null> {
    const session = await this.parentModel.db.startSession();
    session.startTransaction();

    try {
      const existingParent = await this.parentModel.findById(id).session(session).exec();
      if (!existingParent) {
        await session.abortTransaction();
        return null;
      }

      const updateData: Record<string, unknown> = {};

      if (updateParentDto.firstname !== undefined) {
        updateData.firstname = updateParentDto.firstname;
      }
      if (updateParentDto.lastname !== undefined) {
        updateData.lastname = updateParentDto.lastname;
      }
      if (updateParentDto.idNumber !== undefined) {
        updateData.idNumber = updateParentDto.idNumber;
      }

      if (updateParentDto.dynamicFields && typeof updateParentDto.dynamicFields === 'object') {
        const dynamicFieldsUpdate: Record<string, unknown> = {};
        Object.keys(updateParentDto.dynamicFields).forEach(key => {
          dynamicFieldsUpdate[`dynamicFields.${key}`] = updateParentDto.dynamicFields?.[key];
        });
        Object.assign(updateData, dynamicFieldsUpdate);
      }

      if (updateParentDto.linked_kids) {
        updateData.linked_kids = updateParentDto.linked_kids.map(kidId => new Types.ObjectId(kidId));
      }

      const shouldSyncContacts = this.isContactSyncEnabled();
      if (shouldSyncContacts) {
        const namespacedDynamicFields = this.mapParentDynamicFields(updateParentDto.dynamicFields);

        const parentContactId = existingParent.contactId
          ? existingParent.contactId.toString()
          : undefined;

        if (!parentContactId) {
          const contactId = await this.createContactForParent(
            {
              firstname: updateParentDto.firstname ?? existingParent.firstname,
              lastname: updateParentDto.lastname ?? existingParent.lastname,
              organizationId: existingParent.organizationId.toString(),
              idNumber: updateParentDto.idNumber ?? existingParent.idNumber,
              dynamicFields: namespacedDynamicFields ?? this.mapParentDynamicFields(existingParent.dynamicFields as Record<string, unknown>),
            },
            session,
          );
          updateData.contactId = contactId;
        } else {
          await this.contactService.update(
            parentContactId,
            {
              firstname: updateParentDto.firstname,
              lastname: updateParentDto.lastname,
              idNumber: updateParentDto.idNumber,
              dynamicFields: namespacedDynamicFields,
            },
            session,
          );
        }
      }

      const updatedParent = (await this.parentModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .exec()) as ParentDocument | null;

      if (!updatedParent) {
        await session.abortTransaction();
        return null;
      }

      const existingKidIds = (existingParent.linked_kids || []).map(k => k.toString());
      const newKidIds = (updatedParent.linked_kids || []).map(k => k.toString());

      const kidsToRemove = existingKidIds.filter(kid => !newKidIds.includes(kid));
      const kidsToAdd = newKidIds.filter(kid => !existingKidIds.includes(kid));

      if (kidsToRemove.length > 0) {
        await this.kidService.removeParentFromKids(kidsToRemove, id, session);
        await this.removeParentRelationships(existingParent, kidsToRemove, session);
      }

      if (kidsToAdd.length > 0) {
        await this.kidService.addParentToKids(kidsToAdd, id, session);
        await this.ensureParentRelationships(updatedParent as ParentDocument, kidsToAdd, session);
      }

      await session.commitTransaction();
      return updatedParent;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string): Promise<Parent | null> {
    const session = await this.parentModel.db.startSession();
    session.startTransaction();

    try {
      const parent = await this.parentModel.findById(id).session(session).exec();
      if (!parent) {
        await session.abortTransaction();
        return null;
      }

      if (parent.linked_kids && parent.linked_kids.length > 0) {
        const kidIds = parent.linked_kids.map(k => k.toString());
        await this.kidService.removeParentFromKids(kidIds, id, session);
        await this.removeParentRelationships(parent, kidIds, session);
      }

      if (this.isContactSyncEnabled() && parent.contactId) {
        const contactId = parent.contactId.toString();
        await this.contactRelationshipService.removeAllForContact(contactId, session);
        await this.contactService.remove(contactId, session);
      }

      const deletedParent = await this.parentModel.findByIdAndDelete(id).session(session).exec();

      await session.commitTransaction();
      return deletedParent;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async addKidToParent(parentId: string, kidId: string, session?: ClientSession): Promise<void> {
    const updateOptions: Record<string, unknown> = { new: true };
    if (session) {
      updateOptions.session = session;
    }

    const parent = (await this.parentModel.findByIdAndUpdate(
      parentId,
      { $addToSet: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions,
    ).exec()) as ParentDocument | null;

    if (parent) {
      await this.ensureParentRelationships(parent, [kidId], session);
    }
  }

  async removeKidFromParent(parentId: string, kidId: string, session?: ClientSession): Promise<void> {
    const updateOptions: Record<string, unknown> = { new: true };
    if (session) {
      updateOptions.session = session;
    }

    const parent = (await this.parentModel.findByIdAndUpdate(
      parentId,
      { $pull: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions,
    ).exec()) as ParentDocument | null;

    if (parent) {
      await this.removeParentRelationships(parent, [kidId], session);
    }
  }

  async addKidToParents(parentIds: string[], kidId: string, session?: ClientSession): Promise<void> {
    if (parentIds.length === 0) {
      return;
    }

    const updateOptions: Record<string, unknown> = {};
    if (session) {
      updateOptions.session = session;
    }

    await this.parentModel.updateMany(
      { _id: { $in: parentIds.map(id => new Types.ObjectId(id)) } },
      { $addToSet: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions,
    ).exec();

    const parents = (await this.parentModel
      .find({ _id: { $in: parentIds.map(id => new Types.ObjectId(id)) } })
      .exec()) as ParentDocument[];

    await Promise.all(parents.map(parent => this.ensureParentRelationships(parent, [kidId], session)));
  }

  async removeKidFromParents(parentIds: string[], kidId: string, session?: ClientSession): Promise<void> {
    if (parentIds.length === 0) {
      return;
    }

    const updateOptions: Record<string, unknown> = {};
    if (session) {
      updateOptions.session = session;
    }

    await this.parentModel.updateMany(
      { _id: { $in: parentIds.map(id => new Types.ObjectId(id)) } },
      { $pull: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions,
    ).exec();

    const parents = (await this.parentModel
      .find({ _id: { $in: parentIds.map(id => new Types.ObjectId(id)) } })
      .exec()) as ParentDocument[];

    await Promise.all(parents.map(parent => this.removeParentRelationships(parent, [kidId], session)));
  }

  private isContactSyncEnabled(): boolean {
    return isUnifiedContactsEnabled();
  }

  private mapParentDynamicFields(fields?: Record<string, unknown>): Record<string, unknown> | undefined {
    return namespaceDynamicFields(fields as Record<string, unknown> | undefined, 'parent');
  }

  private async createContactForParent(
    payload: {
      firstname: string;
      lastname: string;
      organizationId: string;
      idNumber?: string;
      dynamicFields?: Record<string, unknown>;
    },
    session?: ClientSession,
  ): Promise<Types.ObjectId> {
    const contact = await this.contactService.create(
      {
        firstname: payload.firstname,
        lastname: payload.lastname,
        type: ContactType.PARENT,
        organizationId: payload.organizationId,
        idNumber: payload.idNumber,
        dynamicFields: payload.dynamicFields,
      },
      session,
    );

    return new Types.ObjectId(contact._id);
  }

  private async ensureParentRelationships(parent: ParentDocument, kidIds: string[], session?: ClientSession): Promise<void> {
    if (!this.isContactSyncEnabled() || kidIds.length === 0) {
      return;
    }

    const updatedParent = parent.contactId
      ? parent
      : await this.parentModel.findById(parent._id).exec();

    if (!updatedParent?.contactId) {
      return;
    }

    const kids = await this.kidService.findByIds(kidIds);
    const parentContactId = updatedParent.contactId.toString();

    await Promise.all(
      kids
        .filter(kid => kid.contactId)
        .map(async kid => {
          const kidContactId = kid.contactId!.toString();
          await this.contactRelationshipService.upsert(
            {
              sourceContactId: parentContactId,
              targetContactId: kidContactId,
              relation: ContactRelation.PARENT,
            },
            session,
          );
          await this.contactRelationshipService.upsert(
            {
              sourceContactId: kidContactId,
              targetContactId: parentContactId,
              relation: ContactRelation.CHILD,
            },
            session,
          );
        }),
    );
  }

  private async removeParentRelationships(parent: ParentDocument, kidIds: string[], session?: ClientSession): Promise<void> {
    if (!this.isContactSyncEnabled() || !parent.contactId || kidIds.length === 0) {
      return;
    }

    const kids = await this.kidService.findByIds(kidIds);
    const parentContactId = parent.contactId.toString();

    await Promise.all(
      kids
        .filter(kid => kid.contactId)
        .map(async kid => {
          const kidContactId = kid.contactId!.toString();
          await this.contactRelationshipService.removeByPair(parentContactId, kidContactId, session);
          await this.contactRelationshipService.removeByPair(kidContactId, parentContactId, session);
        }),
    );
  }
}

