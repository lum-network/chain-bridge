import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import sandblockLogo from '../../assets/images/logos/sandblock.png';

class Layout extends Component {
    render() {
        return (
            <React.Fragment>
                <header className="header-area">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <nav className="main-nav">
                                    <a href="index.html" className="logo">
                                        <img src={sandblockLogo} className="light-logo" alt="Sandblock"/>
                                        <img src={sandblockLogo} className="dark-logo" alt="Sandblock"/>
                                    </a>
                                    <ul className="nav">
                                        <li><NavLink to="/home">HOME</NavLink></li>
                                        <li><NavLink to="/blocks">BLOCKS</NavLink></li>
                                        <li><NavLink to="/validators">VALIDATORS</NavLink></li>
                                        <li><NavLink to="/proposals">PROPOSALS</NavLink></li>
                                    </ul>
                                    <a className='menu-trigger'>
                                        <span>Menu</span>
                                    </a>
                                </nav>
                            </div>
                        </div>
                    </div>
                </header>
                {this.props.children}
                <footer id="contact">
                    <div className="footer-bottom slim">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-12">
                                    <p className="copyright">Made with <i className="fa fa-heart"/> in Paris </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </React.Fragment>
        )
    }
}

export default Layout;
