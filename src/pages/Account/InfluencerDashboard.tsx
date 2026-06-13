import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { toast } from 'react-toastify';
import userApiClient from '../../services/userApiClient';

// Asset Imports
import bg1 from '../../assets/images/background/bg1.jpg';
import profileImgFallback from '../../assets/images/profile4.jpg';

const InfluencerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, data: user } = useSelector((state: RootState) => state.auth.user);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('');
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('user_accessToken')) {
            navigate('/login');
        } else if (user && !user.isInfluencer) {
            navigate('/account/profile');
        } else if (user && user.isInfluencer) {
            fetchDashboardData();
        }
    }, [isAuthenticated, navigate, user]);

    const fetchDashboardData = async () => {
        try {
            const res = await userApiClient.get('/user/influencer/dashboard');
            if (res.data.success) {
                setDashboardData(res.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (amount > dashboardData?.walletBalance) {
            toast.error('Insufficient wallet balance');
            return;
        }

        setWithdrawing(true);
        try {
            const res = await userApiClient.post('/user/influencer/withdraw', { amount });
            if (res.data.success) {
                toast.success('Withdrawal requested successfully');
                setWithdrawAmount('');
                fetchDashboardData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to request withdrawal');
        } finally {
            setWithdrawing(false);
        }
    };

    const copyReferralLink = () => {
        const link = `${window.location.origin}/?ref=${dashboardData?.referralCode}`;
        navigator.clipboard.writeText(link);
        toast.success('Referral link copied to clipboard!');
    };

    if (loading) return <div className="text-center my-5">Loading...</div>;

    return (
        <div className="page-content bg-light position-relative">
            {/* Banner Section */}
            <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: `url(${bg1})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Influencer Dashboard</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item">Influencer</li>
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
                                            <img className="rounded-circle" src={user?.imageUrl || profileImgFallback} alt="User" />
                                        </div>
                                        <h5 className="title mb-0">{user?.username || user?.displayName || user?.name || 'User'}</h5>
                                        <span className="text text-primary">{user?.email || ''}</span>
                                    </div>
                                    <div className="account-nav">
                                        <div className="nav-title bg-light uppercase">DASHBOARD</div>
                                        <ul>
                                            <li><Link to="/account">Dashboard</Link></li>
                                            <li><Link to="/account/orders">Orders</Link></li>
                                        </ul>
                                        <div className="nav-title bg-light uppercase">ACCOUNT SETTINGS</div>
                                        <ul className="account-info-list">
                                            <li><Link to="/account/profile">Profile</Link></li>
                                            {user?.isInfluencer && <li className="active"><Link to="/account/influencer">Influencer Dashboard</Link></li>}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <section className="col-xl-9 account-wrapper mt-4 mt-xl-0">
                            <div className="row mb-4">
                                <div className="col-md-3">
                                    <div className="card text-center p-3">
                                        <h5>Wallet Balance</h5>
                                        <h3 className="text-primary">₹{dashboardData?.walletBalance?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card text-center p-3">
                                        <h5>Pending Balance</h5>
                                        <h3 className="text-warning">₹{dashboardData?.pendingBalance?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card text-center p-3">
                                        <h5>Total Earned</h5>
                                        <h3 className="text-success">₹{dashboardData?.totalEarned?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card text-center p-3">
                                        <h5>Total Withdrawn</h5>
                                        <h3 className="text-info">₹{dashboardData?.totalWithdrawn?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-4 mb-4">
                                <h4 className="mb-3">Your Referral Link</h4>
                                <div className="input-group mb-3">
                                    <input type="text" className="form-control" readOnly value={`${window.location.origin}/?ref=${dashboardData?.referralCode}`} />
                                    <button className="btn btn-primary" type="button" onClick={copyReferralLink}>Copy Link</button>
                                </div>
                                <p className="text-muted">Share this link to earn commission on every successful purchase.</p>
                            </div>

                            <div className="card p-4 mb-4">
                                <h4 className="mb-3">Request Withdrawal</h4>
                                <form onSubmit={handleWithdraw} className="row">
                                    <div className="col-md-8">
                                        <input type="number" className="form-control" placeholder="Enter Amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required />
                                    </div>
                                    <div className="col-md-4">
                                        <button className="btn btn-primary w-100" type="submit" disabled={withdrawing}>
                                            {withdrawing ? 'Requesting...' : 'Withdraw'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="card p-4">
                                        <h4 className="mb-3">Recent Referrals</h4>
                                        <ul className="list-group">
                                            {dashboardData?.recentOrders?.length === 0 ? <p>No referrals yet.</p> : dashboardData?.recentOrders?.map((order: any) => (
                                                <li key={order._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>{order.orderId}</strong><br/>
                                                        <small>{new Date(order.createdAt).toLocaleDateString()}</small>
                                                    </div>
                                                    <div>
                                                        <span className="badge bg-primary rounded-pill me-2">₹{order.influencerCommissionAmount?.toFixed(2)}</span>
                                                        <span className={`badge ${order.influencerCommissionStatus === 'APPROVED' ? 'bg-success' : 'bg-warning'} rounded-pill`}>{order.influencerCommissionStatus}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card p-4">
                                        <h4 className="mb-3">Withdrawal Requests</h4>
                                        <ul className="list-group">
                                            {dashboardData?.withdrawalRequests?.length === 0 ? <p>No requests yet.</p> : dashboardData?.withdrawalRequests?.map((req: any) => (
                                                <li key={req._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>₹{req.amount?.toFixed(2)}</strong><br/>
                                                        <small>{new Date(req.requestedAt).toLocaleDateString()}</small>
                                                    </div>
                                                    <span className={`badge ${req.status === 'Approved' ? 'bg-success' : req.status === 'Pending' ? 'bg-warning' : 'bg-danger'} rounded-pill`}>{req.status}</span>
                                                </li>
                                            ))}
                                        </ul>
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

export default InfluencerDashboard;
