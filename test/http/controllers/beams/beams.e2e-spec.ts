import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ApiModule } from '@app/modules';
import { BeamService } from '@app/services';
import { beamEvent1, beamEvent2, beamSeed1, beamSeed2 } from './seed';

describe('Beams (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        const beamsQueryExecutor = app.get<BeamService>(BeamService);

        await beamsQueryExecutor.createBeam(beamSeed1, beamEvent1);
        await beamsQueryExecutor.createBeam(beamSeed2, beamEvent2);
    });

    afterAll(async () => {
        await app.close();
    });

    it('[GET] - should return beams', async () => {
        const response = await request(app.getHttpServer()).get('/beams');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThan(0);
        expect(response.body.metadata.items_count).toBeGreaterThan(0);
        expect(response.body.result[0].status).toBeGreaterThanOrEqual(0);
        expect(response.body.result[0].status).toBeLessThanOrEqual(4);
    });

    it('[GET] - should return a beam by id', async () => {
        const response = await request(app.getHttpServer()).get('/beams/00ae0884-bfd6-4c96-afc1-14355ebbced8');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.status).toBeGreaterThanOrEqual(0);
        expect(response.body.result.status).toBeLessThanOrEqual(4);
        expect(response.body.result.schema).toEqual('lum-network/review');
    });
});
