import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CommissionResponse {
    @ApiProperty()
    @Expose()
    rate: string;

    @ApiProperty()
    @Expose({ name: 'maxRate' })
    max_rate: string;

    @ApiProperty()
    @Expose({ name: 'maxChangeRate' })
    max_change_rate: string;
}
