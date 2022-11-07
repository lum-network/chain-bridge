import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from '@app/modules';
import request from 'supertest';

import {
    mockResponseReviewSumDaily,
    mockResponseReviewSumMonthly,
    mockResponseReviewSumYearly,
    mockResponseRewardAvgDaily,
    mockResponseRewardAvgMonthly,
    mockResponseRewardAvgYearly,
    mockResponseRewardSumDaily,
    mockResponseRewardSumMonthly,
    mockResponseRewardSumYearly,
} from './mock.data';

import { DatabaseConfig } from '@app/database';

describe('Stats (e2e)', () => {
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

    describe('REVIEWS_SUM - should return the sum of reviews from 2022-11-07 to 2022-16-09', () => {
        it('[POST] - Daily', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'reviews_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'daily',
                })
                .expect(mockResponseReviewSumDaily);
        });

        it('[POST] - Monthly', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'reviews_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'monthly',
                })
                .expect(mockResponseReviewSumMonthly);
        });

        it('[POST] - Yearly', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'reviews_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'yearly',
                })
                .expect(mockResponseReviewSumYearly);
        });

        it('[POST] - fallback to daily if no group_type property', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'reviews_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                })
                .expect(mockResponseReviewSumDaily);
        });
    });

    describe('REWARDS_SUM - should return the sum of rewards from 2022-11-07 to 2022-16-09', () => {
        it('[POST] - Daily', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'daily',
                })
                .expect(mockResponseRewardSumDaily);
        });

        it('[POST] - Monthly', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'monthly',
                })
                .expect(mockResponseRewardSumMonthly);
        });

        it('[POST] - Yearly', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'yearly',
                })
                .expect(mockResponseRewardSumYearly);
        });

        it('[POST] - fallback to daily if no group_type property', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_sum',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                })
                .expect(mockResponseRewardSumDaily);
        });
    });

    describe('REWARDS_AVG - should return the average of rewards from 2022-11-07 to 2022-16-09', () => {
        it('[POST] - Daily', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_avg',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'daily',
                })
                .expect(mockResponseRewardAvgDaily);
        });

        it('[POST] - Monthly', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_avg',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'monthly',
                })
                .expect(mockResponseRewardAvgMonthly);
        });

        it('[POST] - Yearly', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_avg',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                    group_type: 'yearly',
                })
                .expect(mockResponseRewardAvgYearly);
        });

        it('[POST] - fallback to daily if no group_type property', () => {
            return request(app.getHttpServer())
                .post('/stats/chart')
                .send({
                    type: 'rewards_avg',
                    start_at: '2022-07-11 00:00:00',
                    end_at: '2022-09-16 00:00:00',
                })
                .expect(mockResponseRewardAvgDaily);
        });
    });

    afterAll(async () => {
        await app.close();
    });
});
