import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";

import {Observable} from "rxjs";

import {ExplorerRequest} from "@app/utils";

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const req: ExplorerRequest = context.switchToHttp().getRequest() as ExplorerRequest;

        if(!req || !req.query){
            return next.handle();
        }

        const page = parseInt(req.query.page as string || '0');
        const limit = parseInt(req.query.limit as string || '5');
        const skip = page === 0 ? 0 : (page * limit);

        req.pagination = {
            page,
            limit,
            skip,
        };
        return next.handle();
    }
}
