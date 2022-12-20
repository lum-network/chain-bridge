import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { LumConstants } from '@lum-network/sdk-javascript';
import request from 'supertest';

import { ApiModule } from '@app/modules';
import { ProposalDepositService, ProposalVoteService } from '@app/services';
import { depositSeed, voteSeed } from './seed';

describe('Governance (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        const depositQueryExecutor = app.get<ProposalDepositService>(ProposalDepositService);
        const voteQueryExecutor = app.get<ProposalVoteService>(ProposalVoteService);

        await depositQueryExecutor.createOrUpdateDepositors(depositSeed.proposalId, depositSeed.depositorAddress, depositSeed.amount);
        await voteQueryExecutor.createOrUpdateVoters(voteSeed.proposalId, voteSeed.voterAddress, voteSeed.voteOption, voteSeed.voteWeight);
    });

    afterAll(async () => {
        await app.close();
    });

    it('[GET] - should return proposals', async () => {
        const response = await request(app.getHttpServer()).get('/governance/proposals');
        if (response.status === HttpStatus.OK) {
            expect(response.status).toEqual(HttpStatus.OK);
        }
    });

    it('[GET] - should return proposals by id', async () => {
        const response = await request(app.getHttpServer()).get('/governance/proposals/21');
        if (response.status === HttpStatus.OK) {
            expect(response.body.result.proposal_id.low).toBe(21);
            expect(response.body.result.status).toBeGreaterThanOrEqual(-1);
            expect(response.body.result.status).toBeLessThanOrEqual(4);
        }
    });

    it('[GET] - should return depositors by id', async () => {
        const response = await request(app.getHttpServer()).get('/governance/proposals/21/depositors');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThan(0);
        expect(Number(response.body.result[0].amount.amount)).toBeGreaterThanOrEqual(100000000000);
        expect(response.body.result[0].amount.denom).toEqual(LumConstants.MicroLumDenom);
        expect(response.body.result[0].proposal_id).toBe(depositSeed.proposalId);
        expect(response.body.result[0].depositor_address).toEqual(expect.stringMatching(/^lumvaloper/));
        expect(response.body.metadata.items_count).toBeGreaterThan(0);
    });

    it('[GET] - should return voters by id', async () => {
        const response = await request(app.getHttpServer()).get('/governance/proposals/21/voters');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThan(0);
        expect(response.body.result[0].vote_option).toBeGreaterThanOrEqual(-1);
        expect(response.body.result[0].vote_option).toBeLessThanOrEqual(4);
        expect(response.body.result[0].vote_weight).toBe(voteSeed.voteWeight);
        expect(response.body.result[0].voter_address).toEqual(expect.stringMatching(/^lum1/));
        expect(response.body.metadata.items_count).toBeGreaterThan(0);
    });
});
