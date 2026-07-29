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

    // Influencer State
    const [showInfluencerModal, setShowInfluencerModal] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [socialForm, setSocialForm] = useState({
        facebook: '',
        instagram: '',
        youtube: ''
    });

    // Bank Details State
    const [bankForm, setBankForm] = useState({
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: ''
    });
    const [savingBank, setSavingBank] = useState(false);

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSocialForm(prev => ({ ...prev, [name]: value }));
    };

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBankForm(prev => ({ ...prev, [name]: value }));
    };

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

            setBankForm({
                accountHolderName: (user as any).accountHolderName || '',
                bankName: (user as any).bankName || '',
                accountNumber: (user as any).accountNumber || '',
                ifscCode: (user as any).ifscCode || '',
                upiId: (user as any).upiId || ''
            });

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

    const handleUpgradeToInfluencer = async () => {
        const fbRegex = /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?(_)?\-]+(\/)?.*$/i;
        const igRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_\-\.]+.*$/i;
        const ytRegex = /^https?:\/\/(www\.)?youtube\.com\/(@[a-zA-Z0-9_\-\.]+|channel\/[a-zA-Z0-9_\-]+|c\/[a-zA-Z0-9_\-]+|user\/[a-zA-Z0-9_\-]+|.*)/i;

        if (!socialForm.facebook || !fbRegex.test(socialForm.facebook.trim())) {
            toast.error('Please enter a valid Facebook profile URL (e.g., https://facebook.com/yourusername).');
            return;
        }
        if (!socialForm.instagram || !igRegex.test(socialForm.instagram.trim())) {
            toast.error('Please enter a valid Instagram profile URL (e.g., https://instagram.com/yourusername).');
            return;
        }
        if (!socialForm.youtube || !ytRegex.test(socialForm.youtube.trim())) {
            toast.error('Please enter a valid YouTube channel/profile URL (e.g., https://youtube.com/@yourchannel).');
            return;
        }

        setUpgrading(true);
        try {
            const res = await userApiClient.post('/user/influencer/upgrade', { socialProfiles: socialForm });
            if (res.data.success) {
                toast.success('Your Influencer request has been submitted successfully. Our team will review your request.');
                setShowInfluencerModal(false);
                
                try {
                    const profileRes = await userApiClient.get('/user/auth/me');
                    if (profileRes.data.success && profileRes.data.data.user) {
                        const updatedUser = profileRes.data.data.user;
                        dispatch(userLoginSuccess(updatedUser));
                        localStorage.setItem('user_data', JSON.stringify(updatedUser));
                    }
                } catch (profileErr) {
                    console.error("Failed to fetch updated profile", profileErr);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setUpgrading(false);
        }
    };

    const handleUpdateBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankForm.accountHolderName.trim()) {
            toast.error('Account Holder Name is required.');
            return;
        }
        if (!bankForm.bankName.trim()) {
            toast.error('Bank Name is required.');
            return;
        }
        if (!bankForm.accountNumber.trim()) {
            toast.error('Account Number is required.');
            return;
        }
        if (!bankForm.ifscCode.trim()) {
            toast.error('IFSC Code is required.');
            return;
        }

        setSavingBank(true);
        try {
            const res = await userApiClient.put('/user/influencer/bank-details', bankForm);
            if (res.data.success) {
                toast.success('Bank details saved successfully!');
                if (user) {
                    dispatch(userLoginSuccess({ ...user, ...bankForm }));
                    localStorage.setItem('user_data', JSON.stringify({ ...user, ...bankForm }));
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save bank details');
        } finally {
            setSavingBank(false);
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
                                            {user?.isInfluencer && (!user?.influencerRequestStatus || user?.influencerRequestStatus === 'APPROVED') ? (
                                                <li><Link to="/account/influencer">Influencer Dashboard</Link></li>
                                            ) : user?.influencerRequestStatus === 'PENDING' ? (
                                                <li><span className="text-muted d-block py-1" style={{ cursor: 'not-allowed', fontSize: '14px' }}>Influencer (Pending Review)</span></li>
                                            ) : (
                                                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowInfluencerModal(true); }}>Become an Influencer</a></li>
                                            )}
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

                            {/* Bank Details Card for Influencers */}
                            {user?.isInfluencer && (!user?.influencerRequestStatus || user?.influencerRequestStatus === 'APPROVED') && (
                                <div className="account-card mt-4 p-4 shadow-sm border rounded">
                                    <h4 className="title mb-3">Influencer Bank Details</h4>
                                    <p className="text-muted small mb-4">
                                        Please ensure your bank account details are complete and accurate before requesting a withdrawal.
                                    </p>
                                    <form onSubmit={handleUpdateBankDetails} className="row">
                                        <div className="col-lg-6">
                                            <div className="form-group m-b20">
                                                <label className="label-title fw-bold">Account Holder Name <span className="text-danger">*</span></label>
                                                <input type="text" name="accountHolderName" value={bankForm.accountHolderName} onChange={handleBankChange} required className="form-control" placeholder="e.g. John Doe" />
                                            </div>
                                        </div>
                                        <div className="col-lg-6">
                                            <div className="form-group m-b20">
                                                <label className="label-title fw-bold">Bank Name <span className="text-danger">*</span></label>
                                                <input type="text" name="bankName" value={bankForm.bankName} onChange={handleBankChange} required className="form-control" placeholder="e.g. State Bank of India" />
                                            </div>
                                        </div>
                                        <div className="col-lg-6">
                                            <div className="form-group m-b20">
                                                <label className="label-title fw-bold">Account Number <span className="text-danger">*</span></label>
                                                <input type="text" name="accountNumber" value={bankForm.accountNumber} onChange={handleBankChange} required className="form-control" placeholder="Enter bank account number" />
                                            </div>
                                        </div>
                                        <div className="col-lg-6">
                                            <div className="form-group m-b20">
                                                <label className="label-title fw-bold">IFSC Code <span className="text-danger">*</span></label>
                                                <input type="text" name="ifscCode" value={bankForm.ifscCode} onChange={handleBankChange} required className="form-control" placeholder="e.g. SBIN0001234" />
                                            </div>
                                        </div>
                                        <div className="col-lg-12">
                                            <div className="form-group m-b20">
                                                <label className="label-title fw-bold">UPI ID <span className="text-muted">(Optional)</span></label>
                                                <input type="text" name="upiId" value={bankForm.upiId} onChange={handleBankChange} className="form-control" placeholder="e.g. username@upi" />
                                            </div>
                                        </div>
                                        <div className="col-lg-12 d-flex justify-content-end mt-2">
                                            <button type="submit" disabled={savingBank} className="btn btn-primary">
                                                {savingBank ? 'Saving...' : 'Save Bank Details'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Become an Influencer Section */}
                            {!user?.isInfluencer && (
                                <>
                                    {user?.influencerRequestStatus === 'PENDING' ? (
                                        <div className="account-card mt-4 p-4 border border-warning rounded" style={{ backgroundColor: '#fffdf5' }}>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="badge bg-warning text-dark me-2">Pending Review</span>
                                                <h4 className="mb-0 text-dark">Influencer Request Under Review</h4>
                                            </div>
                                            <p className="mb-2 text-muted">
                                                Your request submitted on {user.influencerRequestDate ? new Date(user.influencerRequestDate).toLocaleDateString() : 'recently'} is currently being reviewed by our Admin team.
                                            </p>
                                            <p className="mb-0 text-muted small">
                                                We will notify you via email once your social profiles have been verified and approved. Your normal account remains completely active for shopping and rewards.
                                            </p>
                                        </div>
                                    ) : user?.influencerRequestStatus === 'REJECTED' ? (
                                        <div className="account-card mt-4 p-4 border border-danger rounded" style={{ backgroundColor: '#fff8f8' }}>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="badge bg-danger text-white me-2">Not Approved</span>
                                                <h4 className="mb-0 text-danger">Update on Your Influencer Request</h4>
                                            </div>
                                            <p className="mb-2 text-muted">
                                                Thank you for your interest. After careful review, our team was unable to approve your request at this time.
                                            </p>
                                            {user?.influencerRejectionReason && (
                                                <div className="alert alert-danger p-2 mb-3 small" role="alert">
                                                    <strong>Reason:</strong> {user.influencerRejectionReason}
                                                </div>
                                            )}
                                            <p className="mb-3 text-muted small">
                                                Your regular user account status remains completely unaffected. If you have updated your social profile links or grown your audience, you are welcome to submit a new request below.
                                            </p>
                                            <button onClick={() => setShowInfluencerModal(true)} className="btn btn-primary btn-sm">
                                                Submit New Request
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="account-card mt-4 p-4 border border-primary rounded" style={{ backgroundColor: '#f8faff' }}>
                                            <h4 className="mb-2 text-primary">Become an Influencer</h4>
                                            <p className="mb-3 text-muted">
                                                Earn commission by sharing your referral link.
                                                Promote products on Facebook, Instagram, and YouTube, and earn rewards when customers purchase through your link.
                                            </p>
                                            <button onClick={() => setShowInfluencerModal(true)} className="btn btn-primary">
                                                Become an Influencer
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
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

            {/* Influencer Upgrade Modal */}
            {showInfluencerModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '12px',
                        padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h4 className="mb-2">Become a Naturalayam Influencer</h4>
                        <p className="text-muted mb-3 small">
                            Submit your social media profile URLs for verification. Our admin team will review your application to grant you influencer status and unique referral links.
                        </p>

                        <form onSubmit={(e) => { e.preventDefault(); handleUpgradeToInfluencer(); }}>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Facebook Profile URL <span className="text-danger">*</span></label>
                                <input
                                    type="url"
                                    name="facebook"
                                    className="form-control"
                                    placeholder="https://facebook.com/yourusername"
                                    value={socialForm.facebook}
                                    onChange={handleSocialChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Instagram Profile URL <span className="text-danger">*</span></label>
                                <input
                                    type="url"
                                    name="instagram"
                                    className="form-control"
                                    placeholder="https://instagram.com/yourusername"
                                    value={socialForm.instagram}
                                    onChange={handleSocialChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small">YouTube Channel URL <span className="text-danger">*</span></label>
                                <input
                                    type="url"
                                    name="youtube"
                                    className="form-control"
                                    placeholder="https://youtube.com/@yourchannel"
                                    value={socialForm.youtube}
                                    onChange={handleSocialChange}
                                    required
                                />
                            </div>

                            <div className="d-flex justify-content-end gap-3">
                                <button type="button" onClick={() => setShowInfluencerModal(false)} disabled={upgrading} className="btn btn-light">
                                    Cancel
                                </button>
                                <button type="submit" disabled={upgrading} className="btn btn-primary">
                                    {upgrading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
