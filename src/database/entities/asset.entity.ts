import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'assets' })
export class AssetEntity {
    @PrimaryColumn({ type: 'text' })
    id: string;

    @Column({ type: 'jsonb' })
    value: any;

    @Column({ type: 'jsonb', nullable: true, default: () => "'[]'", array: false })
    extra: any[] = [];

    constructor(data: Partial<AssetEntity>) {
        Object.assign(this, data);
    }
}
