import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class MinimumAgeConstraint implements ValidatorConstraintInterface {
  validate(birthDate: Date, args: ValidationArguments) {
    const [minAge] = args.constraints as [number];

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= minAge;
  }

  defaultMessage(args: ValidationArguments) {
    const [minAge] = args.constraints as [number];
    return `Umur minimal ${minAge} tahun`;
  }
}

export function MinimumAge(age: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [age],
      validator: MinimumAgeConstraint,
    });
  };
}
