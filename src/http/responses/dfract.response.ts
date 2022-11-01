import { ApiProperty } from '@nestjs/swagger';

export class TokenInfo {
    @ApiProperty()
    readonly symbol?: string;

    @ApiProperty()
    readonly unit_price_usd?: number;

    @ApiProperty()
    readonly total_value_usd?: number;

    @ApiProperty()
    readonly supply?: number;

    @ApiProperty()
    readonly apy?: number;
}
