import React, { Component } from 'react';
import {connect} from "react-redux";
import {search} from "../../../store/actions/search";
import {dispatchAction} from "../../../utils/redux";

type Props = {
    result: {},
    error: string,
    loading: boolean
};

type State = { result: {} };

class SearchPage extends Component {
    constructor(props){
        super(props);
        this.state = {
            result: null,
            loading: true
        }
    }

    componentDidMount(): void {
        const { data } = this.props.match.params;
        dispatchAction(search(data));
    }

    async componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
        await this.setState({
            loading: nextProps.loading,
            result: nextProps.result
        });

        if(nextProps.loading === false && nextProps.error === null && nextProps.result !== null){
            switch(this.state.result.type)
            {
                case "block":
                    return this.props.history.push(`/block/${this.state.result.data}`);

                case "transaction":
                    return this.props.history.push(`/transaction/${this.state.result.data}`);

                case "account":
                    return this.props.history.push(`/account/${this.state.result.data}`);
            }
        }
    }

    render() {
        return (
            <React.Fragment>
                <section className="block-explorer-wrapper bg-bottom-center" id="welcome-1">
                    <div className="block-explorer text">
                        <div className="container text-center">
                            <div className="row">
                                <div className="col-lg-12 align-self-center">
                                    <h1>Search</h1>
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
                                    <h2 className="section-title">No result found for the data <i>{this.props.match.params.data}</i></h2>
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
        result: state.search.data,
        error: state.search.error,
        loading: state.search.loading
    };
};

export default connect(
    matchStateToProps,
    { search }
)(SearchPage);
