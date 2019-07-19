import React, { Component } from 'react';
import {dispatchAction} from "../../../../utils/redux";
import {getBlocks} from "../../../../store/actions/blocks";
import {connect} from "react-redux";
import moment from 'moment';
import {NavLink} from "react-router-dom";

type Props = {
    blocks: [],
    error: string,
    loading: boolean
};

type State = { blocks: [] };

class BlocksPage extends Component<Props, State> {
    constructor(props){
        super(props);
        this.state = {
            blocks: null,
            totalHeight: 0,
            minHeight: 0,
            maxHeight: 0,
        }
    }

    componentDidMount(): void {
        dispatchAction(getBlocks());
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.blocks !== null){
            this.setState({
                blocks: nextProps.blocks
            });
        }
    }

    render() {
        if(this.props.loading || this.state.blocks === null){
            return null;
        }

        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Blocks</h1>
                                </div>
                                <div className="offset-lg-3 col-lg-6">
                                    <p>Block <b>#{this.state.blocks[this.state.blocks.length - 1].height}</b> to <b>#{this.state.blocks[0].height}</b> (Total of <b>{this.state.blocks[0].height}</b> blocks)</p>
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
                                    <table className="table table-striped table-latests">
                                        <thead>
                                            <tr>
                                                <td className="text-center">Height</td>
                                                <td className="text-center">Time</td>
                                                <td className="text-center">Age</td>
                                                <td className="text-center">Transactions</td>
                                                <td className="text-center">Proposer</td>
                                                <td className="text-center">Fees</td>
                                                <td className="text-center"></td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.blocks.map((elem, index)=>{
                                                const url = `/block/${elem.height}`;
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{elem.height}</td>
                                                        <td className="text-center">{moment(elem.dispatched_at).format('MM-DD-YYYY HH:mm:ss')}</td>
                                                        <td className="text-center">{moment(elem.dispatched_at).fromNow()}</td>
                                                        <td className="text-center">{elem.num_txs}</td>
                                                        <td className="text-center">{elem.proposer_address || ''}</td>
                                                        <td className="text-center">0</td>
                                                        <td className="text-center">
                                                            <NavLink className="btn btn-xsm btn-primary" to={url}>
                                                                <i className="fa fa-eye text-white"/>
                                                            </NavLink>
                                                        </td>
                                                    </tr>
                                                )
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
        blocks: state.blocks.data,
        error: state.blocks.error,
        loading: state.blocks.loading
    };
};

export default connect(
    matchStateToProps,
    { getBlocks }
)(BlocksPage);
