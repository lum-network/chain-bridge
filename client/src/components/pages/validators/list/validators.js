import React  from 'react';
import {dispatchAction} from "../../../../utils/redux";
import {connect} from "react-redux";
import {getValidators} from "../../../../store/actions/validators";
import {NavLink} from "react-router-dom";

type Props = {
    validators: [],
    error: string,
    loading: boolean
};

type State = { validators: [], height: number};

class ValidatorsPage extends React.Component<Props, State> {
    constructor(props: Props){
        super(props);

        this.state = {
            validators: [],
            height: 0
        }

        dispatchAction(getValidators());
    }

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        if(nextProps.validators !== null) {
            this.setState({validators: nextProps.validators.result, height: nextProps.validators.height});
        }
    }

    renderHeader(){
        return (
            <div className="row">
                <div className="col-lg-12 align-self-center">
                    <h1>Active Validators</h1>
                </div>
                <div className="offset-lg-3 col-lg-6">
                    <p></p>
                </div>
            </div>
        );
    }

    renderValidators(){
        if(this.state.validators === undefined){
            return null;
        }

        return (
            <table className="table table-no-border table-latests">
                <thead>
                    <tr>
                        <th className="text-center">Moniker</th>
                        <th className="text-center">Voting Power</th>
                        <th className="text-center">Commissions</th>
                        <th className="text-center">Tokens</th>
                        <th className="text-center">Jailed</th>
                        <th className="text-center">See</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.validators !== null && this.state.validators.map((elem, index)=> {
                        const url = `/validator/${elem.operator_address}`;
                        return (
                            <tr key={index}>
                                <td className="text-center">{elem.description.identity || elem.description.moniker}</td>
                                <td className="text-center">{Number(elem.delegator_shares).toFixed(0)}</td>
                                <td className="text-center">{Number(elem.commission.commission_rates.rate).toPrecision(2) * 100} %</td>
                                <td className="text-center">{elem.tokens} SBC</td>
                                <td className="text-center">{(elem.jailed) ? 'Yes' : 'No'}</td>
                                <td className="text-center">
                                    <NavLink className="btn btn-xsm btn-primary" to={url} >
                                        <i className="fa fa-eye text-white"/>
                                    </NavLink>
                                </td>
                            </tr>
                        )
                    })}
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
                                            {this.renderValidators()}
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
};

const matchStateToProps = state => {
    return {
        validators: state.validators.data,
        error: state.validators.error,
        loading: state.validators.loading
    };
};

export default connect(
    matchStateToProps,
    { getValidators }
)(ValidatorsPage);

