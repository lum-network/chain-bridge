import React, { Component } from 'react';
import {connect} from "react-redux";
import { crypto } from 'sandblock-chain-sdk';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from 'reactstrap';

import hardwareButton from '../../../../assets/images/buttons/hardware.svg';
import softwareButton from '../../../../assets/images/buttons/software.svg';
import mnemonicButton from '../../../../assets/images/buttons/mnemonic.svg';
import privateKeyButton from '../../../../assets/images/buttons/key.svg';
import ledgerButton from '../../../../assets/images/buttons/ledger.svg';
import {dispatchAction} from "../../../../utils/redux";
import {getAccount} from "../../../../store/actions/accounts";
import { toast } from 'react-toastify';


type Props = {
    account: {},
    error: string,
    loading: boolean
};

type State = {
    walletUnlocked: boolean,
    walletPrivateKey: string,
    accountInfos: {},
    selectedMethod: string,

    openedModal: string,

    deciphering: boolean,

    input: any
};

class WalletShow extends Component<Props, State> {
    fileUploadHandler: null;
    constructor(props: Props){
        super(props);
        this.state = {
            walletUnlocked: false,
            walletPrivateKey: '',
            accountInfos: null,
            selectedMethod: '',

            openedModal: '',

            deciphering: false,

            input: null
        }

        this.openModal = this.openModal.bind(this);
        this.toggleHardwareModal = this.toggleHardwareModal.bind(this);
        this.toggleSoftwareModal = this.toggleSoftwareModal.bind(this);
        this.processSelectedMethod = this.processSelectedMethod.bind(this);
        this.unlockWallet = this.unlockWallet.bind(this);
    }

    componentDidMount(): void {
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        this.setState({accountInfos: nextProps.account});
    }

    openModal(type: string) {
        this.setState({openedModal: type});
    }

    toggleHardwareModal(){
        this.openModal('hardware');
    }

    toggleSoftwareModal(){
        this.openModal('software');
    }

    processSelectedMethod(){
        if(this.state.selectedMethod === 'mnemonic'){
            this.setState({openedModal: 'mnemonic'});
        } else if(this.state.selectedMethod === 'privatekey'){
            this.setState({openedModal: 'privatekey'});
        } else if(this.state.selectedMethod === "keystore"){
            this.fileUploadHandler.click();
        }
    }

    unlockWallet(value = null){
        if(this.state.selectedMethod === 'mnemonic' && String(this.state.input).length > 0){
            if(!crypto.validateMnemonic(this.state.input)){
                return false;
            }
            try {
                const pk = crypto.getPrivateKeyFromMnemonic(this.state.input);
                const address = crypto.getAddressFromPrivateKey(pk, 'sand');
                this.setState({walletUnlocked: true, walletPrivateKey: pk, mnemonicModalOpened: false});
                dispatchAction(getAccount(address));
            } catch(error) {
                console.warn(error);
            }
        } else if(this.state.selectedMethod === "privatekey" && String(this.state.input).length > 0){
            try {
                 const pk = crypto.getPublicKeyFromPrivateKey(this.state.input);
                const address = crypto.getAddressFromPublicKey(pk, 'sand');
                this.setState({walletUnlocked: true, walletPrivateKey: this.state.input, privateKeyModalOpened: false});
                dispatchAction(getAccount(address));
            } catch(error){
                console.warn(error);
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

            this.setState({deciphering: true});

            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                try {
                    const keystoreContent = fileReader.result;
                    const pk = crypto.getPrivateKeyFromKeyStore(keystoreContent, "caca");
                    console.log(pk);
                    this.setState({deciphering: false});
                } catch(error) {
                    this.setState({deciphering: false});
                    toast.warn('Unable to decipher your keystore file, please check passphrase');
                }
            };
            fileReader.readAsText(file);
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
                        <div className="button-wallet-action" onClick={() => {this.openModal('hardware')}}>
                            <img src={hardwareButton} className="button-image" alt="icon"/>
                            <h3>Hardware</h3>
                            <p>Ledger Wallet, Finney,<br/>Trezor, BitBot, Secalot,<br/>KeepKey</p>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="button-wallet-action" onClick={() => {this.openModal('software')}}>
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
        console.log(this.state.accountInfos);
        return (
            <React.Fragment>

            </React.Fragment>
        );
    }

    renderModals(){
        return (
            <React.Fragment>
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
                        <Button color="success" onClick={this.unlockWallet} disabled={this.state.input === null || String(this.state.input).length <= 0 || !crypto.validateMnemonic(this.state.input)}>Unlock Wallet</Button>{' '}
                        <Button color="secondary" onClick={() => {this.setState({openedModal: ''})}}>Cancel</Button>
                    </ModalFooter>
                </Modal>
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
