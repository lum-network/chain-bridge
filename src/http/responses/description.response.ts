import {ApiProperty} from "@nestjs/swagger";

import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DescriptionResponse {
    @ApiProperty()
    @Expose()
    moniker: string;

    @ApiProperty()
    @Expose()
    identity: string;

    @ApiProperty()
    @Expose()
    website: string;

    @ApiProperty()
    @Expose()
    details: string;

    @ApiProperty()
    @Expose({ name: 'securityContact' })
    security_contact: string;
}
