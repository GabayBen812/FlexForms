import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Room extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  location!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: MongooseSchema.Types.ObjectId;
}

export const RoomSchema = SchemaFactory.createForClass(Room); 