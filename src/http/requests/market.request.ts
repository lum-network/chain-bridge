import { ApiProperty } from '@nestjs/swagger';

import { IsDateString, IsNotEmpty, IsString, IsIn } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

import { MillionsMarketSymbol } from '@app/utils';

export class MarketRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    denom: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    since: Date;
}

@Exclude()
export class MarketDenomParams {
    @ApiProperty()
    @Expose()
    @IsNotEmpty()
    @IsString()
    @IsIn([
        MillionsMarketSymbol.COSMOS.toLocaleLowerCase(),
        MillionsMarketSymbol.CRONOS.toLocaleLowerCase(),
        MillionsMarketSymbol.LUM.toLocaleLowerCase(),
        MillionsMarketSymbol.OSMOSIS.toLocaleLowerCase(),
        MillionsMarketSymbol.STARGAZE.toLocaleLowerCase(),
    ])
    denom: string;
}
