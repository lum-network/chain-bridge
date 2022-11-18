import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';

import request from 'supertest';
import { Observable } from 'rxjs';

import { ApiModule } from '@app/modules';
import { makeRequest, MetricNames } from '@app/utils';
import { mockAssetResponse, mockLumPriceResponse, mockNotifySocketData, mockParamsResponse } from './mock.data';

describe('Core (e2e)', () => {
    let app: INestApplication;
    let client: ClientProxy;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule, ClientsModule.register([{ name: 'API', transport: Transport.REDIS }])],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.connectMicroservice({
            transport: Transport.REDIS,
        });

        await app.startAllMicroservices();
        await app.init();

        client = app.get('API');
        await client.connect();
    });

    describe('Metrics Scheduler - @messagePattern', () => {
        it('Sends updateMetric to consumer', async () => {
            const response: Promise<Observable<any>> = makeRequest(client, 'updateMetric', { name: MetricNames.DFRACT_CURRENT_SUPPLY, value: 33159.249595 });

            expect(await response).toStrictEqual({ code: 200, message: '' });
        });

        it('Sends notifySocket to consumer', async () => {
            const response: Promise<Observable<any>> = makeRequest(client, 'notifySocket', mockNotifySocketData);

            expect(await response).toStrictEqual({ code: 200, message: '' });
        });
    });

    describe('Endpoints', () => {
        it('[GET] - should return lum price', async () => {
            const http = request(app.getHttpServer());
            const response = await http.get('/price');
            expect(response.body).toEqual(mockLumPriceResponse);
        });

        it('[GET] - should return assets', async () => {
            const http = request(app.getHttpServer());
            const response = await http.get('/assets');
            expect(response.body).toEqual(mockAssetResponse);
        });

        it('[GET] - should return params', async () => {
            const http = request(app.getHttpServer());
            const response = await http.get('/params');
            expect(response.body).toEqual(mockParamsResponse);
        });
    });

    afterAll(async () => {
        await app.close();
        client.close();
    });
});
