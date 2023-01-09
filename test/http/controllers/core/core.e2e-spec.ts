import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ApiModule } from '@app/modules';
import { AssetSymbol } from '@app/utils';

describe('Core (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        app.close();
    });

    it('[GET] - should return assets', async () => {
        const response = await request(app.getHttpServer()).get('/price');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.price).toBeGreaterThan(0);
        expect(response.body.result.symbol).toBe(AssetSymbol.LUM);
    });

    it('[GET] - should return assets', async () => {
        const response = await request(app.getHttpServer()).get('/assets');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThan(0);
        expect(response.body.result.some((asset: { denom: string; amount: string }) => asset.denom === 'ulum')).toBe(true);
    });

    it('[GET] - should return params', async () => {
        const response = await request(app.getHttpServer()).get('/params');
        expect(response.status).toEqual(HttpStatus.OK);
        expect('chain_id' in response.body.result).toBe(true);
        expect('mint' in response.body.result).toBe(true);
        expect('staking' in response.body.result).toBe(true);
        expect('gov' in response.body.result).toBe(true);
        expect('distribution' in response.body.result).toBe(true);
        expect('slashing' in response.body.result).toBe(true);
    });
});
