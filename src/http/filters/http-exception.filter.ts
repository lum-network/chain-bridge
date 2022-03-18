import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';

import * as Sentry from '@sentry/node';

import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        let code: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'error';

        if (exception instanceof InternalServerErrorException) {
            message = exception.message;
            Sentry.captureException(exception, {
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
        } else {
            code = exception.getStatus();
            if (exception.message !== undefined && exception.message !== null) {
                message = exception.message;
            }
        }

        response.status(status).json({
            code,
            message,
            result: {
                url: request.url,
            },
        });
    }
}
