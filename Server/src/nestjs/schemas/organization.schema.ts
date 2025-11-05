import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: [Types.ObjectId], ref: 'FeatureFlag', default: [] })
  featureFlagIds!: Types.ObjectId[];
  
  @Prop()
  cardcomTerminalNumber?: string;

  @Prop()
  cardcomUsername?: string;

  @Prop({ type: Object })
  greenInvoiceCredentials?: {
    apiKey: string,
    secret: string
  };

  @Prop({ type: Object, default: {} })
    requestDefinitions!: Record<
      string,
      {
        type: string;
        fields: Record<string, {
          type: string;
          choices?: string[];
        }>;
      }
    >;

  @Prop({ type: Object, default: {} })
  tableFieldDefinitions!: Record<
    string, // entity type: "kids", "parents", etc.
    {
      fields: Record<string, {
        type: string; // "TEXT" | "SELECT" | "DATE" | "NUMBER" | "EMAIL" | "PHONE"
        label: string;
        required?: boolean;
        choices?: string[]; // for SELECT type
        defaultValue?: any;
      }>;
      fieldOrder?: string[]; // Array of field names in the desired order
    }
  >;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.set('collection', 'Organizations');