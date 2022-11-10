import { Column, Entity, PrimaryColumn } from 'typeorm';

import { GenericValueEntity } from '@app/utils';

@Entity({ name: 'assets' })
export class AssetEntity {
    @PrimaryColumn({ type: 'text' })
    id: string;

    @Column({ type: 'jsonb', nullable: false })
    value: GenericValueEntity;

    @Column({ type: 'jsonb', nullable: false, default: () => "'[]'", array: false })
    extra: GenericValueEntity[] = [];

    constructor(data: Partial<AssetEntity>) {
        Object.assign(this, data);
    }
}
