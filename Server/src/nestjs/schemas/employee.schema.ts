import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: false, versionKey: false })
export class Employee {
  @Prop({ required: true })
  firstname!: string;

  @Prop({ required: true })
  lastname!: string;

  @Prop()
  idNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  dynamicFields!: Record<string, any>;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
EmployeeSchema.set('collection', 'Employees');

