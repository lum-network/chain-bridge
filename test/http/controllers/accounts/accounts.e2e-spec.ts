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
        const response = await request(app.getHttpServer()).get('/accounts/lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj/delegations');
        if (response.status === HttpStatus.OK) {
            expect(response.body.result.length).toBeGreaterThanOrEqual(0);
            if (response.body.result.length) {
                expect(response.body.result[0].validator_address).toEqual(expect.stringMatching(/^lumvaloper/));
                expect(response.body.result[0].delegator_address).toEqual(expect.stringMatching(/^lum1/));
                expect(Number(response.body.result[0].shares)).toBeGreaterThanOrEqual(0);
            }
        }
    });

    it('[GET] - should return transactions for an account address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj/transactions');
        if (response.status === HttpStatus.OK) {
            expect(response.body.result.length).toBeGreaterThanOrEqual(0);
        }
    });

    it('[GET] - should return redelegations for an account address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj/redelegations');
        if (response.status === HttpStatus.OK) {
            expect(response.body.result.length).toBeGreaterThanOrEqual(0);
            if (response.body.result.length) {
                expect(response.body.result[0].redelegation).toBeTruthy();
                expect(response.body.result[0].entries).toBeTruthy();
            }
        }
    });

    it('[GET] - should return unbondings for an account address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj/unbondings');
        if (response.status === HttpStatus.OK) {
            expect(response.body.result.length).toBeGreaterThanOrEqual(0);
            if (response.body.result.length) {
                expect(response.body.result.entries).toBeTruthy();
                expect(response.body.result.validator_address).toBeTruthy();
            }
        }
    });

    it('[GET] - should return account information for a given address', async () => {
        const response = await request(app.getHttpServer()).get('/accounts/lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj');
        if (response.status === HttpStatus.OK) {
            if (response.body.result) {
                expect(response.body.result.commissions).toBeTruthy();
                expect(response.body.result).toHaveProperty('address', 'lum1qx2dts3tglxcu0jh47k7ghstsn4nactukljgyj');
                expect(response.body.result.withdraw_address).toBeTruthy();
                expect(response.body.result.balance).toBeTruthy();
                expect(response.body.result.account_number).toBeTruthy();
                expect(response.body.result.all_rewards).toBeTruthy();
                expect(response.body.result.sequence).toBeTruthy();
                expect(response.body.result.vesting).toBeTruthy();
                expect(response.body.result.airdrop).toBeTruthy();
            }
        }
    });
});
