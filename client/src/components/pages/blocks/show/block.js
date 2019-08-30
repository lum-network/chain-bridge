import React, { Component } from 'react';
import {dispatchAction} from "../../../../utils/redux";
import {getBlock} from "../../../../store/actions/blocks";
import {connect} from "react-redux";
import TransactionsListComponent from "../../../parts/TransactionsList";
import {NavLink} from "react-router-dom";

type Props = {
    block: {},
    error: string,
    loading: boolean
};

type State = { block: {} };

class BlockShowPage extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            block: null
        };
    }

    componentDidMount(): void {
        dispatchAction(getBlock(this.props.match.params.blockId));
    }

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.block !== null){
            this.setState({block: nextProps.block});
        }
    }

    renderBlock(){
        if(this.state.block === null){
            return null;
        }

        return (
            <React.Fragment>
                <div className="row m-bottom-30">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Header</h5>
                                <hr/>
                                <table className="table table-latests table-detail table-no-border">
                                    <tbody>
                                        <tr>
                                            <td><strong>Block Height</strong></td>
                                            <td>{this.state.block.height}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Block Hash</strong></td>
                                            <td>{this.state.block.hash}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Chain ID</strong></td>
                                            <td>{this.state.block.chain_id}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Timestamp</strong></td>
                                            <td>{this.state.block.dispatched_at}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Proposed By</strong></td>
                                            <td><NavLink to={`/validator/${this.state.block.proposer_address}`}>{this.state.block.proposer_address}</NavLink></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Transactions in the block</strong></td>
                                            <td>{this.state.block.num_txs}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Transactions since Genesis</strong></td>
                                            <td>{this.state.block.total_txs}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Transactions</h5>
                                <div className="table-responsive">
                                    <TransactionsListComponent transactions={this.state.block.transactions}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                                    <h1>Block Details</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        {this.renderBlock()}
                    </div>
                </section>
            </React.Fragment>
        );
    }

}

const matchStateToProps = state => {
    return {
        block: state.blocks.data,
        error: state.blocks.error,
        loading: state.blocks.loading
    };
};

export default connect(
    matchStateToProps,
    { getBlock }
)(BlockShowPage);

