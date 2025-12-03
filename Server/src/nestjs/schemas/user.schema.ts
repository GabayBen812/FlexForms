import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;  

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: false })
  linked_parent_id?: Types.ObjectId;

  @Prop({
    default: 'parent',
    enum: [
      'system_admin',
      'assistant_employee',
      'room_manager',
      'branch_manager',
      'district_manager',
      'finance_manager',
      'activity_manager',
      'parent',
      'student',
      'shift_manager',
    ],
  })
  role!:
    | 'system_admin'
    | 'assistant_employee'
    | 'room_manager'
    | 'branch_manager'
    | 'district_manager'
    | 'finance_manager'
    | 'activity_manager'
    | 'parent'
    | 'student'
    | 'shift_manager';

  @Prop({ required: true })
  name!: string;

  @Prop({ required: false })
  logo?: string;

  @Prop({ required: false })
  passwordResetToken?: string;

  @Prop({ required: false })
  passwordResetExpires?: Date;

  @Prop({ default: false })
  emailVerified?: boolean;

  @Prop({ required: false })
  emailVerificationToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('collection', 'Users');



