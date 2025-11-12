import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true, versionKey: false })
export class Account {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Contact' }], default: [] })
  linked_contacts!: Types.ObjectId[];

  @Prop({ type: Object, default: {} })
  dynamicFields!: Record<string, any>;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.set('collection', 'Accounts');

