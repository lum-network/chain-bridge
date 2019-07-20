import React, { Component } from 'react';
import {dispatchAction} from "../../../../utils/redux";
import {listTransactions} from "../../../../store/actions/transactions";
import {connect} from "react-redux";
import TransactionsListComponent from "../../../parts/TransactionsList";

type Props = {
    transactions: [],
    error: string,
    loading: boolean
};

type State = { transactions: [] };

class TransactionsListPage extends Component<Props, State> {
    constructor(props){
        super(props);
        this.state = {
            transactions: null
        }
    }

    componentDidMount(): void {
        dispatchAction(listTransactions());
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.transactions !== null){
            this.setState({
                transactions: nextProps.transactions
            });
        }
    }

    render(){
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Transactions</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                    <p>Latest 50 transactions of the network</p>
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
                                    <TransactionsListComponent transactions={this.state.transactions}/>
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
        transactions: state.transactions.data,
        error: state.transactions.error,
        loading: state.transactions.loading
    };
};

export default connect(
    matchStateToProps,
    { listTransactions }
)(TransactionsListPage);

