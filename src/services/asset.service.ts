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

    createOrUpdateAssetValue = async (compositeKey: string, value: GenericValueEntity): Promise<AssetEntity> => {
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

    ownAssetCreateOrUpdateValue = async (getAssetInfo: any, name: string): Promise<void> => {
        for (const key in filterFalsy(getAssetInfo)) {
            if (key) {
                const compositeKey = `${name.toLowerCase()}_${key}`;

                const value = { [key]: getAssetInfo[key], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
    };

    // Helper function to append historical data to the extra column
    createOrUpdateAssetExtra = async (compositeKey: string): Promise<GenericValueEntity> => {
        // We first query the entity by passing the id
        const entity = await this.getById(compositeKey);

        // We update the assets table by passing the latest entity.value column to the extra column
        // We append extra column array by making sure to only update for the given id
        // This allows to have historical data for each metrics
        const query = await this._repository.query(`
            UPDATE assets
            SET extra = extra || '${JSON.stringify(entity.value)}'::jsonb
            WHERE id = '${compositeKey}'
        `);

        // We return the value of the query
        return query;
    };

    assetCreateOrAppendExtra = async (): Promise<void> => {
        // We ONLY append historical data to the extra column if there is a value record registered
        const record = await this._repository.createQueryBuilder('assets').select(['id', 'value']).orderBy('id', 'ASC').getRawMany();

        for (const key of record) {
            if (key) {
                const entity = await this.getById(key.id);

                if (entity) {
                    await this.createOrUpdateAssetExtra(key.id);
                }
            }
        }
    };

    fetchLatestMetrics = async (skip: number, take: number): Promise<[AssetEntity[], number]> => {
        const query = this._repository.createQueryBuilder('assets').skip(skip).take(take).orderBy('id', 'ASC');

        // Return the values and the length
        return query.getManyAndCount();
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

    fetchLatestAsset = async (denom: string): Promise<{ id: string; value: GenericValueEntity }[]> => {
        // Fetch assets by denom
        const query = await this._repository
            .createQueryBuilder('assets')
            .select(['id', 'value'])
            .where('id like :id', { id: `%${denom}%` })
            .getRawMany();

        return query;
    };

    getChainServiceApy = async (): Promise<{ symbol: string; apy: number }[]> => {
        const query = await this._repository.createQueryBuilder('assets').select(['id', 'value']).where('id like :id', { id: `%apy%` }).getRawMany();

        const filteredQuery = query.filter((el) => el.id !== 'dfr_apy' && el.id !== 'lum_apy');

        return filteredQuery
            .map((el) => ({
                symbol: el.id.substring(0, el.id.indexOf('_')).toUpperCase(),
                apy: el.value.apy,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getChainServicePrice = async (): Promise<{ symbol: string; unit_price_usd: number }[]> => {
        const query = await this._repository.createQueryBuilder('assets').select(['id', 'value']).where('id like :id', { id: `%unit_price_usd%` }).getRawMany();

        const filteredQuery = query.filter((el) => el.id !== 'dfr_unit_price_usd' && el.id !== 'lum_unit_price_usd');

        return filteredQuery
            .map((el) => ({
                symbol: el.id.substring(0, el.id.indexOf('_')).toUpperCase(),
                unit_price_usd: el.value.unit_price_usd,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getChainServiceTotalAllocatedToken = async (): Promise<{ symbol: string; total_allocated_token: number }[]> => {
        const query = await this._repository.createQueryBuilder('assets').select(['id', 'value']).where('id like :id', { id: `%total_allocated_token%` }).getRawMany();

        const filteredQuery = query.filter((el) => el.id !== 'dfr_total_allocated_token' && el.id !== 'lum_total_allocated_token');

        return filteredQuery
            .map((el) => ({
                symbol: el.id.substring(0, el.id.indexOf('_')).toUpperCase(),
                total_allocated_token: el.value.total_allocated_token,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getDfrAccountBalance = async (): Promise<{ symbol: string; account_balance: number }[]> => {
        const query = await this._repository.createQueryBuilder('assets').select(['id', 'value']).where('id like :id', { id: `%dfr_account_balance%` }).getRawMany();

        return query.map((el) => el.value.account_balance);
    };

    getDfrTotalComputedTvl = async (): Promise<{ symbol: string; tvl: number }[]> => {
        const query = await this._repository.createQueryBuilder('assets').select(['id', 'value']).where('id like :id', { id: `%dfr_tvl%` }).getRawMany();

        return query.map((el) => el.value.tvl);
    };
}
