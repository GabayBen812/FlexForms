import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kid } from '../schemas/kid.schema';
import { CreateKidDto } from '../dto/kid.dto';
import { UpdateKidDto } from '../dto/kid.dto';

@Injectable()
export class KidService {
  constructor(
    @InjectModel(Kid.name) private kidModel: Model<Kid>,
  ) {}

  async create(createKidDto: CreateKidDto): Promise<Kid> {
    console.log('KidService.create - received DTO:', createKidDto);
    try {
      const kidData: any = {
        firstname: createKidDto.firstname,
        lastname: createKidDto.lastname,
        birthdate: new Date(createKidDto.birthdate),
        sex: createKidDto.sex,
        organizationId: new Types.ObjectId(createKidDto.organizationId),
        linked_parents: [],
      };
      
      if (createKidDto.address) {
        kidData.address = createKidDto.address;
      }
      
      if (createKidDto.linked_parents && Array.isArray(createKidDto.linked_parents) && createKidDto.linked_parents.length > 0) {
        kidData.linked_parents = createKidDto.linked_parents
          .filter(parentId => parentId && Types.ObjectId.isValid(parentId))
          .map(parentId => new Types.ObjectId(parentId));
      }
      
      console.log('KidService.create - kidData to save:', kidData);
      const createdKid = new this.kidModel(kidData);
      const saved = await createdKid.save();
      console.log('KidService.create - saved kid:', saved);
      return saved;
    } catch (error) {
      console.error('KidService.create - error:', error);
      throw error;
    }
  }

  async findAll(organizationId: string): Promise<Kid[]> {
    return this.kidModel.find({ organizationId: new Types.ObjectId(organizationId) }).exec();
  }

  async findOne(id: string): Promise<Kid | null> {
    return this.kidModel.findById(id).exec();
  }

  async update(id: string, updateKidDto: UpdateKidDto): Promise<Kid | null> {
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
    
    return this.kidModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Kid | null> {
    return this.kidModel.findByIdAndDelete(id).exec();
  }
}

