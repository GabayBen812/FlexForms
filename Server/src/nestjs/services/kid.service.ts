import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Kid, KidDocument } from '../schemas/kid.schema';
import { CreateKidDto, UpdateKidDto } from '../dto/kid.dto';
import { ParentService } from './parent.service';
import { ContactService } from './contact.service';
import { ContactRelationshipService } from './contact-relationship.service';
import { ContactType } from '../schemas/contact.schema';
import { namespaceDynamicFields } from '../utils/contact-dynamic-fields.util';
import { isUnifiedContactsEnabled } from '../utils/feature-flags.util';

@Injectable()
export class KidService {
  constructor(
    @InjectModel(Kid.name) private readonly kidModel: Model<KidDocument>,
    @Inject(forwardRef(() => ParentService))
    private readonly parentService: ParentService,
    private readonly contactService: ContactService,
    private readonly contactRelationshipService: ContactRelationshipService,
  ) {}

  async create(createKidDto: CreateKidDto): Promise<Kid> {
    const session = await this.kidModel.db.startSession();
    session.startTransaction();

    try {
      let contactId: Types.ObjectId | undefined;
      if (this.isContactSyncEnabled()) {
        contactId = await this.createContactForKid(
          {
            firstname: createKidDto.firstname,
            lastname: createKidDto.lastname,
            organizationId: createKidDto.organizationId,
            idNumber: createKidDto.idNumber,
            address: createKidDto.address,
            profileImageUrl: createKidDto.profileImageUrl,
            dynamicFields: this.mapKidDynamicFields(createKidDto.dynamicFields),
          },
          session,
        );
      }

      const kidData: Record<string, unknown> = {
        firstname: createKidDto.firstname,
        lastname: createKidDto.lastname,
        organizationId: new Types.ObjectId(createKidDto.organizationId),
        linked_parents: [],
      };

      if (createKidDto.profileImageUrl) {
        kidData.profileImageUrl = createKidDto.profileImageUrl;
      }

      if (createKidDto.address) {
        kidData.address = createKidDto.address;
      }

      if (createKidDto.idNumber) {
        kidData.idNumber = createKidDto.idNumber;
      }

      if (contactId) {
        kidData.contactId = contactId;
      }

      if (createKidDto.linked_parents && Array.isArray(createKidDto.linked_parents) && createKidDto.linked_parents.length > 0) {
        kidData.linked_parents = createKidDto.linked_parents
          .filter(parentId => parentId && Types.ObjectId.isValid(parentId))
          .map(parentId => new Types.ObjectId(parentId));
      }

      if (createKidDto.dynamicFields && typeof createKidDto.dynamicFields === 'object') {
        kidData.dynamicFields = createKidDto.dynamicFields;
      }

      const createdKid = new this.kidModel(kidData);
      const savedKid = (await createdKid.save({ session })) as KidDocument;

      if (savedKid.linked_parents && savedKid.linked_parents.length > 0) {
        const parentIds = savedKid.linked_parents.map(p => p.toString());
        await this.parentService.addKidToParents(parentIds, savedKid._id.toString(), session);
      }

      await session.commitTransaction();
      return savedKid;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(organizationId: string, query: Record<string, any> = {}): Promise<Kid[]> {
    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (query.firstname) {
      filter.firstname = { $regex: query.firstname, $options: 'i' };
    }
    if (query.lastname) {
      filter.lastname = { $regex: query.lastname, $options: 'i' };
    }
    if (query.idNumber) {
      filter.idNumber = { $regex: query.idNumber, $options: 'i' };
    }
    if (query.address) {
      filter.address = { $regex: query.address, $options: 'i' };
    }

    Object.keys(query).forEach(key => {
      if (key.startsWith('dynamicFields.') && query[key] !== undefined && query[key] !== '') {
        if (query[key] === 'true' || query[key] === 'false') {
          filter[key] = query[key] === 'true';
        } else {
          filter[key] = { $regex: query[key], $options: 'i' };
        }
      }
    });

    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === '') {
        delete filter[key];
      }
    });

