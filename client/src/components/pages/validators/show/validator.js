import React from 'react';
import {connect} from "react-redux";
import {getValidator} from "../../../../store/actions/validators";
import {dispatchAction} from "../../../../utils/redux";
import QRCode from "qrcode.react";
import {NavLink} from "react-router-dom";

type Props = {
    validator: {},
    error: string,
    loading: boolean
};

type State = { validator: {}};

class ValidatorPage extends React.Component<Props, State> {
    constructor(props: Props){
        super(props);
        this.state = {
            validator: null
        };
        dispatchAction(getValidator(this.props.match.params.address))
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        if(nextProps.validator !== null){
            this.setState({validator: nextProps.validator.result});
        }
    }

    renderHeader(){
        return (
            <div className="row">
                <div className="col-lg-12 align-self-center">
                    <h1>Validator details</h1>
                </div>
                <div className="offset-lg-3 col-lg-6">
                    <p>{this.state.validator !== null && this.state.validator.operator_address}</p>
                </div>
            </div>
        );
    }

    renderValidator(){
        if(this.props.loading || this.state.validator === null){
            return null;
        }
        return (
            <React.Fragment>
                <div className="col-sm-10">
                    <table className="table table-striped table-latests table-detail">
                        <tbody>
                            <tr>
                                <td><strong>Identity</strong></td>
                                <td>{this.state.validator.description.identity || this.state.validator.description.moniker}</td>
                            </tr>
                            <tr>
                                <td><strong>Address</strong></td>
                                <td>{this.state.validator.operator_address || this.props.match.params.address}</td>
                            </tr>
                            <tr>
                                <td><strong>Public Key</strong></td>
                                <td>{(this.state.validator.consensus_pubkey && this.state.validator.consensus_pubkey) || 'None'}</td>
                            </tr>
                            <tr>
                                <td><strong>Tokens</strong></td>
                                <td>{`${this.state.validator.tokens} SBC` || 0}</td>
                            </tr>
                            <tr>
                                <td><strong>Delegator Shares</strong></td>
                                <td>{Number(this.state.validator.delegator_shares).toFixed(0) || 0}</td>
                            </tr>
                            <tr>
                                <td><strong>Commission Rate</strong></td>
                                <td>{`${Number(this.state.validator.commission.commission_rates.rate).toPrecision(2)}%` || 0}</td>
                            </tr>
                            <tr>
                                <td><strong>Max Rate</strong></td>
                                <td>{`${Number(this.state.validator.commission.commission_rates.max_rate).toPrecision(2)}%` || 0}</td>
                            </tr>
                            <tr>
                                <td><strong>Max Change Rate</strong></td>
                                <td>{`${Number(this.state.validator.commission.commission_rates.max_change_rate).toPrecision(2)}%` || 0}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col-sm-2">
                    <div className="qr">
                        <QRCode value={this.state.validator.operator_address} className="img-fluid d-block mx-auto"/>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    renderDelegations(){
        if(this.props.loading || this.state.validator === null){
            return null;
        }

        return (
            <table className="table table-striped table-latests">
                <thead>
                <tr>
                    <td className="text-center">Address</td>
                    <td className="text-center">Amount</td>
                </tr>
                </thead>
                <tbody>
                {this.state.validator !== null && this.state.validator.delegations.map((elem, index)=> {
                    const url = `/account/${elem.delegator_address}`;
                    return (
                        <tr key={index}>
                            <td className="text-center"><NavLink to={url} >{elem.delegator_address}</NavLink></td>
                            <td className="text-center">{elem.balance} SBC</td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        );
    }

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            {this.renderHeader()}
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row m-bottom-70">
                            <div className="col-lg-12">
                                <div className="center-heading">
                                    <h2 className="section-title">General</h2>
                                </div>
                            </div>
                            {this.renderValidator()}
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="center-heading">
                                    <h2 className="section-title">Delegations</h2>
                                </div>
                            </div>
                        </div>
                        {this.renderDelegations()}
                    </div>
                </section>
            </React.Fragment>
        );
    }
};

const matchStateToProps = state => {
    return {
        validator: state.validators.data,
        error: state.validators.error,
        loading: state.validators.loading
    };
};

export default connect(
    matchStateToProps,
    { getValidator }
)(ValidatorPage);
