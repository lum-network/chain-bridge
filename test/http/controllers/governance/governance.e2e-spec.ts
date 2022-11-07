import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from '@app/modules';
import request from 'supertest';

import { mockResponseDepositors, mockResponseVotersPage0, mockResponseVotersPage1 } from './mock.data';

import { DatabaseConfig } from '@app/database';

describe('Governance (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ApiModule,

                // Use the e2e_test database to run the tests

                TypeOrmModule.forRootAsync({ ...DatabaseConfig }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('[GET] Depositors - should return the depositors for proposalId 21', () => {
        return request(app.getHttpServer()).get('/governance/proposals/21/depositors').expect(200).expect(mockResponseDepositors);
    });

    it('[GET] Voters - should the first 5 voters for proposalId 21', () => {
        return request(app.getHttpServer()).get('/governance/proposals/21/voters').expect(200).expect(mockResponseVotersPage0);
    });

    it('[GET] Voters - should the first 5 voters of paginated page 1 for proposalId 21', () => {
        return request(app.getHttpServer()).get('/governance/proposals/21/voters?page=1').expect(200).expect(mockResponseVotersPage1);
    });

    afterAll(async () => {
        await app.close();
    });
});
