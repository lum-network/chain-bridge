import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AssetEntity } from '@app/database';
import { filterFalsy, GenericValueEntity } from '@app/utils';
import { AssetInfo } from '@app/http';

@Injectable()
export class AssetService {
    constructor(@InjectRepository(AssetEntity) private readonly _repository: Repository<AssetEntity>) {}

    getById = async (compositeKey: string): Promise<AssetEntity> => {
        return this._repository.findOne({
            where: {
                id: compositeKey,
            },
        });
    };

    getExtra = async (): Promise<{ id: string; extra: [] }[]> => {
        return await this._repository.createQueryBuilder('assets').select(['id', 'extra']).getRawMany();
    };

    createOrUpdateAssetValue = async (compositeKey: string, value: any): Promise<AssetEntity> => {
        let entity = await this.getById(compositeKey);

        // If entity does not exists, we create with a new one
        if (!entity) {
            entity = new AssetEntity({
                id: compositeKey,
                value,
            });
        } else {
            // Otherwise, we just update the propertiess
            entity.id = compositeKey;
            entity.value = value;
        }

        return this._repository.save(entity);
    };

    chainAssetCreateOrUpdateValue = async (getAssetInfo: AssetInfo[]): Promise<void> => {
        for (const key of filterFalsy(getAssetInfo)) {
            if (key) {
                const compositeKey = `${key.symbol.toLowerCase()}_${Object.keys(key)[0]}`;
                const value = { [Object.keys(key)[0]]: Object.values(key)[0], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
    };

    owneAssetCreateOrUpdateValue = async (getAssetInfo: any, name: string): Promise<void> => {
        for (const key in filterFalsy(getAssetInfo)) {
            if (key) {
                const compositeKey = `${name.toLowerCase()}_${key}`;

                const value = { [key]: getAssetInfo[key], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
    };

    createOrUpdateAssetExtra = async (compositeKey: string): Promise<GenericValueEntity> => {
        // Helper function to append historical data to the extra column
        const entity = await this.getById(compositeKey);

        const query = await this._repository.query(`
            UPDATE assets
            SET extra = extra || '${JSON.stringify(entity.value)}'::jsonb
            WHERE id = '${compositeKey}'
        `);

        return query;
    };

    assetCreateOrAppendExtra = async (): Promise<void> => {
        // We ONLY append historical data to the extra column if there is a value record registered
        const record = await this._repository.createQueryBuilder('assets').select(['id', 'value']).orderBy('id', 'ASC').getRawMany();

        for (const key of record) {
            if (key) {
                const entity = await this.getById(key.id);

                if (entity) await this.createOrUpdateAssetExtra(key.id);
            }
        }
    };

    fetchLatestMetrics = async (skip: number): Promise<[AssetInfo[], number]> => {
        const assetInfo = {};

        const query = await this._repository.createQueryBuilder('assets').select(['id', 'value']).skip(skip).orderBy('id', 'ASC').getRawMany();

        // For every compositeKey we group by symbol to get the {unit_price_usd, total_value_usd, apy, supply}
        const data = query.map((el) => {
            const { id, ...rest } = el;
            return { symbol: el.id.substring(0, id.indexOf('_')), ...rest.value };
        });

        Promise.all(data.map((el) => (assetInfo[el.symbol] = { ...assetInfo[el.symbol], ...el })));

        // Return the length and the values
        return [Object.values(assetInfo), Object.values(assetInfo).length];
    };

    fetchMetricsSince = async (metrics: string, date: Date): Promise<{ id: string; extra: [] }[]> => {
        // Date will come as string format with month and year 'Jan-2022'

        const query = await this._repository.createQueryBuilder('assets').select(['id', 'extra']).where('id = :metrics', { metrics: metrics }).getRawMany();

        // We return data that has been request since the start of the requested month
        return query.map((el) => ({
            id: el.id,
            extra: el.extra.filter((el) => new Date(el.last_updated_at).getTime() >= new Date(date).getTime() && new Date(el.last_updated_at).getTime() < new Date().getTime()),
        }));
    };
}
