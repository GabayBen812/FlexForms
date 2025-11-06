import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Kid } from '../schemas/kid.schema';
import { CreateKidDto } from '../dto/kid.dto';
import { UpdateKidDto } from '../dto/kid.dto';
import { ParentService } from './parent.service';

@Injectable()
export class KidService {
  constructor(
    @InjectModel(Kid.name) private kidModel: Model<Kid>,
    @Inject(forwardRef(() => ParentService))
    private parentService: ParentService,
  ) {}

  async create(createKidDto: CreateKidDto): Promise<Kid> {
    console.log('KidService.create - received DTO:', createKidDto);
    const session = await this.kidModel.db.startSession();
    session.startTransaction();
    
    try {
      const kidData: any = {
        firstname: createKidDto.firstname,
        lastname: createKidDto.lastname,
        organizationId: new Types.ObjectId(createKidDto.organizationId),
        linked_parents: [],
      };
      
      if (createKidDto.address) {
        kidData.address = createKidDto.address;
      }

      if (createKidDto.idNumber) {
        kidData.idNumber = createKidDto.idNumber;
      }
      
      if (createKidDto.linked_parents && Array.isArray(createKidDto.linked_parents) && createKidDto.linked_parents.length > 0) {
        kidData.linked_parents = createKidDto.linked_parents
          .filter(parentId => parentId && Types.ObjectId.isValid(parentId))
          .map(parentId => new Types.ObjectId(parentId));
      }

      // Handle dynamicFields - save them to the database
      if (createKidDto.dynamicFields && typeof createKidDto.dynamicFields === 'object') {
        kidData.dynamicFields = createKidDto.dynamicFields;
      }
      
      console.log('KidService.create - kidData to save:', kidData);
      const createdKid = new this.kidModel(kidData);
      const saved = await createdKid.save({ session });
      
      // Sync: Add this kid to all linked parents
      if (saved.linked_parents && saved.linked_parents.length > 0) {
        const parentIds = saved.linked_parents.map(p => p.toString());
        await this.parentService.addKidToParents(parentIds, saved._id.toString(), session);
      }
      
      await session.commitTransaction();
      console.log('KidService.create - saved kid:', saved);
      return saved;
    } catch (error) {
      console.error('KidService.create - error:', error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(organizationId: string, query: any = {}): Promise<Kid[]> {
    const filter: any = {
      organizationId: new Types.ObjectId(organizationId)
    };

    // Apply advanced search filters
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
    
    // Handle dynamicFields filters (dot notation)
    Object.keys(query).forEach(key => {
      if (key.startsWith('dynamicFields.') && query[key] !== undefined && query[key] !== '') {
        // Handle boolean values (from checkbox fields)
        if (query[key] === 'true' || query[key] === 'false') {
          filter[key] = query[key] === 'true';
        } else {
          // Handle text/number values with regex
          filter[key] = { $regex: query[key], $options: 'i' };
        }
      }
    });

    // Remove empty filters
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });

    return this.kidModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Kid | null> {
    return this.kidModel.findById(id).exec();
  }

  async update(id: string, updateKidDto: UpdateKidDto): Promise<Kid | null> {
    const session = await this.kidModel.db.startSession();
    session.startTransaction();
    
    try {
      // Get the existing kid to compare linked_parents
      const existingKid = await this.kidModel.findById(id).session(session).exec();
      if (!existingKid) {
        await session.abortTransaction();
        return null;
      }

      const oldParentIds = (existingKid.linked_parents || []).map(p => p.toString());
      
      const updateData: any = { ...updateKidDto };
      
      // Handle dynamicFields separately using dot notation to merge instead of replace
      if (updateKidDto.dynamicFields && typeof updateKidDto.dynamicFields === 'object') {
        const dynamicFieldsUpdate: any = {};
        Object.keys(updateKidDto.dynamicFields).forEach(key => {
          dynamicFieldsUpdate[`dynamicFields.${key}`] = updateKidDto.dynamicFields[key];
        });
        
        // Remove dynamicFields from updateData and use dot notation instead
        delete updateData.dynamicFields;
        Object.assign(updateData, dynamicFieldsUpdate);
      }
      
      if (updateKidDto.linked_parents) {
        updateData.linked_parents = updateKidDto.linked_parents.map(parentId => new Types.ObjectId(parentId));
      }
      
      const updatedKid = await this.kidModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .exec();

      if (!updatedKid) {
        await session.abortTransaction();
        return null;
      }

      // Sync bidirectional relationship
      const newParentIds = (updatedKid.linked_parents || []).map(p => p.toString());
      
      // Find parents to remove this kid from
      const parentsToRemove = oldParentIds.filter(pid => !newParentIds.includes(pid));
      // Find parents to add this kid to
      const parentsToAdd = newParentIds.filter(pid => !oldParentIds.includes(pid));
      
      // Remove kid from old parents
      if (parentsToRemove.length > 0) {
        await this.parentService.removeKidFromParents(parentsToRemove, id, session);
      }
      
      // Add kid to new parents
      if (parentsToAdd.length > 0) {
        await this.parentService.addKidToParents(parentsToAdd, id, session);
      }

      await session.commitTransaction();
      return updatedKid;
    } catch (error) {
      console.error('KidService.update - error:', error);
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
      // Get the kid before deletion to sync relationships
      const kid = await this.kidModel.findById(id).session(session).exec();
      if (!kid) {
        await session.abortTransaction();
        return null;
      }

      // Remove this kid from all linked parents before deleting
      if (kid.linked_parents && kid.linked_parents.length > 0) {
        const parentIds = kid.linked_parents.map(p => p.toString());
        await this.parentService.removeKidFromParents(parentIds, id, session);
      }

      const deletedKid = await this.kidModel.findByIdAndDelete(id).session(session).exec();
      
      await session.commitTransaction();
      return deletedKid;
    } catch (error) {
      console.error('KidService.remove - error:', error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Public method to add parent to kid (called from ParentService)
   */
  async addParentToKid(kidId: string, parentId: string, session?: ClientSession): Promise<void> {
    const updateOptions: any = { new: true };
    if (session) {
      updateOptions.session = session;
    }
    
    await this.kidModel.findByIdAndUpdate(
      kidId,
      { $addToSet: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions
    ).exec();
  }

  /**
   * Public method to remove parent from kid (called from ParentService)
   */
  async removeParentFromKid(kidId: string, parentId: string, session?: ClientSession): Promise<void> {
    const updateOptions: any = { new: true };
    if (session) {
      updateOptions.session = session;
    }
    
    await this.kidModel.findByIdAndUpdate(
      kidId,
      { $pull: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions
    ).exec();
  }

  /**
   * Batch methods for efficiency
   */
  async addParentToKids(kidIds: string[], parentId: string, session?: ClientSession): Promise<void> {
    if (kidIds.length === 0) return;
    
    const updateOptions: any = {};
    if (session) {
      updateOptions.session = session;
    }
    
    await this.kidModel.updateMany(
      { _id: { $in: kidIds.map(id => new Types.ObjectId(id)) } },
      { $addToSet: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions
    ).exec();
  }

  async removeParentFromKids(kidIds: string[], parentId: string, session?: ClientSession): Promise<void> {
    if (kidIds.length === 0) return;
    
    const updateOptions: any = {};
    if (session) {
      updateOptions.session = session;
    }
    
    await this.kidModel.updateMany(
      { _id: { $in: kidIds.map(id => new Types.ObjectId(id)) } },
      { $pull: { linked_parents: new Types.ObjectId(parentId) } },
      updateOptions
    ).exec();
  }
}

