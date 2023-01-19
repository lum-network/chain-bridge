import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';

import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface Response<T> {
    code: number;
    message?: string;
    result: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        // We don't want to override the response if it's a metrics prometheus call
        const request = context.switchToHttp().getRequest<Request>();
        if (request.url === '/metrics') {
            return next.handle();
        }

        // Otherwise we remap the response
        return next.handle().pipe(
            map((data) => ({
                ...data,
                code: 200,
                message: '',
            })),
        );
    }
}
