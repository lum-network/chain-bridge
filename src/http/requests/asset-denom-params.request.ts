import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import { AssetDenom } from '@app/utils';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class AssetDenomParams {
    @ApiProperty()
    @Expose()
    @IsNotEmpty()
    @IsString()
    @IsIn([AssetDenom.AKASH_NETWORK, AssetDenom.COMDEX, AssetDenom.COSMOS, AssetDenom.DFR, AssetDenom.EVMOS, AssetDenom.JUNO, AssetDenom.KI, AssetDenom.LUM, AssetDenom.OSMOSIS, AssetDenom.SENTINEL, AssetDenom.STARGAZE])
    denom: string;
}
