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
import {Fee} from "sandblock-chain-sdk-js/dist/utils";

type Props = {
    account: {},
    error: string,
    loading: boolean
};

type State = {
    walletUnlocked: boolean,
    walletPublicKey: any,
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
    timeoutHandler: null;
    constructor(props: Props){
        super(props);
        this.state = {
            walletUnlocked: false,
            walletPublicKey: '',
            walletPrivateKey: '',
            accountInfos: null,
            accountTransactions: [],
            selectedMethod: '',

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
        this.preProcessLedger = this.preProcessLedger.bind(this);
        this.unlockWallet = this.unlockWallet.bind(this);
        this.unlockWalletByKey = this.unlockWalletByKey.bind(this);
        this.decipherKeystore = this.decipherKeystore.bind(this);
        this.processLedgerTransport = this.processLedgerTransport.bind(this);
        this.initTransaction = this.initTransaction.bind(this);
        this.delegate = this.delegate.bind(this);
        this.undelegate = this.undelegate.bind(this);
        this.withdrawRewards = this.withdrawRewards.bind(this);
    }

    async UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        let newTxs = [];
        if(nextProps.account !== null && nextProps.account.transactions_sent !== undefined && nextProps.account.transactions_received !== undefined){
            newTxs = [...nextProps.account.transactions_sent, ...nextProps.account.transactions_received];
            await newTxs.sort((a, b)=>{
                return new Date(b.dispatched_at) - new Date(a.dispatched_at);
            });
            this.setState({accountInfos: nextProps.account, accountTransactions: newTxs});
        }
    }

    componentDidMount(): void {
        //const address = sdk.utils.getAddressFromPrivateKey(Buffer.from(this.state.walletPrivateKey, 'hex'), 'sand').toString();
        //this.retrieveWallet(address);
    }

    componentWillUnmount(): void {
        if(this.timeoutHandler !== null) {
            clearTimeout(this.timeoutHandler);
        }
    }

    async retrieveWallet(address, refresh: boolean = true){
        await dispatchAction(getAccount(address));
        if(refresh) {
            this.timeoutHandler = setTimeout(async () => {
                await this.retrieveWallet(address);
            }, 10000);
        }
    }

    toggleHardwareModal(){
        this.setState({openedModal: 'hardware'});
    }

    toggleSoftwareModal(){
        this.setState({openedModal: 'software'});
    }

    buildFeePayload(): Fee{
        return {
            gas: "200000",
            amount: [{
                amount: "1",
                denom: "sbc"
            }]
        };
    }

    async withdrawRewards(){
        if(this.state.newTransactionStep === 1){
            if(!this.state.input || !this.state.input.destination){
                return toast.warn('All fields are required');
            }

            if(String(this.state.input.destination).startsWith('sandvaloper') === false){
                return toast.warn('Please enter a valid validator address(starts with sandvaloper)');
            }

            this.setState({newTransactionStep: 2});
        } else {
            // Ledger is case-specific
            const sbc = new sdk.client();
            let tx = null;
            if(this.state.selectedMethod === 'ledger'){
                await sbc.initLedgerMetas(this.state.ledgerTransport, this.state.HDPath);
                const payload = await sbc.withdrawReward(this.state.input.destination, this.buildFeePayload(), "Withdrawn using explorer wallet");
                tx = await sbc.dispatchWithLedger(payload, this.state.ledgerTransport, this.state.HDPath);
            } else {
                sbc.setPrivateKey(Buffer.from(this.state.walletPrivateKey, 'hex'));
                const payload = await sbc.withdrawReward(this.state.input.destination, this.buildFeePayload(), "Withdrawn using explorer wallet");
                tx = await sbc.dispatch(payload);
            }
            if(tx === null){
                return toast.error('Unable to dispatch your transaction, please make sure all params are correct');
            }
            this.setState({openedModal: '', newTransactionStep: 1});
            toast.success(`Transaction dispatched with hash ${tx.txhash}`);
            await this.retrieveWallet(this.state.accountInfos.address, false);
        }
    }

    async undelegate(){
        if(this.state.newTransactionStep === 1){
            if(!this.state.input || !this.state.input.destination || !this.state.input.amount){
                return toast.warn('All fields are required');
            }

            if(String(this.state.input.destination).startsWith('sandvaloper') === false){
                return toast.warn('Please enter a valid validator address(starts with sandvaloper)');
            }

            if(parseInt(this.state.input.amount) <= 0){
                return toast.warn('Please enter a correct amount');
            }

            this.setState({newTransactionStep: 2});
        } else {
            // Ledger is case-specific
            const sbc = new sdk.client();
            let tx = null;
            if(this.state.selectedMethod === 'ledger'){
                await sbc.initLedgerMetas(this.state.ledgerTransport, this.state.HDPath);
                const payload = await sbc.undelegate(this.state.input.destination, "sbc", this.state.input.amount, this.buildFeePayload(), "Undelegated using explorer wallet");
                tx = await sbc.dispatchWithLedger(payload, this.state.ledgerTransport, this.state.HDPath);
            } else {
                sbc.setPrivateKey(Buffer.from(this.state.walletPrivateKey, 'hex'));
                const payload = await sbc.undelegate(this.state.input.destination, "sbc", this.state.input.amount, this.buildFeePayload(), "Undelegated using explorer wallet");
                tx = await sbc.dispatch(payload);
            }
            if(tx === null){
                return toast.error('Unable to dispatch your transaction, please make sure all params are correct');
            }
            this.setState({openedModal: '', newTransactionStep: 1});
            toast.success(`Transaction dispatched with hash ${tx.txhash}`);
            await this.retrieveWallet(this.state.accountInfos.address, false);
        }
    }

    async delegate(){
        if(this.state.newTransactionStep === 1){
            if(!this.state.input || !this.state.input.destination || !this.state.input.amount){
                return toast.warn('All fields are required');
            }

            if(String(this.state.input.destination).startsWith('sandvaloper') === false){
                return toast.warn('Please enter a valid validator address(starts with sandvaloper)');
            }

            if(!this.state.accountInfos || !this.state.accountInfos.coins || this.state.accountInfos.coins.length <= 0){
                return toast.warn('Unable to fetch your coins balance');
            }

            let found = false;
            let balance: number = 0;
            const currencies: [] = JSON.parse(this.state.accountInfos.coins);
            await currencies.forEach((cur)=>{
                if(cur !== null && cur.denom !== undefined){
                    if(cur.denom === 'sbc'){
                        found = true;
                        if(cur.amount !== undefined) {
                            balance = cur.amount;
                        }
                    }
                }
            });

            if(!found){
                return toast.warn("You don't have any SBC");
            }

            if(!balance || parseInt(this.state.input.amount) > balance){
                return toast.warn("You don't have enough SBC");
            }

            this.setState({newTransactionStep: 2});
        } else {
            // Ledger is case-specific
            const sbc = new sdk.client();
            let tx = null;
            if(this.state.selectedMethod === 'ledger'){
                await sbc.initLedgerMetas(this.state.ledgerTransport, this.state.HDPath);
                const payload = await sbc.delegate(this.state.input.destination, "sbc", this.state.input.amount, this.buildFeePayload(), "Delegated using explorer wallet");
                tx = await sbc.dispatchWithLedger(payload, this.state.ledgerTransport, this.state.HDPath);
            } else {
                sbc.setPrivateKey(Buffer.from(this.state.walletPrivateKey, 'hex'));
                const payload = await sbc.delegate(this.state.input.destination, "sbc", this.state.input.amount, this.buildFeePayload(), "Delegated using explorer wallet");
                tx = await sbc.dispatch(payload);
            }
            if(tx === null){
                return toast.error('Unable to dispatch your transaction, please make sure all params are correct');
            }
            this.setState({openedModal: '', newTransactionStep: 1});
            toast.success(`Transaction dispatched with hash ${tx.txhash}`);
            await this.retrieveWallet(this.state.accountInfos.address, false);
        }
    }

    async initTransaction(){
        if(this.state.newTransactionStep === 1) {
            if (!this.state.input || !this.state.input.destination || !this.state.input.amount || !this.state.input.currency) {
                return toast.warn('All fields are required');
            }

            this.setState({newTransactionStep: 2});
        } else {
            // Ledger is case-specific
            const sbc = new sdk.client();
            let tx = null;
            if(this.state.selectedMethod === 'ledger'){
                await sbc.initLedgerMetas(this.state.ledgerTransport, this.state.HDPath);
                const payload = await sbc.transfer(this.state.input.destination, this.state.input.currency, this.state.input.amount, this.buildFeePayload(), "Sent using explorer wallet");
                tx = await sbc.dispatchWithLedger(payload, this.state.ledgerTransport, this.state.HDPath);
            } else {
                sbc.setPrivateKey(Buffer.from(this.state.walletPrivateKey, 'hex'));
                const payload = await sbc.transfer(this.state.input.destination, this.state.input.currency, this.state.input.amount, this.buildFeePayload(), "Sent using explorer wallet");
                tx = await sbc.dispatch(payload);
            }
            if(tx === null){
                return toast.error('Unable to dispatch your transaction, please make sure all params are correct');
            }
            this.setState({openedModal: '', newTransactionStep: 1});
            toast.success(`Transaction dispatched with hash ${tx.txhash}`);
            await this.retrieveWallet(this.state.accountInfos.address, false);
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
                // We get the public key
                this.state.ledgerSandblockApp.getAddressAndPubKey(this.state.HDPath, 'sand').then(
                    async (res)=>{
                        if(res.return_code !== 36864) {
                            if (res.return_code === 28160) {
                                return toast.error(res.error_message)
                            } else {
                                return toast.error('Unknown error while trying to access Ledger. Is it unlocked?');
                            }
                        }
                        await this.retrieveWallet(res.bech32_address);
                        this.setState({
                            ledgerAcquired: true,
                            walletUnlocked: true,
                            openedModal: '',
                            walletPublicKey: res.compressed_pk
                        });
                    }, (err)=>{
                        console.error(err);
                    }
                )
            }, (err)=>{
                console.error(err);
            }
        )
    }

    async getLedgerTransport(){
        if(this.state.ledgerTransport !== null){
            return this.state.ledgerTransport;
        }

        try {
            const ledgerTransport = await TransportU2F.create(15000);
            const ledgerSandblockApp = new sdk.SandblockApp(ledgerTransport);
            this.setState({ledgerTransport, ledgerSandblockApp});
            await this.processLedgerTransport();
            return ledgerTransport;
        } catch(error){
            console.error(error);
        }
        try {
            if(!this.state.ledgerTransport){
                const ledgerTransport = await TransportWebUSB.create(15000);
                const ledgerSandblockApp = new sdk.SandblockApp(ledgerTransport);
                this.setState({ledgerTransport, ledgerSandblockApp});
                await this.processLedgerTransport();
                return ledgerTransport;
            }
        } catch(error){
            console.error(error);
        }

        return this.state.ledgerTransport;
    }

    async preProcessLedger(){
        if(parseInt(this.state.HDPath[3]) < 0){
            return toast.warn('Invalid HDPath');
        }
        if(parseInt(this.state.HDPath[4]) < 0){
            return toast.warn('Invalid HDPath');
        }
        await this.getLedgerTransport();
    }

    async processSelectedMethod(){
        if(this.state.selectedMethod === 'mnemonic'){
            this.setState({openedModal: 'mnemonic'});
        } else if(this.state.selectedMethod === 'privatekey'){
            this.setState({openedModal: 'privatekey'});
        } else if(this.state.selectedMethod === "keystore"){
            this.fileUploadHandler.click();
        } else if(this.state.selectedMethod === 'ledger'){
            this.setState({openedModal: 'ledger'});
        }
    }

    unlockWalletByKey(e) {
        e.preventDefault();
        this.unlockWallet();
    }

    async unlockWallet(value = null){
        if(this.state.selectedMethod === 'mnemonic' && String(this.state.input).length > 0){
            if(!sdk.utils.validateMnemonic(this.state.input)){
                return false;
            }
            try {
                const masterKey = sdk.utils.deriveMasterKeySync(this.state.input);
                const keypair = sdk.utils.deriveKeypair(masterKey);

                const address = sdk.utils.getAddressFromPrivateKey(keypair.privateKey, 'sand').toString();
                this.setState({walletUnlocked: true, walletPrivateKey: keypair.privateKey.toString('hex'), openedModal: ''});
                await this.retrieveWallet(address);
            } catch(error) {
                console.warn(error);
                toast.warn('Unable to access your wallet using mnemonic phrase');
            }
        } else if(this.state.selectedMethod === "privatekey" && String(this.state.input).length > 0){
            try {
                 const pk = sdk.utils.getPublicKeyFromPrivateKey(this.state.input);
                const address = sdk.utils.getAddressFromPublicKey(pk, 'sand');
                this.setState({walletUnlocked: true, walletPrivateKey: this.state.input, openedModal: ''});
                await this.retrieveWallet(address.toString());
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

    async decipherKeystore(e){
        e.preventDefault();
        if(!this.state.input || this.state.input.length <= 0){
            return false;
        }
        this.setState({deciphering: true});
        try {
            const pk = sdk.utils.getPrivateKeyFromKeyStore(this.state.input, this.state.passphrase);
            const address = sdk.utils.getAddressFromPrivateKey(pk, 'sand');
            await this.retrieveWallet(address.toString());
            this.setState({walletUnlocked: true, walletPrivateKey: pk.toString('hex'), openedModal: '', deciphering: false});
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
                    <div className="col-12">
                        <Alert color="info" className="text-center">
                            You can unlock your wallet using hardware or software method.<br/>
                            The wallet deciphering and unlocking is client only and nothing is sent to our servers.
                        </Alert>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-4 offset-lg-2 col-sm-12">
                        <div className="button-wallet-action" onClick={() => {this.setState({openedModal: 'hardware'})}}>
                            <img src={hardwareButton} className="button-image" alt="icon"/>
                            <h3>Hardware</h3>
                            <p>Ledger Wallet (Nano S, Nano X)</p>
                        </div>
                    </div>
                    <br/>
                    <div className="col-lg-4 col-sm-12">
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
                                            <td>{this.state.accountInfos.public_key_value || 'None'} ({this.state.accountInfos.public_key_type || 'Type Unknown'})</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Account Number</strong></td>
                                            <td>{this.state.accountInfos.account_number || 0}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Account Sequence (aka Number of transactions)</strong></td>
                                            <td>{this.state.accountInfos.sequence || 0}</td>
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
                                    <button className="btn btn-sm btn-primary mr-2" onClick={() => {this.setState({openedModal: 'new_transaction'})}}>Emit a new transaction</button>
                                    <button className="btn btn-sm btn-primary mr-2" onClick={() => {this.setState({openedModal: 'delegate'})}}>Delegate my SBC</button>
                                    <button className="btn btn-sm btn-primary mr-2" onClick={() => {this.setState({openedModal: 'undelegate'})}}>Undelegate my SBC</button>
                                    <button className="btn btn-sm btn-primary mr-2" onClick={() => {this.setState({openedModal: 'withdraw_rewards'})}}>Withdraw my rewards</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </React.Fragment>
        );
    }

    renderUndelegateModal(){
        if(!this.state.walletUnlocked){
            return null;
        }

        return (
            <Modal isOpen={this.state.openedModal === 'undelegate'} toggle={() => {this.setState({openedModal: '', newTransactionStep: 1})}} size={'lg'}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Undelegate my SBC</ModalHeader>
                <ModalBody>
                    {this.state.newTransactionStep === 1 ? (
                        <React.Fragment>
                            <div className="row">
                                <div className="col-lg-6 form-group">
                                    <label>Validator Address</label>
                                    <input type="text" className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, destination: ev.target.value}})}}/>
                                </div>
                                <div className="col-lg-6 form-group">
                                    <label>Amount</label>
                                    <input type="number" className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, amount: ev.target.value}})}}/>
                                </div>
                            </div>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <div className="alert alert-info text-center">
                                Please confirm the different parameters. They will be used to dispatch your transaction.<br/>
                                Once confirmed, it's definitive and nothing can be roll-backed
                            </div>
                            {this.state.ledgerAcquired && (
                                <div className="alert alert-warning text-center">
                                    Once you click 'confirm', please validate and sign on the Ledger to process the transaction.
                                </div>
                            )}
                            <React.Fragment>
                                <ul>
                                    <li><b>Validator address:</b> {this.state.input.destination}</li>
                                    <li><b>Amount:</b> {this.state.input.amount}</li>
                                </ul>
                            </React.Fragment>
                        </React.Fragment>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.undelegate}>Confirm</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: '', newTransactionStep: 1})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderWithdrawRewardsModal(){
        if(!this.state.walletUnlocked){
            return null;
        }

        return (
            <Modal isOpen={this.state.openedModal === 'withdraw_rewards'} toggle={() => {this.setState({openedModal: '', newTransactionStep: 1})}} size={'lg'}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Withdraw my rewards</ModalHeader>
                <ModalBody>
                    {this.state.newTransactionStep === 1 ? (
                        <React.Fragment>
                            <div className="row">
                                <div className="col-lg-12 form-group">
                                    <label>Validator Address</label>
                                    <input type="text" className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, destination: ev.target.value}})}}/>
                                </div>
                            </div>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <div className="alert alert-info text-center">
                                Please confirm the different parameters. They will be used to dispatch your transaction.<br/>
                                Once confirmed, it's definitive and nothing can be roll-backed
                            </div>
                            {this.state.ledgerAcquired && (
                                <div className="alert alert-warning text-center">
                                    Once you click 'confirm', please validate and sign on the Ledger to process the transaction.
                                </div>
                            )}
                            <React.Fragment>
                                <ul>
                                    <li><b>Validator address:</b> {this.state.input.destination}</li>
                                </ul>
                            </React.Fragment>
                        </React.Fragment>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.withdrawRewards}>Confirm</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: '', newTransactionStep: 1})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

    renderDelegateModal(){
        if(!this.state.walletUnlocked){
            return null;
        }

        return (
            <Modal isOpen={this.state.openedModal === 'delegate'} toggle={() => {this.setState({openedModal: '', newTransactionStep: 1})}} size={'lg'}>
                <ModalHeader toggle={() => {this.setState({openedModal: ''})}}>Delegate my SBC</ModalHeader>
                <ModalBody>
                    {this.state.newTransactionStep === 1 ? (
                        <React.Fragment>
                            <div className="row">
                                <div className="col-lg-6 form-group">
                                    <label>Validator Address</label>
                                    <input type="text" className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, destination: ev.target.value}})}}/>
                                </div>
                                <div className="col-lg-6 form-group">
                                    <label>Amount</label>
                                    <input type="number" className="form-control" onChange={(ev)=>{this.setState({input: {...this.state.input, amount: ev.target.value}})}}/>
                                </div>
                            </div>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <div className="alert alert-info text-center">
                                Please confirm the different parameters. They will be used to dispatch your transaction.<br/>
                                Once confirmed, it's definitive and nothing can be roll-backed
                            </div>
                            {this.state.ledgerAcquired && (
                                <div className="alert alert-warning text-center">
                                    Once you click 'confirm', please validate and sign on the Ledger to process the transaction.
                                </div>
                            )}
                            <React.Fragment>
                                <ul>
                                    <li><b>Validator address:</b> {this.state.input.destination}</li>
                                    <li><b>Amount:</b> {this.state.input.amount}</li>
                                </ul>
                            </React.Fragment>
                        </React.Fragment>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.delegate}>Confirm</Button>{' '}
                    <Button color="secondary" onClick={() => {this.setState({openedModal: '', newTransactionStep: 1})}}>Cancel</Button>
                </ModalFooter>
            </Modal>
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
                            {this.state.ledgerAcquired && (
                                <div className="alert alert-warning text-center">
                                    Once you click 'confirm', please validate and sign on the Ledger to process the transaction.
                                </div>
                            )}
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
                    <form onSubmit={this.unlockWalletByKey}>
                        <div className="row">
                            <div className="col-lg-12">
                                <label>Please enter your mnemonic phrase</label>
                                <input type="text" className="form-control" onChange={(ev) => {this.setState({input: ev.target.value})}}/>
                            </div>
                        </div>
                    </form>
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
                    <form onSubmit={this.unlockWalletByKey}>
                        <div className="row">
                            <div className="col-lg-12">
                                <label>Please enter your private key</label>
                                <input type="text" className="form-control" onChange={(ev) => {this.setState({input: ev.target.value})}}/>
                            </div>
                        </div>
                    </form>
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
                    <form onSubmit={this.decipherKeystore}>
                        <div className="row">
                            <div className="col-lg-12">
                                <label>Please enter your passphrase if you have one</label>
                                <input type="password" className="form-control" onChange={(ev) => {this.setState({passphrase: ev.target.value})}}/>
                            </div>
                        </div>
                    </form>
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
                    <div className="alert alert-warning text-center">
                        You can customize the Hardware Derivation Path if you're confident enough with it. Otherwise leave it like this.<br/>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            Account
                            <input className="form-control" min="0" type="number" defaultValue={this.state.HDPath[2]} onChange={(ev)=>{this.state.HDPath[2] = ev.target.value; this.forceUpdate()}}/>
                        </div>
                        <div className="col-6">
                            Address Index
                            <input className="form-control" min="0" type="number" defaultValue={this.state.HDPath[4]} onChange={(ev)=>{this.state.HDPath[4] = ev.target.value; this.forceUpdate()}}/>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="success" onClick={this.preProcessLedger}>Continue</Button>
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
                {this.renderDelegateModal()}
                {this.renderUndelegateModal()}
                {this.renderWithdrawRewardsModal()}
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
