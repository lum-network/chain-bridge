import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import sandblockLogo from '../../assets/images/logos/sat_logo_title_white.svg';
import sandblockLogoBlack from '../../assets/images/logos/sat_logo_title_black.svg';
import $ from 'jquery';


class Layout extends Component {

    onResize(): void {
        const width = $(window).width();
        if(width > 991) {
            const scroll = $(window).scrollTop();
            if (scroll >= 30) {
                $(".header-area").addClass("header-sticky");
                $(".header-area .dark-logo").css('display', 'block');
                $(".header-area .light-logo").css('display', 'none');
            } else {
                $(".header-area").removeClass("header-sticky");
                $(".header-area .dark-logo").css('display', 'none');
                $(".header-area .light-logo").css('display', 'block');
            }
        }
    }

    componentDidMount(): void {
        if ($('.menu-trigger').length) {
            $('.menu-trigger').click(function() {
                $(this).toggleClass('active');
                $('.header-area .nav').slideToggle(200);
            });
        }

        window.addEventListener('resize', this.onResize);
        this.onResize();
    }

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
                                        <img src={sandblockLogoBlack} className="dark-logo" alt="Sandblock"/>
                                    </NavLink>
                                    <ul className="nav">
                                        <li><NavLink to="/home">HOME</NavLink></li>
                                        <li><NavLink to="/blocks">BLOCKS</NavLink></li>
                                        <li><NavLink to="/transactions">TRANSACTIONS</NavLink></li>
                                        <li><NavLink to="/validators">VALIDATORS</NavLink></li>
                                        <li><NavLink to="/migration">MIGRATION</NavLink></li>
                                        <li><NavLink to="/wallet">WALLET</NavLink></li>
                                        <li><a href="https://sandblock.io" target="_blank" rel="noopener noreferrer">ABOUT</a></li>
                                    </ul>
                                    <button className='menu-trigger'>
                                        <span>Menu</span>
                                    </button>
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
