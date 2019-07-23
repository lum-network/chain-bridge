import React, { Component } from 'react';
import {connect} from "react-redux";
import { crypto, utils } from 'sandblock-chain-sdk';
import { save } from 'save-file';
import { toast } from 'react-toastify';
import {dispatchAction} from "../../../utils/redux";
import {fetchMigration, submitMigration} from "../../../store/actions/migration";
import {NavLink} from "react-router-dom";

type Props = {
    migration: {},
    error: string,
    loading: boolean
};

type State = {
    currentStep: number,
    walletGenerated: boolean,
    walletDatas: {},
    passphrase: string,
    passphraseConfirm: string,
    loading: boolean,
    keyStore: {},
    destinationAddress: string,
    sendPayload: {},
    migrationRequestReference: string,
    migration: {}
};

class MigrationPortalPage extends Component<Props, State>{
    constructor(props: Props){
        super(props);
        this.state = {
            currentStep: 1,
            walletGenerated: false,
            walletDatas: null,
            passphrase: null,
            passphraseConfirm: null,
            loading: false,
            keyStore: null,
            destinationAddress: '0x5937E671965c0C43DC9842B79d74aa70A36Bd308',
            sendPayload: null,
            migrationRequestReference: null,
            migration: null
        }

        this.generateNewWallet = this.generateNewWallet.bind(this);
        this.downloadGeneratedWallet = this.downloadGeneratedWallet.bind(this);
        this.sendWithMEW = this.sendWithMEW.bind(this);
        this.searchRequest = this.searchRequest.bind(this);
    }

    componentDidMount(): void {
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        this.setState({migration: nextProps.migration});
        
        if(nextProps.error !== null){
            toast.error('We were unable to process your request');
        }
    }

    generateNewWallet(){
        if(this.state.passphrase === null || this.state.passphraseConfirm === null){
            return;
        }

        if(this.state.passphrase !== this.state.passphraseConfirm){
            return;
        }
        //TODO: add passphrase strength validator

        this.setState({loading: true});

        const privateKey = crypto.generatePrivateKey();
        const keyStore = crypto.generateKeyStore(privateKey, this.state.passphrase);
        const publicKey = crypto.getPublicKeyFromPrivateKey(privateKey);
        const address = crypto.getAddressFromPublicKey(publicKey);

        this.setState({
            keyStore,
            loading: false,
            walletGenerated: true,
            sendPayload: utils.str2hexstring(JSON.stringify({destination: address}))
        });
    }

    async downloadGeneratedWallet(){
        var blob = new Blob([JSON.stringify(this.state.keyStore)], {type: "application/json"});
        await save(blob, `sandblock_chain_wallet_${new Date().getTime()}.json`);
        this.setState({currentStep: 3});
    }

    sendWithMEW(){
        const url = `https://www.myetherwallet.com/interface/send-transaction?to=${this.state.destinationAddress}&data=${this.state.sendPayload}&tokensymbol=SAT`;
        window.open(url, '_blank');
    }

    searchRequest(){
        if(this.state.migrationRequestReference === null || this.state.migrationRequestReference.length <= 0){
            return null;
        }

        dispatchAction(fetchMigration(this.state.migrationRequestReference));
    }

