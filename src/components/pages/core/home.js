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

type State = { latestBlock: {}, latestValidators: {} };

class HomePage extends Component<Props, State> {

    constructor(props){
        super(props);

        this.state = {
            latestBlock: null,
            latestValidators: null
        }
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

    render() {
        if(this.props.loading || this.state.latestBlock == null){
            return null;
        }

        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Sandblock Blockchain Explorer</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                    <p>Current Block Height: {this.state.latestBlock.block.header.height}</p>
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
                                            <input type="text" placeholder="Search by Address / Txn Hash / Block #"/>
                                                <button><i className="fa fa-search"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-features section bg-bottom">
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
                                        <span>{this.state.latestBlock.block.header.height}</span>
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
                                        <span>{this.state.latestValidators.validators.length}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Branded Tokens Created</h5>
                                    </div>
                                    <div className="text">
                                        <span>120</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Surprise Coin Value</h5>
                                    </div>
                                    <div className="text">
                                        <span>$0.07 <i className="green fa fa-long-arrow-up"></i></span>
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
                                        <span>{moment(this.state.latestBlock.block.header.time).format('MM-DD-YYYY HH:mm:ss')}</span>
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
                                        <span>{this.state.latestValidators.validators.length}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Branded Tokens Minted</h5>
                                    </div>
                                    <div className="text">
                                        <span>123,456,789</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                                <div className="item">
                                    <div className="title">
                                        <div className="icon"></div>
                                        <h5>Trade Volume</h5>
                                    </div>
                                    <div className="text">
                                        <span>$479,093,652.91</span>
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
