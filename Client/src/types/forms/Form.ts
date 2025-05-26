import { FieldConfig } from "@/components/forms/DynamicForm";

export type Form = {
  _id: string;
  title: string;
  description: string;
  fields: FieldConfig[];
  organizationId: string;
  isActive: boolean;
  code: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  maxRegistrators?: number;
  registrationDeadline?: string;
};