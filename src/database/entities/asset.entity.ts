import { GenericValueEntity } from '@app/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'assets' })
export class AssetEntity {
    @PrimaryColumn({ type: 'text' })
    id: string;

    @Column({ type: 'jsonb' })
    value: GenericValueEntity;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'", array: false })
    extra: GenericValueEntity[] = [];

    constructor(data: Partial<AssetEntity>) {
        Object.assign(this, data);
    }
}
