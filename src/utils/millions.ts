import { Deposit, DepositState } from '@lum-network/sdk-javascript/build/codec/lum/network/millions/deposit';
import { WithdrawalState } from '@lum-network/sdk-javascript/build/codec/lum/network/millions/withdrawal';

export interface DepositWithRawAmount extends Deposit {
    rawAmount: number;
}

export const depositStateToString = (state: DepositState): string => {
    switch (state) {
        case DepositState.DEPOSIT_STATE_UNSPECIFIED:
            return 'UNSPECIFIED';
        case DepositState.DEPOSIT_STATE_IBC_TRANSFER:
            return 'IBC_TRANSFER';
        case DepositState.DEPOSIT_STATE_ICA_DELEGATE:
            return 'ICA_DELEGATE';
        case DepositState.DEPOSIT_STATE_SUCCESS:
            return 'SUCCESS';
        case DepositState.DEPOSIT_STATE_FAILURE:
            return 'FAILURE';
        default:
            return 'UNKNOWN';
    }
};

export const withdrawalStateToString = (state: WithdrawalState): string => {
    switch (state) {
        case WithdrawalState.WITHDRAWAL_STATE_UNSPECIFIED:
            return 'UNSPECIFIED';
        case WithdrawalState.WITHDRAWAL_STATE_ICA_UNDELEGATE:
            return 'UNDELEGATE';
        case WithdrawalState.WITHDRAWAL_STATE_ICA_UNBONDING:
            return 'UNBONDING';
        case WithdrawalState.WITHDRAWAL_STATE_IBC_TRANSFER:
            return 'TRANSFER';
        case WithdrawalState.WITHDRAWAL_STATE_FAILURE:
            return 'FAILURE';
        case WithdrawalState.WITHDRAWAL_STATE_PENDING:
            return 'PENDING';
        default:
            return 'UNKNOWN';
    }
};

export const groupAndSumDeposits = (deposits: Deposit[]): DepositWithRawAmount[] => {
    const groupedDeposits: { [address: string]: DepositWithRawAmount } = {};

    deposits.forEach((deposit) => {
        if (!groupedDeposits[deposit.depositorAddress]) {
            groupedDeposits[deposit.depositorAddress] = {
                ...deposit,
                rawAmount: deposit.isSponsor ? 0 : Number(deposit.amount.amount),
            };
        } else if (!deposit.isSponsor) {
            groupedDeposits[deposit.depositorAddress].rawAmount += Number(deposit.amount.amount);
        }
    });

    return Object.values(groupedDeposits);
};
