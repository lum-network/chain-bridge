import React from 'react';
import {connect} from "react-redux";
import {getValidator} from "../../../../store/actions/validators";
import {dispatchAction} from "../../../../utils/redux";
import QRCode from "qrcode.react";
import {NavLink} from "react-router-dom";
import ValidatorStatus from "../../../parts/ValidatorStatus";

import sdk from 'sandblock-chain-sdk-js';

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

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        if (nextProps.validator !== null) {
            this.setState({validator: nextProps.validator.result});
        }
    }

    renderValidator(){
        if(this.props.loading || this.state.validator === null || this.state.validator === undefined){
            return null;
        }
        const accAddress = sdk.utils.convertValAddressToAccAddress(this.state.validator.operator_address || this.props.match.params.address).toString();
        return (
            <React.Fragment>
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-lg-2 col-sm-12">
                                    <QRCode value={this.state.validator.operator_address} className="img-fluid d-block mx-auto"/>
                                </div>
                                <div className="col-lg-10 col-sm-12">
                                    <h3>{this.state.validator.description.identity || this.state.validator.description.moniker}</h3>
                                    <br/>
                                    <div className="row">
                                        <div className="col-6">
                                            <h6 className="font-weight-bold">Operator Address</h6>
                                            {this.state.validator.operator_address || this.props.match.params.address}
                                        </div>
                                        <div className="col-6">
                                            <h6 className="font-weight-bold">Address</h6>
                                            <NavLink to={`/account/${accAddress}`}>{accAddress || ''}</NavLink>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row">
                                <div className="col-lg-12 col-sm-6 col-xs-3">
                                    <div className="table-responsive">
                                        <table className="table table-latests table-detail table-no-border">
                                            <tbody>
                                                <tr>
                                                    <td className="validator-identity-title">Details</td>
                                                    <td>{this.state.validator.description.details || ''}</td>
                                                </tr>
                                                <tr>
                                                    <td className="validator-identity-title">Website</td>
                                                    <td><a href={this.state.validator.description.website || ''} target="_blank" rel="noopener noreferrer">{this.state.validator.description.website || ''}</a> </td>
                                                </tr>
                                                <tr>
                                                    <td className="validator-identity-title">Status</td>
                                                    <td><ValidatorStatus status={this.state.validator.status} jailed={this.state.validator.jailed}/></td>
                                                </tr>
                                                <tr>
                                                    <td className="validator-identity-title">Commission</td>
                                                    <td>{`${Number(this.state.validator.commission.commission_rates.rate).toPrecision(2) * 100} %` || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td className="validator-identity-title">Voting Power</td>
                                                    <td>{Number(this.state.validator.delegator_shares).toFixed(0) || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td className="validator-identity-title">Delegated</td>
                                                    <td>{`${this.state.validator.tokens} SBC` || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td className="validator-identity-title">Outstanding rewards</td>
                                                    <td>{`${Number(this.state.validator.rewards[0].amount).toFixed(2)} ${String(this.state.validator.rewards[0].denom).toUpperCase()}` || 0}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    renderDelegations(){
        if(this.props.loading || this.state.validator === undefined){
            return null;
        }

        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Delegations</h5>
                    <h6 className="card-subtitle mb-2 text-muted">Wallets that delegated SBC to this validator</h6>
                    <div className="table-responsive">
                        <table className="table table-no-border table-latests">
                            <thead>
                                <tr>
                                    <th className="text-center">Address</th>
                                    <th className="text-center">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.validator !== null && this.state.validator.delegations !== undefined && this.state.validator.delegations.map((elem, index)=> {
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
                    </div>
                </div>
            </div>
        );
    }

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Validator details</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row m-bottom-30">
                            {this.renderValidator()}
                        </div>
                        <div className="row m-bottom-30">
                            <div className="col-12">
                                {this.renderDelegations()}
                            </div>
                        </div>
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
