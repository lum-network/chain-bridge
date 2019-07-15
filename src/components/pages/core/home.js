import React, { Component } from 'react';

class HomePage extends Component {

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Surprise Blockchain Explorer</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                    <p>Up To Block 1883224</p>
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
                                    <h2 className="section-title">General Information</h2>
                                </div>
                            </div>
                            <div className="offset-lg-3 col-lg-6">
                                <div className="center-text">
                                    <p>Surprise is a decentralized network designed to connect brands loyalty programs</p>
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
                                        <span>12345</span>
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
                                        <span>3</span>
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
                                        <span>2019-02-01 10:00:00 </span>
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
                                        <span>4</span>
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
export default HomePage;
