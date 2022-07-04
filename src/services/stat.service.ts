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
        const todayKpi = await this._beamService.acquireTodayKpi();
        const globalKpi = await this._beamService.acquireGlobalKpi();
        const merchants = await this._beamService.countDifferentCreatorAddresses();
        return {
            beams: {
                total: await this._beamService.countTotal(),
                pending: pending,
                validated: validated,
                canceled: canceled
            },
            rewards: {
                total: globalKpi.sum,
                average: globalKpi.avg,
                best_ath: globalKpi.max,
                best_today: todayKpi.max
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
