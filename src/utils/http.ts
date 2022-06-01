import { Request } from 'express';

export interface ExplorerRequestPagination {
    page: number;
    limit: number;
    skip: number;
}

export interface ExplorerRequest extends Request {
    pagination: ExplorerRequestPagination;
};
