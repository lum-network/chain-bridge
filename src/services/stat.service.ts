import {Injectable} from "@nestjs/common";

import {BeamService} from "@app/services/beam.service";
import {BeamStatus} from "@app/utils";

@Injectable()
export class StatService {
    constructor(
        private readonly _beamService: BeamService
    ) {
    }

    getKpi = async (): Promise<any> => {
        const [pending, validated, canceled] = await Promise.all([
            this._beamService.countByStatus(BeamStatus.OPEN),
            this._beamService.countByStatus(BeamStatus.CLOSED),
            this._beamService.countByStatus(BeamStatus.CANCELED)
        ]);
        const [globalTotal, globalAverage, globalMax] = await Promise.all([
            this._beamService.sumTotalAmount(),
            this._beamService.averageTotalAmount(),
            this._beamService.maxTotalAmount()
        ])
        const [,, todayMax] = await Promise.all([
            this._beamService.sumTotalAmount(new Date()),
            this._beamService.averageTotalAmount(new Date()),
            this._beamService.maxTotalAmount(new Date())
        ]);
        const merchants = await this._beamService.countDifferentCreatorAddresses();
        return {
            result: {
                beams: {
                    total: await this._beamService.countTotal(),
                    pending: pending,
                    validated: validated,
                    canceled: canceled
                },
                rewards: {
                    total: globalTotal,
                    average: globalAverage,
                    best_ath: globalMax,
                    best_today: todayMax
                },
                medias: {
                    total: 0 //TODO: implement
                },
                merchants: {
                    total: merchants
                }
            }
        }
    }
}
