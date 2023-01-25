import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Like, Repository, UpdateResult } from 'typeorm';
import dayjs from 'dayjs';

import { AssetEntity } from '@app/database';
import { filterFalsy, GenericAssetInfo, GenericValueEntity } from '@app/utils';

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

    getExtra = async (): Promise<{ id: string; extra: GenericValueEntity[] }[]> => {
        return this._repository.find({
            select: ['id', 'extra'],
        });
    };

    createOrUpdate = async (compositeKey: string, value: GenericValueEntity): Promise<AssetEntity | UpdateResult> => {
        const entity = await this.getById(compositeKey);
        if (!entity) {
            const createAssetValueEntity = new AssetEntity({ id: compositeKey, value });
            return this._repository.save(createAssetValueEntity);
        }

        entity.id = compositeKey;
        entity.value = value;
        return this._repository.update(entity.id, entity);
    };

    createOrUpdateFromInfo = async (infos: GenericAssetInfo[]): Promise<void> => {
        // We avoid falsy values being inserted in the db
        for (const key of filterFalsy(infos)) {
            if (!key) {
                continue;
            }

            const compositeKey = `${key.symbol.toLowerCase()}_${Object.keys(key)[0]}`;
            const value = { [Object.keys(key)[0]]: Object.values(key)[0] };
            await this.createOrUpdate(compositeKey, value);
        }
    };

    // We create or append extra values
    createOrAppendExtra = async (): Promise<void> => {
        const records = await this.getExtra();

        for (const record of records) {
            const entity = await this.getById(record.id);

            // We want to exclude all redundant data
            if (entity.extra.includes(entity.value)) {
                continue;
            }

            // If the value is not present, append it to the extra array and update the db
            entity.extra.push(entity.value);
            await this._repository.update(record.id, entity);
        }
    };

    fetchLatestMetrics = async (skip: number, take: number): Promise<[AssetEntity[], number]> => {
        const query = this._repository.createQueryBuilder('assets').skip(skip).take(take).orderBy('id', 'ASC');
        return query.getManyAndCount();
    };

    fetchMetricsSince = async (metrics: string, date: Date): Promise<{ id: string; extra: GenericValueEntity[] }[]> => {
        // Date will come as string format with month and year 'Jan-2022'
        const data = await this._repository.find({
            where: {
                id: metrics,
            },
            select: ['id', 'extra', 'updated_at'],
        });

        // We return data that has been request since the start of the requested month
        /*return data.map((el) => ({
            id: el.id,
            extra: el.extra.filter((el) => new Date(el.updated_at).getTime() >= new Date(date).getTime() && new Date(el.last_updated_at).getTime() < new Date().getTime()),
        }));*/
        return [];
    };

    fetchLatestAsset = async (denom: string): Promise<{ id: string; value: GenericValueEntity }[]> => {
        return this._repository.find({
            where: {
                id: Like(`%${denom}%`),
            },
            select: ['id', 'value'],
        });
    };

    getAPYs = async (): Promise<{ symbol: string; apy: number }[]> => {
        const data = await this._repository.find({
            where: {
                id: Like(`%apy%`),
            },
            select: ['id', 'value'],
        });
        const filteredQuery = data.filter((el) => el.id !== 'dfr_apy' && el.id !== 'lum_apy');
        return filteredQuery
            .map((el) => ({
                symbol: el.id.substring(0, el.id.indexOf('_')).toUpperCase(),
                apy: (el.value as any).apy,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getPrices = async (): Promise<{ symbol: string; unit_price_usd: number }[]> => {
        const data = await this._repository.find({
            where: {
                id: Like(`%unit_price_usd%`),
            },
            select: ['id', 'value'],
        });
        const filteredQuery = data.filter((el) => el.id !== 'dfr_unit_price_usd' && el.id !== 'lum_unit_price_usd');
        return filteredQuery
            .map((el) => ({
                symbol: el.id.substring(0, el.id.indexOf('_')).toUpperCase(),
                unit_price_usd: (el.value as any).unit_price_usd,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getTotalAllocatedTokens = async (): Promise<{ symbol: string; total_allocated_token: number }[]> => {
        const data = await this._repository.find({
            where: {
                id: Like(`%total_allocated_token%`),
            },
            select: ['id', 'value'],
        });
        const filteredQuery = data.filter((el) => el.id !== 'dfr_total_allocated_token' && el.id !== 'lum_total_allocated_token');
        return filteredQuery
            .map((el) => ({
                symbol: el.id.substring(0, el.id.indexOf('_')).toUpperCase(),
                total_allocated_token: (el.value as any).total_allocated_token,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getDfrAccountBalance = async (): Promise<number> => {
        const data = await this._repository.findOne({ where: { id: 'dfr_account_balance' }, select: ['id', 'value'] });
        return (data.value as any).account_balance;
    };

    getDfrTotalComputedTvl = async (): Promise<number> => {
        const data = await this._repository.findOne({ where: { id: 'dfr_tvl' }, select: ['id', 'value'] });
        return (data.value as any).tvl;
    };
}
