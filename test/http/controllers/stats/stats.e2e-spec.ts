import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';

import { ApiModule } from '@app/modules';
import request, { Response } from 'supertest';

import { StatService } from '@app/services';

describe('Stats (e2e)', () => {
    let app: INestApplication;
    let reviewsSum: Response;
    let sumResult: Promise<number>;
    let rewardsSum: Response;
    let rewardsSumResult: Promise<number>;
    let rewardsAvg: Response;
    let rewardsAvgResult: Promise<number>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        const statsQueryExecutor = app.get<StatService>(StatService);

        statsQueryExecutor.getKpi();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('REVIEWS_SUM - should return the sum of reviews from 2022-11-07 to 2022-16-09', () => {
        const startDate = new Date('2022-07-11 00:00:00');
        const endDate = new Date('2022-09-16 00:00:00');
        // The sum of the values should match for daily, monthly and yearly
        beforeEach(async () => {
            reviewsSum = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'reviews_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'yearly',
            });
            sumResult = reviewsSum.body.result.reduce((acc, curr) => acc + curr.value, 0);
        });

        it('[POST] - should return daily reviews_sum', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'reviews_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'daily',
            });

            const diffTime = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const reviewsSumDaily = response.body.result.reduce((acc, curr) => acc + curr.value, 0);

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(daysDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(reviewsSumDaily).toEqual(sumResult);
        });

        it('[POST] - should return monthly reviews_sum', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'reviews_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'monthly',
            });

            const reviewsSumMonthly = response.body.result.reduce((acc, curr) => acc + curr.value, 0);

            const monthDifference = endDate.getMonth() - startDate.getMonth() + 1;

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(monthDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(reviewsSumMonthly).toEqual(sumResult);
        });

        it('[POST] - should return yearly reviews_sum', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'reviews_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'yearly',
            });
            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
        });

        it('[POST] - should fallback to daily if no group_type property is given', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'reviews_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
            });

            const diffTime = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(daysDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
        });
    });

    describe('REWARDS_SUM - should return the sum of rewards from 2022-11-07 to 2022-16-09', () => {
        const startDate = new Date('2022-07-11 00:00:00');
        const endDate = new Date('2022-09-16 00:00:00');
        // The sum of the values should match for daily, monthly and yearly
        beforeEach(async () => {
            rewardsSum = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'yearly',
            });
            rewardsSumResult = rewardsSum.body.result.reduce((acc, curr) => acc + curr.rewards, 0);
        });
        it('[POST] - should return daily rewards_sum', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'daily',
            });

            const diffTime = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const rewardsSumDaily = response.body.result.reduce((acc, curr) => acc + curr.rewards, 0);

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(daysDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(rewardsSumDaily).toEqual(rewardsSumResult);
        });

        it('[POST] - should return monthly rewards_sum', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'monthly',
            });

            const rewardsSumMonthly = response.body.result.reduce((acc, curr) => acc + curr.rewards, 0);

            const monthDifference = endDate.getMonth() - startDate.getMonth() + 1;

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(monthDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(rewardsSumMonthly).toEqual(rewardsSumResult);
        });

        it('[POST] - should return yearly rewards_sum', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'yearly',
            });

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
        });

        it('[POST] - should fallback to daily if no group_type property is given', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_sum',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
            });

            const diffTime = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const rewardsSumDaily = response.body.result.reduce((acc, curr) => acc + curr.rewards, 0);

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(daysDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(rewardsSumDaily).toEqual(rewardsSumResult);
        });
    });

    describe('REWARDS_AVG - should return the average of rewards from 2022-11-07 to 2022-16-09', () => {
        const startDate = new Date('2022-07-11 00:00:00');
        const endDate = new Date('2022-09-16 00:00:00');
        // The sum of the values should match for daily, monthly and yearly
        beforeEach(async () => {
            rewardsAvg = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_avg',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'yearly',
            });
            rewardsAvgResult = rewardsAvg.body.result.reduce((acc, curr) => acc + curr.avg, 0);
        });

        it('[POST] - should return daily rewards_avg', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_avg',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'daily',
            });
            const diffTime = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const rewardsAvgDaily = response.body.result.reduce((acc, curr) => acc + curr.avg, 0);

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(daysDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(rewardsAvgDaily).toEqual(rewardsAvgResult);
        });

        it('[POST] - should return monthly rewards_avg', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_avg',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'monthly',
            });
            const rewardsAvgMonthly = response.body.result.reduce((acc, curr) => acc + curr.rewards, 0);

            const monthDifference = endDate.getMonth() - startDate.getMonth() + 1;

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(monthDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(rewardsAvgMonthly).toEqual(rewardsAvgResult);
        });

        it('[POST] - should return yearly rewards_avg', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_avg',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
                group_type: 'yearly',
            });

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
        });

        it('[POST] - should fallback to daily if no group_type property is given', async () => {
            const response = await request(app.getHttpServer()).post('/stats/chart').send({
                type: 'rewards_avg',
                start_at: '2022-07-11 00:00:00',
                end_at: '2022-09-16 00:00:00',
            });

            const diffTime = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const rewardsAvgDaily = response.body.result.reduce((acc, curr) => acc + curr.avg, 0);

            expect(response.status).toEqual(HttpStatus.CREATED);
            expect(response.body.result.length).toBeGreaterThan(0);
            expect(response.body.result.length).toEqual(daysDifference);
            for (const object of response.body.result) {
                expect(object).toHaveProperty('key');
                expect(object).toHaveProperty('value');
            }
            expect(rewardsAvgDaily).toEqual(rewardsAvgResult);
        });
    });

    describe('KPI', () => {
        it('[GET] - should return the kpis for beams in db', async () => {
            const response = await request(app.getHttpServer()).get('/stats/kpi');
            expect(response.status).toEqual(HttpStatus.OK);
            expect(response.body.result.blocks.total).toBeGreaterThanOrEqual(0);
            expect(response.body.result.beams.total).toBeGreaterThanOrEqual(0);
            expect(response.body.result.beams.pending).toBeGreaterThanOrEqual(0);
            expect(response.body.result.beams.validated).toBeGreaterThanOrEqual(0);
            expect(response.body.result.beams.canceled).toBeGreaterThanOrEqual(0);
            expect(response.body.result.medias.total).toBeGreaterThanOrEqual(0);
            expect(response.body.result.merchants.total).toBeGreaterThanOrEqual(0);
            expect(Number(response.body.result.rewards.total)).toBeGreaterThanOrEqual(0);
            expect(Number(response.body.result.rewards.average)).toBeGreaterThanOrEqual(0);
            expect(Number(response.body.result.rewards.best_ath)).toBeGreaterThanOrEqual(0);
            expect(Number(response.body.result.transactions.total)).toBeGreaterThanOrEqual(0);
        });
    });
});
