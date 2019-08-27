import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import sandblockLogo from '../../assets/images/logos/sat_logo_title_white.svg';

//                                    <a className='menu-trigger'>
//                                         <span>Menu</span>
//                                     </a>

class Layout extends Component {
    render() {
        return (
            <React.Fragment>
                <header className="header-area">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <nav className="main-nav">
                                    <NavLink to="/home" className="logo">
                                        <img src={sandblockLogo} className="light-logo" alt="Sandblock"/>
                                    </NavLink>
                                    <ul className="nav">
                                        <li><NavLink to="/home">HOME</NavLink></li>
                                        <li><NavLink to="/blocks">BLOCKS</NavLink></li>
                                        <li><NavLink to="/transactions">TRANSACTIONS</NavLink></li>
                                        <li><NavLink to="/validators">VALIDATORS</NavLink></li>
                                        <li><NavLink to="/wallet">WALLET</NavLink></li>
                                        <li><a href="https://sandblock.io" target="_blank" rel="noopener noreferrer">ABOUT</a></li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </header>
                {this.props.children}
            </React.Fragment>
        )
    }
}

export default Layout;
