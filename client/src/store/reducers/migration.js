import * as actionTypes from '../actions/actionTypes';

const initialState = {
    data: null,
    loading: false,
    error: null
};

const reducer = (state = initialState, action) => {
    switch(action.type){
        case actionTypes.MIGRATION_SUBMIT_START:
        case actionTypes.MIGRATION_FETCH_START:
            return {
                ...state,
                error: null,
                loading: true,
                data: null
            };

        case actionTypes.MIGRATION_SUBMIT_FAILURE:
        case actionTypes.MIGRATION_FETCH_FAILURE:
            return {
                ...state,
                error: action.error,
                loading: false,
                data: null
            };

        case actionTypes.MIGRATION_SUBMIT_SUCCESS:
        case actionTypes.MIGRATION_FETCH_SUCCESS:
            const migration = action.payload.data.result || {};
            return {
                ...state,
                loading: false,
                data: migration,
                error: null
            }

        default:
            return state;
    }
}

export default reducer;
