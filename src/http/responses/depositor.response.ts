import { Coin } from '@lum-network/sdk-javascript';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DepositorResponse {
    @ApiProperty()
    @Expose({ name: 'id' })
    id: string;

    @ApiProperty()
    @Expose({ name: 'proposalId' })
    proposal_id: string;

    @ApiProperty()
    @Expose({ name: 'depositorAddress' })
    depositor_address: string;

    @ApiProperty()
    @Expose({ name: 'amount' })
    amount: Coin[];

    constructor(data: Partial<DepositorResponse>) {
        Object.assign(this, data);
    }
}
