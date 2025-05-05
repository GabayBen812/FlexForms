import { Types } from 'mongoose';

export class CreateRegistrationDto {
  formId!: Types.ObjectId;
  fullName!: string;
  email?: string;
  phone?: string;
}
