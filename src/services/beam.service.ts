import {Inject, Injectable} from "@nestjs/common";

import {Repository} from "typeorm";

import {BeamEntity} from "@app/database";

@Injectable()
export class BeamService {
    constructor(
        @Inject('BEAM_REPOSITORY') private readonly _repository: Repository<BeamEntity>
    ) {
    }

    fetch = async (skip: number, take: number): Promise<[BeamEntity[], number]> => {
        const query = this._repository.createQueryBuilder('beams').skip(skip).take(take);
        return query.getManyAndCount();
    }

    get = async (id: string): Promise<BeamEntity> => {
        return this._repository.findOne({
            where: {
                id
            }
        });
    }

    save = async (entity: Partial<BeamEntity>): Promise<BeamEntity> => {
        return this._repository.save(entity);
    }

    saveBulk = async (entities: Partial<BeamEntity>[]): Promise<BeamEntity[]> => {
        return this._repository.save(entities);
    }
}
