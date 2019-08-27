import React, { Component } from 'react';
import './App.css';

import { Route, Switch, Redirect } from 'react-router-dom';

import Layout from './components/layout/layout';
import HomePage from "./components/pages/core/home";
import AddressShowPage from './components/pages/accounts/show/show';
import BlocksPage from './components/pages/blocks/list/blocks';
import BlockShowPage from './components/pages/blocks/show/block';
import TransactionShowPage from './components/pages/transactions/show/transaction';
import TransactionsListPage from './components/pages/transactions/list/transactions';
import SearchPage from './components/pages/core/search';
import MigrationPortalPage from './components/pages/core/migration';
import WalletHomePage from './components/pages/wallet/home/home';
import WalletCreatePage from './components/pages/wallet/create/create';
import WalletShowPage from './components/pages/wallet/show/show';
import ValidatorsPage from "./components/pages/validators/list/validators";
import ValidatorPage from "./components/pages/validators/show/validator";

import {withRouter} from "react-router";
import {ToastContainer} from "react-toastify";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentDidMount() {
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.token) {
            this.setState({loading: false});
        }
    }

    render() {
        if (this.state.loading) {
            /*return (
                <div className="animation-loading">
                    <Login style={{ display: 'none' }} />
                    <CocoLoading />
                </div>
            );*/
        }
        let routes = (
            <Layout>
                <Switch>
                    <Route path="/home" exact component={HomePage}/>
                    <Route path="/account/:accountId" exact component={AddressShowPage}/>
                    <Route path="/blocks" exact component={BlocksPage}/>
                    <Route path="/block/:blockId" exact component={BlockShowPage}/>
                    <Route path="/transactions" exact component={TransactionsListPage}/>
                    <Route path="/transaction/:hash" exact component={TransactionShowPage}/>
                    <Route path="/search/:data" exact component={SearchPage}/>
                    <Route path="/validators" exact component={ValidatorsPage}/>
                    <Route path="/validator/:address" exact component={ValidatorPage}/>
                    <Route path="/migration" exact component={MigrationPortalPage}/>
                    <Route path="/wallet" exact component={WalletHomePage}/>
                    <Route path="/wallet/show" exact component={WalletShowPage}/>
                    <Route path="/wallet/create" exact component={WalletCreatePage}/>
                    <Redirect to={'/home'}/>
                    {/*<Route component={NotFound}/>*/}
                </Switch>
            </Layout>
        );
        return(
            <React.Fragment>
                <div className="bg-gray-100 font-sans leading-normal tracking-normal fit">{routes}</div>
                <ToastContainer />
            </React.Fragment>
        );
    }
}

export default withRouter(App);
