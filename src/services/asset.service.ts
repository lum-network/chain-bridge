import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AssetEntity } from '@app/database';
import { GenericValueEntity, getDateFromString } from '@app/utils';
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

    chainAssetCreateOrUpdateValue = async (getTokenInfo: TokenInfo[]) => {
        for (const key of getTokenInfo) {
            if (key) {
                const compositeKey = `${key.symbol.toLowerCase()}_${Object.keys(key)[0]}`;
                const value = { [Object.keys(key)[0]]: Object.values(key)[0], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
    };

    owneAssetCreateOrUpdateValue = async (getTokenInfo: any, name: string) => {
        for (const key in getTokenInfo) {
            if (key) {
                const compositeKey = `${name.toLowerCase()}_${key}`;

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
        const record = await this._repository.createQueryBuilder('assets').select(['id', 'value']).orderBy('id', 'ASC').getRawMany();

        for (const key of record) {
            const entity = await this.getByMetrics(key?.id);

            if (entity) await this.createOrUpdateAssetExtra(key?.id);
        }
    };

    fetchLatestMetrics = async (skip: number, take: number): Promise<TokenInfo[]> => {
        const query = {};

        const sql = await this._repository.createQueryBuilder('assets').select(['id', 'value']).orderBy('id', 'ASC').skip(skip).take(take).getRawMany();

        const data = sql.map((el) => {
            const { id, ...rest } = el;
            return { symbol: el.id.substring(0, id.indexOf('_')), ...rest.value };
        });

        data.forEach((el) => (query[el.symbol] = { ...query[el.symbol], ...el }));

        return Object.values(query);
    };

    fetchMetricsSince = async (metrics: string, date: string, skip: number, take: number): Promise<any> => {
        // Date will come as string format with month and year 'Jan-2022'
        const formatedDate = date.split('-');

        const getMonth = getDateFromString(formatedDate[0], formatedDate[1]);
        const startDate = new Date(`${formatedDate[1]}-${getMonth}-01`);

        const query = await this._repository.createQueryBuilder('assets').select(['id', 'extra']).where('id = :metrics', { metrics: metrics }).skip(skip).take(take).getRawMany();

        return query.map((el) => ({
            id: el.id,
            extra: el.extra.filter((el) => new Date(el.last_updated_at).getTime() >= startDate.getTime() && new Date(el.last_updated_at).getTime() < new Date().getTime()),
        }));
    };
}
