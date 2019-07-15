import React, { Component } from 'react';
import {dispatchAction} from "../../../../utils/redux";
import {getBlocks} from "../../../../store/actions/blocks";
import {connect} from "react-redux";
import moment from 'moment';

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
                totalHeight: nextProps.blocks.last_height,
                blocks: nextProps.blocks.block_metas,
                maxHeight: nextProps.blocks.block_metas[0].header.height,
                minHeight: nextProps.blocks.block_metas[nextProps.blocks.block_metas.length - 1].header.height
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
                                    <p>Block <b>#{this.state.minHeight}</b> to <b>#{this.state.maxHeight}</b> (Total of <b>{this.state.totalHeight}</b> blocks)</p>
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.blocks.map((elem, index)=>{
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{elem.header.height}</td>
                                                        <td className="text-center">{moment(elem.header.time).format('MM-DD-YYYY HH:mm:ss')}</td>
                                                        <td className="text-center">{moment(elem.header.time).fromNow()}</td>
                                                        <td className="text-center">{elem.header.num_txs}</td>
                                                        <td className="text-center">{elem.header.proposer_address}</td>
                                                        <td className="text-center">{elem.header.height}</td>
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
