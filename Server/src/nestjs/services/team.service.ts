import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from '../schemas/team.schema';
import { CreateTeamDto } from '../dto/team.dto';
import { UpdateTeamDto } from '../dto/team.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
  ) {}

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    try {
      const teamData: any = {
        name: createTeamDto.name,
        organizationId: new Types.ObjectId(createTeamDto.organizationId),
      };
      
      if (createTeamDto.description) {
        teamData.description = createTeamDto.description;
      }

      // Handle dynamicFields - save them to the database
      if (createTeamDto.dynamicFields && typeof createTeamDto.dynamicFields === 'object') {
        teamData.dynamicFields = createTeamDto.dynamicFields;
      }
      
      const createdTeam = new this.teamModel(teamData);
      const saved = await createdTeam.save();
      return saved;
    } catch (error) {
      console.error('TeamService.create - error:', error);
      throw error;
    }
  }

  async findAll(organizationId: string): Promise<Team[]> {
    return this.teamModel.find({ organizationId: new Types.ObjectId(organizationId) }).exec();
  }

  async findOne(id: string): Promise<Team | null> {
    return this.teamModel.findById(id).exec();
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team | null> {
    const updateData: any = { ...updateTeamDto };
    
    // Handle dynamicFields separately using dot notation to merge instead of replace
    if (updateTeamDto.dynamicFields && typeof updateTeamDto.dynamicFields === 'object') {
      const dynamicFieldsUpdate: any = {};
      Object.keys(updateTeamDto.dynamicFields).forEach(key => {
        dynamicFieldsUpdate[`dynamicFields.${key}`] = updateTeamDto.dynamicFields[key];
      });
      
      // Remove dynamicFields from updateData and use dot notation instead
      delete updateData.dynamicFields;
      Object.assign(updateData, dynamicFieldsUpdate);
    }
    
    return this.teamModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Team | null> {
    return this.teamModel.findByIdAndDelete(id).exec();
  }

  async count(organizationId: string): Promise<number> {
    return this.teamModel.countDocuments({
      organizationId: new Types.ObjectId(organizationId),
    }).exec();
  }
}

