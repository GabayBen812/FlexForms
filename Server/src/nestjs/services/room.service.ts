import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from '../schemas/room.schema';
import { CreateRoomDto } from '../dto/room.dto';
import { UpdateRoomDto } from '../dto/room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const createdRoom = new this.roomModel(createRoomDto);
    return createdRoom.save();
  }

  async findAll(organizationId: string): Promise<Room[]> {
    return this.roomModel.find({ organizationId }).exec();
  }

  async findOne(id: string): Promise<Room | null> {
    return this.roomModel.findById(id).exec();
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room | null> {
    return this.roomModel
      .findByIdAndUpdate(id, updateRoomDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Room | null> {
    return this.roomModel.findByIdAndDelete(id).exec();
  }
} 