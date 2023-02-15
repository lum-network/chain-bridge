import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';

import request from 'supertest';

import { ApiModule } from '@app/modules';
import { AssetService } from '@app/services';

import { chainSeed } from './seed';

describe('Dfract (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        const dfractQueryExecutor = app.get<AssetService>(AssetService);

        await dfractQueryExecutor.createFromInfo(chainSeed);
        await dfractQueryExecutor.create(`dfr_account_balance`, String(1.0837));
        await dfractQueryExecutor.create(`dfr_tvl`, String(856346));
        await dfractQueryExecutor.create(`dfr_unit_price_usd`, String(0.91234));
        await dfractQueryExecutor.create(`dfr_total_value_usd`, String(856346));
        await dfractQueryExecutor.create(`dfr_supply`, String(7473637363));
        await dfractQueryExecutor.create(`dfr_apy`, String(0.2983));
    });

    afterAll(async () => {
        await app.close();
    });

    it('[GET] - should return the latest asset metrics', async () => {
        const response = await request(app.getHttpServer()).get('/dfract/assets/latest');
        expect(response.body.code).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThan(0);
        expect(response.body.metadata.items_total).toBeGreaterThan(0);
        response.body.result.forEach((obj) => {
            if (obj.id === 'dfr_account_balance') {
                expect(obj.value).toHaveProperty('account_balance');
                expect(obj.value.account_balance).toBeGreaterThan(0);
            }
            if (obj.id === 'dfr_apy') {
                expect(obj.value).toHaveProperty('apy');
                expect(obj.value.apy).toBeGreaterThan(0);
            }
            if (obj.id === 'dfr_supply') {
                expect(obj.value).toHaveProperty('supply');
                expect(obj.value.supply).toBeGreaterThan(0);
            }
            if (obj.id === 'dfr_total_value_usd') {
                expect(obj.value).toHaveProperty('total_value_usd');
                expect(obj.value.total_value_usd).toBeGreaterThan(0);
            }
            if (obj.id === 'dfr_tvl') {
                expect(obj.value).toHaveProperty('tvl');
                expect(obj.value.tvl).toBeGreaterThan(0);
            }
        });
    });

    it('[GET] - should return paginated call for the latest assets', async () => {
        const response = await request(app.getHttpServer()).get('/dfract/assets/latest?limit=10');
        expect(response.body.code).toEqual(HttpStatus.OK);
        expect(response.body.metadata.items_count).toEqual(10);
    });

    it('[POST] - should return the apy metrics for lum since december 2022', async () => {
        const response = await request(app.getHttpServer()).post('/dfract/assets/since').send({
            metrics: 'lum_apy',
            since: '2022-12-01 00:00:00',
        });
        expect(response.body.code).toEqual(HttpStatus.OK);
        expect(response.body.result[0].key === 'lum_apy').toBe(true);
    });

    it('[GET] - should return response for specific asset denom (lum)', async () => {
        const response = await request(app.getHttpServer()).get('/dfract/assets/lum');
        expect(response.body.code).toEqual(HttpStatus.OK);
        response.body.result.forEach((obj) => {
            expect(obj).toHaveProperty('id');
            expect(obj).toHaveProperty('key');
            expect(obj).toHaveProperty('value');
            expect(obj).toHaveProperty('created_at');

            if (obj.key === 'lum_total_allocated_token') {
                expect(Number(obj.value)).toBeGreaterThan(0);
            }

            if (obj.key === 'lum_total_value_usd') {
                expect(Number(obj.value)).toBeGreaterThan(0);
            }

            if (obj.key === 'lum_unit_price_usd') {
                expect(Number(obj.value)).toBeGreaterThan(0);
            }

            if (obj.key === 'lum_apy') {
                expect(Number(obj.value)).toBeGreaterThan(0);
            }

            if (obj.key === 'lum_supply') {
                expect(Number(obj.value)).toBeGreaterThan(0);
            }
        });
    });
});
