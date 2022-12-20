import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ApiModule } from '@app/modules';
import { TransactionService } from '@app/services';
import { seedTransaction } from './seed';

describe('Transaction (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        const transactionQueryExecutor = app.get<TransactionService>(TransactionService);

        await transactionQueryExecutor.saveBulk(seedTransaction);
    });

    afterAll(async () => {
        await app.close();
    });

    it('[GET] - should return transactions', async () => {
        const response = await request(app.getHttpServer()).get('/transactions');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThanOrEqual(0);
    });

    it('[GET] - should return a transaction for a given hash', async () => {
        const response = await request(app.getHttpServer()).get('/transactions/D0DA7F9B835F71A37D083C495C5F9505F0F1D84669F3F8B829E0CEF811F9000A');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.hash).toBeTruthy();
        expect(response.body.result.height).toBeGreaterThan(0);
        expect(response.body.result.success).toBe(true);
        expect(response.body.result.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(response.body.result.fees[0].amount).toBeGreaterThan(0);
        expect(response.body.result).toHaveProperty('addresses');
        expect(response.body.result.gas_wanted).toBeGreaterThanOrEqual(0);
        expect(response.body.result.gas_used).toBeGreaterThanOrEqual(0);
        expect(response.body.result.messages).toBeTruthy();
        expect(response.body.result.message_type).toBeTruthy();
        expect(response.body.result.messages_count).toBeGreaterThanOrEqual(0);
        expect(response.body.result.raw_logs).toBeTruthy();
    });
});
