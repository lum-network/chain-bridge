import { GatewayTimeoutException, HttpException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { TimeoutError, throwError, lastValueFrom, Observable } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

const logger = new Logger('MakeRequest');
export const makeRequest = async (client: ClientProxy, pattern: any, payload: any = null): Promise<Observable<any>> => {
    return lastValueFrom(
        client.send(pattern, payload).pipe(
            timeout(10000),
            catchError((err) => {
                const { status, message } = err;
                logger.error(`${err.message}: ${JSON.stringify(pattern) || pattern}`);

                if (err instanceof TimeoutError) {
                    return throwError(() => new GatewayTimeoutException(err.message));
                }

                throw new HttpException(message, typeof status === 'number' ? status : 500);
            }),
        ),
    );
};
