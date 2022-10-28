import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AssetEntity } from '@app/database';
import { GenericValueEntity } from '@app/utils';
import { TokenInfo } from '@app/http';

@Injectable()
export class AssetService {
    constructor(@InjectRepository(AssetEntity) private readonly _repository: Repository<AssetEntity>) {}

    getByMetrics = async (metrics: string): Promise<AssetEntity> => {
        return this._repository.findOne({
            where: {
                id: metrics,
            },
        });
    };

    createOrUpdateAssetValue = async (metrics: string, value: any): Promise<AssetEntity> => {
        let entity = await this.getByMetrics(metrics);

        // If entity does not exists, we create with a new one
        if (!entity) {
            entity = new AssetEntity({
                id: metrics,
                value,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.id = metrics;
            entity.value = value;
        }

        await this._repository.save(entity);
        return entity;
    };

    createOrUpdateAssetExtra = async (metrics: string): Promise<GenericValueEntity> => {
        const entity = await this.getByMetrics(metrics);

        const query = await this._repository.query(`
            UPDATE assets
            SET extra = extra || '${JSON.stringify(entity.value)}'::jsonb
            WHERE id = '${metrics}'
        `);

        return query;
    };

    genericAsset = async (getTokenInfo: any) => {
        for (const key of await getTokenInfo) {
            const compositeKey = `${key.symbol}_${Object.keys(key)[0]}`;

            const value = { [Object.keys(key)[0]]: Object.values(key)[0], last_updated_at: new Date() };

            await this.createOrUpdateAssetValue(compositeKey, value);

            const entity = await this.getByMetrics(compositeKey);

            if (entity) await this.createOrUpdateAssetExtra(compositeKey);
        }
    };
}
