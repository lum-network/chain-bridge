import { ValidationError } from 'class-validator';

export const PayloadValidationOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    exceptionFactory: (validationError: ValidationError[] = []): ValidationError[] => {
        return validationError;
    },
};
