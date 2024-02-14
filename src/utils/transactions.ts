import { MsgExec } from '@lum-network/sdk-javascript/build/codegen/cosmos/authz/v1beta1/tx';

import { TransactionEntity } from '@app/database';

export const getAddressesRelatedToTransaction = (transaction: Partial<TransactionEntity>): string[] => {
    const addresses: string[] = [];

    for (const message of transaction.messages) {
        if (message.type_url === MsgExec.typeUrl) {
            for (const key in message.value) {
                if (key === 'grantee') {
                    addresses.push(message.value[key]);
                    break;
                }
            }
        } else {
            for (const key in message.value) {
                if (
                    key === 'sender' ||
                    key === 'recipient' ||
                    key === 'validator' ||
                    key === 'fromAddress' ||
                    key === 'delegatorAddress' ||
                    key === 'granter' ||
                    key === 'voter' ||
                    key === 'proposer' ||
                    key === 'depositor' ||
                    key === 'depositorAddress'
                ) {
                    addresses.push(message.value[key]);
                    break;
                }
            }
        }

        if (addresses.length) {
            break;
        }
    }

    return addresses;
};
