import {
    BLOCKS_GET_FAILURE,
    BLOCKS_GET_LATEST_FAILURE,
    BLOCKS_GET_LATEST_START,
    BLOCKS_GET_LATEST_SUCCESS,
    BLOCKS_GET_START, BLOCKS_GET_SUCCESS
} from "./actionTypes";

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

export const getBlocks = (minHeight?: string, maxHeight?: string) => {
    let url;
    if(minHeight === undefined && maxHeight === undefined){
        url = `/blockchain`;
    } else if (minHeight !== undefined && maxHeight !== undefined){
        url = `/blockchain?minHeight=${minHeight}&maxHeight=${maxHeight}`;
    } else {
        url = `/blockchain`;
    }
    return {
        types: [BLOCKS_GET_START, BLOCKS_GET_SUCCESS, BLOCKS_GET_FAILURE],
        payload: {
            client: "tendermint",
            request: {
                method: `GET`,
                url
            }
        }
    }
}
