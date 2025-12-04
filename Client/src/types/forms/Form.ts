import { FieldConfig } from "@/components/forms/DynamicForm";

export type Form = {
  _id: string;
  title: string;
  description: string;
  fields: FieldConfig[];
  organizationId: string | { _id: string; logo?: string; name?: string };
  seasonId?: string;
  isActive: boolean;
  code: number;
  paymentSum?: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  maxRegistrators?: number;
  registrationDeadline?: string;
  backgroundColor?: string;
};