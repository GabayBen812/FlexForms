import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

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
  @IsEnum(["system_admin", "admin", "editor", "viewer"], {
    message: "role must be one of: system_admin, admin, editor, viewer",
  })
  role?: "system_admin" | "admin" | "editor" | "viewer";

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
  @IsEnum(["system_admin", "admin", "editor", "viewer"], {
    message: "role must be one of: system_admin, admin, editor, viewer",
  })
  role?: "system_admin" | "admin" | "editor" | "viewer";

  @IsOptional()
  @IsMongoId()
  organizationId?: string;
}

