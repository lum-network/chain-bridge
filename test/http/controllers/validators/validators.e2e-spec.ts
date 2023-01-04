import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';

import { ApiModule } from '@app/modules';
import { BlockService, ValidatorDelegationService, ValidatorService } from '@app/services';

import { blockSeed1, blockSeed2, klubStakingDelegation, lumFoundationDelegation, validatorsSeed } from './seed';

describe('Validators (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApiModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        const validatorQueryExecutor = app.get<ValidatorService>(ValidatorService);
        const validatorDelegationQueryExecutor = app.get<ValidatorDelegationService>(ValidatorDelegationService);

        const blockQueryExecutor = app.get<BlockService>(BlockService);

        await app.init();

        // We first seed validators and delegations
        await validatorQueryExecutor.saveBulk(validatorsSeed);
        await validatorDelegationQueryExecutor.createOrUpdate(
            klubStakingDelegation.delegatorAddress,
            klubStakingDelegation.validatorAddress,
            klubStakingDelegation.shares,
            klubStakingDelegation.balances,
        );
        await validatorDelegationQueryExecutor.createOrUpdate(
            lumFoundationDelegation.delegatorAddress,
            lumFoundationDelegation.validatorAddress,
            lumFoundationDelegation.shares,
            lumFoundationDelegation.balances,
        );

        // We then seed blocks
        await blockQueryExecutor.save(blockSeed1);
        await blockQueryExecutor.save(blockSeed2);
    });

    afterAll(async () => {
        await app.close();
    });

    it('[GET] - should return a list of validators', async () => {
        const response = await request(app.getHttpServer()).get('/validators');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.length).toBeGreaterThan(0);
    });

    it('[GET] - should return information on a specific validator (Lum Network Testnet Foundation)', async () => {
        const response = await request(app.getHttpServer()).get(`/validators/lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh`);
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result.operator_address).toEqual(expect.stringMatching(/^lumvaloper/));
    });

    it('[GET] - should return information on blocks for a specific validator (Lum Network Testnet Foundation)', async () => {
        const response = await request(app.getHttpServer()).get('/validators/lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh/blocks');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result[0].operator_address).toEqual('lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh');
        expect(response.body.metadata.items_total).toBeGreaterThan(0);
    });

    it('[GET] - should return information on delegations for a specific validator (Lum Network Testnet Foundation)', async () => {
        const response = await request(app.getHttpServer()).get('/validators/lumvaloper1ugeeckr6frejr62jm60m69zxy7ttudc33rwxdh/delegations');
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.result[0].balance).toEqual(lumFoundationDelegation.balances);
        expect(response.body.metadata.items_total).toBeGreaterThan(0);
    });
});
