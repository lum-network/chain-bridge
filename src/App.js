import React, { Component } from 'react';
import './App.css';

import { Route, Switch, Redirect } from 'react-router-dom';

import Layout from './components/layout/layout';
import HomePage from "./components/pages/core/home";
import AddressShowPage from './components/pages/account/show/show';

import {withRouter} from "react-router";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentDidMount() {
    }

    componentWillReceiveProps(nextProps) {
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
                    <Redirect to={'/home'}/>
                    {/*<Route component={NotFound}/>*/}
                </Switch>
            </Layout>
        );
        return <div className="bg-gray-100 font-sans leading-normal tracking-normal fit">{routes}</div>;
    }
}

export default withRouter(App);
