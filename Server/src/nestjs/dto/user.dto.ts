import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

const USER_ROLES = [
  "system_admin",
  "assistant_employee",
  "room_manager",
  "branch_manager",
  "district_manager",
  "finance_manager",
  "activity_manager",
  "parent",
  "student",
  "shift_manager",
] as const;

type UserRole = (typeof USER_ROLES)[number];

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: "password must be at least 6 characters long" })
  password!: string;

  @IsOptional()
  @IsEnum(USER_ROLES, {
    message:
      "role must be one of: system_admin, assistant_employee, room_manager, branch_manager, district_manager, finance_manager, activity_manager, parent, student, shift_manager",
  })
  role?: UserRole;

  @IsMongoId()
  organizationId!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(USER_ROLES, {
    message:
      "role must be one of: system_admin, assistant_employee, room_manager, branch_manager, district_manager, finance_manager, activity_manager, parent, student, shift_manager",
  })
  role?: UserRole;

  @IsOptional()
  @IsMongoId()
  organizationId?: string;
}
