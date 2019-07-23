import React, { Component } from 'react';
import {dispatchAction} from "../../../utils/redux";
import {getLatestBlock} from "../../../store/actions/blocks";
import {getValidatorsLatest} from "../../../store/actions/validators";
import { connect } from 'react-redux';

import moment from 'moment';

type Props = {
    latestBlock: {},
    error: string,
    loading: boolean
};

type State = { latestBlock: {}, latestValidators: {}, searchInput: '' };

class HomePage extends Component<Props, State> {

    constructor(props){
        super(props);

        this.state = {
            latestBlock: null,
            latestValidators: null,
            searchInput: ''
        }

        this.triggerSearch = this.triggerSearch.bind(this);
    }

    componentDidMount(): void {
        dispatchAction(getLatestBlock());
        dispatchAction(getValidatorsLatest());
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.latestBlock !== null) {
            this.setState({latestBlock: nextProps.latestBlock});
        }
        if(nextProps.latestValidators !== null){
            this.setState({latestValidators: nextProps.latestValidators});
        }
    }

    triggerSearch(){
        this.props.history.push(`/search/${this.state.searchInput}`);
    }

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Sandblock Chain Explorer</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                    <p>Current Block Height: {this.state.latestBlock !== null && this.state.latestBlock.height}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="search">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="input-wrapper">
                                        <div className="input">
                                            <input
                                                type="text"
                                                defaultValue={this.state.searchInput}
                                                onChange={(ev)=>{this.setState({searchInput: ev.target.value})}}
                                                onSubmit={this.triggerSearch}
                                                onKeyPress={ev => {
                                                    if(ev.key === 'Enter'){
                                                        this.triggerSearch();
                                                    }
                                                }}
                                                placeholder="Search by Address / Txn Hash / Block #"/>
                                            <button onClick={this.triggerSearch}><i className="fa fa-search"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-features block-explorer-features-large section bg-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="center-heading">
                                    <h2 className="section-title">General Informations</h2>
                                </div>
                            </div>
                            <div className="offset-lg-3 col-lg-6">
                                <div className="center-text">
                                    <p>Sandblock is designing solutions to acquire, engage and retain customers using blockchain and crypto-assets</p>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Last Block Height</h5>
                                    </div>
                                    <div className="text">
                                        <span>{this.state.latestBlock !== null && this.state.latestBlock.height}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Last Block Time</h5>
                                    </div>
                                    <div className="text">
                                        <span>{this.state.latestBlock !== null && moment(this.state.latestBlock.time).format('MM-DD-YYYY HH:mm:ss')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Active Validators</h5>
                                    </div>
                                    <div className="text">
                                        <span>{this.state.latestValidators !== null && this.state.latestValidators.validators.length}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Total Validators</h5>
                                    </div>
                                    <div className="text">
                                        <span>{this.state.latestValidators !== null && this.state.latestValidators.validators.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </React.Fragment>
        );
    }
}

const matchStateToProps = state => {
    return {
        latestBlock: state.blocks.data,
        latestValidators: state.validators.data,
        error: state.blocks.error || state.validators.error,
        loading: state.blocks.loading || state.validators.loading
    };
};

export default connect(
    matchStateToProps,
    { getLatestBlock, getValidatorsLatest }
)(HomePage);
