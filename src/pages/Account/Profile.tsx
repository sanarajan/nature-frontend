import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { toast } from 'react-toastify';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { X, Crop } from 'lucide-react';
import userApiClient from '../../services/userApiClient';
import { userLoginSuccess, userLogout } from '../../store/authSlice';

// Asset Imports
import bg1 from '../../assets/images/background/bg1.jpg';
import profileImgFallback from '../../assets/images/profile4.jpg'; // fallback

const Profile: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, data: user } = useSelector((state: RootState) => state.auth.user);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    // Profile Image & Cropping States
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const cropperRef = useRef<any>(null);

    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('user_accessToken')) {
            navigate('/login');
        } else if (user) {
            const fullName = user.displayName || user.username || user.name || '';

            setFormData(prev => ({
                ...prev,
                username: fullName,
                email: user.email || '',
                phone: user.phoneNumber || user.phone || user.mobile || ''
            }));

            if (user.imageUrl) {
                setProfileImage(user.imageUrl);
            }
        }
    }, [isAuthenticated, navigate, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Image Upload Handlers
    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];

            if (!validTypes.includes(file.type)) {
                toast.error('Only JPG and PNG images are allowed.');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size must be less than 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSrc(reader.result?.toString() || '');
                setIsCropModalOpen(true);
            });
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset input to allow selecting same file again
        }
    };

    const saveCroppedImage = () => {
        if (typeof cropperRef.current?.cropper !== 'undefined') {
            const croppedBase64 = cropperRef.current?.cropper.getCroppedCanvas().toDataURL('image/jpeg');
            if (croppedBase64) {
                setProfileImage(croppedBase64);
                setIsCropModalOpen(false);
                setSrc(null);
            } else {
                toast.error('Failed to crop image');
            }
        } else {
            toast.error('Cropper not initialized');
        }
    };

    const handleUpdateProfile = async () => {
        // Proper Name Validation
        const nameRegex = /^[a-zA-Z\s]{3,40}$/;
        if (!nameRegex.test(formData.username)) {
            toast.error("Please enter a valid proper username (letters only, 3-40 characters).");
            return;
        }

        // Validation for passwords if filled
        if (formData.password || formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match!");
                return;
            }
            if (formData.password.length < 8) {
                toast.error("Password must be at least 8 characters");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                username: formData.username,
                password: formData.password || undefined,
                avatar: profileImage
            };

            const res = await userApiClient.put('/user/auth/profile', payload);

            if (res.data.success) {
                // Instantly update Redux store
                if (user) {
                    dispatch(userLoginSuccess({ ...user, ...res.data.data.user }));
                }

                toast.success("Profile updated successfully!");
                // Clear password fields
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

                // If password was changed, force logout
                if (payload.password) {
                    dispatch(userLogout());
                    toast.info("Password updated successfully. Please login again.");
                    navigate('/login');
                }
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
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
                                <li className="breadcrumb-item">Account Profile</li>
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
                                            <li className="active"><Link to="/account/profile">Profile</Link></li>
                                            <li><Link to="/account/address">Address</Link></li>
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
                                <div className="profile-edit">
                                    <div className="avatar-upload d-flex align-items-center">
                                        <div className=" position-relative ">
                                            <div className="avatar-preview thumb">
                                                <div id="imagePreview" style={{ backgroundImage: `url(${profileImage || profileImgFallback})` }}></div>
                                            </div>
                                            <div className="change-btn thumb-edit d-flex align-items-center flex-wrap">
                                                <input type='file' className="form-control d-none" id="imageUpload" accept=".png, .jpg, .jpeg" onChange={onSelectFile} />
                                                <label htmlFor="imageUpload" className="btn btn-light ms-0"><i className="fa-solid fa-camera"></i></label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="clearfix">
                                        <h2 className="title mb-0">{user?.username || user?.displayName || user?.name || 'User'}</h2>
                                        <span className="text text-primary">{user?.email || ''}</span>
                                    </div>
                                </div>

                                <form action="#" className="row" onSubmit={(e) => e.preventDefault()}>
                                    <div className="col-lg-12">
                                        <div className="form-group m-b25">
                                            <label className="label-title">Username</label>
                                            <input name="username" value={formData.username} onChange={handleChange} required className="form-control" />
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="form-group m-b25">
                                            <label className="label-title">Email address</label>
                                            <input type="email" name="email" value={formData.email} readOnly required className="form-control" style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="form-group m-b25">
                                            <label className="label-title">Phone</label>
                                            <input type="tel" name="phone" value={formData.phone} readOnly required className="form-control" style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="form-group m-b25">
                                            <label className="label-title">New password (leave blank to leave unchanged)</label>
                                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" placeholder="Optional" />
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="form-group m-b25">
                                            <label className="label-title">Confirm new password</label>
                                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-control" placeholder="Optional" />
                                        </div>
                                    </div>
                                </form>

                                <div className="d-flex justify-content-end align-items-center mt-3">
                                    <button onClick={handleUpdateProfile} disabled={loading} className="btn btn-primary" type="button">
                                        {loading ? 'Updating...' : 'Update profile'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Crop Modal */}
            {isCropModalOpen && src && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '16px',
                        padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '90%', maxWidth: '500px'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0"><Crop size={20} className="me-2" /> Crop Photo</h4>
                            <button onClick={() => { setIsCropModalOpen(false); setSrc(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ width: '100%', background: '#333' }}>
                            <Cropper
                                src={src}
                                style={{ height: 350, width: '100%' }}
                                aspectRatio={1}
                                guides={true}
                                ref={cropperRef}
                                viewMode={1}
                                dragMode="move"
                                background={false}
                            />
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button onClick={saveCroppedImage} style={{ padding: '10px 20px', background: 'var(--admin-primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}>
                                Save Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
