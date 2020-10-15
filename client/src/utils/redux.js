import axios from 'axios';
import { multiClientMiddleware } from 'redux-axios-middleware';
import { createStore, applyMiddleware } from 'redux';

import thunk from 'redux-thunk';

import reducers from '../store/reducers';

import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
const clients = {
    api: {
        client: axios.create({
            baseURL: `http://api.explorer.sandblock.io`,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
    },
    cosmos: {
        client: axios.create({
            baseURL: `${process.env.REACT_APP_CHAIN_HOST}${process.env.REACT_APP_CHAIN_COSMOS_PORT}`,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
    },
    tendermint: {
        client: axios.create({
            baseURL: `${process.env.REACT_APP_CHAIN_HOST}${process.env.REACT_APP_CHAIN_TENDERMINT_PORT}`,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
    }
}

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
                    if (
                        error &&
                        error.data &&
                        error.data &&
                        error.data.message
                    ) {
                        const message = error.data.message;

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
    applyMiddleware(thunk, multiClientMiddleware(clients, axiosMiddlewareOptions))
);

export const persistor = persistStore(store);
export const dispatchAction: Function = (actionResult: any) => {
    store.dispatch(actionResult);
};
