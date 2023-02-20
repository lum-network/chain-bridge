import { IsNumberString } from 'class-validator';

export class BlockShowParams {
    @IsNumberString()
    height: number;
}
