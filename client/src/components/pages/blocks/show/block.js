import React, { Component } from 'react';
import {dispatchAction} from "../../../../utils/redux";
import {getBlock} from "../../../../store/actions/blocks";
import {connect} from "react-redux";
import moment from 'moment';
import EllipsisText from "react-ellipsis-text";
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

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.block !== null){
            this.setState({block: nextProps.block});
        }
    }

    render() {
        if(this.props.loading || this.state.block === null){
            return null;
        }

        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Block Details</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                    <p>Block <b>#{this.props.match.params.blockId}</b></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="block-explorer-section section bg-bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="center-heading">
                                    <h2 className="section-title">General</h2>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="table-responsive">
                                    <table className="table table-striped table-latests table-detail">
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
                                                <td>{this.state.block.proposer_address}</td>
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
                                            <th className="text-center">Hash</th>
                                            <th className="text-center">Status</th>
                                            <th className="text-center">Type</th>
                                            <th className="text-center">Block</th>
                                            <th className="text-center">Age</th>
                                            <th className="text-center">From</th>
                                            <th className="text-center">To</th>
                                            <th className="text-center">Value</th>
                                            <th className="text-center"></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.block.transactions.map((elem, index)=>{
                                                const url = `/transaction/${elem.hash}`;
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center"><EllipsisText text={elem.hash} length={20}/></td>
                                                        <td className="text-center">{elem.success ? 'Success' : 'Error'}</td>
                                                        <td className="text-center">{elem.action}</td>
                                                        <td className="text-center">{elem.height}</td>
                                                        <td className="text-center">{moment(elem.created_at).fromNow()}</td>
                                                        <td className="text-center"><EllipsisText text={elem.from_address || 'Unknown'} length={20}/></td>
                                                        <td className="text-center"><EllipsisText text={elem.to_address || 'Unknown'} length={20}/></td>
                                                        <td className="text-center">{elem.amount || 0}</td>
                                                        <td className="text-center">
                                                            <NavLink className="btn btn-xsm btn-primary" to={url} >
                                                                <i className="fa fa-eye text-white"/>
                                                            </NavLink>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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
        block: state.blocks.data,
        error: state.blocks.error,
        loading: state.blocks.loading
    };
};

export default connect(
    matchStateToProps,
    { getBlock }
)(BlockShowPage);

