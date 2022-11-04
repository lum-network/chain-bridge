import { Injectable } from '@nestjs/common';

import moment from 'moment';

import { BeamService } from '@app/services/beam.service';
import { BlockService } from '@app/services/block.service';
import { LumNetworkService } from '@app/services/lum-network.service';
import { TransactionService } from '@app/services/transaction.service';

import { BeamStatus, ChartTypes } from '@app/utils';

@Injectable()
export class StatService {
    constructor(
        private readonly _blockService: BlockService,
        private readonly _beamService: BeamService,
        private readonly _lumService: LumNetworkService,
        private readonly _transactionService: TransactionService,
    ) {}

    getKpi = async (): Promise<any> => {
        const [pending, validated, canceled] = await Promise.all([
            this._beamService.countByStatus(BeamStatus.OPEN),
            this._beamService.countByStatus(BeamStatus.CLOSED),
            this._beamService.countByStatus(BeamStatus.CANCELED),
        ]);
        const [globalTotal, globalAverage, globalMax] = await Promise.all([this._beamService.sumTotalAmount(), this._beamService.averageTotalAmount(), this._beamService.maxTotalAmount()]);
        const [, , todayMax] = await Promise.all([this._beamService.sumTotalAmount(new Date()), this._beamService.averageTotalAmount(new Date()), this._beamService.maxTotalAmount(new Date())]);
        const merchants = await this._beamService.countDifferentCreatorAddresses();
        return {
            result: {
                blocks: {
                    total: await this._blockService.countTotal(),
                },
                beams: {
                    total: await this._beamService.countTotal(),
                    pending: pending,
                    validated: validated,
                    canceled: canceled,
                },
                medias: {
                    total: 0, //TODO: implement
                },
                merchants: {
                    total: merchants,
                },
                rewards: {
                    total: globalTotal,
                    average: globalAverage,
                    best_ath: globalMax,
                    best_today: todayMax,
                },
                transactions: {
                    total: await this._transactionService.countTotal(),
                },
            },
        };
    };

    getChart = async (type: ChartTypes, startAt: Date, endAt: Date, groupType: string): Promise<any> => {
        switch (type) {
            case ChartTypes.ASSET_VALUE:
                const startAtTimestamp = moment(startAt).unix();
                const endAtTimestamp = moment(endAt).unix();

                return await this._lumService.getPriceHistory(startAtTimestamp, endAtTimestamp);

            case ChartTypes.REVIEWS_SUM:
                return await this._beamService.countInRange(startAt, endAt, groupType);

            case ChartTypes.REWARDS_SUM:
                return await this._beamService.sumTotalAmountInRange(startAt, endAt);

            case ChartTypes.REWARDS_AVG:
                return await this._beamService.averageTotalAmountInRange(startAt, endAt, groupType);

            case ChartTypes.REWARDS_LAST:
                return await this._beamService.fetchLastClaimed();

            case ChartTypes.MERCHANTS_LAST:
                break;

            case ChartTypes.WALLETS_TOP:
                break;
        }
        return null;
    };
}
