import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types  } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly emailService: EmailService
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }
  
  async findByOrganizationPaginated(organizationId: string, skip = 0, limit = 10) {
    const objectId = new Types.ObjectId(organizationId);
    const result = await this.userModel
      .find({ organizationId: objectId })
      .select('-password')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    console.log('Users found:', result);
    return result;
  }

  async create(createUserDto: CreateUserDto) {
    const normalizedEmail = createUserDto.email.trim().toLowerCase();
    const existingUser = await this.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const organizationObjectId = new Types.ObjectId(createUserDto.organizationId);

    const createdUser = await this.userModel.create({
      name: createUserDto.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: createUserDto.role ?? 'viewer',
      organizationId: organizationObjectId,
    });

    const userObject = createdUser.toObject();
    delete userObject.password;

    // Send welcome email asynchronously (don't block user creation)
    this.sendWelcomeEmail(createdUser).catch((err) => {
      console.error('Error sending welcome email:', err);
    });

    return userObject;
  }

  private async sendWelcomeEmail(user: UserDocument) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const loginUrl = `${frontendUrl}/login`;

      await this.emailService.sendWelcomeEmail({
        email: user.email,
        name: user.name,
        loginUrl,
        language: 'he', // Default to Hebrew, can be made dynamic
      });
    } catch (err) {
      console.error('Error in sendWelcomeEmail:', err);
    }
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const { organizationId, ...rest } = updateUserDto;

    const updateData: Partial<User> = { ...rest };

    if (organizationId) {
      updateData.organizationId = new Types.ObjectId(organizationId);
    }

    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .lean()
      .exec();
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async findSystemAdminByOrganization(organizationId: string) {
    const objectId = new Types.ObjectId(organizationId);
    return this.userModel
      .findOne({ 
        organizationId: objectId, 
        role: 'system_admin' 
      })
      .select('-password')
      .lean()
      .exec();
  }

  async findByPasswordResetToken(token: string) {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }
}
