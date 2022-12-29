import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEqual } from 'lodash';

import { Repository } from 'typeorm';

import { AssetEntity } from '@app/database';
import { filterFalsy, GenericExtraEntity, GenericValueEntity } from '@app/utils';
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
    assetCreateOrAppendExtra = async (): Promise<void> => {
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

    cleanupSync = async (): Promise<void> => {
        const startTime = Date.now();
        const records = await this.getExtra();
        // We first verify if there are no duplicates in the extra entity

        const sameDay = (date1: Date, date2: Date) => {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getDate() === d2.getDate();
        };

        const filteredExtra = records.map((item) => {
            // Create an empty hash map
            const map = new Map();

            // Filter the extra array to only include values where the last_updated_at is different from the previous value's last_updated_at
            const filteredExtra = item.extra
                .filter((cur, index, arr) => !index || !sameDay(arr[index - 1].last_updated_at, cur.last_updated_at))
                .reduce((acc, cur) => {
                    // If the current value's last_updated_at is not in the map, add it to the map and the accumulator
                    if (!map.has(cur.last_updated_at)) {
                        map.set(cur.last_updated_at, cur);
                        acc.push(cur);
                    }
                    return acc;
                }, []);

            // Return a new object with the filtered extra array
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            console.log(`Processing time: ${processingTime}ms`);
            return {
                id: item.id,
                extra: filteredExtra,
            };
        });

        // Before we update the extra entity we do a deepEquality comparison between the extra entity and filteredExtra
        const deepEqual = records.every((record, index) => isEqual(record.extra, filteredExtra[index].extra));

        // We only update the db if there are differences
        if (!deepEqual) {
            for (const el of filteredExtra) {
                // we get the id
                const entity = await this.getById(el.id);

                // we reassign the entity
                entity.extra = el.extra;

                // we update the db
                this._repository.update(el.id, entity);
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
                this._repository.update(el.id, entity);
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
