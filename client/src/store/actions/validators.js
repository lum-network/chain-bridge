import {
    VALIDATORS_GET_LATEST_FAILURE,
    VALIDATORS_GET_LATEST_START,
    VALIDATORS_GET_LATEST_SUCCESS,
    VALIDATORS_GET_START,
    VALIDATORS_GET_SUCCESS,
    VALIDATORS_GET_FAILURE,
    VALIDATOR_GET_START,
    VALIDATOR_GET_FAILURE,
    VALIDATOR_GET_SUCCESS
} from "./actionTypes";

export const getValidators = () => {
    return {
        types: [VALIDATORS_GET_LATEST_START, VALIDATORS_GET_LATEST_SUCCESS, VALIDATORS_GET_LATEST_FAILURE],
        payload: {
            client: 'cosmos',
            request: {
                method: `GET`,
                url: `/staking/validators`
            }
        }
    }
}

export const getValidator = (address: string) => {
    return {
        types: [VALIDATOR_GET_START, VALIDATOR_GET_SUCCESS, VALIDATOR_GET_FAILURE],
        payload: {
            client: 'cosmos',
            request: {
                method: `GET`,
                url: `/staking/validators/${address}`
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
