import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SearchResponse {
    @ApiProperty()
    @Expose()
    type: string;

    @ApiProperty()
    @Expose()
    data: any;
}
