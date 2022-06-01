import {Inject, Injectable} from "@nestjs/common";

import {Repository} from "typeorm";

import {BeamEntity} from "@app/database";

@Injectable()
export class BeamService {
    constructor(
        @Inject('BEAM_REPOSITORY') private readonly _repository: Repository<BeamEntity>
    ) {
    }

    save = async (entity: Partial<BeamEntity>): Promise<BeamEntity> => {
        return this._repository.save(entity);
    }

    saveBulk = async (entities: Partial<BeamEntity>[]): Promise<BeamEntity[]> => {
        return this._repository.save(entities);
    }
}
