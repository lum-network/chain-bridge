import React, { Component } from 'react';
import {connect} from "react-redux";
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import sdk from 'sandblock-chain-sdk-js';
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Alert
} from 'reactstrap';
import hardwareButton from '../../../../assets/images/buttons/hardware.svg';
import softwareButton from '../../../../assets/images/buttons/software.svg';
import mnemonicButton from '../../../../assets/images/buttons/mnemonic.svg';
import privateKeyButton from '../../../../assets/images/buttons/key.svg';
import ledgerButton from '../../../../assets/images/buttons/ledger.svg';
import {dispatchAction} from "../../../../utils/redux";
import {getAccount} from "../../../../store/actions/accounts";
import { toast } from 'react-toastify';
import QRCode from "qrcode.react";
import TransactionsListComponent from "../../../parts/TransactionsList";


type Props = {
    account: {},
    error: string,
    loading: boolean
};

type State = {
    walletUnlocked: boolean,
    walletPrivateKey: string,
    accountInfos: {},
    accountTransactions: [],
    selectedMethod: string,

    openedModal: string,

    newTransactionStep: number,

    deciphering: boolean,

    input: any,
    passphrase: string,

    activeTab: number,

    ledgerTransport: any,
    ledgerSandblockApp: any,
    ledgerAcquired: boolean,
    HDPath: []
};

class WalletShow extends Component<Props, State> {
    fileUploadHandler: null;
    constructor(props: Props){
        super(props);
        this.state = {
            walletUnlocked: true,
            walletPrivateKey: '12af61a94691d459c2bc1779f66a2e45911f282e1395c7ca07a08a73ff889265',
            accountInfos: null,
            accountTransactions: [],
            selectedMethod: 'keystore',

            openedModal: '',

            newTransactionStep: 1,

            deciphering: false,

            input: null,
            passphrase: null,

            activeTab: 1,

            ledgerTransport: null,
            ledgerSandblockApp: null,
            ledgerAcquired: false,
            HDPath: [44, 118, 0, 0, 0]
        }

        this.toggleHardwareModal = this.toggleHardwareModal.bind(this);
        this.toggleSoftwareModal = this.toggleSoftwareModal.bind(this);
        this.processSelectedMethod = this.processSelectedMethod.bind(this);
        this.unlockWallet = this.unlockWallet.bind(this);
        this.decipherKeystore = this.decipherKeystore.bind(this);
        this.processLedgerTransport = this.processLedgerTransport.bind(this);
        this.initTransaction = this.initTransaction.bind(this);
    }

