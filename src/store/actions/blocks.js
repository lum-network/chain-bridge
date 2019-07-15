import {BLOCKS_GET_LATEST_FAILURE, BLOCKS_GET_LATEST_START, BLOCKS_GET_LATEST_SUCCESS} from "./actionTypes";

export const getLatestBlock = () => {
    return {
        types: [BLOCKS_GET_LATEST_START, BLOCKS_GET_LATEST_SUCCESS, BLOCKS_GET_LATEST_FAILURE],
        payload: {
            client: 'cosmos',
            request: {
                method: `GET`,
                url: `/blocks/latest`
            }
        }
    };
};
