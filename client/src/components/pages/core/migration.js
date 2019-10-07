import React, { Component } from 'react';
import {connect} from "react-redux";
import { save } from 'save-file';
import { toast } from 'react-toastify';
import {dispatchAction} from "../../../utils/redux";
import {fetchMigration, submitMigration} from "../../../store/actions/migration";
import {NavLink} from "react-router-dom";
import sdk from 'sandblock-chain-sdk-js';

type Props = {
    migration: {},
    error: string,
    loading: boolean
};

type State = {
    currentStep: number,
    alreadyHaveAWallet: boolean,
    walletGenerated: boolean,
    walletDatas: {},
    passphrase: string,
    passphraseConfirm: string,
    loading: boolean,
    keyStore: {},
    sendPayload: {},
    signedMessage: string,
    signedMessageSent: boolean,
    migrationRequestReference: string,
    migration: {},
    input: any
};

class MigrationPortalPage extends Component<Props, State>{
    constructor(props: Props){
        super(props);
        this.state = {
            currentStep: 1,
            alreadyHaveAWallet: false,
            walletGenerated: false,
            walletDatas: null,
            passphrase: null,
            passphraseConfirm: null,
            loading: false,
            keyStore: null,
            sendPayload: null,
            signedMessage: null,
            signedMessageSent: false,
            migrationRequestReference: null,
            migration: null,
            input: null
        }

        this.generateNewWallet = this.generateNewWallet.bind(this);
        this.downloadGeneratedWallet = this.downloadGeneratedWallet.bind(this);
        this.signWithMEW = this.signWithMEW.bind(this);
        this.searchRequest = this.searchRequest.bind(this);
        this.sendSignedMessage = this.sendSignedMessage.bind(this);
        this.validateOwnWallet = this.validateOwnWallet.bind(this);
    }

    componentDidMount(): void {
    }

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        this.setState({migration: nextProps.migration, loading: nextProps.loading});

