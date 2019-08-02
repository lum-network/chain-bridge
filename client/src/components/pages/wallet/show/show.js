import React, { Component } from 'react';
import {connect} from "react-redux";

type Props = {
    latestBlock: {},
    error: string,
    loading: boolean
};

type State = {
    walletUnlocked: boolean
};

class WalletShow extends Component<Props, State> {
    constructor(props: Props){
        super(props);
        this.state = {
            walletUnlocked: false
        }
    }

    componentDidMount(): void {
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
    }

    renderWalletLocked(){
        return (
            <React.Fragment>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="alert alert-info text-center">
                            You can unlock your wallet using hardware or software method.<br/>
                            The wallet deciphering and unlocking is client only and nothing is sent to our servers.
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-6">
                        <div className="item">
                            <div className="title text-center"><h5>Hardware Wallet</h5></div>
                            <div className="text">
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="item">
                            <div className="title text-center"><h5>Software Wallet</h5></div>
                            <div className="text">
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }

    renderWalletUnlocked(){
        return null;
    }

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Wallet Management</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-features section bg-bottom">
                    <div className="container">
                        {(this.state.walletUnlocked) ? this.renderWalletUnlocked() : this.renderWalletLocked()}
                    </div>
                </section>
            </React.Fragment>
        );
    }
}

const matchStateToProps = state => {
    return {

    };
};

export default connect(
    matchStateToProps,
    {  }
)(WalletShow);
