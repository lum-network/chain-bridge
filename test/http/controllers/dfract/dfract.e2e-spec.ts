import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from '@app/modules';
import request from 'supertest';

import { mockResponseHistoricalMetrics, mockResponseLatestMetrics } from './mock.data';

describe('Dfract (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ApiModule,
                // Use the e2e_test database to run the tests
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: process.env.DATABASE_HOST,
                    port: parseInt(process.env.DATABASE_PORT),
                    username: process.env.DATABASE_USER,
                    password: process.env.DATABASE_PASSWORD,
                    database: process.env.DATABASE_NAME,
                    entities: ['./**/*.entity.ts'],
                    synchronize: true,
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('[GET] Dfract - should return the latest asset metrics for the seeded data (atom)', () => {
        return request(app.getHttpServer()).get('/dfract/assets/latest').expect(200).expect(mockResponseLatestMetrics);
    });

    it('[GET] Dfract - should return the asset the apy metrics for atom from since october 2022', () => {
        return request(app.getHttpServer()).get('/dfract/assets/atom_apy/oct-2022').expect(200).expect(mockResponseHistoricalMetrics);
    });

    afterAll(async () => {
        app.close();
    });
});
