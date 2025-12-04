import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatGroupDocument = ChatGroup & Document;

@Schema({ timestamps: true })
export class ChatGroup {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    default: [],
  })
  memberIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false })
  isArchived!: boolean;

  @Prop({ default: false })
  isReadOnlyForParents!: boolean;
}

export const ChatGroupSchema = SchemaFactory.createForClass(ChatGroup);
ChatGroupSchema.set('collection', 'ChatGroups');
ChatGroupSchema.index({ organizationId: 1, name: 1 }, { unique: false });


