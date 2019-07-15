import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import './assets/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './assets/css/purple.css';

import App from './App';

import { store } from './utils/redux';

const app = (
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>
);

ReactDOM.render(app, document.getElementById('root'));
