import * as actionTypes from '../actions/actionTypes';

const initialState = {
    data: null,
    loading: false,
    error: null
};

const reducer = (state = initialState, action) => {
    switch(action.type){
        case actionTypes.VALIDATORS_GET_LATEST_START:
        case actionTypes.VALIDATORS_GET_START:
            return {
                ...state,
                error: null,
                loading: true,
                data: null
            };

        case actionTypes.VALIDATORS_GET_LATEST_FAILURE:
        case actionTypes.VALIDATORS_GET_FAILURE:
            return {
                ...state,
                error: action.error,
                loading: false,
                data: null
            };

        case actionTypes.VALIDATORS_GET_LATEST_SUCCESS:
        case actionTypes.VALIDATORS_GET_SUCCESS:
            const block = action.payload.data || {};
            return {
                ...state,
                loading: false,
                data: block,
                error: null
            }

        default:
            return state;
    }
}

export default reducer;
