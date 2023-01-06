import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEqual } from 'lodash';

import { Repository, UpdateResult } from 'typeorm';

import { AssetEntity } from '@app/database';
import { filterFalsy, GenericExtraEntity, GenericValueEntity, OwnAssetInfo } from '@app/utils';
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

    getExtra = async (): Promise<{ id: string; extra: GenericExtraEntity[] }[]> => {
        return await this._repository.createQueryBuilder('assets').select(['id', 'extra']).getRawMany();
    };

    createOrUpdateAssetValue = async (compositeKey: string, value: GenericValueEntity): Promise<AssetEntity | UpdateResult> => {
        const entity = await this.getById(compositeKey);
        // If entity does not exists, we create with a new one
        if (!entity) {
            const createAssetValueEntity = new AssetEntity({ id: compositeKey, value });

            return this._repository.save(createAssetValueEntity);
        } else {
            // Otherwise, we just update the propertiess
            entity.id = compositeKey;
            entity.value = value;

            return this._repository.update(entity.id, entity);
        }
    };

    chainAssetCreateOrUpdateValue = async (getAssetInfo: AssetInfo[]): Promise<void> => {
        // We avoid falsy values being inserted in the db
        for (const key of filterFalsy(getAssetInfo)) {
            if (key) {
                const compositeKey = `${key.symbol.toLowerCase()}_${Object.keys(key)[0]}`;

                const value = { [Object.keys(key)[0]]: Object.values(key)[0], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
    };

    ownAssetCreateOrUpdateValue = async (getAssetInfo: OwnAssetInfo, name: string): Promise<void> => {
        // We avoid falsy values being inserted in the db
        for (const key in filterFalsy(getAssetInfo)) {
            if (key) {
                const compositeKey = `${name.toLowerCase()}_${key}`;

                const value = { [key]: getAssetInfo[key], last_updated_at: new Date() };

                await this.createOrUpdateAssetValue(compositeKey, value);
            }
        }
    };

    // We create or append extra values
    createOrAppendExtra = async (): Promise<void> => {
        const records = await this.getExtra();

        // We first query the entity by passing the id
        for (const record of records) {
            const entity = await this.getById(record.id);

            // Check if the value is already present in the extra array
            if (!entity.extra.includes(entity.value)) {
                // If the value is not present, append it to the extra array
                entity.extra.push(entity.value);

                // Update the entity in the database
                await this._repository.update(record.id, entity);
            }
        }
    };

    // Cleanup historical data by keeping only 1 asset value per week
    cleanupSync = async (): Promise<void> => {
        const records = await this.getExtra();

        // Get the week of the current value's last_updated_at
        const getWeek = (date: Date): number => {
            // Set to midnight on the same day of the week
            date.setHours(0, 0, 0, 0);
            // Set to the first day of the week
            date.setDate(date.getDate() - date.getDay());
            // Return the week number
            return Math.ceil((date.valueOf() - new Date(date.getFullYear(), 0, 1).valueOf()) / 604800000);
        };

        const filteredExtra = records.map((item) => {
            // Create an empty hash map
            const map = new Map();

            // Filter the extra array to only include unique objects
            const arrFilter = item.extra.reduce((acc, cur) => {
                // Get the week of the current value's last_updated_at
                const week = getWeek(new Date(cur.last_updated_at));
                // If the current value's week is not in the map, add it to the map and the accumulator
                if (!map.has(week)) {
                    map.set(week, cur);
                    acc.push(cur);
                } else {
                    // If the current value's week is already in the map, we update the value in the map if the current value is newer
                    const existingValue = map.get(week);
                    if (new Date(cur.last_updated_at) > new Date(existingValue.last_updated_at)) {
                        map.set(week, cur);
                    }
                }
                return acc;
            }, []);

            // Return a new object with the filtered extra array
            return {
                id: item.id,
                extra: arrFilter,
            };
        });

        // Before we update the extra entity we do a deepEquality comparison between the existing extra entity and filteredExtra
        // This serves as check to avoid unnecessary db update if it's not required
        const deepEqual = records.every((record, index) => isEqual(record.extra, filteredExtra[index].extra));

        // We only update the db if there are differences
        if (!deepEqual) {
            for (const el of filteredExtra) {
                // we get the id
                const entity = await this.getById(el.id);

                // we reassign the entity
                entity.extra = el.extra;

                // we update the db
                await this._repository.update(el.id, entity);
            }
        }
    };

    retryExtraSync = async (): Promise<void> => {
        const records = await this.getExtra();

        const arr = [];

        // For every metrics we want to check the last inserted extra value
        for (const key of records) {
            arr.push({ id: key?.id, extra: key?.extra.pop() });
        }

        // As we update historical data one time per epoch we verify if the last updated record was inserted during that week time
        // If not we retry
        // We make sure that the first day of the week is monday 00:00 and last day of the week sunday 23:59
        const today = new Date();
        const dayOfWeek = today.getDay();
        const firstWeekDay = new Date(today.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))).setHours(0, 0, 0, 0);
        const firstWeekDayISO = new Date(firstWeekDay).toISOString();

        const lastWeekDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - dayOfWeek)).setHours(23, 59, 59, 999);
        const lastWeekDayISO = new Date(lastWeekDay).toISOString();

        for (const el of arr) {
            const date = new Date(el?.extra?.last_updated_at);

            if (date < new Date(firstWeekDayISO) && date < new Date(lastWeekDayISO)) {
                // We get the id
                const entity = await this.getById(el.id);

                // we push the value to the entity
                entity.extra.push(entity.value);

                // we update the db
                await this._repository.update(el.id, entity);
            }
        }
    };

    fetchLatestMetrics = async (skip: number, take: number): Promise<[AssetEntity[], number]> => {
        const query = this._repository.createQueryBuilder('assets').skip(skip).take(take).orderBy('id', 'ASC');

        // Return the values and the length
        return query.getManyAndCount();
    };

    fetchMetricsSince = async (metrics: string, date: Date): Promise<{ id: string; extra: GenericExtraEntity[] }[]> => {
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
