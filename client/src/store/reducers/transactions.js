import * as actionTypes from '../actions/actionTypes';

const initialState = {
    data: null,
    loading: false,
    error: null
};

const reducer = (state = initialState, action) => {
    switch(action.type){
        case actionTypes.TRANSACTIONS_GET_START:
        case actionTypes.TRANSACTION_GET_START:
            return {
                ...state,
                error: null,
                loading: true,
                data: null
            };

        case actionTypes.TRANSACTIONS_GET_FAILURE:
        case actionTypes.TRANSACTION_GET_FAILURE:
            return {
                ...state,
                error: action.error,
                loading: false,
                data: null
            };

        case actionTypes.TRANSACTIONS_GET_SUCCESS:
            const txs = action.payload.data.result || [];
            return {
                ...state,
                loading: false,
                data: txs,
                error: null
            }

        case actionTypes.TRANSACTION_GET_SUCCESS:
            const tx = action.payload.data.result || {};
            return {
                ...state,
                loading: false,
                data: tx,
                error: null
            }

        default:
            return state;
    }
}

export default reducer;