    renderStep1(){
        return (
            <div className="item">
                <div className="title text-center"><h5>Migration Processus Introduction</h5></div>
                <div className="text">
                    <div className="row">
                        <div className="col-lg-12 text-left">
                            <h5 className="card-title">1. Lorem Ipsum</h5>
                            <p className="card-text">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br/>
                                Nullam et rhoncus ligula, quis scelerisque nisi. Mauris at hendrerit justo. Pellentesque et porta nisl, sed condimentum velit.<br/>
                                Vestibulum sem eros, condimentum a magna at, viverra porta risus. Etiam porttitor hendrerit sapien, aliquet semper dui elementum nec.<br/>
                                Proin urna metus, sagittis in tempor mollis, lobortis a dui. Donec consequat tempus nulla, vitae pulvinar turpis convallis eu.<br/>
                                Aenean quis mi faucibus ex consequat mattis id a sapien. Mauris quis nunc nec nisi porta tempus nec feugiat neque.<br/>
                                Ut a pulvinar purus. Suspendisse ac velit vitae sem pellentesque finibus.
                            </p>
                            <br/>
                            <h5 className="card-title">2. Lorem Ipsum</h5>
                            <p className="card-text">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br/>
                                Nullam et rhoncus ligula, quis scelerisque nisi. Mauris at hendrerit justo. Pellentesque et porta nisl, sed condimentum velit.<br/>
                                Vestibulum sem eros, condimentum a magna at, viverra porta risus. Etiam porttitor hendrerit sapien, aliquet semper dui elementum nec.<br/>
                                Proin urna metus, sagittis in tempor mollis, lobortis a dui. Donec consequat tempus nulla, vitae pulvinar turpis convallis eu.<br/>
                                Aenean quis mi faucibus ex consequat mattis id a sapien. Mauris quis nunc nec nisi porta tempus nec feugiat neque.<br/>
                                Ut a pulvinar purus. Suspendisse ac velit vitae sem pellentesque finibus.
                            </p>
                            <br/>
                            <h5 className="card-title">3. Lorem Ipsum</h5>
                            <p className="card-text">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br/>
                                Nullam et rhoncus ligula, quis scelerisque nisi. Mauris at hendrerit justo. Pellentesque et porta nisl, sed condimentum velit.<br/>
                                Vestibulum sem eros, condimentum a magna at, viverra porta risus. Etiam porttitor hendrerit sapien, aliquet semper dui elementum nec.<br/>
                                Proin urna metus, sagittis in tempor mollis, lobortis a dui. Donec consequat tempus nulla, vitae pulvinar turpis convallis eu.<br/>
                                Aenean quis mi faucibus ex consequat mattis id a sapien. Mauris quis nunc nec nisi porta tempus nec feugiat neque.<br/>
                                Ut a pulvinar purus. Suspendisse ac velit vitae sem pellentesque finibus.
                            </p>
                        </div>
                    </div>
                    <br/>
                    <div className="row">
                        <div className="col-lg-6 offset-3">
                            <button className="btn btn-sm btn-success btn-block" onClick={()=>{this.setState({currentStep: 2})}}>I have read and I agree the given conditions without any reserve</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderStep2(){
        return (
            <div className="item">
                <div className="title text-center"><h5>SandBlock Chain Wallet Generation</h5></div>
                <div className="text">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="alert alert-warning text-center">
                                <p>
                                    You will now generate your Sandblock Chain Wallet.<br/>
                                    You will be forced to save the related files on your computer.<br/>
                                    If you loose it, <b>no one will never</b> be able to get back your funds.<br/>
                                    If you close the window and reopen it, <b>you will have</b> to restart the processus.
                                </p>
                            </div>
                        </div>
                    </div>
                    {
                        (this.state.walletGenerated) ? (
                            <div className="row">
                                <div className="col-lg-4 offset-4">
                                    <button className="btn btn-sm btn-block btn-success" onClick={this.downloadGeneratedWallet}>Download my wallet</button>
                                </div>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-lg-4 offset-4">
                                    <div className="form-group">
                                        <label>Please enter a passphrase</label>
                                        <input type="password" className="form-control" onChange={(ev)=>{this.setState({passphrase: ev.target.value})}}/>
                                    </div>
                                    <div className="form-group">
                                        <label>Please repeat the passphrase</label>
                                        <input type="password" className="form-control" onChange={(ev)=>{this.setState({passphraseConfirm: ev.target.value})}}/>
                                    </div>
                                    <div className="form-group">
                                        <button className="btn btn-sm btn-block btn-success" onClick={this.generateNewWallet}>Generate my wallet</button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        );
    }

    renderStep3(){
        return (
            <div className="item">
                <div className="title text-center"><h5>Sandblock Tokens Sending</h5></div>
                <div className="text">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="alert alert-warning text-center">
                                <p>
                                    Everything is now ready. The destination Ethereum Address is:<br/>
                                    <b>{this.state.destinationAddress}</b><br/>
                                    Please send all your SAT tokens. Your transaction <b>must contain</b> the following payload in the data field:
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-12 form-group">
                            <label>Payload</label>
                            <input type="text" disabled value={this.state.sendPayload} className="form-control"/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-4 offset-4">
                            <button className="btn btn-sm btn-success" onClick={this.sendWithMEW}>Send via KeyStore/Ledger/Metamask on MyEtherwallet</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderStep(){
        switch(this.state.currentStep)
        {
            case 1:
                return this.renderStep1();

            case 2:
                return this.renderStep2();

            case 3:
                return this.renderStep3();

            default:
                return this.renderStep1();
        }
    }

    renderProcedureCheck(){
        if(this.state.currentStep != 1){
            return null;
        }

        return (
            <div className="item">
                <div className="title text-center"><h5>Procedure State Check</h5></div>
                <div className="text">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="alert alert-warning text-center">
                                You can query our system to see the current state of your migration request.<br/>
                                Please note it may take a few days to be completed.
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        {
                            (this.state.migration !== null) ? (
                               <div className="col-lg-12">
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <tbody>
                                                <tr>
                                                    <td className="text-center font-weight-bold">Current State</td>
                                                    <td>{this.state.migration.state}</td>
                                                </tr>
                                                {this.state.migration.state == 'SUCCESS' && (
                                                    <tr>
                                                        <td className="text-center font-weight-bold">Transaction</td>
                                                        <td>
                                                            <NavLink className="btn btn-xsm btn-primary" to={`/transaction/${this.state.migration.tx_hash}`}>
                                                                <i className="fa fa-eye text-white"/>
                                                            </NavLink>
                                                        </td>
                                                    </tr>
                                                )}
                                                {this.state.migration.state == 'REFUSED' && (
                                                    <tr>
                                                        <td className="text-center font-weight-bold">Denial Reason</td>
                                                        <td>{this.state.migration.message}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td className="text-center font-weight-bold">Requested Amount</td>
                                                    <td>{this.state.migration.amount}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-center font-weight-bold">From Address</td>
                                                    <td>{this.state.migration.from_address}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-center font-weight-bold">Destination Address</td>
                                                    <td>{this.state.migration.to_address}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : null
                        }
                        <div className="col-lg-12">
                            <div className="form-group">
                                <label>Migration request reference:</label>
                                <input type="text" className="form-control" value={this.state.migrationRequestReference || ''} onChange={(ev)=>{this.setState({migrationRequestReference: ev.target.value})}}/>
                            </div>
                            <div className="form-group">
                                <button className="btn btn-sm btn-success" onClick={this.searchRequest}>Check my request</button>
                            </div>
                        </div>
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
                                    <h1>Sandblock Chain Migration</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-features section bg-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                {this.renderStep()}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                {this.renderProcedureCheck()}
                            </div>
                        </div>
                    </div>
                </section>
            </React.Fragment>
        )
    }
}

const matchStateToProps = state => {
    return {
        loading: state.migrations.loading,
        migration: state.migrations.data,
        error: state.migrations.error
    };
};

export default connect(
    matchStateToProps,
    { fetchMigration, submitMigration }
)(MigrationPortalPage);
