import { DepositState } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/deposit';
import { WithdrawalState } from '@lum-network/sdk-javascript/build/codec/lum-network/millions/withdrawal';

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
        default:
            return 'UNKNOWN';
    }
};
