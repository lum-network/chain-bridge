import React from 'react';
import {connect} from "react-redux";
import { NavLink } from 'react-router-dom';

class WalletHomePage extends React.Component {
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
                        <div className="row">
                            <div className="col-6">
                                <NavLink to={'/wallet/create'}>
                                    <div className="card-block create-wallet">
                                        <div className="flex-col-vertical-center">
                                            <div className="card-content">
                                                <h2 className="color-white">
                                                    Create A New Wallet
                                                </h2>
                                                <p className="color-white">
                                                    Obtain your own SBC wallet and generate your private key.<br/>
                                                    The security of the key will be your entire responsability.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </NavLink>
                            </div>
                            <div className="col-6">
                                <NavLink to={'/wallet/show'}>
                                    <div className="card-block unlock-wallet">
                                        <div className="flex-col-vertical-center">
                                            <div className="card-content">
                                                <h2 className="color-white">
                                                    Access My Wallet
                                                </h2>
                                                <p className="color-white">
                                                    Interact with the SBC chain. Send coins or branded tokens, delegate or stake.<br/>
                                                    This is where the magic happens.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </section>
            </React.Fragment>
        );
    }
}

const matchStateToProps = state => {
    return {};
};

export default connect(
    matchStateToProps,
    {}
)(WalletHomePage);
