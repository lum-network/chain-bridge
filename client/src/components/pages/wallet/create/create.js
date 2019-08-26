import React from 'react';
import {connect} from "react-redux";

class WalletCreatePage extends React.Component {
    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Get a new wallet</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-features section bg-bottom">
                    <div className="container">
                        <div className="row">
                        </div>
                    </div>
                </section>
            </React.Fragment>
        );
    }
};

const matchStateToProps = state => {
    return {};
};

export default connect(
    matchStateToProps,
    {}
)(WalletCreatePage);
