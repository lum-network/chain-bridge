import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'generic' })
export class GenericDfractEntity {
    @PrimaryColumn({ type: 'varchar' })
    // Option  1) composite incrementalInt-protocol_asset_name
    // Option 2) uuid
    // Option 3) The protocol asset name
    id: string;

    // Protocol assets we represent in our index protocol
    // Example ATOM - OSMO - EVMOS - etc....
    @Column({ type: 'varchar' })
    protocol_assets: string;

    // In this column we store the metrics of the current week
    @Column('jsonb')
    asset_metrics: {
        supply: number;
        unit_price_usd: number;
        total_value_usd: number;
        apy: number;
        // Other metrics tbd in the future
        last_updated_at: Date;
    };

    // In this column we store the historical data metrics
    // For example once a week we append a json with new value
    // Which corresponds to approx and array of 52 JSONB per asset per year
    @Column('jsonb')
    historical_asset_metrics: [
        {
            supply: number;
            unit_price_usd: number;
            total_value_usd: number;
            apy: number;
            // Other metrics tbd in the future
            last_updated_at: Date;
        },
    ];

    constructor(data: Partial<GenericDfractEntity>) {
        Object.assign(this, data);
    }
}
