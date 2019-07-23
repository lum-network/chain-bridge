import {
    MIGRATION_FETCH_FAILURE, MIGRATION_FETCH_START, MIGRATION_FETCH_SUCCESS,
    MIGRATION_SUBMIT_FAILURE, MIGRATION_SUBMIT_START, MIGRATION_SUBMIT_SUCCESS
} from "./actionTypes";

export const fetchMigration = (reference: string) => {
    return {
        types: [MIGRATION_FETCH_START, MIGRATION_FETCH_SUCCESS, MIGRATION_FETCH_FAILURE],
        payload: {
            client: 'api',
            request: {
                method: `GET`,
                url: `/migration/${reference}`
            }
        }
    };
}

export const submitMigration = (msg: string) => {
    return {
        types: [MIGRATION_SUBMIT_START, MIGRATION_SUBMIT_SUCCESS, MIGRATION_SUBMIT_FAILURE],
        payload: {
            client: 'api',
            request: {
                method: `POST`,
                url: `/migration`
            }
        }
    };
}