    return this.kidModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Kid | null> {
    return this.kidModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<KidDocument[]> {
    if (!ids.length) {
      return [];
    }

    return this.kidModel
      .find({ _id: { $in: ids.map(id => new Types.ObjectId(id)) } })
      .exec() as Promise<KidDocument[]>;
  }

  async update(id: string, updateKidDto: UpdateKidDto): Promise<Kid | null> {
    const session = await this.kidModel.db.startSession();
    session.startTransaction();

    try {
      const existingKid = await this.kidModel.findById(id).session(session).exec();
      if (!existingKid) {
        await session.abortTransaction();
        return null;
      }

      const updateData: Record<string, unknown> = {};

      if (updateKidDto.firstname !== undefined) {
        updateData.firstname = updateKidDto.firstname;
      }
      if (updateKidDto.lastname !== undefined) {
        updateData.lastname = updateKidDto.lastname;
      }
      if (updateKidDto.address !== undefined) {
        updateData.address = updateKidDto.address;
      }
      if (updateKidDto.idNumber !== undefined) {
        updateData.idNumber = updateKidDto.idNumber;
      }
      if (updateKidDto.profileImageUrl !== undefined) {
        updateData.profileImageUrl = updateKidDto.profileImageUrl;
      }

      if (updateKidDto.dynamicFields && typeof updateKidDto.dynamicFields === 'object') {
        const dynamicFieldsUpdate: Record<string, unknown> = {};
        Object.keys(updateKidDto.dynamicFields).forEach(key => {
          dynamicFieldsUpdate[`dynamicFields.${key}`] = updateKidDto.dynamicFields?.[key];
        });
        Object.assign(updateData, dynamicFieldsUpdate);
      }

      if (updateKidDto.linked_parents) {
        updateData.linked_parents = updateKidDto.linked_parents.map(parentId => new Types.ObjectId(parentId));
      }

      const shouldSyncContacts = this.isContactSyncEnabled();
      let contactCreated = false;
      if (shouldSyncContacts) {
        const namespacedDynamicFields = this.mapKidDynamicFields(updateKidDto.dynamicFields);
        const kidContactId = existingKid.contactId ? existingKid.contactId.toString() : undefined;

        if (!kidContactId) {
          const newContactId = await this.createContactForKid(
            {
              firstname: updateKidDto.firstname ?? existingKid.firstname,
              lastname: updateKidDto.lastname ?? existingKid.lastname,
              organizationId: existingKid.organizationId.toString(),
              idNumber: updateKidDto.idNumber ?? existingKid.idNumber,
              address: updateKidDto.address ?? existingKid.address,
              profileImageUrl: updateKidDto.profileImageUrl ?? existingKid.profileImageUrl,
              dynamicFields: namespacedDynamicFields ?? this.mapKidDynamicFields(existingKid.dynamicFields as Record<string, unknown>),
            },
            session,
          );
          updateData.contactId = newContactId;
          contactCreated = true;
        } else {
          await this.contactService.update(
            kidContactId,
            {
              firstname: updateKidDto.firstname,
              lastname: updateKidDto.lastname,
              idNumber: updateKidDto.idNumber,
              address: updateKidDto.address,
              profileImageUrl: updateKidDto.profileImageUrl,
              dynamicFields: namespacedDynamicFields,
            },
            session,
          );
        }
      }

      const updatedKid = (await this.kidModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .exec()) as KidDocument | null;

      if (!updatedKid) {
        await session.abortTransaction();
        return null;
      }

      const existingParentIds = (existingKid.linked_parents || []).map(p => p.toString());
      const newParentIds = (updatedKid.linked_parents || []).map(p => p.toString());

      const parentsToRemove = existingParentIds.filter(pid => !newParentIds.includes(pid));
      const parentsToAdd = newParentIds.filter(pid => !existingParentIds.includes(pid));

      if (parentsToRemove.length > 0) {
        await this.parentService.removeKidFromParents(parentsToRemove, id, session);
      }

      if (parentsToAdd.length > 0) {
        await this.parentService.addKidToParents(parentsToAdd, id, session);
      }

      if (contactCreated && newParentIds.length > 0) {
        await this.parentService.addKidToParents(newParentIds, id, session);
      }

      await session.commitTransaction();
      return updatedKid;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string): Promise<Kid | null> {
    const session = await this.kidModel.db.startSession();
    session.startTransaction();

    try {
      const kid = await this.kidModel.findById(id).session(session).exec();
      if (!kid) {
        await session.abortTransaction();
        return null;
      }

      if (kid.linked_parents && kid.linked_parents.length > 0) {
        const parentIds = kid.linked_parents.map(p => p.toString());
        await this.parentService.removeKidFromParents(parentIds, id, session);
      }

      if (this.isContactSyncEnabled() && kid.contactId) {
        const contactId = kid.contactId.toString();
        await this.contactRelationshipService.removeAllForContact(contactId, session);
        await this.contactService.remove(contactId, session);
      }

      const deletedKid = await this.kidModel.findByIdAndDelete(id).session(session).exec();

      await session.commitTransaction();
      return deletedKid;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async addParentToKid(kidId: string, parentId: string, session?: ClientSession): Promise<void> {
    const updateOptions: Record<string, unknown> = { new: true };
    if (session) {
      updateOptions.session = session;
    }

    await this.kidModel.findByIdAndUpdate(
      kidId,
      { $addToSet: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions,
    ).exec();
  }

  async removeParentFromKid(kidId: string, parentId: string, session?: ClientSession): Promise<void> {
    const updateOptions: Record<string, unknown> = { new: true };
    if (session) {
      updateOptions.session = session;
    }

    await this.kidModel.findByIdAndUpdate(
      kidId,
      { $pull: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions,
    ).exec();
  }

  async addParentToKids(kidIds: string[], parentId: string, session?: ClientSession): Promise<void> {
    if (kidIds.length === 0) {
      return;
    }

    const updateOptions: Record<string, unknown> = {};
    if (session) {
      updateOptions.session = session;
    }

    await this.kidModel.updateMany(
      { _id: { $in: kidIds.map(id => new Types.ObjectId(id)) } },
      { $addToSet: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions,
    ).exec();
  }

  async removeParentFromKids(kidIds: string[], parentId: string, session?: ClientSession): Promise<void> {
    if (kidIds.length === 0) {
      return;
    }

    const updateOptions: Record<string, unknown> = {};
    if (session) {
      updateOptions.session = session;
    }

    await this.kidModel.updateMany(
      { _id: { $in: kidIds.map(id => new Types.ObjectId(id)) } },
      { $pull: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions,
    ).exec();
  }

  private isContactSyncEnabled(): boolean {
    return isUnifiedContactsEnabled();
  }

  private mapKidDynamicFields(fields?: Record<string, unknown>): Record<string, unknown> | undefined {
    return namespaceDynamicFields(fields as Record<string, unknown> | undefined, 'kid');
  }

  private async createContactForKid(
    payload: {
      firstname: string;
      lastname: string;
      organizationId: string;
      idNumber?: string;
      address?: string;
      profileImageUrl?: string;
      dynamicFields?: Record<string, unknown>;
    },
    session?: ClientSession,
  ): Promise<Types.ObjectId> {
    const contact = await this.contactService.create(
      {
        firstname: payload.firstname,
        lastname: payload.lastname,
        type: ContactType.KID,
        organizationId: payload.organizationId,
        idNumber: payload.idNumber,
        address: payload.address,
        profileImageUrl: payload.profileImageUrl,
        dynamicFields: payload.dynamicFields,
      },
      session,
    );

    return new Types.ObjectId(contact._id);
  }
}

