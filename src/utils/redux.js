import axios from 'axios';
import axiosMiddleware from 'redux-axios-middleware';
import { createStore, applyMiddleware } from 'redux';

import thunk from 'redux-thunk';

import reducers from '../store/reducers/index';

import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

const client = axios.create({
    baseURL: process.env.REACT_APP_ENV === 'debug' ? process.env.REACT_APP_CHAIN_RPC_DEV : process.env.REACT_APP_CHAIN_RPC_PROD,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

const axiosMiddlewareOptions = {
    interceptors: {
        request: [
            async (state, config) => {
                return config;
            }
        ],
        response: [
            {
                success({ getState, dispatch, getSourceAction }, req) {
                    //console.log(`[debug] ${JSON.stringify(req)}`);
                    return Promise.resolve(req);
                },
                error({ getState, dispatch, getSourceAction }, error) {
                    if (error.config.reduxSourceAction.payload.options) {
                        //console.log(`[debug] ${JSON.stringify(error)}`);
                        return Promise.reject(error);
                    }

                    if (
                        error.response &&
                        error.response.data &&
                        error.response.data.error &&
                        error.response.data.error.message
                    ) {
                        const message = error.response.data.error.message;

                        return Promise.reject(new Error(message));
                    }

                    return Promise.reject(new Error('An error occurred, please try again later.'));
                }
            }
        ]
    }
};

const persistConfig = {
    key: 'root',
    storage,
    stateReconciler: autoMergeLevel2
};

const rootReducer = (state: any, action) => {
    if (action.type === 'persist/REHYDRATE') {
        try {
            Object.keys(action.payload).forEach(key => {
                if (action.payload[key].error) {
                    action.payload[key].error = null;
                }
            });
        } catch (_error) {}
    }

    return reducers(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(
    persistedReducer,
    {},
    applyMiddleware(thunk, axiosMiddleware(client, axiosMiddlewareOptions))
);

export const persistor = persistStore(store);
export const dispatchAction: Function = (actionResult: any) => {
    store.dispatch(actionResult);
};
