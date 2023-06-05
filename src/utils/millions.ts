import { LumMessages } from '@lum-network/sdk-javascript';

//TODO: Add update deposit when it's available
export const isMillionsDeposit = (type: string) => {
    return type === LumMessages.MsgMillionsDepositUrl || type === LumMessages.MsgWithdrawDepositUrl;
};
