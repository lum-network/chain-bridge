import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import './assets/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './assets/css/purple.css';
import 'react-toastify/dist/ReactToastify.css';

import * as serviceWorker from './serviceWorker';

import App from './App';

import { store } from './utils/redux';

const app = (
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
        <ToastContainer />
    </Provider>
);

ReactDOM.render(app, document.getElementById('root'));
serviceWorker.unregister();
