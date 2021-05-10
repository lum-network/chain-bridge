import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DescriptionResponse {
    @Expose()
    moniker: string;

    @Expose()
    identity: string;

    @Expose()
    website: string;

    @Expose()
    details: string;

    @Expose({ name: 'securityContact' })
    security_contact: string;
}
