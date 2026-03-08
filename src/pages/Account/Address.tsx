import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import userApiClient from '../../services/userApiClient';

// Asset Imports
import bg1 from '../../assets/images/background/bg1.jpg';
import profileImgFallback from '../../assets/images/profile4.jpg'; // fallback

const Address: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, data: user } = useSelector((state: RootState) => state.auth.user);

    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('user_accessToken')) {
            navigate('/login');
        } else if (user) {
            if (user.imageUrl) {
                setProfileImage(user.imageUrl);
            }
        }
    }, [isAuthenticated, navigate, user]);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const res = await userApiClient.get('/user/auth/address');
                if (res.data.success) {
                    setAddresses(res.data.data.addresses || []);
                }
            } catch (error) {
                console.error("Failed to fetch addresses", error);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated || localStorage.getItem('user_accessToken')) {
            fetchAddresses();
        }
    }, [isAuthenticated]);

    return (
        <div className="page-content bg-light position-relative">
            {/* Banner Section */}
            <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: `url(${bg1})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>My Account</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item">Account Address</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="content-inner-1">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <aside className="col-xl-3">
                            <div className="toggle-info">
                                <h5 className="title mb-0">Account Navbar</h5>
                                <a className="toggle-btn" href="#accountSidebar" onClick={(e) => { e.preventDefault(); document.getElementById('accountSidebar')?.classList.toggle('show'); }}>Account Menu</a>
                            </div>
                            <div className="sticky-top account-sidebar-wrapper">
                                <div className="account-sidebar" id="accountSidebar">
                                    <div className="profile-head">
                                        <div className="user-thumb">
                                            <img className="rounded-circle" src={profileImage || profileImgFallback} alt="User" />
                                        </div>
                                        <h5 className="title mb-0">{user?.username || user?.displayName || user?.name || 'User'}</h5>
                                        <span className="text text-primary">{user?.email || ''}</span>
                                    </div>
                                    <div className="account-nav">
                                        <div className="nav-title bg-light uppercase">DASHBOARD</div>
                                        <ul>
                                            <li><Link to="/account">Dashboard</Link></li>
                                            <li><Link to="/account/orders">Orders</Link></li>
                                            <li><Link to="/account/downloads">Downloads</Link></li>
                                            <li><Link to="/account/return">Return request</Link></li>
                                        </ul>
                                        <div className="nav-title bg-light uppercase">ACCOUNT SETTINGS</div>
                                        <ul className="account-info-list">
                                            <li><Link to="/account/profile">Profile</Link></li>
                                            <li className="active"><Link to="/account/address">Address</Link></li>
                                            <li><Link to="/account/shipping">Shipping methods</Link></li>
                                            <li><Link to="/account/payment">Payment Methods</Link></li>
                                            <li><Link to="/account/review">Review</Link></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <section className="col-xl-9 account-wrapper mt-4 mt-xl-0">
                            <div className="row">
                                <div className="col-12 m-b30">
                                    <p className="m-b0">The following addresses will be used on the checkout page by default.</p>
                                </div>

                                {!loading && addresses.length === 0 ? (
                                    <div className="col-12 m-b30">
                                        <div className="alert alert-warning">No active address exist, please add a new one.</div>
                                    </div>
                                ) : (
                                    addresses.map((addr: any, idx: number) => (
                                        <div className="col-md-6 m-b30" key={addr._id || idx}>
                                            <div className="address-card">
                                                <div className="account-address-box">
                                                    <h6 className="mb-3">Shipping address {idx > 0 && `#${idx + 1}`}</h6>
                                                    <ul>
                                                        <li>{addr.house || addr.firstName}</li>
                                                        <li>{addr.place || addr.street1}</li>
                                                        <li>{addr.district || addr.city}, {addr.state}</li>
                                                        <li>{addr.pincode}</li>
                                                        <li>{addr.country}</li>
                                                    </ul>
                                                </div>
                                                <div className="account-address-bottom">
                                                    <Link to="/account/address/edit" state={addr} className="d-block me-3"><i className="fa-solid fa-pen me-2"></i>Edit</Link>
                                                    <a href="javascript:void(0);" className="d-block me-3"><i className="fa-solid fa-trash-can me-2"></i>Remove</a>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <div className="col-12">
                                    <div className="account-card-add">
                                        <div className="account-address-add">
                                            <svg id="Line" height="50" viewBox="0 0 64 64" width="50" xmlns="http://www.w3.org/2000/svg">
                                                <path d="m59.28775 26.0578-7.30176-6.251v-11.72068a.99973.99973 0 0 0 -1-1h-7.46a.99974.99974 0 0 0 -1 1v3.60693l-7.2109-6.17675a5.07688 5.07688 0 0 0 -6.6416 0l-23.97314 20.54345a2.04251 2.04251 0 0 0 1.32226 3.56787h5.98047v18.92188a8.60569 8.60569 0 0 0 8.59082 8.60059h10.481a1.00019 1.00019 0 0 0 -.00006-2h-10.48094a6.60308 6.60308 0 0 1 -6.59082-6.60059v-19.92188a1.00005 1.00005 0 0 0 -1-1l-6.99951-.05078 23.97119-20.542a3.08781 3.08781 0 0 1 4.03955 0l8.86133 7.59082a1.00655 1.00655 0 0 0 1.65039-.75934v-4.7802h5.46v11.18066a1.00013 1.00013 0 0 0 .34961.75928l7.63184 6.60156h-6.98148a.99974.99974 0 0 0 -1 1v3.7002a1.00019 1.00019 0 0 0 2-.00006v-2.70014h5.98145a2.03152 2.03152 0 0 0 1.32031-3.56982z" />
                                                <path d="m43.99564 33.718a13.00122 13.00122 0 0 0 .00012 26.00244c17.24786-.71391 17.24231-25.29106-.00012-26.00244zm.00012 24.00244c-14.59461-.60394-14.58984-21.40082.00006-22.00244a11.00122 11.00122 0 0 1 -.00006 22.00244z" />
                                                <path d="m49.001 45.71942h-4v-4.00049a1.00019 1.00019 0 0 0 -2 0v4.00049h-4a1.00019 1.00019 0 0 0 .00006 2h3.99994v4a1 1 0 0 0 2 0v-4h4a1 1 0 0 0 0-2z" />
                                            </svg>
                                        </div>
                                        <h4 className="mb-3">Add New Address</h4>
                                        <Link to="/account/address/add" className="btn btn-primary px-5">Add</Link>
                                    </div>
                                </div>

                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Address;
