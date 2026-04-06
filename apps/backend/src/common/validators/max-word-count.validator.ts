import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { countWords } from '../utils/word-count';

@ValidatorConstraint({ async: false })
export class MaxWordCountConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [maxWords] = args.constraints as [number];

    if (value === null || value === undefined || value === '') {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    return countWords(value) <= maxWords;
  }

  defaultMessage(args: ValidationArguments): string {
    const [maxWords] = args.constraints as [number];
    return `Teks maksimal ${maxWords.toLocaleString('id-ID')} kata`;
  }
}

export function MaxWordCount(
  maxWords: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [maxWords],
      validator: MaxWordCountConstraint,
    });
  };
}
