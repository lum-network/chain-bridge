import React, { Component } from 'react';
import {connect} from "react-redux";
import QRCode from 'qrcode.react';
import {getAccount} from "../../../../store/actions/accounts";
import {dispatchAction} from "../../../../utils/redux";

type Props = {
    account: {},
    error: string,
    loading: boolean
};

type State = { account: {} };

class AddressShowPage extends Component<Props, State> {
    constructor(props){
        super(props);
        this.state = {
            account: null
        }
    }

    componentDidMount(): void {
        dispatchAction(getAccount(this.props.match.params.accountId));
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.account !== null){
            this.setState({account: nextProps.account});
        }
    }

    renderTransactions() {
        return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="table-responsive">
                        <table className="table table-striped table-latests">
                            <thead>
                                <tr>
                                    <th className="text-center">Hash</th>
                                    <th className="text-center">Type</th>
                                    <th className="text-center">Block</th>
                                    <th className="text-center">Age</th>
                                    <th className="text-center">From</th>
                                    <th className="text-center">To</th>
                                    <th className="text-center">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="text-center">d3e4f72db22777a3...</td>
                                    <td className="text-center">Coins Transfer</td>
                                    <td className="text-center">1234</td>
                                    <td className="text-center">A few seconds ago</td>
                                    <td className="text-center">surprise1xr8vqhhvek...</td>
                                    <td className="text-center">surprise1jxwkalwgl8...</td>
                                    <td className="text-center"><span className="red">- 5</span></td>
                                </tr>
                                <tr>
                                    <td className="text-center">29a7e2f30d424248...</td>
                                    <td className="text-center">Branded Token Minting</td>
                                    <td className="text-center">1234</td>
                                    <td className="text-center">10 minutes ago</td>
                                    <td className="text-center">surprise1xr8vqhhvek...</td>
                                    <td className="text-center">surprise1xr8vqhhvek...</td>
                                    <td className="text-center"><span className="green">+ 50</span></td>
                                </tr>
                                <tr>
                                    <td className="text-center">2f04876ba83f63d6...</td>
                                    <td className="text-center">Branded Token Transfer</td>
                                    <td className="text-center">1234</td>
                                    <td className="text-center">1 hour ago</td>
                                    <td className="text-center">surprise1xr8vqhhvek...</td>
                                    <td className="text-center">surprise1jxwkalwgl8...</td>
                                    <td className="text-center"><span className="red">- 10</span></td>
                                </tr>
                                <tr>
                                    <td className="text-center">24dadeea863c4cb6...</td>
                                    <td className="text-center">Branded Token Creation</td>
                                    <td className="text-center">1234</td>
                                    <td className="text-center">1 day ago</td>
                                    <td className="text-center">surprise1xr8vqhhvek...</td>
                                    <td className="text-center">surprise1xr8vqhhvek...</td>
                                    <td className="text-center"><span className="green">+ 1000</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        if(this.props.loading || this.state.account === null){
            return null;
        }

        let coins = [];
        this.state.account.account.value.coins.map((elem, index)=>{
            coins.push(`${elem.amount} ${elem.denom}`);
        });

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
                                    <p>{this.state.account.account.value.address}</p>
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
                            <div className="col-lg-9 col-md-9 col-sm-12">
                                <div className="table-responsive">
                                    <table className="table table-striped table-latests table-detail">
                                        <tbody>
                                            <tr>
                                                <td><strong>Address</strong></td>
                                                <td>{this.state.account.account.value.address}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Public Key</strong></td>
                                                <td>{this.state.account.account.value.public_key && this.state.account.account.value.public_key.value || 'None'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Account Number</strong></td>
                                                <td>{this.state.account.account.value.account_number}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Account Sequence</strong></td>
                                                <td>{this.state.account.account.value.sequence}</td>
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
                                    <QRCode value={"EcGbgDMaxhEhe9spbGjhqAPuWDTcfUopQY"} className="img-fluid d-block mx-auto"/>
                                </div>
                            </div>
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

