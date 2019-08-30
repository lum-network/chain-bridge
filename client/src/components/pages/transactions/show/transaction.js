import React, { Component } from 'react';
import {connect} from "react-redux";
import {getTransaction} from "../../../../store/actions/transactions";
import {dispatchAction} from "../../../../utils/redux";
import {NavLink} from "react-router-dom";

type Props = {
    transaction: {},
    error: string,
    loading: boolean
};

type State = { transaction: {} };

class TransactionShowPage extends Component<Props, State> {
    constructor(props){
        super(props);
        this.state = {
            transaction: null
        }
    }

    componentDidMount(): void {
        dispatchAction(getTransaction(this.props.match.params.hash));
    }

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.transaction !== null){
            this.setState({transaction: nextProps.transaction});
        }
    }

    renderTransaction(){
        if(this.state.transaction === null || this.props.loading){
            return null;
        }

        return (
            <table className="table table-latests table-detail table-no-border">
                <tbody>
                    <tr>
                        <td className="validator-identity-title"><strong>Block Height</strong></td>
                        <td><NavLink to={`/block/${this.state.transaction.height}`}>{this.state.transaction.height}</NavLink></td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Transaction Hash</strong></td>
                        <td>{this.state.transaction.hash}</td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Status</strong></td>
                        <td>
                            {
                                (this.state.transaction.success)
                                    ? <span className="badge badge-success">Success</span>
                                    : <span className="badge badge-danger">Error</span>
                            }
                        </td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Log Output</strong></td>
                        <td>{this.state.transaction.log}</td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Timestamp</strong></td>
                        <td>{this.state.transaction.dispatched_at}</td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Action</strong></td>
                        <td>{this.state.transaction.action}</td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Gas Wanted</strong></td>
                        <td>{this.state.transaction.gas_wanted}</td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Gas Used</strong></td>
                        <td>{this.state.transaction.gas_used}</td>
                    </tr>
                    <tr>
                        <td className="validator-identity-title"><strong>Memo</strong></td>
                        <td>{this.state.transaction.name}</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    renderMsgs(){
        if(this.state.transaction === null || this.props.loading){
            return null;
        }

        if(!this.state.transaction.msgs){
            return null;
        }

        let msgs = [];
        JSON.parse(this.state.transaction.msgs).forEach((msg, index)=>{
            msgs.push(
                <div className="row" key={index}>
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{msg.type}</h5>
                                <table>
                                    <tbody>
                                    <tr>
                                        <td className="validator-identity-title"><strong>From</strong></td>
                                        <td><NavLink to={`/account/${msg.value.from_address}`}>{msg.value.from_address}</NavLink></td>
                                    </tr>
                                    <tr>
                                        <td className="validator-identity-title"><strong>To</strong></td>
                                        <td><NavLink to={`/account/${msg.value.to_address}`}>{msg.value.to_address}</NavLink></td>
                                    </tr>
                                    <tr>
                                        <td className="validator-identity-title"><strong>Value</strong></td>
                                        <td>{msg.value.amount[0].amount} {msg.value.amount[0].denom}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )
        });

        return msgs;
    }

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Transaction details</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row m-bottom-30">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Informations</h5>
                                        <hr/>
                                        <div className="table-responsive">
                                            {this.renderTransaction()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Messages</h5>
                                        <hr/>
                                        <div className="table-responsive">
                                            {this.renderMsgs()}
                                        </div>
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
        transaction: state.transactions.data,
        error: state.transactions.error,
        loading: state.transactions.loading
    };
};

export default connect(
    matchStateToProps,
    { getTransaction }
)(TransactionShowPage);

