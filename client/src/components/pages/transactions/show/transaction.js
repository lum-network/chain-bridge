import React, { Component } from 'react';
import {connect} from "react-redux";
import {getTransaction} from "../../../../store/actions/transactions";
import {dispatchAction} from "../../../../utils/redux";

type Props = {
    transaction: {},
    error: string,
    loading: boolean
};

type State = { transaction: {} };

class TransactionShowPage extends Component<Props, State> {
    constructor(props){
        super(props);
        this.state = {
            transaction: null
        }
    }

    componentDidMount(): void {
        dispatchAction(getTransaction(this.props.match.params.hash));
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.transaction !== null){
            this.setState({transaction: nextProps.transaction});
        }
    }

    renderTransaction(){
        if(this.state.transaction === null || this.props.loading){
            return null;
        }

        return (
            <table className="table table-striped table-latests table-detail">
                <tbody>
                    <tr>
                        <td><strong>Block Height</strong></td>
                        <td>{this.state.transaction.height}</td>
                    </tr>
                    <tr>
                        <td><strong>Transaction Hash</strong></td>
                        <td>{this.state.transaction.hash}</td>
                    </tr>
                    <tr>
                        <td><strong>Status</strong></td>
                        <td>
                            {
                                (this.state.transaction.success)
                                    ? <span className="badge badge-success">Success</span>
                                    : <span className="badge badge-danger">Error</span>
                            }
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Log Output</strong></td>
                        <td>{this.state.transaction.log}</td>
                    </tr>
                    <tr>
                        <td><strong>Timestamp</strong></td>
                        <td>{this.state.transaction.dispatched_at}</td>
                    </tr>
                    <tr>
                        <td><strong>From</strong></td>
                        <td>{this.state.transaction.from_address}</td>
                    </tr>
                    <tr>
                        <td><strong>To</strong></td>
                        <td>{this.state.transaction.to_address}</td>
                    </tr>
                    <tr>
                        <td><strong>Action</strong></td>
                        <td>{this.state.transaction.action}</td>
                    </tr>
                    <tr>
                        <td><strong>Name / Amount</strong></td>
                        <td>{this.state.transaction.name} / {this.state.transaction.amount}</td>
                    </tr>
                    <tr>
                        <td><strong>Gas Wanted</strong></td>
                        <td>{this.state.transaction.gas_wanted}</td>
                    </tr>
                    <tr>
                        <td><strong>Gas Used</strong></td>
                        <td>{this.state.transaction.gas_used}</td>
                    </tr>
                </tbody>
            </table>
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
                                    <h1>Transaction details</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="table-responsive">
                                    {this.renderTransaction()}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </React.Fragment>
        );
    }
}

const matchStateToProps = state => {
    return {
        transaction: state.transactions.data,
        error: state.transactions.error,
        loading: state.transactions.loading
    };
};

export default connect(
    matchStateToProps,
    { getTransaction }
)(TransactionShowPage);

