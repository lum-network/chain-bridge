import * as actionTypes from '../actions/actionTypes';

const initialState = {
    data: null,
    loading: false,
    error: null
};

const reducer = (state = initialState, action) => {
    switch(action.type){
        case actionTypes.BLOCKS_GET_LATEST_START:
            return {
                ...state,
                error: null,
                loading: true,
                data: null
            };

        case actionTypes.BLOCKS_GET_LATEST_FAILURE:
            return {
                ...state,
                error: action.error,
                loading: false,
                data: null
            };

        case actionTypes.BLOCKS_GET_LATEST_SUCCESS:
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
