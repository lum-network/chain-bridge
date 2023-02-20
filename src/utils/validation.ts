import { ValidationError } from 'class-validator';

export const PayloadValidationOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    exceptionFactory: (validationError: ValidationError[] = []): ValidationError[] => {
        return validationError;
    },
};

export const getDescriptionFromErrors = (errors: ValidationError[]): string | undefined => {
    if (!errors) {
        return undefined;
    }
    for (const e of errors) {
        if (e.constraints) {
            const ck = Object.keys(e.constraints);
            for (const k of ck) {
                if (e.constraints[k]) {
                    return e.constraints[k];
                }
            }
        } else if (e.children) {
            const d = getDescriptionFromErrors(e.children);
            if (d) {
                return d;
            }
        }
    }
    return undefined;
};
