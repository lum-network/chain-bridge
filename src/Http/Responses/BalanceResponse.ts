import {Exclude, Expose} from "class-transformer";

@Exclude()
export default class BalanceResponse {
    @Expose()
    denom: string;

    @Expose()
    amount: number;
}
