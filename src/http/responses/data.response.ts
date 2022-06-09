import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";

export class DataResponseMetadata {
    @ApiProperty()
    readonly page: number;

    @ApiProperty()
    readonly limit: number;

    @ApiProperty()
    readonly pages_total: number;

    @ApiProperty()
    readonly items_count: number;

    @ApiProperty()
    readonly items_total: number;

    @ApiProperty()
    readonly has_previous_page: boolean;

    @ApiProperty()
    readonly has_next_page: boolean;

    constructor(data: Partial<DataResponseMetadata>) {
        Object.assign(this, data);
        this.pages_total = Math.ceil(this.items_total / this.limit);
        this.has_previous_page = this.page > 0;
        this.has_next_page = this.page < (this.pages_total - 1);
    }
}

export class DataResponse {
    @ApiProperty()
    readonly code?: number;

    @ApiProperty()
    readonly message?: string;

    @ApiProperty()
    readonly result: any;

    @ApiProperty({ type: () => DataResponseMetadata })
    @Type(() => DataResponseMetadata)
    readonly metadata?: Partial<DataResponseMetadata>;

    constructor(data: Partial<DataResponse>) {
        Object.assign(this, data);
    }
}
