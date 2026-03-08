import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';

// Asset Imports
import bg1 from '../../assets/images/background/bg1.jpg';
import profileImgFallback from '../../assets/images/profile4.jpg'; // fallback

const ShippingAddress: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, data: user } = useSelector((state: RootState) => state.auth.user);

    const [profileImage, setProfileImage] = useState<string | null>(null);

    const [formLoading, setFormLoading] = useState(false);
    const [statesList, setStatesList] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        _id: '',
        house: '',
        place: '',
        district: '',
        city: '',
        state: '',
        country: 'India',
        pincode: ''
    });

    const isEditMode = location.pathname.includes('/edit');

    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('user_accessToken')) {
            navigate('/login');
        } else if (user) {
            if (user.imageUrl) {
                setProfileImage(user.imageUrl);
            }
        }

        const fetchStates = async () => {
            try {
                const res = await userApiClient.get('/user/auth/states');
                if (res.data.success) {
                    setStatesList(res.data.data.states || []);
                }
            } catch (err) {
                console.error("Failed to load states:", err);
            }
        };
        fetchStates();

        if (isEditMode) {
            const passedData = location.state as any;
            if (passedData) {
                setFormData({
                    _id: passedData._id || '',
                    house: passedData.house || '',
                    place: passedData.place || '',
                    district: passedData.district || passedData.city || '',
                    city: passedData.city || passedData.district || '',
                    state: passedData.state || '',
                    country: passedData.country || 'India',
                    pincode: passedData.pincode || ''
                });
            }
        }
    }, [isAuthenticated, navigate, user, isEditMode, location.state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Map district and city explicitly since backend uses 'city' as required internally in initial design (but user calls it district/place)
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'district' ? { city: value } : {})
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // JQuery/Browser Validation logic matching user prompt requirement:
        const { house, place, district, state, pincode } = formData;
        if (!house || !place || !district || !state || !pincode) {
            toast.error("Please fill all required fields");
            return;
        }

        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(pincode)) {
            toast.error("Pincode must be exactly 6 digits");
            return;
        }

        setFormLoading(true);
        try {
            const res = await userApiClient.post('/user/auth/address', formData);
            if (res.data.success) {
                toast.success(res.data.message || 'Address saved successfully!');
                navigate('/account/address');
            }
        } catch (error: any) {
            console.error("Save address error:", error);
            toast.error(error.response?.data?.message || 'Failed to save address.');
        } finally {
            setFormLoading(false);
        }
    };

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
                                <li className="breadcrumb-item"><Link to="/account/address">Account Address</Link></li>
                                <li className="breadcrumb-item">Account Shipping Address</li>
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
                            <div className="account-card">
                                <form className="row" onSubmit={handleSave}>
                                    <h3 className="m-b30">{isEditMode ? 'Edit' : 'Add'} Shipping address</h3>

                                    <div className="col-md-12">
                                        <div className="m-b25">
                                            <label className="label-title">Country *</label>
                                            <select name="country" value={formData.country} disabled onChange={handleChange} className="form-select w-100" style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}>
                                                <option value="India">India</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="form-group m-b25">
                                            <label className="label-title">House Name / Flat No. *</label>
                                            <input name="house" value={formData.house} onChange={handleChange} required className="form-control" />
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="form-group m-b25">
                                            <label className="label-title">Place *</label>
                                            <input name="place" value={formData.place} onChange={handleChange} required className="form-control" />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="m-b25">
                                            <label className="label-title">State *</label>
                                            <select name="state" value={formData.state} onChange={handleChange} required className="form-select w-100">
                                                <option value="">Select State</option>
                                                {statesList.map(s => (
                                                    <option key={s.code} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-group m-b25">
                                            <label className="label-title">District *</label>
                                            <input name="district" value={formData.district} onChange={handleChange} required className="form-control" />
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="form-group m-b25">
                                            <label className="label-title">Pincode *</label>
                                            <input type="text" pattern="\d{6}" maxLength={6} name="pincode" value={formData.pincode} onChange={handleChange} required className="form-control" placeholder="6 digit pincode" />
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <button type="submit" disabled={formLoading} className="btn btn-secondary">
                                            {formLoading ? 'Saving...' : 'Save changes'}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingAddress;
