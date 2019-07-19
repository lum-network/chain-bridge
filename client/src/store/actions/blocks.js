import {
    BLOCK_GET_FAILURE,
    BLOCK_GET_START, BLOCK_GET_SUCCESS,
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
            client: 'api',
            request: {
                method: `GET`,
                url: `/blocks/latest`
            }
        }
    };
};

export const getBlock = (height: string) => {
    return {
        types: [BLOCK_GET_START, BLOCK_GET_SUCCESS, BLOCK_GET_FAILURE],
        payload: {
            client: 'api',
            request: {
                method: `GET`,
                url: `/blocks/${height}`
            }
        }
    };
};

export const getBlocks = (minHeight?: string, maxHeight?: string) => {
    let url;
    if(minHeight === undefined && maxHeight === undefined){
        url = `/blocks`;
    } else if (minHeight !== undefined && maxHeight !== undefined){
        url = `/blocks?minHeight=${minHeight}&maxHeight=${maxHeight}`;
    } else {
        url = `/blocks`;
    }
    return {
        types: [BLOCKS_GET_START, BLOCKS_GET_SUCCESS, BLOCKS_GET_FAILURE],
        payload: {
            client: "api",
            request: {
                method: `GET`,
                url
            }
        }
    }
}
