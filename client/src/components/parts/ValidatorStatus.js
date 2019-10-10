import React from 'react';

export default class ValidatorStatus extends React.Component {
    render() {
        if(this.props.jailed === null || this.props.status === null){
            return null;
        }

        if(this.props.jailed){
            return (<span className="badge badge-danger"><i className="text-white fa fa-lock"/> Jailed</span>)
        }
        switch(this.props.status){
            case 0:
                return (<span className="badge badge-danger"><i className="text-white fa-cross"/> Unbounded</span>);

            case 1:
                return (<span className="badge badge-warning"><i className="text-white fa-warning"/> Unbounding</span>);

            case 2:
                return (<span className="badge badge-success"><i className="text-white fa fa-check"/> Active</span>);

            default:
                return this.props.status;
        }
    }
}
