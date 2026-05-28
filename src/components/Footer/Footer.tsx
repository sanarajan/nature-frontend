import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import footerImg from '../../assets/images/footer-img.png';
import smallProduct1 from '../../assets/images/shop/product/small/1.png';
import smallProduct2 from '../../assets/images/shop/product/small/2.png';
import smallProduct3 from '../../assets/images/shop/product/small/3.png';

const Footer: React.FC = () => {
    return (
        <footer className="site-footer style-1">
            {/* Footer Top */}
            <div className="footer-top">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-3 col-md-4 col-sm-6 wow fadeInUp" data-wow-delay="0.1s">
                            <div className="widget widget_about me-2">
                                <div className="footer-logo logo-white">
                                    <Link to="/"><img src={logo} alt="" /></Link>
                                </div>
                                <ul className="widget-address">
                                    <li>
                                        <p><span>Address</span> : 22/88 C, NR KAREEKKAD JUMA MASJID, PAYYOLI, KOZHIKODE, KOZHIKODE, KERALA, 673522
</p>
                                    </li>
                                    <li>
                                        <p><span>E-mail</span> : info@naturalayam.com</p>
                                    </li>
                                    <li>
                                        <p><span>Phone</span> : 917902601096
</p>
                                    </li>
                                </ul>
                                <div className="subscribe_widget">
                                    <h6 className="title fw-medium text-capitalize">subscribe to our newsletter</h6>
                                    <form className="dzSubscribe style-1" action="#0" method="post">
                                        <div className="dzSubscribeMsg"></div>
                                        <div className="form-group">
                                            <div className="input-group mb-0">
                                                <input name="dzEmail" required={true} type="email"
                                                    className="form-control" placeholder="Your Email Address" />
                                                <div className="input-group-addon">
                                                    <button name="submit" value="Submit" type="submit" className="btn">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                                            <polyline points="12 5 19 12 12 19"></polyline>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-4 col-sm-6 wow fadeInUp" data-wow-delay="0.2s">
                            <div className="widget widget_post">
                                <h5 className="footer-title">Recent Posts</h5>
                                <ul>
                                    <li>
                                        <div className="dz-media">
                                            <img src={smallProduct1} alt="" />
                                        </div>
                                        <div className="dz-content">
                                            <h6 className="name"><a href="javascript:void(0);">Hydrated Supple Skin</a></h6>
                                            <span className="time">July 23, 2023</span>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="dz-media">
                                            <img src={smallProduct2} alt="" />
                                        </div>
                                        <div className="dz-content">
                                            <h6 className="name"><a href="javascript:void(0);">Glowing Radiant Skin</a></h6>
                                            <span className="time">July 23, 2023</span>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="dz-media">
                                            <img src={smallProduct3} alt="" />
                                        </div>
                                        <div className="dz-content">
                                            <h6 className="name"><a href="javascript:void(0);">Silky Soft Skin</a></h6>
                                            <span className="time">July 23, 2023</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-4 col-sm-4 col-6 wow fadeInUp" data-wow-delay="0.3s">
                            <div className="widget widget_services">
                                <h5 className="footer-title">Our Stores</h5>
                                <ul>
                                    <li><a href="javascript:void(0);">New York</a></li>
                                    <li><a href="javascript:void(0);">London SF</a></li>
                                    <li><a href="javascript:void(0);">Edinburgh</a></li>
                                    <li><a href="javascript:void(0);">Los Angeles</a></li>
                                    <li><a href="javascript:void(0);">Chicago</a></li>
                                    <li><a href="javascript:void(0);">Las Vegas</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-4 col-sm-4 col-6 wow fadeInUp" data-wow-delay="0.4s">
                            <div className="widget widget_services">
                                <h5 className="footer-title">Useful Links</h5>
                                <ul>
                                    <li><a href="javascript:void(0);">Privacy Policy</a></li>
                                    <li><a href="javascript:void(0);">Returns</a></li>
                                    <li><a href="javascript:void(0);">Terms & Conditions</a></li>
                                    <li><a href="javascript:void(0);">Contact Us</a></li>
                                    <li><a href="javascript:void(0);">Latest News</a></li>
                                    <li><a href="javascript:void(0);">Our Sitemap</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-xl-2 col-md-4 col-sm-4 wow fadeInUp" data-wow-delay="0.5s">
                            <div className="widget widget_services">
                                <h5 className="footer-title">Footer Menu</h5>
                                <ul>
                                    <li><a href="javascript:void(0);">Instagram profile</a></li>
                                    <li><a href="javascript:void(0);">New about</a></li>
                                    <li><a href="javascript:void(0);">Woman Dress</a></li>
                                    <li><a href="javascript:void(0);">Contact Us</a></li>
                                    <li><a href="javascript:void(0);">Latest News</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer Top End */}

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <div className="container">
                    <div className="row fb-inner wow fadeInUp" data-wow-delay="0.1s">
                        <div className="col-lg-4 col-md-12 text-start">
    <div className="d-flex align-items-center gap-3 social-icons-footer">
        
        <a
            href="https://www.instagram.com/naturalayam/reels/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
        >
            <i className="fab fa-instagram"></i>
        </a>

        <a
            href="https://www.facebook.com/Naturalayam/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
        >
            <i className="fab fa-facebook-f"></i>
        </a>

        <a
            href="https://www.youtube.com/@Naturalayam"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
        >
            <i className="fab fa-youtube"></i>
        </a>

    </div>
</div>
                        <div className="col-lg-4 col-md-12 text-start">
                            <p className="copyright-text">© <span className="current-year">{new Date().getFullYear()}</span> <a
                                href="https://www.indiankoder.com/">Calicut Web Designer</a> Theme.</p>
                        </div>
                        <div className="col-lg-4 col-md-12 text-end">
                            <div
                                className="d-flex align-items-center justify-content-center justify-content-md-center justify-content-xl-end">
                                <span className="me-3">We Accept: </span>
                                <img src={footerImg} alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer Bottom End */}
        </footer>
    );
};

export default Footer;
