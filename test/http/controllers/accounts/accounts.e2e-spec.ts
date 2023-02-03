import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ApiModule } from '@app/modules';

describe('Accounts (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('[GET] - should return delegations for a given delegator address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn/delegations');
        expect(response.body.result.length).toBeGreaterThanOrEqual(0);
        expect(response.body.result[0].validator_address).toEqual(expect.stringMatching(/^lumvaloper/));
        expect(response.body.result[0].delegator_address).toEqual(expect.stringMatching(/^lum1/));
        expect(Number(response.body.result[0].shares)).toBeGreaterThanOrEqual(0);
    });

    it('[GET] - should return transactions for an account address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn/transactions');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThanOrEqual(0);
    });

    it('[GET] - should return redelegations for an account address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn/redelegations');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThanOrEqual(0);
    });

    it('[GET] - should return unbondings for an account address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn/unbondings');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThanOrEqual(0);
    });

    it('[GET] - should return account information for a given address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.commissions).toBeTruthy();
        expect(response.body.result).toHaveProperty('address', 'lum1ugeeckr6frejr62jm60m69zxy7ttudc3w584kn');
        expect(response.body.result.withdraw_address).toBeTruthy();
        expect(response.body.result.balances).toBeTruthy();
        expect(response.body.result.account_number).toBeGreaterThanOrEqual(0);
        expect(response.body.result.all_rewards).toBeTruthy();
        expect(response.body.result.sequence).toBeTruthy();
        expect(response.body.result.vesting).toBeNull();
        expect(response.body.result.airdrop).toBeTruthy();
    });
});
