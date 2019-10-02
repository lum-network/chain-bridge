import React, { Component } from 'react';
import {connect} from "react-redux";
import QRCode from 'qrcode.react';
import {getAccount} from "../../../../store/actions/accounts";
import {dispatchAction} from "../../../../utils/redux";
import TransactionsListComponent from "../../../parts/TransactionsList";
import { toast } from 'react-toastify';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";

type Props = {
    account: {},
    error: string,
    loading: boolean
};

type State = { account: {transactions_sent: [], transactions_received:[]}, transactions: [], isQRCodeModalOpened: boolean };

class AddressShowPage extends Component<Props, State> {
    constructor(props: Props){
        super(props);
        this.state = {
            account: null,
            transactions: null,
            isQRCodeModalOpened: false
        }

        this.onClickCopyAddress = this.onClickCopyAddress.bind(this);
    }

    componentDidMount(): void {
        dispatchAction(getAccount(this.props.match.params.accountId));
    }

    async UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        if(nextProps.account !== null && nextProps.error === null){
            let newTxs = [];
            if(nextProps.account.transactions_sent !== undefined && nextProps.account.transactions_received !== undefined){
                newTxs = [...nextProps.account.transactions_sent, ...nextProps.account.transactions_received];
                await newTxs.sort((a, b)=>{
                    return new Date(b.dispatched_at) - new Date(a.dispatched_at);
                });
            }
            this.setState({
                account: nextProps.account,
                transactions: newTxs
            });
        }
    }

    onClickCopyAddress(){
        navigator.clipboard.writeText(this.state.account.address);
        toast.success('Account address copied to clipboard!');
    }

    renderTransactions() {
        if(this.state.transactions === null){
            return null;
        }

        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Transactions</h5>
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
        if(this.state.account.coins.length > 0) {
            JSON.parse(this.state.account.coins).map((elem) => {
                return coins.push(`${elem.amount} ${elem.denom}`);
            });
        }

        return (
            <React.Fragment>
                <div className="col-12">
                    <div className="card">
                        <div className="card-header account-details-header">
                            <div className="row align-items-center">
                                <div className="col-lg-1 col-sm-12 col-xs-12"><i className="fa fa-qrcode fa-4x open-qrcode" onClick={() => {this.setState({isQRCodeModalOpened: true})}}/> </div>
                                <div className="col-lg-6 col-sm-12 col-xs-12">
                                    <h6 className="font-weight-bold">Address</h6>
                                    {this.state.account.address || this.props.match.params.accountId}
                                    <i className="fa fa-copy ml-3 copy-to-clipboard" onClick={this.onClickCopyAddress}/>
                                </div>
                                <div className="col-lg-5 col-sm-12 col-xs-12">
                                    <h6 className="font-weight-bold">Reward Address</h6>
                                    {this.state.account.address || this.props.match.params.accountId}
                                </div>
                            </div>
                        </div>
                        <div className="card-body table-responsive">
                            <table className="table table-latests table-detail table-no-border">
                                <tbody>
                                    <tr>
                                        <td className="validator-identity-title"><strong>Address</strong></td>
                                        <td>{this.state.account.address || this.props.match.params.accountId}</td>
                                    </tr>
                                    <tr>
                                        <td className="validator-identity-title"><strong>Public Key</strong></td>
                                        <td>{this.state.account.public_key_value || 'None'} ({this.state.account.public_key_type || 'Type Unknown'})</td>
                                    </tr>
                                    <tr>
                                        <td className="validator-identity-title"><strong>Account Number</strong></td>
                                        <td>{this.state.account.account_number | 0}</td>
                                    </tr>
                                    <tr>
                                        <td className="validator-identity-title"><strong>Account Sequence</strong></td>
                                        <td>{this.state.account.sequence | 0}</td>
                                    </tr>
                                    <tr>
                                        <td className="validator-identity-title"><strong>Owned Coins</strong></td>
                                        <td>
                                            {coins.join(', ')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </React.Fragment>
        )
    }

    renderDelegations(){
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Delegations</h5>
                </div>
            </div>
        );
    }

    renderUnboundings(){
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Unboundings</h5>
                </div>
            </div>
        );
    }

    renderQRCodeModal(){
        if(!this.state.account || this.props.loading){
            return null;
        }

        return (
            <Modal isOpen={this.state.isQRCodeModalOpened} toggle={() => {this.setState({isQRCodeModalOpened: false})}}>
                <ModalHeader toggle={() => {this.setState({isQRCodeModalOpened: false})}}>Address QRCode</ModalHeader>
                <ModalBody>
                    <div className="row">
                        <div className="col-12">
                            <div className="qr">
                                <QRCode value={this.state.account.address} className="img-fluid d-block mx-auto"/>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => {this.setState({isQRCodeModalOpened: false})}}>Close</Button>
                </ModalFooter>
            </Modal>
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
                                    <h1>Account Details</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row m-bottom-30">
                            {this.renderAccount()}
                        </div>
                        <div className="row m-bottom-30">
                            <div className="col-6">{this.renderDelegations()}</div>
                            <div className="col-6">{this.renderUnboundings()}</div>
                        </div>
                        <div className="row m-bottom-30">
                            <div className="col-12">
                                {this.renderTransactions()}
                            </div>
                        </div>
                    </div>
                </section>
                {this.renderQRCodeModal()}
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

