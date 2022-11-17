import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from '@app/modules';
import request from 'supertest';

import { mockAddressValidatorResponse, mockValidatorBlockResponse, mockValidatorDelegationsResponse, mockValidatorsResponse } from './mock.data';

import { DatabaseConfig } from '@app/database';

describe('Validators (e2e)', () => {
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

    it('[GET] - should return a list of validators', () => {
        return request(app.getHttpServer()).get('/validators').expect(mockValidatorsResponse);
    });

    it('[GET] - should return information on a specific validator (Lum Foundation)', () => {
        return request(app.getHttpServer()).get('/validators/lumvaloper1qx2dts3tglxcu0jh47k7ghstsn4nactufgmmlk').expect(mockAddressValidatorResponse);
    });

    // Todo create a dump for the blocks table
    it.skip('[GET] - should return information on blocks for a specific validator (Lum Foundation)', () => {
        return request(app.getHttpServer()).get('/validators/lumvaloper1qx2dts3tglxcu0jh47k7ghstsn4nactufgmmlk/blocks').expect(mockValidatorBlockResponse);
    });

    // Todo create a dump for the validator_delegations table
    it.skip('[GET] - should return information on delegations for a specific validator (Lum Foundation)', () => {
        return request(app.getHttpServer()).get('/validators/lumvaloper1qx2dts3tglxcu0jh47k7ghstsn4nactufgmmlk/delegations').expect(mockValidatorDelegationsResponse);
    });

    afterAll(async () => {
        await app.close();
    });
});
