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

  @Prop({ default: 'viewer', enum: ['system_admin', 'admin', 'editor', 'viewer'] })
  role!: 'system_admin' | 'admin' | 'editor' | 'viewer';

  @Prop({ required: true })
  name!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('collection', 'Users');



