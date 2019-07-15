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
                                                <td>{this.state.account.account.value.public_key.value}</td>
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
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="table-responsive">
                                    <table className="table table-striped table-latests">
                                        <thead>
                                        <tr>
                                            <th>Hash</th>
                                            <th>Block</th>
                                            <th>Date/Time</th>
                                            <th>Amount</th>
                                            <th>Balance</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>d3e4f72db22777a3</td>
                                            <td>1863796</td>
                                            <td>2018-04-13 10:14:27</td>
                                            <td><span className="red">- 99,999<small>.99</small> ARD</span></td>
                                            <td>8,355,004
                                                <small>.71</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>29a7e2f30d424248</td>
                                            <td>1862732</td>
                                            <td>2018-04-12 14:16:54</td>
                                            <td><span className="red">- 99,999<small>.99</small> ARD</span></td>
                                            <td>8,455,004
                                                <small>.7</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>2f04876ba83f63d6</td>
                                            <td>1837529</td>
                                            <td>2018-03-23 22:12:16</td>
                                            <td><span className="green">+ 99,999<small>.99</small> ARD</span></td>
                                            <td>8,555,004
                                                <small>.69</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>24dadeea863c4cb6</td>
                                            <td>1837516</td>
                                            <td>2018-03-23 21:59:47</td>
                                            <td><span className="green">+ 99,999<small>.99</small> ARD</span></td>
                                            <td>8,455,004
                                                <small>.7</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>6c1f51ee1782f1de</td>
                                            <td>1801648</td>
                                            <td>2018-02-24 23:32:49</td>
                                            <td><span className="red">- 70,001<small>.99</small> ARD</span></td>
                                            <td>8,355,004
                                                <small>.71</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>35689f91f9a389fa</td>
                                            <td>1766980</td>
                                            <td>2018-01-30 03:42:33</td>
                                            <td><span className="red">- 299,999<small>.99</small> ARD</span></td>
                                            <td>8,425,006
                                                <small>.7</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>459f7bd610f62f8e</td>
                                            <td>1744792</td>
                                            <td>2018-01-13 16:52:33</td>
                                            <td><span className="red">- 79,999<small>.99</small> ARD</span></td>
                                            <td>8,725,006
                                                <small>.69</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>33d333ed27d8585c</td>
                                            <td>1711392</td>
                                            <td>2017-12-20 01:23:30</td>
                                            <td><span className="red">- 499,999<small>.99</small> ARD</span></td>
                                            <td>8,805,006
                                                <small>.68</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>ef89f28eacd70b95</td>
                                            <td>1711220</td>
                                            <td>2017-12-19 22:20:29</td>
                                            <td><span className="red">- 169,999<small>.99</small> ARD</span></td>
                                            <td>9,305,006
                                                <small>.67</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>3ae2012fac36f081</td>
                                            <td>1705263</td>
                                            <td>2017-12-15 12:55:55</td>
                                            <td><span className="red">- 159,999<small>.99</small> ARD</span></td>
                                            <td>9,475,006
                                                <small>.66</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>ec630c5de5ccbdaf</td>
                                            <td>1685058</td>
                                            <td>2017-11-30 13:14:24</td>
                                            <td><span className="red">- 399,999<small>.99</small> ARD</span></td>
                                            <td>9,635,006
                                                <small>.65</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>a3db0f84e058175c</td>
                                            <td>1664298</td>
                                            <td>2017-11-15 01:10:22</td>
                                            <td><span className="red">- 600,001<small>.99</small> ARD</span></td>
                                            <td>10,035,006
                                                <small>.64</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>2cf97e2c61e7a1a7</td>
                                            <td>1644648</td>
                                            <td>2017-10-31 00:48:40</td>
                                            <td><span className="red">- 99,999<small>.99</small> ARD</span></td>
                                            <td>10,635,008
                                                <small>.63</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>88f82cf57bf61a8d</td>
                                            <td>1632389</td>
                                            <td>2017-10-21 17:01:49</td>
                                            <td><span className="green">+ 79,999<small>.99</small> ARD</span></td>
                                            <td>10,735,008
                                                <small>.62</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>574d2191cc0514ab</td>
                                            <td>1632387</td>
                                            <td>2017-10-21 17:00:20</td>
                                            <td><span className="green">+ 299,999<small>.99</small> ARD</span></td>
                                            <td>10,655,008
                                                <small>.63</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>d737aee6f7bd32bf</td>
                                            <td>1630884</td>
                                            <td>2017-10-20 14:20:22</td>
                                            <td><span className="green">+ 169,999<small>.99</small> ARD</span></td>
                                            <td>10,355,008
                                                <small>.64</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>fc1d953a47e30f5f</td>
                                            <td>1628746</td>
                                            <td>2017-10-18 23:59:21</td>
                                            <td><span className="green">+ 159,999<small>.99</small> ARD</span></td>
                                            <td>10,185,008
                                                <small>.65</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>31086ded676a6e1c</td>
                                            <td>1628740</td>
                                            <td>2017-10-18 23:57:52</td>
                                            <td><span className="green">+ 2,099,999<small>.99</small> ARD</span></td>
                                            <td>10,025,008
                                                <small>.66</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>8dbfc3d0c5a22ea5</td>
                                            <td>1626679</td>
                                            <td>2017-10-17 10:43:17</td>
                                            <td><span className="red">- 700,000<small>.0</small> ARD</span></td>
                                            <td>7,925,008
                                                <small>.67</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>77c39582662734b2</td>
                                            <td>1602704</td>
                                            <td>2017-09-28 22:07:41</td>
                                            <td><span className="green">+ 700,000<small>.0</small> ARD</span></td>
                                            <td>8,625,008
                                                <small>.67</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>0cfe0329984af3a9</td>
                                            <td>1602668</td>
                                            <td>2017-09-28 21:32:08</td>
                                            <td><span className="red">- 10<small>.0</small> ARD</span></td>
                                            <td>7,925,008
                                                <small>.67</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>241e20def07426c6</td>
                                            <td>1594640</td>
                                            <td>2017-09-22 21:24:25</td>
                                            <td><span className="green">+ 10<small>.0</small> ARD</span></td>
                                            <td>7,925,018
                                                <small>.67</small>
                                                ARD
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>3cc8be1caadd24f1</td>
                                            <td>1593981</td>
                                            <td>2017-09-22 09:31:09</td>
                                            <td><span className="green">+ 359,999<small>.99</small> ARD</span></td>
                                            <td>7,925,008
                                                <small>.67</small>
                                                ARD
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
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
        account: state.accounts.data,
        error: state.accounts.error,
        loading: state.accounts.loading
    };
};

export default connect(
    matchStateToProps,
    { getAccount }
)(AddressShowPage);

