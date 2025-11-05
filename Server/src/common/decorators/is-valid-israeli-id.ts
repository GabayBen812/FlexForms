import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidIsraeliID } from '../utils/israeliIdValidator';

@ValidatorConstraint({ name: 'isValidIsraeliID', async: false })
export class IsValidIsraeliIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    // If value is empty/undefined, validation passes (use with @IsOptional() if it's optional)
    if (value === undefined || value === null || value === '') {
      return true;
    }

    return isValidIsraeliID(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return 'idNumber must be a valid Israeli ID number (תעודת זהות)';
  }
}

/**
 * Decorator that validates an Israeli ID number (תעודת זהות) according to Israeli regulations.
 * 
 * Israeli ID numbers must:
 * - Contain only digits
 * - Be up to 9 digits long
 * - Pass the Luhn algorithm checksum validation
 * 
 * @param validationOptions - Optional validation options
 * 
 * @example
 * ```typescript
 * class CreateParentDto {
 *   @IsString()
 *   @IsOptional()
 *   @IsValidIsraeliID()
 *   idNumber?: string;
 * }
 * ```
 */
export function IsValidIsraeliID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIsraeliIDConstraint,
    });
  };
}

