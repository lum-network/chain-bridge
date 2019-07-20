import {
    TRANSACTION_GET_FAILURE,
    TRANSACTION_GET_START,
    TRANSACTION_GET_SUCCESS, TRANSACTIONS_GET_FAILURE,
    TRANSACTIONS_GET_START, TRANSACTIONS_GET_SUCCESS
} from "./actionTypes";

export const getTransaction = (hash: string) => {
    return {
        types: [TRANSACTION_GET_START, TRANSACTION_GET_SUCCESS, TRANSACTION_GET_FAILURE],
        payload: {
            client: 'api',
            request: {
                method: `GET`,
                url: `/transactions/${hash}`
            }
        }
    };
}

export const listTransactions = () => {
    return {
        types: [TRANSACTIONS_GET_START, TRANSACTIONS_GET_SUCCESS, TRANSACTIONS_GET_FAILURE],
        payload: {
            client: 'api',
            request: {
                method: `GET`,
                url: `/transactions`
            }
        }
    }
}
