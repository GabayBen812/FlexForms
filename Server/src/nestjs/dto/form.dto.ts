export class CreateFormDto {
  title!: string;
  description?: string;
  organizationId!: string;
  fields!: Record<string, any>[];
  isActive?: boolean;
}