    async UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        let newTxs = [];
        if(nextProps.account !== null && nextProps.account.transactions_sent !== undefined && nextProps.account.transactions_received !== undefined){
            newTxs = [...nextProps.account.transactions_sent, ...nextProps.account.transactions_received];
            await newTxs.sort((a, b)=>{
                return new Date(b.dispatched_at) - new Date(a.dispatched_at);
            });
        }
        this.setState({accountInfos: nextProps.account, accountTransactions: newTxs});
    }

    componentDidMount(): void {
        this.retrieveWallet();
        //TODO: remove ça
    }

    retrieveWallet(){
        const address = sdk.utils.getAddressFromPrivateKey(Buffer.from(this.state.walletPrivateKey, 'hex'), 'sand').toString();
        dispatchAction(getAccount(address));
    }

    toggleHardwareModal(){
        this.setState({openedModal: 'hardware'});
    }

    toggleSoftwareModal(){
        this.setState({openedModal: 'software'});
    }

    async initTransaction(){
        if(this.state.newTransactionStep === 1) {
            if (!this.state.input || !this.state.input.destination || !this.state.input.amount || !this.state.input.currency) {
                return toast.warn('All fields are required');
            }

            this.setState({newTransactionStep: 2});
        } else {
            // Ledger is case-specific
            if(this.state.selectedMethod === 'ledger'){

            } else {
                const sbc = new sdk.client();
                sbc.setPrivateKey(Buffer.from(this.state.walletPrivateKey, 'hex'));
                const tx = await sbc.transfer(sbc._address.toString(), this.state.input.destination, this.state.input.currency, this.state.input.amount, "Sent using explorer wallet");
                if(tx === null){
                    return toast.error('Unable to dispatch your transaction, please make sure all params are correct');
                }
                this.setState({openedModal: '', newTransactionStep: 1});
                toast.success(`Transaction dispatched with hash ${tx.txhash}`);
            }
        }
    }

    async processLedgerTransport(){
        this.state.ledgerSandblockApp.getVersion().then(
            res => {
                // Everything went fine ?
                if(res.return_code !== 36864) {
                    if (res.return_code === 28160) {
                        return toast.error(res.error_message)
                    } else {
                        return toast.error('Unknown error while trying to access Ledger. Is it unlocked?');
                    }
                }
                // We get the address
                this.state.ledgerSandblockApp.getAddressAndPubKey(this.state.HDPath, 'sand').then(
                    (res)=>{
                        if(res.return_code !== 36864) {
                            if (res.return_code === 28160) {
                                return toast.error(res.error_message)
                            } else {
                                return toast.error('Unknown error while trying to access Ledger. Is it unlocked?');
                            }
                        }
                        dispatchAction(getAccount(res.bech32_address));
                        this.setState({
                            ledgerAcquired: true,
                            walletUnlocked: true,
                            openedModal: ''
                        });
                    }
                )
            }
        )
    }

    async getLedgerTransport(){
        if(this.state.ledgerTransport !== null){
            return this.state.ledgerTransport;
        }

        try {
            const ledgerTransport = await TransportU2F.create(1000);
            const ledgerSandblockApp = new sdk.SandblockApp(ledgerTransport);
            this.setState({ledgerTransport, ledgerSandblockApp});
            await this.processLedgerTransport();
            return ledgerTransport;
        } catch(error){}
        try {
            if(!this.state.ledgerTransport){
                const ledgerTransport = await TransportWebUSB.create();
                const ledgerSandblockApp = new sdk.SandblockApp(ledgerTransport);
                this.setState({ledgerTransport, ledgerSandblockApp});
                await this.processLedgerTransport();
                return ledgerTransport;
            }
        } catch(error){}

        return this.state.ledgerTransport;
    }

    async processSelectedMethod(){
        if(this.state.selectedMethod === 'mnemonic'){
            this.setState({openedModal: 'mnemonic'});
        } else if(this.state.selectedMethod === 'privatekey'){
            this.setState({openedModal: 'privatekey'});
        } else if(this.state.selectedMethod === "keystore"){
            this.fileUploadHandler.click();
        } else if(this.state.selectedMethod === 'ledger'){
            await this.getLedgerTransport();
            this.setState({openedModal: 'ledger'});
        }
    }

    unlockWallet(value = null){
        if(this.state.selectedMethod === 'mnemonic' && String(this.state.input).length > 0){
            if(!sdk.utils.validateMnemonic(this.state.input)){
                return false;
            }
            try {
                const masterKey = sdk.utils.deriveMasterKeySync(this.state.input);
                const keypair = sdk.utils.deriveKeypair(masterKey);

                const address = sdk.utils.getAddressFromPrivateKey(keypair.privateKey, 'sand').toString();
                this.setState({walletUnlocked: true, walletPrivateKey: keypair.privateKey.toString('hex'), openedModal: ''});
                dispatchAction(getAccount(address));
            } catch(error) {
                console.warn(error);
                toast.warn('Unable to access your wallet using mnemonic phrase');
            }
        } else if(this.state.selectedMethod === "privatekey" && String(this.state.input).length > 0){
            try {
                 const pk = sdk.utils.getPublicKeyFromPrivateKey(this.state.input);
                const address = sdk.utils.getAddressFromPublicKey(pk, 'sand');
                this.setState({walletUnlocked: true, walletPrivateKey: this.state.input, openedModal: ''});
                dispatchAction(getAccount(address.toString()));
            } catch(error){
                console.warn(error);
                toast.warn('Unable to access your wallet using the private key');
            }
        } else if(this.state.selectedMethod === "keystore"){
            if(value.target.files === undefined || value.target.files.length <= 0){
                return false;
            }

            const file = value.target.files[0];
            if(!file || file.type !== "application/json" || (file.name.split('.').pop()).toLowerCase() !== "json"){
                console.warn('bad file type');
                return false;
            }

            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                const keystoreContent = fileReader.result;
                this.setState({input: keystoreContent, openedModal: 'keystore'});
            };
            fileReader.readAsText(file);
        }
    }

    decipherKeystore(){
        if(!this.state.input || this.state.input.length <= 0){
            return false;
        }
        this.setState({deciphering: true});
        try {
            const pk = sdk.utils.getPrivateKeyFromKeyStore(this.state.input, this.state.passphrase);
            const address = sdk.utils.getAddressFromPrivateKey(pk, 'sand');
            dispatchAction(getAccount(address.toString()));
            this.setState({walletUnlocked: true, walletPrivateKey: pk.toString('hex'), openedModal: '', deciphering: false});
            console.log(this.state.walletPrivateKey);
        } catch(error){
            this.setState({deciphering: false});
            toast.warn('Unable to decipher your keystore file, please check passphrase');
        }
    }

    renderWalletLocked(){
        return (
            <React.Fragment>
                <input type="file" ref={(ref)=> this.fileUploadHandler = ref} style={{display: 'none'}} onChange={this.unlockWallet}/>
                <div className="row">
                    <div className="col-lg-12">
                        <Alert color="info" className="text-center">
                            You can unlock your wallet using hardware or software method.<br/>
                            The wallet deciphering and unlocking is client only and nothing is sent to our servers.
                        </Alert>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-4 offset-2">
                        <div className="button-wallet-action" onClick={() => {this.setState({openedModal: 'hardware'})}}>
                            <img src={hardwareButton} className="button-image" alt="icon"/>
                            <h3>Hardware</h3>
                            <p>Ledger Wallet, Finney,<br/>Trezor, BitBot, Secalot,<br/>KeepKey</p>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="button-wallet-action" onClick={() => {this.setState({openedModal: 'software'})}}>
                            <img src={softwareButton} className="button-image" alt="icon"/>
                            <h3>Software</h3>
                            <p>Keystore file, Private Key, Mnemonic Phrase</p>
                            <p className="small-note">Not recommended</p>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }

    renderWalletUnlocked(){
        if(!this.state.accountInfos){
            return null;
        }

        let coins = [];
        if(this.state.accountInfos.coins.length > 0) {
            JSON.parse(this.state.accountInfos.coins).map((elem, index) => {
                return coins.push(`${elem.amount} ${elem.denom}`);
            });
        }
        return (
            <React.Fragment>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row m-bottom-70">
                            <div className="col-lg-9 col-md-9 col-sm-12">
                                <div className="table-responsive">
                                    <table className="table table-striped table-latests table-detail">
                                        <tbody>
                                        <tr>
                                            <td><strong>Address</strong></td>
                                            <td>{this.state.accountInfos.address || ''}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Public Key</strong></td>
                                            <td>{this.state.accountInfos.public_key || 'None'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Account Number</strong></td>
                                            <td>{this.state.accountInfos.account_number | 0}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Account Sequence</strong></td>
                                            <td>{this.state.accountInfos.sequence | 0}</td>
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
                                    <QRCode value={this.state.accountInfos.address} className="img-fluid d-block mx-auto"/>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="table-responsive">
                                    <TransactionsListComponent transactions={this.state.accountTransactions}/>
                                    <button className="btn btn-sm btn-primary" onClick={() => {this.setState({openedModal: 'new_transaction'})}}>Emit a new transaction</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </React.Fragment>
        );
    }

    renderNewTransactionModal(){
        if(!this.state.walletUnlocked){
            return null;
        }

        let currencies = [{denom: 'Please choose a currency'}];
        if(this.state.accountInfos && this.state.accountInfos.coins && this.state.accountInfos.coins.length > 0){
            currencies = currencies.concat(JSON.parse(this.state.accountInfos.coins));
        }
        return (
            <Modal isOpen={this.state.openedModal === 'new_transaction'} toggle={() => {this.setState({openedModal: '', newTransactionStep: 1})}} size={'lg'}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Init a new transaction</ModalHeader>
                <ModalBody>
                    {this.state.newTransactionStep === 1 ? (
                        <React.Fragment>
                            <div className="row">
                                <div className="col-lg-12 form-group">
                                    <label>Destination Address</label>
                                    <input type="text" className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, destination: ev.target.value}})}}/>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-lg-6 form-group">
                                    <label>Amount</label>
                                    <input type="number" className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, amount: ev.target.value}})}}/>
                                </div>
                                <div className="col-lg-6 form-group">
                                    <label>Currency</label>
                                    <select className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, currency: ev.target.value}})}}>
                                        {
                                             currencies.map((elem, index) => {
                                                return (<option value={elem.denom} key={index}>{`${elem.denom} ${(elem.amount) ? `(${elem.amount})` :''}`}</option>);
                                            })
                                        }
                                    </select>
                                </div>
                            </div>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <div className="alert alert-info text-center">
                                Please confirm the different parameters. They will be used to dispatch your transaction.<br/>
                                Once confirmed, it's definitive and nothing can be roll-backed
                            </div>
                            <React.Fragment>
                                <ul>
                                    <li><b>Destination address:</b> {this.state.input.destination}</li>
                                    <li><b>Asset:</b> {this.state.input.amount} {this.state.input.currency}</li>
                                </ul>
                            </React.Fragment>
                        </React.Fragment>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.initTransaction}>Confirm</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: '', newTransactionStep: 1})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderMnemonicModal(){
        return (
            <Modal isOpen={this.state.openedModal === 'mnemonic'} toggle={() => {this.setState({openedModal: ''})}}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Access by Mnemonic Phrase</ModalHeader>
                <ModalBody>
                    <div className="row">
                        <div className="col-lg-12">
                            <label>Please enter your mnemonic phrase</label>
                            <input type="text" className="form-control" onChange={(ev) => {this.setState({input: ev.target.value})}}/>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="success" onClick={this.unlockWallet} disabled={this.state.input === null || String(this.state.input).length <= 0 || !sdk.utils.validateMnemonic(this.state.input)}>Unlock Wallet</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: ''})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderPrivateKeyModal(){
        return (
            <Modal isOpen={this.state.openedModal === 'privatekey'} toggle={() => {this.setState({openedModal: ''})}}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Access by Private Key</ModalHeader>
                <ModalBody>
                    <div className="row">
                        <div className="col-lg-12">
                            <label>Please enter your private key</label>
                            <input type="text" className="form-control" onChange={(ev) => {this.setState({input: ev.target.value})}}/>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="success" onClick={this.unlockWallet} disabled={this.state.input === null || String(this.state.input).length <= 0}>Unlock Wallet</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: ''})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderKeystoreModal(){
        return (
            <Modal isOpen={this.state.openedModal === 'keystore'} toggle={() => {this.setState({openedModal: ''})}}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Access by Keystore File</ModalHeader>
                <ModalBody>
                    <div className="row">
                        <div className="col-lg-12">
                            <label>Please enter your passphrase if you have one</label>
                            <input type="text" className="form-control" onChange={(ev) => {this.setState({passphrase: ev.target.value})}}/>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="success" onClick={this.decipherKeystore}>Unlock Wallet</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: 'software', input: null})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderHardwareModal(){
        return (
            <Modal isOpen={this.state.openedModal === 'hardware'} toggle={() => {this.setState({openedModal: ''})}}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Access by Hardware</ModalHeader>
                <ModalBody>
                    <div className="button-wallet-options">
                        <div
                            className={"button-wallet-option " + (this.state.selectedMethod === 'ledger' ? 'selected': '')}
                            onClick={() => {this.setState({selectedMethod: 'ledger'})}}
                        >
                            <div className="img-title-container">
                                <img src={ledgerButton} className="icon" alt="icon"/>
                                <div className="title-link-container">
                                    <span>Ledger</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="success" onClick={this.processSelectedMethod} disabled={this.state.selectedMethod === ''}>Continue</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: ''})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderSoftwareModal(){
        return (
            <Modal isOpen={this.state.openedModal === 'software'} toggle={() => {this.setState({openedModal: ''})}}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Access by Software</ModalHeader>
                <ModalBody>
                    <Alert color="warning" className="text-center">
                        This is not a recommended way to access your wallet.
                        Due to the sensitivity of the information involved, these options should only be used by experienced users.
                    </Alert>
                    <div className="button-wallet-options">
                        <div
                            className={"button-wallet-option " + (this.state.selectedMethod === 'keystore' ? 'selected': '')}
                            onClick={() => {this.setState({selectedMethod: 'keystore'})}}
                        >
                            <div className="img-title-container">
                                <img src={softwareButton} className="icon" alt="icon"/>
                                <div className="title-link-container">
                                    <span>Keystore File</span>
                                </div>
                            </div>
                        </div>
                        <div
                            className={"button-wallet-option " + (this.state.selectedMethod === 'mnemonic' ? 'selected': '')}
                            onClick={() => {this.setState({selectedMethod: 'mnemonic'})}}
                        >
                            <div className="img-title-container">
                                <img src={mnemonicButton} className="icon" alt="icon"/>
                                <div className="title-link-container">
                                    <span>Mnemonic Phrase</span>
                                </div>
                            </div>
                        </div>
                        <div
                            className={"button-wallet-option " + (this.state.selectedMethod === 'privatekey' ? 'selected': '')}
                            onClick={() => {this.setState({selectedMethod: 'privatekey'})}}
                        >
                            <div className="img-title-container">
                                <img src={privateKeyButton} className="icon" alt="icon"/>
                                <div className="title-link-container">
                                    <span>Private Key</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="success" onClick={this.processSelectedMethod} disabled={this.state.selectedMethod === '' || this.state.deciphering}>Continue</Button>
                    <Button color="secondary" onClick={() => {this.setState({openedModal: ''})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderLedgerModal(){
        return (
            <Modal isOpen={this.state.openedModal === 'ledger'} toggle={() => {this.setState({openedModal: ''})}}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Access by Ledger</ModalHeader>
                <ModalBody>
                    <div className="alert alert-info text-center">
                        Please launch the Sandblock App on your Ledger and then accept our request to your wallet.<br/>
                        We only fetch the address of it, no public key no private key.
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => {this.setState({openedModal: '', ledgerAcquired: false, ledgerSandblockApp: null, ledgerTransport: null, selectedMethod: ''})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderModals(){
        return (
            <React.Fragment>
                {this.renderMnemonicModal()}
                {this.renderPrivateKeyModal()}
                {this.renderKeystoreModal()}
                {this.renderHardwareModal()}
                {this.renderSoftwareModal()}
                {this.renderLedgerModal()}
                {this.renderNewTransactionModal()}
            </React.Fragment>
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
                                    <h1>Wallet Management</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-features section bg-bottom">
                    <div className="container">
                        {(this.state.walletUnlocked) ? this.renderWalletUnlocked() : this.renderWalletLocked()}
                    </div>
                </section>
                {this.renderModals()}
            </React.Fragment>
        );
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
    {  }
)(WalletShow);
