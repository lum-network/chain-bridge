import {
    VALIDATORS_GET_LATEST_FAILURE, VALIDATORS_GET_LATEST_START, VALIDATORS_GET_LATEST_SUCCESS,
    VALIDATORS_GET_START, VALIDATORS_GET_SUCCESS, VALIDATORS_GET_FAILURE
} from "./actionTypes";

export const getValidatorsLatest = () => {
    return {
        types: [VALIDATORS_GET_LATEST_START, VALIDATORS_GET_LATEST_SUCCESS, VALIDATORS_GET_LATEST_FAILURE],
        payload: {
            client: 'cosmos',
            request: {
                method: `GET`,
                url: `/validatorsets/latest`
            }
        }
    }
}


export const getValidatorsAt = (height) => {
    return {
        types: [VALIDATORS_GET_START, VALIDATORS_GET_SUCCESS, VALIDATORS_GET_FAILURE],
        payload: {
            client: 'cosmos',
            request: {
                method: `GET`,
                url: `/validatorsets/${height}`
            }
        }
    }
}
