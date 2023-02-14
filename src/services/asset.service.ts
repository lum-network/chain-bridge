import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Like, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';

import { AssetEntity } from '@app/database';
import { GenericAssetInfo } from '@app/utils';
import dayjs from 'dayjs';

@Injectable()
export class AssetService {
    constructor(@InjectRepository(AssetEntity) private readonly _repository: Repository<AssetEntity>) {}

    getById = async (id: number): Promise<AssetEntity> => {
        return this._repository.findOne({
            where: {
                id,
            },
        });
    };

    getByKey = async (key: string, date: Date): Promise<AssetEntity> => {
        return this._repository.findOne({
            where: {
                key,
                created_at: date,
            },
            order: {
                created_at: 'DESC',
            },
        });
    };

    isKeyCreated = async (key: string): Promise<boolean> => {
        const today = dayjs().startOf('day');
        const entity = await this._repository.findOne({
            where: {
                key,
                created_at: MoreThanOrEqual(today.toDate()),
            },
            order: {
                created_at: 'DESC',
            },
        });
        return !entity;
    };

    create = async (key: string, value: string): Promise<AssetEntity> => {
        const entity = new AssetEntity({
            key,
            value,
        });
        return this._repository.save(entity);
    };

    createFromInfo = async (infos: GenericAssetInfo[]): Promise<void> => {
        for (const info of infos) {
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
                await this.create(compositeKey, String(value));
            }
        }
    };

    fetchLatestMetrics = async (skip: number, take: number): Promise<[AssetEntity[], number]> => {
        const query = this._repository.createQueryBuilder('assets').skip(skip).take(take).orderBy('id', 'ASC');
        return query.getManyAndCount();
    };

    fetchMetricsSince = async (metrics: string, date: Date): Promise<AssetEntity[]> => {
        const data = await this._repository.find({
            where: {
                key: metrics,
                created_at: MoreThan(date),
            },
        });
        return data;
    };

    fetchLatestAsset = async (denom: string): Promise<AssetEntity[]> => {
        return this._repository.find({
            where: {
                key: Like(`%${denom}%`),
            },
            select: ['id', 'key', 'value'],
            order: {
                id: 'DESC',
            },
        });
    };

    getAPYs = async (): Promise<{ symbol: string; apy: number }[]> => {
        const data = await this._repository.find({
            where: {
                key: Like(`%apy%`),
            },
            select: ['id', 'key', 'value'],
        });
        return data
            .filter((el) => el.key !== 'dfr_apy' && el.key !== 'lum_apy')
            .map((el) => ({
                symbol: el.key.split('_')[0].toUpperCase(),
                apy: el.value as any,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getPriceForSymbol = async (symbol: string): Promise<number> => {
        const data = await this._repository.findOne({
            where: {
                key: `${symbol.toLowerCase()}_unit_price_usd`,
            },
            select: ['id', 'key', 'value'],
            order: {
                id: 'DESC',
            },
        });

        if (!data || !data.value) {
            return 0;
        }
        return Number(data.value);
    };

    getPrices = async (): Promise<{ symbol: string; unit_price_usd: number }[]> => {
        const data = await this._repository.find({
            where: {
                key: Like(`%unit_price_usd%`),
            },
            select: ['id', 'key', 'value', 'created_at'],
            order: {
                created_at: 'DESC',
            },
        });

        return data
            .filter((el) => el.key !== 'dfr_unit_price_usd' && el.key !== 'lum_unit_price_usd')
            .map((el) => ({
                symbol: el.key.split('_')[0].toUpperCase(),
                unit_price_usd: el.value as any,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getTotalAllocatedTokens = async (): Promise<{ symbol: string; total_allocated_token: number }[]> => {
        const data = await this._repository.find({
            where: {
                key: Like(`%total_allocated_token%`),
            },
            select: ['id', 'key', 'value'],
            order: {
                created_at: 'DESC',
            },
        });
        return data
            .filter((el) => el.key !== 'lum_total_allocated_token')
            .map((el) => ({
                symbol: el.key.split('_')[0].toUpperCase(),
                total_allocated_token: el.value as any,
            }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    };

    getTotalAllocatedTokensForSymbol = async (symbol: string): Promise<number> => {
        const data = await this._repository.findOne({
            where: {
                key: `${symbol.toLowerCase()}_total_allocated_token`,
            },
            select: ['id', 'key', 'value'],
            order: {
                id: 'DESC',
            },
        });
        if (!data || !data.value) {
            return 0;
        }
        return Number(data.value);
    };

    getDfrAccountBalance = async (): Promise<number> => {
        const data = await this._repository.findOne({ where: { key: 'dfr_account_balance' }, select: ['id', 'key', 'value'], order: { id: 'DESC' } });
        if (!data || !data.value) {
            return 0;
        }
        return Number(data.value);
    };

    getDfrTotalComputedTvl = async (): Promise<number> => {
        const data = await this._repository.findOne({ where: { key: 'dfr_tvl' }, select: ['id', 'key', 'value'], order: { id: 'DESC' } });
        if (!data || !data.value) {
            return 0;
        }
        return Number(data.value);
    };
}
