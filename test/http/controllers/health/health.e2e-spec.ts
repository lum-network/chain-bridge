import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ApiModule } from '@app/modules';
import { mockResponseHealth } from './mock.data';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/health (GET)', () => {
        return request(app.getHttpServer()).get('/health').expect(200).expect(mockResponseHealth);
    });
    afterAll(async () => {
        await app.close();
    });
});
