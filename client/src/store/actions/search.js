import {SEARCH_FAILURE, SEARCH_START, SEARCH_SUCCESS} from "./actionTypes";

export const search = (data: string) => {
    return {
        types: [SEARCH_START, SEARCH_SUCCESS, SEARCH_FAILURE],
        payload: {
            client: 'api',
            request: {
                method: `GET`,
                url: `/search/${data}`
            }
        }
    };
}
