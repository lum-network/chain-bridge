import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Observable } from 'rxjs';

import { ExplorerRequest, MetadataKeys } from '@app/utils';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
    constructor(private readonly _reflector: Reflector) {}
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const req: ExplorerRequest = context.switchToHttp().getRequest() as ExplorerRequest;

        if (!req || !req.query) {
            return next.handle();
        }

        const defaultTake = this._reflector.get<number>(MetadataKeys.DEFAULT_TAKE, context.getHandler());

        const page = parseInt((req.query.page as string) || '0');
        const limit = parseInt((req.query.limit as string) || (defaultTake as unknown as string) || '5');
        const skip = page === 0 ? 0 : page * limit;

        req.pagination = {
            page,
            limit,
            skip,
        };
        return next.handle();
    }
}
