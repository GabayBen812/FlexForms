import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Parent } from '../schemas/parent.schema';
import { CreateParentDto } from '../dto/parent.dto';
import { UpdateParentDto } from '../dto/parent.dto';
import { KidService } from './kid.service';

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
    @Inject(forwardRef(() => KidService))
    private kidService: KidService,
  ) {}

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    console.log('ParentService.create - received DTO:', createParentDto);
    const session = await this.parentModel.db.startSession();
    session.startTransaction();
    
    try {
      const parentData: any = {
        firstname: createParentDto.firstname,
        lastname: createParentDto.lastname,
        organizationId: new Types.ObjectId(createParentDto.organizationId),
        linked_kids: [],
      };
      
      if (createParentDto.idNumber) {
        parentData.idNumber = createParentDto.idNumber;
      }
      
      if (createParentDto.linked_kids && Array.isArray(createParentDto.linked_kids) && createParentDto.linked_kids.length > 0) {
        parentData.linked_kids = createParentDto.linked_kids
          .filter(kidId => kidId && Types.ObjectId.isValid(kidId))
          .map(kidId => new Types.ObjectId(kidId));
      }
      
      console.log('ParentService.create - parentData to save:', parentData);
      const createdParent = new this.parentModel(parentData);
      const saved = await createdParent.save({ session });
      
      // Sync: Add this parent to all linked kids
      if (saved.linked_kids && saved.linked_kids.length > 0) {
        const kidIds = saved.linked_kids.map(k => k.toString());
        await this.kidService.addParentToKids(kidIds, saved._id.toString(), session);
      }
      
      await session.commitTransaction();
      console.log('ParentService.create - saved parent:', saved);
      return saved;
    } catch (error) {
      console.error('ParentService.create - error:', error);
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
      // Get the existing parent to compare linked_kids
      const existingParent = await this.parentModel.findById(id).session(session).exec();
      if (!existingParent) {
        await session.abortTransaction();
        return null;
      }

      const oldKidIds = (existingParent.linked_kids || []).map(k => k.toString());
      
      const updateData: any = { ...updateParentDto };
      
      // Handle dynamicFields separately using dot notation to merge instead of replace
      if (updateParentDto.dynamicFields && typeof updateParentDto.dynamicFields === 'object') {
        const dynamicFieldsUpdate: any = {};
        Object.keys(updateParentDto.dynamicFields).forEach(key => {
          dynamicFieldsUpdate[`dynamicFields.${key}`] = updateParentDto.dynamicFields[key];
        });
        
        // Remove dynamicFields from updateData and use dot notation instead
        delete updateData.dynamicFields;
        Object.assign(updateData, dynamicFieldsUpdate);
      }
      
      if (updateParentDto.linked_kids) {
        updateData.linked_kids = updateParentDto.linked_kids.map(kidId => new Types.ObjectId(kidId));
      }
      
      const updatedParent = await this.parentModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .exec();

      if (!updatedParent) {
        await session.abortTransaction();
        return null;
      }

      // Sync bidirectional relationship
      const newKidIds = (updatedParent.linked_kids || []).map(k => k.toString());
      
      // Find kids to remove this parent from
      const kidsToRemove = oldKidIds.filter(kid => !newKidIds.includes(kid));
      // Find kids to add this parent to
      const kidsToAdd = newKidIds.filter(kid => !oldKidIds.includes(kid));
      
      // Remove parent from old kids
      if (kidsToRemove.length > 0) {
        await this.kidService.removeParentFromKids(kidsToRemove, id, session);
      }
      
      // Add parent to new kids
      if (kidsToAdd.length > 0) {
        await this.kidService.addParentToKids(kidsToAdd, id, session);
      }

      await session.commitTransaction();
      return updatedParent;
    } catch (error) {
      console.error('ParentService.update - error:', error);
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
      // Get the parent before deletion to sync relationships
      const parent = await this.parentModel.findById(id).session(session).exec();
      if (!parent) {
        await session.abortTransaction();
        return null;
      }

      // Remove this parent from all linked kids before deleting
      if (parent.linked_kids && parent.linked_kids.length > 0) {
        const kidIds = parent.linked_kids.map(k => k.toString());
        await this.kidService.removeParentFromKids(kidIds, id, session);
      }

      const deletedParent = await this.parentModel.findByIdAndDelete(id).session(session).exec();
      
      await session.commitTransaction();
      return deletedParent;
    } catch (error) {
      console.error('ParentService.remove - error:', error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Public method to add kid to parent (called from KidService)
   */
  async addKidToParent(parentId: string, kidId: string, session?: ClientSession): Promise<void> {
    const updateOptions: any = { new: true };
    if (session) {
      updateOptions.session = session;
    }
    
    await this.parentModel.findByIdAndUpdate(
      parentId,
      { $addToSet: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions
    ).exec();
  }

  /**
   * Public method to remove kid from parent (called from KidService)
   */
  async removeKidFromParent(parentId: string, kidId: string, session?: ClientSession): Promise<void> {
    const updateOptions: any = { new: true };
    if (session) {
      updateOptions.session = session;
    }
    
    await this.parentModel.findByIdAndUpdate(
      parentId,
      { $pull: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions
    ).exec();
  }

  /**
   * Batch methods for efficiency
   */
  async addKidToParents(parentIds: string[], kidId: string, session?: ClientSession): Promise<void> {
    if (parentIds.length === 0) return;
    
    const updateOptions: any = {};
    if (session) {
      updateOptions.session = session;
    }
    
    await this.parentModel.updateMany(
      { _id: { $in: parentIds.map(id => new Types.ObjectId(id)) } },
      { $addToSet: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions
    ).exec();
  }

  async removeKidFromParents(parentIds: string[], kidId: string, session?: ClientSession): Promise<void> {
    if (parentIds.length === 0) return;
    
    const updateOptions: any = {};
    if (session) {
      updateOptions.session = session;
    }
    
    await this.parentModel.updateMany(
      { _id: { $in: parentIds.map(id => new Types.ObjectId(id)) } },
      { $pull: { linked_kids: new Types.ObjectId(kidId) } },
      updateOptions
    ).exec();
  }
}

