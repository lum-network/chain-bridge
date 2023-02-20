import { ArgumentsHost, Catch, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import { isArray, ValidationError } from 'class-validator';

import { getDescriptionFromErrors } from '@app/utils';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
    catch = (error: Error, host: ArgumentsHost): void => {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let code: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'error';
        let result: any = null;

        if (error instanceof InternalServerErrorException) {
            message = error.message;
            Sentry.captureException(error, {
                user: {
                    ip_address: request.ip,
                },
                extra: {
                    path: request.url,
                    method: request.method,
                    body: request.body,
                    params: request.params,
                    date: new Date(),
                },
            });
        } else if (isArray(error) && error.length > 0 && error[0] instanceof ValidationError) {
            code = HttpStatus.BAD_REQUEST;
            message = 'payload_validation_failed';
            result = {
                errors: getDescriptionFromErrors(error as ValidationError[]),
            };
        } else {
            if ((error as any).status !== undefined && (error as any).status !== null) {
                code = (error as any).status;
            }
            if (error.message !== undefined && error.message !== null) {
                message = error.message;
            }
        }

        response.status(code).json({
            code,
            message,
            result: {
                url: request.url,
                ...result,
            },
        });
    };
}
