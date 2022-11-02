import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AssetEntity } from '@app/database';
import { filterFalsy, GenericValueEntity, getDateFromString } from '@app/utils';
import { AssetInfo } from '@app/http';

@Injectable()
export class AssetService {
    constructor(@InjectRepository(AssetEntity) private readonly _repository: Repository<AssetEntity>) {}

    getByCompositeKey = async (compositeKey: string): Promise<AssetEntity> => {
        return this._repository.findOne({
            where: {
                id: compositeKey,
            },
        });
    };

    getExtra = async (): Promise<{ id: string; extra: [] }[]> => {
        const extra = this._repository.createQueryBuilder('assets').select(['id', 'extra']);
        return await extra.getRawMany();
    };

    createOrUpdateAssetValue = async (compositeKey: string, value: any): Promise<AssetEntity> => {
        let entity = await this.getByCompositeKey(compositeKey);

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

        await this._repository.save(entity);
        return entity;
    };

    chainAssetCreateOrUpdateValue = async (getAssetInfo: AssetInfo[]): Promise<void> => {
        for (const key of filterFalsy(getAssetInfo)) {
            const compositeKey = `${key.symbol.toLowerCase()}_${Object.keys(key)[0]}`;
            const value = { [Object.keys(key)[0]]: Object.values(key)[0], last_updated_at: new Date() };

            await this.createOrUpdateAssetValue(compositeKey, value);
        }
    };

    owneAssetCreateOrUpdateValue = async (getAssetInfo: any, name: string): Promise<void> => {
        for (const key in filterFalsy(getAssetInfo)) {
            const compositeKey = `${name.toLowerCase()}_${key}`;

            const value = { [key]: getAssetInfo[key], last_updated_at: new Date() };

            await this.createOrUpdateAssetValue(compositeKey, value);
        }
    };

    createOrUpdateAssetExtra = async (compositeKey: string): Promise<GenericValueEntity> => {
        const entity = await this.getByCompositeKey(compositeKey);

        const query = await this._repository.query(`
            UPDATE assets
            SET extra = extra || '${JSON.stringify(entity.value)}'::jsonb
            WHERE id = '${compositeKey}'
        `);

        return query;
    };

    assetCreateOrAppendExtra = async (): Promise<void> => {
        const record = await this._repository.createQueryBuilder('assets').select(['id', 'value']).orderBy('id', 'ASC').getRawMany();

        for (const key of record) {
            if (key) {
                const entity = await this.getByCompositeKey(key.id);

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

        data.forEach((el) => (assetInfo[el.symbol] = { ...assetInfo[el.symbol], ...el }));

        // Return the length and the values
        return [Object.values(assetInfo), Object.values(assetInfo).length];
    };

    fetchMetricsSince = async (metrics: string, date: string, skip: number): Promise<[{ id: string; extra: [] }[], number]> => {
        // Date will come as string format with month and year 'Jan-2022'
        const formatedDate = date.split('-');

        const getMonth = getDateFromString(formatedDate[0], formatedDate[1]);
        const startDate = new Date(`${formatedDate[1]}-${getMonth}-01`);

        const query = await this._repository.createQueryBuilder('assets').select(['id', 'extra']).where('id = :metrics', { metrics: metrics }).skip(skip).getRawMany();
        const result = query.map((el) => ({
            id: el.id,
            extra: el.extra.filter((el) => new Date(el.last_updated_at).getTime() >= startDate.getTime() && new Date(el.last_updated_at).getTime() < new Date().getTime()),
        }));

        return [result, result.length];
    };
}
