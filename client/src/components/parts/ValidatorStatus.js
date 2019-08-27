import React from 'react';

export default class ValidatorStatus extends React.Component {
    render() {
        if(!this.props.jailed && !this.props.status){
            return null;
        }

        if(this.props.jailed){
            return (<span className="badge badge-danger"><i className="text-white fa fa-lock"/> Jailed</span>)
        }
        switch(this.props.status){
            case 1:
                return "1 lol";

            case 2:
                return (<span className="badge badge-success"><i className="text-white fa fa-check"/> Active</span>);

            default:
                return this.props.status;
        }
    }
}
