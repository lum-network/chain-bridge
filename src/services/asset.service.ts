import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AssetEntity } from '@app/database';
import { GenericValueEntity } from '@app/utils';

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

    getLatestValue = async (): Promise<any> => {
        const query = await this._repository.createQueryBuilder('assets').select(['id', 'value']).orderBy('id', 'ASC').getRawMany();

        return query;
    };

    getLatestExtra = async (): Promise<any> => {
        const query = await this._repository.createQueryBuilder('assets').select(['id', 'extra']).orderBy('id', 'ASC').getRawMany();

        return query;
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

    chainAssetCreateOrUpdateValue = async (getTokenInfo: any) => {
        for (const key of await getTokenInfo) {
            if (key) {
                const compositeKey = `${key?.symbol}_${Object.keys(key)[0]}`;
                const value = { [Object.keys(key)[0]]: Object.values(key)[0], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
    };

    owneAssetCreateOrUpdateValue = async (getTokenInfo: any, name: string) => {
        for (const key in getTokenInfo) {
            if (key) {
                const compositeKey = `${name}_${key}`;

                const value = { [key]: getTokenInfo[key], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
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

    assetCreateOrAppendExtra = async () => {
        const record = await this.getLatestValue();

        for (const key of record) {
            const entity = await this.getByMetrics(key?.id);

            if (entity) await this.createOrUpdateAssetExtra(key?.id);
        }
    };

    fetchLatestAssetMetrics = async (skip: number, take: number): Promise<any> => {
        let query = {};

        const sql = await this._repository.createQueryBuilder('assets').select(['id', 'value']).orderBy('id', 'ASC').skip(skip).take(take).getRawMany();

        const data = sql.map((el) => {
            const { id, ...rest } = el;
            return { symbol: el.id.substring(0, id.indexOf('_')), ...rest.value };
        });

        data.forEach((a) => (query[a.symbol] = { ...query[a.symbol], ...a }));

        query = Object.values(query);

        return query;
    };
}
