import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { userLoginSuccess } from '../../store/authSlice';
import { toast } from 'react-toastify';
import userApiClient from '../../services/userApiClient';

interface AccountSidebarProps {
    activePage: 'dashboard' | 'orders' | 'my-rewards' | 'nature-points' | 'profile' | 'influencer' | 'withdrawal-history' | 'address';
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({ activePage }) => {
    const dispatch = useDispatch();
    const { data: user } = useSelector((state: RootState) => state.auth.user);
    
    const [showInfluencerModal, setShowInfluencerModal] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [socialForm, setSocialForm] = useState({ facebook: '', instagram: '', youtube: '' });

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSocialForm({ ...socialForm, [e.target.name]: e.target.value });
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

    return (
        <>
            <aside className="col-xl-3">
                <div className="toggle-info">
                    <h5 className="title mb-0">Account Navbar</h5>
                    <a className="toggle-btn" href="#accountSidebar" onClick={(e) => { e.preventDefault(); document.getElementById('accountSidebar')?.classList.toggle('show'); }}>Account Menu</a>
                </div>
                <div className="sticky-top account-sidebar-wrapper">
                    <div className="account-sidebar" id="accountSidebar">
                        <div className="profile-head">
                            <div className="user-thumb">
                                <img className="rounded-circle" src={user?.imageUrl || "/images/profile4.jpg"} alt="User" />
                            </div>
                            <h5 className="title mb-0">{user?.username || user?.displayName || user?.name || 'User'}</h5>
                            <span className="text text-primary">{user?.email || ''}</span>
                        </div>
                        <div className="account-nav">
                            <div className="nav-title bg-light uppercase">DASHBOARD</div>
                            <ul>
                                <li className={activePage === 'dashboard' ? 'active' : ''}><Link to="/account">Dashboard</Link></li>
                                <li className={activePage === 'orders' ? 'active' : ''}><Link to="/account/orders">Orders</Link></li>
                                <li className={activePage === 'my-rewards' ? 'active' : ''}><Link to="/account/my-rewards">My Rewards</Link></li>
                                <li className={activePage === 'nature-points' ? 'active' : ''}><Link to="/account/nature-points">Nature Points</Link></li>
                            </ul>
                            <div className="nav-title bg-light uppercase">ACCOUNT SETTINGS</div>
                            <ul className="account-info-list">
                                <li className={activePage === 'profile' ? 'active' : ''}><Link to="/account/profile">Profile</Link></li>
                                {user?.isInfluencer && (!user?.influencerRequestStatus || user?.influencerRequestStatus === 'APPROVED') ? (
                                    <>
                                    <li className={activePage === 'influencer' ? 'active' : ''}><Link to="/account/influencer">Influencer Dashboard</Link></li>
                                    <li className={activePage === 'withdrawal-history' ? 'active' : ''}>
                                            <Link to="/account/influencer/withdrawals">Withdrawal History</Link>
                                        </li>
                                    </>
                                ) : user?.influencerRequestStatus === 'PENDING' ? (
                                    <li><span className="text-muted d-block py-1" style={{ cursor: 'not-allowed', fontSize: '14px' }}>Influencer (Pending Review)</span></li>
                                ) : (
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); setShowInfluencerModal(true); }}>Become an Influencer</a></li>
                                )}
                                <li className={activePage === 'address' ? 'active' : ''}><Link to="/account/address">Address</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </aside>

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
        </>
    );
};

export default AccountSidebar;
