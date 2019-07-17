import {
    ACCOUNT_GET_FAILURE, ACCOUNT_GET_START, ACCOUNT_GET_SUCCESS,
} from "./actionTypes";

export const getAccount = (address: string) => {
    return {
        types: [ACCOUNT_GET_START, ACCOUNT_GET_SUCCESS, ACCOUNT_GET_FAILURE],
        payload: {
            client: 'cosmos',
            request: {
                method: `GET`,
                url: `/auth/accounts/${address}`
            }
        }
    };
};
