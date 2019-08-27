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

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.transactions !== null){
            this.setState({
                transactions: nextProps.transactions
            });
        }
    }

    renderHeader(){
        return (
            <div className="row">
                <div className="col-lg-12 align-self-center">
                    <h1>Transactions</h1>
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
                            {this.renderHeader()}
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-body">
                                        <TransactionsListComponent transactions={this.state.transactions}/>
                                    </div>
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

