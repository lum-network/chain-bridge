import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';

import request from 'supertest';

import { ApiModule } from '@app/modules';
import { AssetService } from '@app/services';
import { AssetSymbol } from '@app/utils';

import { chainSeed, dfrSeed, lumSeed } from './seed';

describe('Dfract (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        const dfractQueryExecutor = app.get<AssetService>(AssetService);

        await dfractQueryExecutor.ownAssetCreateOrUpdateValue(lumSeed, AssetSymbol.LUM);
        await dfractQueryExecutor.chainAssetCreateOrUpdateValue(chainSeed);
        await dfractQueryExecutor.ownAssetCreateOrUpdateValue(dfrSeed, AssetSymbol.DFR);
        await dfractQueryExecutor.assetCreateOrAppendExtra();
    });

    afterAll(async () => {
        await app.close();
    });

    jest.setTimeout(30000);
    it('[GET] - should return the latest asset metrics for the seeded data', async () => {
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
        expect(response.body.result[0].id === 'lum_apy').toBe(true);
        expect(response.body.result[0].extra.length).toBeGreaterThan(0);
    });

    it('[GET] - should return response for specific asset denom (lum)', async () => {
        const response = await request(app.getHttpServer()).get('/dfract/assets/lum');
        expect(response.body.code).toEqual(HttpStatus.OK);
        response.body.result.forEach((obj) => {
            expect(obj).toHaveProperty('value');
            expect(obj.value).toHaveProperty('last_updated_at');
            expect(obj.value.last_updated_at).toBeTruthy();

            if (obj.id === 'lum_total_allocated_token') {
                expect(obj.value).toHaveProperty('total_allocated_token');
                expect(obj.value.total_allocated_token).toBeGreaterThan(0);
            }

            if (obj.id === 'lum_total_value_usd') {
                expect(obj.value).toHaveProperty('total_value_usd');
                expect(obj.value.total_value_usd).toBeGreaterThan(0);
            }

            if (obj.id === 'lum_unit_price_usd') {
                expect(obj.value).toHaveProperty('unit_price_usd');
                expect(obj.value.unit_price_usd).toBeGreaterThan(0);
            }

            if (obj.id === 'lum_apy') {
                expect(obj.value).toHaveProperty('apy');
                expect(obj.value.apy).toBeGreaterThan(0);
            }

            if (obj.id === 'lum_supply') {
                expect(obj.value).toHaveProperty('supply');
                expect(obj.value.supply).toBeGreaterThan(0);
            }
        });
    });
});
