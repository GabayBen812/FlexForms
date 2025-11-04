import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Parent } from '../schemas/parent.schema';
import { CreateParentDto } from '../dto/parent.dto';
import { UpdateParentDto } from '../dto/parent.dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
  ) {}

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    console.log('ParentService.create - received DTO:', createParentDto);
    try {
      const parentData: any = {
        firstname: createParentDto.firstname,
        lastname: createParentDto.lastname,
        birthdate: new Date(createParentDto.birthdate),
        sex: createParentDto.sex,
        organizationId: new Types.ObjectId(createParentDto.organizationId),
        linked_kids: [],
      };
      
      if (createParentDto.address) {
        parentData.address = createParentDto.address;
      }
      
      if (createParentDto.linked_kids && Array.isArray(createParentDto.linked_kids) && createParentDto.linked_kids.length > 0) {
        parentData.linked_kids = createParentDto.linked_kids
          .filter(kidId => kidId && Types.ObjectId.isValid(kidId))
          .map(kidId => new Types.ObjectId(kidId));
      }
      
      console.log('ParentService.create - parentData to save:', parentData);
      const createdParent = new this.parentModel(parentData);
      const saved = await createdParent.save();
      console.log('ParentService.create - saved parent:', saved);
      return saved;
    } catch (error) {
      console.error('ParentService.create - error:', error);
      throw error;
    }
  }

  async findAll(organizationId: string): Promise<Parent[]> {
    return this.parentModel.find({ organizationId: new Types.ObjectId(organizationId) }).exec();
  }

  async findOne(id: string): Promise<Parent | null> {
    return this.parentModel.findById(id).exec();
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent | null> {
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
    
    if (updateParentDto.birthdate) {
      updateData.birthdate = new Date(updateParentDto.birthdate);
    }
    if (updateParentDto.linked_kids) {
      updateData.linked_kids = updateParentDto.linked_kids.map(kidId => new Types.ObjectId(kidId));
    }
    
    return this.parentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Parent | null> {
    return this.parentModel.findByIdAndDelete(id).exec();
  }
}