        if(nextProps.error !== null){
            toast.error('We were unable to process your request, please make sure you have no pending request');
        }
        if(this.state.signedMessageSent && !nextProps.loading && nextProps.error === null){
            toast.success('We have successfully received your migration request!');
            this.setState({currentStep: 1});
        }
    }

    validateOwnWallet(e){
        e.preventDefault();
        if(this.state.input === null){
            return;
        }

        if(String(this.state.input).length <= 0){
            return toast.warn('Please enter a SBC wallet address');
        }

        if(String(this.state.input).startsWith('sand') === false){
            return toast.warn('Please enter a valid address');
        }

        this.setState({
            sendPayload: new Buffer(JSON.stringify({destination: this.state.input})).toString('hex'),
            currentStep: 3,
            walletGenerated: false
        });
    }

    generateNewWallet(e){
        e.preventDefault();
        if(this.state.passphrase === null || this.state.passphraseConfirm === null){
            return;
        }

        if(this.state.passphrase !== this.state.passphraseConfirm){
            return;
        }
        //TODO: add passphrase strength validator

        this.setState({loading: true});

        const privateKey = sdk.utils.generatePrivateKey();
        const keyStore = sdk.utils.generateKeyStore(privateKey, this.state.passphrase);
        const publicKey = sdk.utils.getPublicKeyFromPrivateKey(privateKey);
        const address = sdk.utils.getAddressFromPublicKey(publicKey).toString();

        this.setState({
            keyStore,
            loading: false,
            walletGenerated: true,
            passphrase: '',
            passphraseConfirm: '',
            sendPayload: new Buffer(JSON.stringify({destination: address})).toString('hex')
        });
    }

    async downloadGeneratedWallet(){
        var blob = new Blob([JSON.stringify(this.state.keyStore)], {type: "application/json"});
        save(blob, `sandblock_chain_wallet_${new Date().getTime()}.json`);
        this.setState({currentStep: 3, walletGenerated: false});
    }

    signWithMEW(){
        const url = `https://www.myetherwallet.com/interface/sign-message?message=${this.state.sendPayload}`;
        window.open(url, '_blank');
    }

    async sendSignedMessage(e){
        e.preventDefault();
        if(this.state.signedMessage === null || this.state.signedMessage.length <= 0){
            return;
        }

        await dispatchAction(submitMigration(this.state.signedMessage));
        this.setState({signedMessageSent: true});
    }

    searchRequest(e){
        e.preventDefault();
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
                        <div className="col-lg-12">
                            <div className="alert alert-warning text-center">
                                <strong>WARNING: PLEASE READ AND PROCEED CAREFULLY AS THIS PROCESS MIGHT RESULT IN THE LOSS OF CRYPTO-ASSETS</strong>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-12 text-left">
                            <h5 className="card-title">1. Migration Process</h5>
                            <p className="card-text">
                                This migration is dedicated to all the people who have access to an Ethereum wallet that hold Satisfaction Tokens (SAT).<br/>
                                The SAT Ethereum Smart Contract can be found at this address: <a href="https://etherscan.io/token/0x92736b3bff1bbd72a72478d78f18a6ab9b68b791">https://etherscan.io/token/0x92736b3bff1bbd72a72478d78f18a6ab9b68b791</a><br/>
                                <br/>
                                During this process you will be asked to create or provide a Sandblock Chain Wallet and to sign a message using the Ethereum wallet holding your SAT.<br/>
                                Each part of this process is entirely <b>FREE</b> and there is no charge associated with any of the functionalities involved, would it be in fiat, ETH, SAT or SBC.<br/>
                                Once the process is completed, the Sandblock Chain will allocate you the equivalent amount of Sandblock Coins (1 SAT = 1 SBC), rounded to the upper value.<br/>
                                <br/>
                                The allocation process usually happens within minutes but it can take up to a few days depending on the number of requests being processed.<br/>
                                <br/>
                                A detailed article is available to guide you through the process:<br/>
                                <a href="https://medium.com/sandblock/blockchain-migration-step-3-71aebf475104">https://medium.com/sandblock/blockchain-migration-step-3-71aebf475104</a>
                            </p>
                            <br/>
                            <h5 className="card-title">2. Principles & Responsibility</h5>
                            <p className="card-text">
                                During this process you will be asked to create or provide a Sandblock Chain Wallet and use an Ethereum Wallet. You are solely responsible for storing the private keys of these wallets and making sure you do not lose access to it.<br/>
                                <br/>
                                You understand and agree that:<br/>
                                - While the individuals and entities referred to as the Sandblock team make reasonable efforts to develop the Sandblock project, they are not responsible for any loss of crypto-assets<br/>
                                - SBC do not represent or constitute any ownership right or stake, share or security or equivalent rights nor any right to receive future revenues, shares or any other form of participation or governance right in or relating to the Sandblock Project in general<br/>
                                - You have a deep understanding of the functionality, usage, storage, transmission mechanisms and intricacies associated with cryptographic assets and blockchain-based software systems<br/>
                                - You must keep your private key safe and that you may not share it with anybody. You further understand that if your private key is lost or stolen, the SBC associated with its address will be unrecoverable and will be permanently lost. Furthermore, you understand that there is no recovery mechanism for lost keys, so no one will be able to help you retrieve or reconstruct a lost private key and provide you with access to any lost crypto-assets.<br/>
                            </p>
                        </div>
                    </div>
                    <br/>
                    <div className="row">
                        <div className="col-12 text-center">
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
                        <div className="col-12">
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
                                <div className="col-lg-4 offset-lg-4 col-sm-12">
                                    <button className="btn btn-sm btn-block btn-success" onClick={this.downloadGeneratedWallet}>Download my wallet</button>
                                </div>
                            </div>
                        ) : (
                            (this.state.alreadyHaveAWallet) ? (
                                <form onSubmit={this.validateOwnWallet}>
                                    <div className="row">
                                        <div className="col-lg-4 offset-lg-4 col-sm-12">
                                            <div className="form-group">
                                                <label>Please enter your SBC wallet address</label>
                                                <input type="text" className="form-control" onChange={(ev)=>{this.setState({input: ev.target.value})}}/>
                                            </div>
                                            <div className="form-group">
                                                <button type="submit" className="btn btn-sm btn-block btn-success" onClick={this.validateOwnWallet}>Validate</button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={this.generateNewWallet}>
                                    <div className="row">
                                        <div className="col-lg-4 offset-lg-4 col-sm-12">
                                            <div className="form-group">
                                                <label>Please choose a passphrase for your SBC Wallet</label>
                                                <input type="password" className="form-control" onChange={(ev)=>{this.setState({passphrase: ev.target.value})}}/>
                                            </div>
                                            <div className="form-group">
                                                <label>Please confirm the passphrase</label>
                                                <input type="password" className="form-control" onChange={(ev)=>{this.setState({passphraseConfirm: ev.target.value})}}/>
                                            </div>
                                            <div className="form-group">
                                                <button type="submit" className="btn btn-sm btn-block btn-success" onClick={this.generateNewWallet}>Generate my wallet</button>
                                                <button className="btn btn-sm btn-block btn-warning" onClick={()=>{this.setState({alreadyHaveAWallet: true})}}>I already have my own wallet</button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )
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
                                    Everything is now ready. Please sign the following message using your Ethereum Wallet and then paste the signed message.
                                </p>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={this.sendSignedMessage}>
                        <div className="row">
                            <div className="col-lg-12 form-group">
                                <label>Message to sign: </label>
                                <input type="text" disabled value={this.state.sendPayload} className="form-control"/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12 form-group">
                                <label>Signed Message: </label>
                                <textarea className="form-control" onChange={(ev) => {this.setState({signedMessage: ev.target.value})}}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-6">
                                <button className="btn btn-sm btn-info" onClick={this.signWithMEW}>Help me to sign via MyEtherWallet</button>
                            </div>
                            <div className="col-lg-6">
                                <button type="submit" className="btn btn-sm btn-success" onClick={this.sendSignedMessage}>Send the signed message</button>
                            </div>
                        </div>
                    </form>
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
        if(this.state.currentStep !== 1){
            return null;
        }

        return (
            <div className="item">
                <div className="title text-center"><h5>Procedure State Check</h5></div>
                <div className="text">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="alert alert-warning text-center">
                                <b>IMPORTANT:</b> Keep the reference of your request until you have received your SBC.<br/>
                                <br/>
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
                                                    <td className="text-center font-weight-bold">Reference</td>
                                                    <td>{this.state.migration.reference}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-center font-weight-bold">Current State</td>
                                                    <td>{this.state.migration.state}</td>
                                                </tr>
                                                {this.state.migration.state !== 'WAITING' && this.state.migration.tx_hash !== null && (
                                                    <tr>
                                                        <td className="text-center font-weight-bold">Transaction</td>
                                                        <td>
                                                            <NavLink className="btn btn-xsm btn-primary" to={`/transaction/${this.state.migration.tx_hash}`}>
                                                                <i className="fa fa-eye text-white"/>
                                                            </NavLink>
                                                        </td>
                                                    </tr>
                                                )}
                                                {this.state.migration.state === 'REFUSED' && (
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
                            <form onSubmit={this.searchRequest}>
                                <div className="form-group">
                                    <label>Migration request reference:</label>
                                    <input type="text" className="form-control" value={this.state.migrationRequestReference || ''} onChange={(ev)=>{this.setState({migrationRequestReference: ev.target.value})}}/>
                                </div>
                                <div className="form-group">
                                    <button type="submit" className="btn btn-sm btn-success" onClick={this.searchRequest}>Check my request</button>
                                </div>
                            </form>
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
