import React, { Component } from 'react';
import {connect} from "react-redux";
import QRCode from 'qrcode.react';
import {getAccount} from "../../../../store/actions/accounts";
import {dispatchAction} from "../../../../utils/redux";
import TransactionsListComponent from "../../../parts/TransactionsList";

type Props = {
    account: {},
    error: string,
    loading: boolean
};

type State = { account: {}, transactions: [] };

class AddressShowPage extends Component<Props, State> {
    constructor(props){
        super(props);
        this.state = {
            account: null,
            transactions: null
        }
    }

    componentDidMount(): void {
        dispatchAction(getAccount(this.props.match.params.accountId));
    }

    async componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.account !== null){
            let newTxs = [...nextProps.account.transactions_sent, ...nextProps.account.transactions_received];
            await newTxs.sort((a, b)=>{
                return new Date(b.dispatched_at) - new Date(a.dispatched_at);
            });
            this.setState({
                account: nextProps.account,
                transactions: newTxs
            });
        }
    }

    renderTransactions() {
        if(this.state.transactions === null){
            return null;
        }

        return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="table-responsive">
                        <TransactionsListComponent transactions={this.state.transactions}/>
                    </div>
                </div>
            </div>
        );
    }

    renderAccount(){
        if(this.props.loading || this.state.account === null){
            return null;
        }

        let coins = [];
        JSON.parse(this.state.account.coins).map((elem, index)=>{
            return coins.push(`${elem.amount} ${elem.denom}`);
        });

        return (
            <React.Fragment>
                <div className="col-lg-9 col-md-9 col-sm-12">
                    <div className="table-responsive">
                        <table className="table table-striped table-latests table-detail">
                            <tbody>
                            <tr>
                                <td><strong>Address</strong></td>
                                <td>{this.state.account.address}</td>
                            </tr>
                            <tr>
                                <td><strong>Public Key</strong></td>
                                <td>{(this.state.account.public_key && this.state.account.public_key) || 'None'}</td>
                            </tr>
                            <tr>
                                <td><strong>Account Number</strong></td>
                                <td>{this.state.account.account_number}</td>
                            </tr>
                            <tr>
                                <td><strong>Account Sequence</strong></td>
                                <td>{this.state.account.sequence}</td>
                            </tr>
                            <tr>
                                <td><strong>Owned Coins</strong></td>
                                <td>
                                    {coins.join(', ')}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="col-lg-3 col-md-3 col-sm-12">
                    <div className="qr">
                        <QRCode value={this.state.account.address} className="img-fluid d-block mx-auto"/>
                    </div>
                </div>
            </React.Fragment>
        )
    }

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Address Details</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                    <p>{this.state.account !== null && this.state.account.address}</p>
                                </div>
                            </div>
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
                            {this.renderAccount()}
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="center-heading">
                                    <h2 className="section-title">Transactions</h2>
                                </div>
                            </div>
                        </div>
                        {this.renderTransactions()}
                    </div>
                </section>
            </React.Fragment>
        )
    }
}

const matchStateToProps = state => {
    return {
        account: state.accounts.data,
        error: state.accounts.error,
        loading: state.accounts.loading
    };
};

export default connect(
    matchStateToProps,
    { getAccount }
)(AddressShowPage);

