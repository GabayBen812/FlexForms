import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({
    type: Types.ObjectId,
    ref: 'ChatGroup',
    required: true,
    index: true,
  })
  groupId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    default: [],
  })
  readBy!: Types.ObjectId[];
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.set('collection', 'ChatMessages');
ChatMessageSchema.index({ groupId: 1, createdAt: -1 });


