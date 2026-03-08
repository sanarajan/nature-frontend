import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../../assets/images/logo.png';
import CartSidebar from '../CartSidebar/CartSidebar';
import SearchSidebar from '../SearchSidebar/SearchSidebar';
import userApiClient from '../../services/userApiClient';
import { userAuthService } from '../../services/user/userAuthService';

const Header: React.FC = () => {
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Only Home page (/) gets the transparent header
    const isHome = location.pathname === '/';

    const [activeTab, setActiveTab] = useState<'cart' | 'wishlist'>('cart');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user_accessToken'));
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    // Close mobile nav when a link is clicked
    const closeNavbar = () => {
        const navEl = document.getElementById('navbarNavDropdown');
        if (navEl && navEl.classList.contains('show')) {
            const bsCollapse = (window as any).bootstrap?.Collapse?.getInstance(navEl);
            if (bsCollapse) {
                bsCollapse.hide();
            } else {
                navEl.classList.remove('show');
                const toggler = document.querySelector('.navbar-toggler');
                if (toggler) toggler.classList.add('collapsed');
            }
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsHeaderSticky(true);
            } else {
                setIsHeaderSticky(false);
            }
        };

        const checkLogin = () => {
            setIsLoggedIn(!!localStorage.getItem('user_accessToken'));
        };

        const updateCartCount = async () => {
            const token = localStorage.getItem('user_accessToken');
            if (token) {
                try {
                    const cartRes = await userApiClient.get('/user/cart');
                    if (cartRes.data.success && cartRes.data.data) {
                        setCartCount(cartRes.data.data.products?.length || 0);
                    }
                } catch (e) { }
            } else {
                const localCartStr = localStorage.getItem('offlineCart');
                if (localCartStr) {
                    try {
                        const items = JSON.parse(localCartStr);
                        setCartCount(Array.isArray(items) ? items.length : 0);
                    } catch (e) { setCartCount(0); }
                } else {
                    setCartCount(0);
                }
            }
        };

        const updateWishlistCount = async () => {
            const token = localStorage.getItem('user_accessToken');
            if (token) {
                try {
                    const res = await userApiClient.get('/user/wishlist');
                    if (res.data.success) {
                        setWishlistCount(res.data.data?.length || 0);
                    }
                } catch (e) { }
            } else {
                const localWishStr = localStorage.getItem('offlineWishlist');
                if (localWishStr) {
                    try {
                        const items = JSON.parse(localWishStr);
                        setWishlistCount(Array.isArray(items) ? items.length : 0);
                    } catch (e) { setWishlistCount(0); }
                } else {
                    setWishlistCount(0);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('storage', checkLogin);
        window.addEventListener('cart-updated', updateCartCount);
        window.addEventListener('wishlist-updated', updateWishlistCount);
        updateCartCount();
        updateWishlistCount();

        // Interval check for login state (since storage event only works across tabs)
        const interval = setInterval(() => {
            checkLogin();
        }, 1000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', checkLogin);
            window.removeEventListener('cart-updated', updateCartCount);
            window.removeEventListener('wishlist-updated', updateWishlistCount);
            clearInterval(interval);
        };
    }, []);

    const confirmLogout = () => {
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center' }}>
                    <h6 style={{ marginBottom: '15px' }}>Are you sure you want to log out?</h6>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button
                            onClick={() => {
                                handleLogout();
                                closeToast();
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '8px 20px' }}>
                            Yes
                        </button>
                        <button
                            onClick={closeToast as React.MouseEventHandler<HTMLButtonElement>}
                            className="btn btn-outline-secondary btn-sm"
                            style={{ padding: '8px 20px' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
            }
        );
    };

    const handleLogout = async () => {
        try {
            await userAuthService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        }
        localStorage.removeItem('user_accessToken');
        localStorage.removeItem('user_data');
        setIsLoggedIn(false);
        navigate('/login');
        toast.success("Successfully logged out", { position: "top-right", autoClose: 3000 });
    };

    return (
        <header className={`site-header mo-left header style-1${isHome ? ' header-transparent' : ''}`}>
            {/* Main Header */}
            <div className={`sticky-header main-bar-wraper navbar-expand-lg ${isHeaderSticky ? 'is-fixed' : ''}`}>
                <div className="main-bar clearfix">
                    <div className="container-fluid clearfix d-lg-flex d-block">
                        {/* Website Logo */}
                        <div className="logo-header logo-dark me-md-4">
                            <Link to="/"><img src={logo} alt="logo" /></Link>
                        </div>

                        {/* Nav Toggle Button */}
                        <button className="navbar-toggler collapsed navicon justify-content-end" type="button"
                            data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown"
                            aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>

                        {/* Main Nav */}
                        <div className="header-nav navbar-collapse collapse justify-content-start" id="navbarNavDropdown">
                            <div className="logo-header logo-dark">
                                <Link to="/"><img src={logo} alt="" /></Link>
                            </div>
                            <ul className="nav navbar-nav dark-nav">
                                <li className="has-mega-menu sub-menu-down">
                                    <Link to="/" onClick={closeNavbar}><span>Home</span></Link>
                                </li>
                                <li className="has-mega-menu sub-menu-down">
                                    <Link to="/shop" onClick={closeNavbar}><span>Shop</span></Link>
                                </li>
                                <li className="has-mega-menu sub-menu-down">
                                    <Link to="/offers" onClick={closeNavbar}><span>Offers</span></Link>
                                </li>
                                <li className="has-mega-menu sub-menu-down">
                                    <Link to="/about" onClick={closeNavbar}><span>About Us</span></Link>
                                </li>
                                <li className="has-mega-menu sub-menu-down">
                                    <Link to="/contact" onClick={closeNavbar}><span>Contact</span></Link>
                                </li>
                            </ul>
                        </div>

                        {/* EXTRA NAV */}
                        <div className="extra-nav">
                            <div className="extra-cell">
                                <ul className="header-right">
                                    {/* Search icon */}
                                    <li className="nav-item search-link">
                                        <a className="nav-link" href="javascript:void(0);" data-bs-toggle="offcanvas"
                                            data-bs-target="#offcanvasTop" aria-controls="offcanvasTop"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                                                viewBox="0 0 20 20" fill="none">
                                                <path
                                                    d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
                                                    stroke="#24262B" strokeWidth="1.5" strokeLinecap="round"
                                                    strokeLinejoin="round" />
                                                <path d="M17.5 17.5L13.875 13.875" stroke="#24262B" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </a>
                                    </li>
                                    {/* Wishlist icon */}
                                    <li className="nav-item wishlist-link" onClick={() => setActiveTab('wishlist')}>
                                        <a href="javascript:void(0);" className="nav-link"
                                            data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight"
                                            aria-controls="offcanvasRight"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M2.39387 10.053C1.49971 7.2613 2.54471 4.07046 5.47554 3.1263C7.01721 2.6288 8.71887 2.92213 10.0005 3.8863C11.213 2.9488 12.9772 2.63213 14.5172 3.1263C17.448 4.07046 18.4997 7.2613 17.6064 10.053C16.2147 14.478 10.0005 17.8863 10.0005 17.8863C10.0005 17.8863 3.83221 14.5296 2.39387 10.053Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            {wishlistCount > 0 && (
                                                <span className="badge badge-circle" style={{
                                                    position: 'absolute',
                                                    top: '0',
                                                    right: '0',
                                                    background: '#0D775E',
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    padding: '2px 5px',
                                                    borderRadius: '50%',
                                                    fontWeight: 'bold',
                                                    minWidth: '18px',
                                                    height: '18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transform: 'translate(50%, -50%)'
                                                }}>
                                                    {wishlistCount}
                                                </span>
                                            )}
                                        </a>
                                    </li>
                                    {/* User icon / Profile Dropdown */}
                                    <li className="nav-item wishlist-link dropdown">
                                        {isLoggedIn ? (
                                            <>
                                                <a className="nav-link" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 20 20" fill="none">
                                                        <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" stroke="#24262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M17 17C17 14.2386 13.866 12 10 12C6.13401 12 3 14.2386 3 17" stroke="#24262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </a>
                                                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-3"
                                                    aria-labelledby="profileDropdown"
                                                    style={{
                                                        borderRadius: '15px',
                                                        minWidth: '180px',
                                                        overflow: 'hidden',
                                                        padding: '10px 0',
                                                        backgroundColor: '#ffffff'
                                                    }}
                                                >
                                                    <li>
                                                        <Link className="dropdown-item px-4 py-3 d-flex align-items-center" to="/account" style={{ fontSize: '15px', fontWeight: '600', color: '#333', transition: 'all 0.3s' }}>
                                                            <i className="fa-regular fa-user me-3" style={{ color: '#0D775E' }}></i>
                                                            Profile
                                                        </Link>
                                                    </li>
                                                    <li className="border-top my-1" style={{ borderColor: '#f1f1f1 !important' }}></li>
                                                    <li>
                                                        <button
                                                            className="dropdown-item px-4 py-3 d-flex align-items-center text-danger"
                                                            onClick={confirmLogout}
                                                            style={{ fontSize: '15px', fontWeight: '600', transition: 'all 0.3s' }}
                                                        >
                                                            <i className="fa-solid fa-arrow-right-from-bracket me-3"></i>
                                                            Logout
                                                        </button>
                                                    </li>
                                                </ul>
                                            </>
                                        ) : (
                                            <Link className="nav-link" to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 20 20" fill="none">
                                                    <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" stroke="#24262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M17 17C17 14.2386 13.866 12 10 12C6.13401 12 3 14.2386 3 17" stroke="#24262B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </Link>
                                        )}
                                    </li>
                                    {/* Cart icon */}
                                    <li className="nav-item cart-link" onClick={() => setActiveTab('cart')}>
                                        <a href="javascript:void(0);" className="nav-link cart-btn"
                                            data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight"
                                            aria-controls="offcanvasRight"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                                                viewBox="0 0 20 20" fill="none">
                                                <g clipPath="url(#clip0_67_234)">
                                                    <path
                                                        d="M7.49984 18.3334C7.96007 18.3334 8.33317 17.9603 8.33317 17.5001C8.33317 17.0398 7.96007 16.6667 7.49984 16.6667C7.0396 16.6667 6.6665 17.0398 6.6665 17.5001C6.6665 17.9603 7.0396 18.3334 7.49984 18.3334Z"
                                                        stroke="#24262B" strokeWidth="1.5" strokeLinecap="round"
                                                        strokeLinejoin="round"></path>
                                                    <path
                                                        d="M16.6668 18.3334C17.1271 18.3334 17.5002 17.9603 17.5002 17.5001C17.5002 17.0398 17.1271 16.6667 16.6668 16.6667C16.2066 16.6667 15.8335 17.0398 15.8335 17.5001C15.8335 17.9603 16.2066 18.3334 16.6668 18.3334Z"
                                                        stroke="#24262B" strokeWidth="1.5" strokeLinecap="round"
                                                        strokeLinejoin="round"></path>
                                                    <path
                                                        d="M0.833496 0.833252H4.16683L6.40016 11.9916C6.47637 12.3752 6.68509 12.7199 6.98978 12.9652C7.29448 13.2104 7.67575 13.3407 8.06683 13.3333H16.1668C16.5579 13.3407 16.9392 13.2104 17.2439 12.9652C17.5486 12.7199 17.7573 12.3752 17.8335 11.9916L19.1668 4.99992H5.00016"
                                                        stroke="#24262B" strokeWidth="1.5" strokeLinecap="round"
                                                        strokeLinejoin="round"></path>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_67_234">
                                                        <rect width="20" height="20" fill="white"></rect>
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                            <span className="badge badge-primary" style={{ position: 'absolute', top: '0', right: '0', padding: '2px 5px', fontSize: '10px', borderRadius: '50%' }}>{cartCount}</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <a className="extra-right-btn menu-btn" href="javascript:void(0);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="13" viewBox="0 0 30 13"
                                fill="none">
                                <rect y="11" width="30" height="2" fill="black" />
                                <rect width="30" height="2" fill="black" />
                            </svg>
                        </a>
                    </div>
                </div >
            </div >
            {/* Sidebar Components */}
            < CartSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <SearchSidebar />
        </header >
    );
};

export default Header;
