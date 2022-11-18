import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';

import { ApiModule } from '@app/modules';
import { DatabaseConfig } from '@app/database';
import { mockResponseHistoricalMetrics, mockResponseLatestAsset, mockResponseLatestMetrics, mockResponseLatestMetricsPaginated } from './mock.data';

describe('Dfract (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ApiModule,

                // Use the e2e_test database to run the tests

                TypeOrmModule.forRootAsync(DatabaseConfig),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('[GET] Dfract - should return the latest asset metrics for the seeded data', () => {
        return request(app.getHttpServer()).get('/dfract/assets/latest').expect(mockResponseLatestMetrics);
    });

    it('[GET] Dfract - should return paginated call for the latest assets', () => {
        return request(app.getHttpServer()).get('/dfract/assets/latest?limit=10').expect(mockResponseLatestMetricsPaginated);
    });

    it('[POST] Dfract - should return the apy metrics for atom from since october 2022', () => {
        return request(app.getHttpServer())
            .post('/dfract/assets/since')
            .send({
                metrics: 'atom_apy',
                since: '2022-10-01 00:00:00',
            })
            .expect(mockResponseHistoricalMetrics);
    });

    it('[GET] Dfract - should return response for specific asset denom', () => {
        return request(app.getHttpServer()).get('/dfract/assets/atom').expect(mockResponseLatestAsset);
    });

    afterAll(async () => {
        app.close();
    });
});
