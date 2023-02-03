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

    createOrUpdate = async (compositeKey: string, value: GenericValueEntity): Promise<AssetEntity> => {
        let entity = await this.getById(compositeKey);
        if (!entity) {
            entity = new AssetEntity({ id: compositeKey, value, created_at: new Date() });
        }

        entity.value = value;
        entity.updated_at = new Date();
        return this._repository.save(entity);
    };

    createOrUpdateFromInfo = async (infos: GenericAssetInfo[]): Promise<void> => {
        for (const info of filterFalsy(infos)) {
            // Make sure we did get an info
            if (!info) {
                continue;
            }

            // For each key of the info, create or update the asset
            for (const [key, value] of Object.entries(info)) {
                // There are some redundant keys that we want to avoid to sync
                if (key === 'symbol') {
                    continue;
                }
                const compositeKey = `${info.symbol.toLowerCase()}_${key}`;
                const finalValue = { value: value, created_at: new Date() };
                await this.createOrUpdate(compositeKey, finalValue);
            }
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
        const data = await this._repository.find({
            where: {
                id: metrics,
            },
            select: ['id', 'extra', 'updated_at'],
        });

        // We return data that has been request since the start of the requested month
        /*return data.map((asset) => ({
            id: asset.id,
            extra: asset.extra.filter((value) => new Date(el.updated_at).getTime() >= new Date(date).getTime() && new Date(el.last_updated_at).getTime() < new Date().getTime()),
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
        return data
            .map((el) => ({
                symbol: el.id.split('_')[0].toUpperCase(),
                apy: (el.value as any).value,
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
        return data
            .map((el) => ({
                symbol: el.id.split('_')[0].toUpperCase(),
                unit_price_usd: (el.value as any).value,
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
        return data
            .map((el) => ({
                symbol: el.id.split('_')[0].toUpperCase(),
                total_allocated_token: (el.value as any).value,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getDfrAccountBalance = async (): Promise<number> => {
        const data = await this._repository.findOne({ where: { id: 'dfr_account_balance' }, select: ['id', 'value'] });
        if (!data) {
            return 0;
        }
        return (data.value as any).value;
    };

    getDfrTotalComputedTvl = async (): Promise<number> => {
        const data = await this._repository.findOne({ where: { id: 'dfr_tvl' }, select: ['id', 'value'] });
        if (!data) {
            return 0;
        }
        return (data.value as any).value;
    };
}
