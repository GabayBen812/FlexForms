import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeatureFlagDocument = FeatureFlag & Document;

@Schema({ timestamps: true })
export class FeatureFlag {
  @Prop({ required: true, unique: true, index: true })
  key!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ default: false, index: true })
  isEnabled!: boolean;

  @Prop({ type: [String], default: [], index: true })
  tags!: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: [Types.ObjectId], ref: 'Organization', default: [], index: true })
  organizationIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
FeatureFlagSchema.set('collection', 'FeatureFlags');

// Add compound indexes for common queries
FeatureFlagSchema.index({ key: 1, isEnabled: 1 });
FeatureFlagSchema.index({ organizationIds: 1, isEnabled: 1 });
FeatureFlagSchema.index({ tags: 1, isEnabled: 1 }); 