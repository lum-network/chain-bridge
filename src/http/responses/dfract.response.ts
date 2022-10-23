import { ApiProperty } from '@nestjs/swagger';

export class TokenInfo {
    @ApiProperty()
    readonly name?: string;

    @ApiProperty()
    readonly symbol?: string;

    @ApiProperty()
    readonly unitPriceUsd?: number;

    @ApiProperty()
    readonly price?: number;

    @ApiProperty()
    readonly totalValueUsd?: number;

    @ApiProperty()
    readonly supply?: number;

    @ApiProperty()
    readonly apy?: number;
}
