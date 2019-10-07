import React from 'react';
import {connect} from "react-redux";
import {toast} from "react-toastify";
import sdk from 'sandblock-chain-sdk-js';
import {save} from "save-file";
import {NavLink} from "react-router-dom";

class WalletCreatePage extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            step: 1,
            password: '',
            passwordConfirmation: '',
            generating: false,
            mnemonic: null,
            publicKey: null,
            address: null
        };

        this.onValidateForm = this.onValidateForm.bind(this);
    }

    onValidateForm = async (e) => {
        e.preventDefault();

        if(this.state.generating){
            return;
        }

        if(!this.state.password.length || !this.state.passwordConfirmation.length){
            return toast.warn('Both password fields are required');
        }

        if(this.state.password !== this.state.passwordConfirmation) {
            return toast.warn("Both passwords doesn't match");
        }

        await this.setState({generating: true});


        const mnemonic = sdk.utils.generateMnemonic();
        const privateKey = sdk.utils.getPrivateKeyFromMnemonic(mnemonic, true, 0, Buffer.from(''));
        const keyStore = sdk.utils.generateKeyStore(privateKey, this.state.password);
        const publicKey = sdk.utils.getPublicKeyFromPrivateKey(privateKey);
        const address = sdk.utils.getAddressFromPrivateKey(privateKey).toString();

        this.setState({
            step: 2,
            generating: false,
            publicKey,
            address,
            mnemonic
        });

        const blob = new Blob([JSON.stringify(keyStore)], {type: "application/json"});
        await save(blob, `sandblock_chain_wallet_${new Date().getTime()}.json`);
    }

    renderStepOne(){
        return (
            <React.Fragment>
                <div className="alert alert-warning text-center m-bottom-30">
                    This is not a recommended way to access your wallet.<br/>
                    Due to the sensitivity of the information involved, these options should only be used in offline settings by experienced users.<br/>
                    You should use a physical wallet like Ledger
                </div>
                <h5 className="font-weight-bold text-center m-bottom-30">Choose a password</h5>
                <form onSubmit={this.onValidateForm}>
                    <div className="form-group">
                        <label>Your password:</label>
                        <input type="password" className="form-control" onChange={(ev)=>{this.setState({password: ev.target.value})}}/>
                    </div>
                    <div className="form-group">
                        <label>Your password confirmation</label>
                        <input type="password" className="form-control" onChange={(ev)=>{this.setState({passwordConfirmation: ev.target.value})}}/>
                    </div>
                    <div className="form-group">
                        <button type="submit" className="btn btn-sm btn-success" disabled={this.state.generating}>Create my wallet</button>
                    </div>
                </form>
            </React.Fragment>
        );
    }

    renderStepTwo(){
        return (
            <React.Fragment>
                <h5 className="font-weight-bold text-center m-bottom-30">All done!</h5>
                <div className="alert alert-success text-center m-bottom-30">
                    Your wallet is now generated, you must have downloaded it.<br/>
                    Be careful and don't loose the file as well as the password you provided.<br/>
                    If either the wallet or the password is lost, <b>no one</b> will be able to recover your wallet.
                </div>
                <div className="table-responsive">
                    <table className="table table-bordered m-bottom-30">
                        <tbody>
                            <tr>
                                <td className="font-weight-bold">Address</td>
                                <td>{this.state.address}</td>
                            </tr>
                            <tr>
                                <td className="font-weight-bold">Public Key</td>
                                <td>{this.state.publicKey.toString('hex')}</td>
                            </tr>
                            <tr>
                                <td className="font-weight-bold">Mnemonic</td>
                                <td>{this.state.mnemonic.toString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <NavLink to={`/wallet/show`} className="btn btn-sm btn-block btn-primary">Continue to my wallet</NavLink>
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
                                    <h1>Get a new wallet</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-features section bg-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-8 offset-lg-2 col-sm-12">
                                <div className="card">
                                    <div className="card-body">
                                        {(this.state.step === 1) ? this.renderStepOne() : this.renderStepTwo()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </React.Fragment>
        );
    }
};

const matchStateToProps = state => {
    return {};
};

export default connect(
    matchStateToProps,
    {}
)(WalletCreatePage);
