import React, { Component } from 'react';
import {dispatchAction} from "../../../../utils/redux";
import {getBlocks} from "../../../../store/actions/blocks";
import {connect} from "react-redux";
import moment from 'moment-timezone';
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
        moment.tz.setDefault('Europe/Paris');
        dispatchAction(getBlocks());
    }

    async UNSAFE_componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        if(nextProps.blocks !== null){
            await this.setState({
                blocks: nextProps.blocks
            });
            if(this.state.blocks !== null && this.state.blocks.length > 1){
                this.setState({
                    minHeight: nextProps.blocks[nextProps.blocks.length - 1].height,
                    maxHeight: nextProps.blocks[0].height,
                    totalHeight: nextProps.blocks[0].height
                })
            }
        }
    }

    renderBlocks(){
        if(this.state.blocks === undefined){
            return null;
        }

        return (
            <table className="table table-no-border table-latests">
                <thead>
                    <tr>
                        <th className="text-center">Height</th>
                        <th className="text-center">Time</th>
                        <th className="text-center">Age</th>
                        <th className="text-center">Transactions</th>
                        <th className="text-center">Proposer</th>
                        <th className="text-center">Fees</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.blocks !== null && this.state.blocks.map((elem, index)=>{
                        const url = `/block/${elem.height}`;
                        return (
                            <tr key={index}>
                                <td className="text-center">
                                    <NavLink to={url} >
                                        {elem.height}
                                    </NavLink>
                                </td>
                                <td className="text-center">{moment(elem.dispatched_at).format('MM-DD-YYYY HH:mm:ss')}</td>
                                <td className="text-center">{moment(elem.dispatched_at).fromNow()}</td>
                                <td className="text-center">{elem.num_txs}</td>
                                <td className="text-center">{elem.proposer_address || ''}</td>
                                <td className="text-center">0</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        );
    }

    renderHeader(){
        return (
            <div className="row">
                <div className="col-lg-12 align-self-center">
                    <h1>Blocks</h1>
                </div>
                <div className="offset-lg-3 col-lg-6">
                    <p>Block <b>#{this.state.minHeight}</b> to <b>#{this.state.maxHeight}</b> (Total of <b>{this.state.totalHeight}</b> blocks)</p>
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
                                        <div className="table-responsive">
                                            {this.renderBlocks()}
                                        </div>
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
        blocks: state.blocks.data,
        error: state.blocks.error,
        loading: state.blocks.loading
    };
};

export default connect(
    matchStateToProps,
    { getBlocks }
)(BlocksPage);
