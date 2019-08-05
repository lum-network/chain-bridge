import React, { Component } from 'react';
import EllipsisText from "react-ellipsis-text";
import moment from "moment";
import {NavLink} from "react-router-dom";

export default class TransactionsListComponent extends Component {
    render() {
        return (
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
                {this.props.transactions && this.props.transactions.map && this.props.transactions.map((elem, index)=>{
                    const url = `/transaction/${elem.hash}`;
                    return (
                        <tr key={index}>
                            <td className="text-center"><EllipsisText text={elem.hash} length={20}/></td>
                            <td className="text-center">
                                {
                                    (elem.success)
                                        ? <span className="badge badge-success">Success</span>
                                        : <span className="badge badge-danger">Error</span>
                                }
                            </td>
                            <td className="text-center">{elem.action}</td>
                            <td className="text-center">{elem.height}</td>
                            <td className="text-center">{moment(elem.created_at).fromNow()}</td>
                            <td className="text-center">
                                <EllipsisText text={elem.from_address || 'Unknown'} length={20}/>
                            </td>
                            <td className="text-center">
                                <EllipsisText text={elem.to_address || 'Unknown'} length={20}/>
                            </td>
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
        );
    }
}
