import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ApiModule } from '@app/modules';

describe('Blocks (e2e)', () => {
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

    it('[GET] - should return blocks', async () => {
        const response = await request(app.getHttpServer()).get('/blocks');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThanOrEqual(0);
    });

    it('[GET] - should return block by height', async () => {
        const response = await request(app.getHttpServer()).get('/blocks/5364528');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.transactions.length).toBeGreaterThanOrEqual(0);
        expect(response.body.result.hash).toBeTruthy();
        expect(response.body.result.height).toBeGreaterThan(0);
        expect(response.body.result.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(response.body.result.proposer_address).toBeTruthy();
        expect(response.body.result.operator_address).toEqual(expect.stringMatching(/^lumvaloper/));
    });
});
