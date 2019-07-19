import * as actionTypes from '../actions/actionTypes';

const initialState = {
    data: null,
    loading: false,
    error: null
};

const reducer = (state = initialState, action) => {
    switch(action.type){
        case actionTypes.ACCOUNT_GET_START:
            return {
                ...state,
                error: null,
                loading: true,
                data: null
            };

        case actionTypes.ACCOUNT_GET_FAILURE:
            return {
                ...state,
                error: action.error,
                loading: false,
                data: null
            };

        case actionTypes.ACCOUNT_GET_SUCCESS:
            const account = action.payload.data.result || {};
            return {
                ...state,
                loading: false,
                data: account,
                error: null
            }

        default:
            return state;
    }
}

export default reducer;
