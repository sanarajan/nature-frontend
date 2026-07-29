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
        } else if (user && (!user.isInfluencer || (user.influencerRequestStatus && user.influencerRequestStatus !== 'APPROVED'))) {
            toast.error('Influencer dashboard is only accessible after admin approval.');
            navigate('/account/profile');
        } else if (user && user.isInfluencer && (!user.influencerRequestStatus || user.influencerRequestStatus === 'APPROVED')) {
            fetchDashboardData();
        }
    }, [isAuthenticated, navigate, user]);

    const fetchDashboardData = async () => {
        try {
            const res = await userApiClient.get('/user/influencer/dashboard');
            if (res.data.success) {
                const data = res.data.data;
                setDashboardData(data);
                if (['INACTIVE', 'Inactive'].includes(data?.status || user?.influencerStatus)) {
                    toast.warn('Your influencer account is currently inactive. Referral commissions and withdrawals are disabled.');
                } else if (['BLOCKED', 'Blocked'].includes(data?.status || user?.influencerStatus)) {
                    toast.error('Your influencer account has been blocked. Referral commissions and withdrawals are disabled.');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const openWithdrawModal = () => {
        const currentStatus = dashboardData?.status || user?.influencerStatus;
        if (['INACTIVE', 'Inactive'].includes(currentStatus)) {
            toast.error('Your influencer account is currently inactive. Withdrawals are disabled.');
            return;
        }
        if (['BLOCKED', 'Blocked'].includes(currentStatus)) {
            toast.error('Your influencer account has been blocked. Withdrawals are disabled.');
            return;
        }

        if (!dashboardData?.isBankDetailsComplete) {
            toast.error('Please complete your bank details before requesting a withdrawal.');
            navigate('/account/profile');
            return;
        }

        setShowWithdrawModal(true);
    };

    const handleWithdrawSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);
        const minAmount = dashboardData?.minWithdrawalAmount || 500;
        const availableBalance = dashboardData?.walletBalance || 0;

        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (amount < minAmount) {
            toast.error(`Minimum withdrawal amount is ₹${minAmount}`);
            return;
        }

        if (amount > availableBalance) {
            toast.error('Insufficient wallet balance');
            return;
        }

        setWithdrawing(true);
        try {
            const res = await userApiClient.post('/user/influencer/withdraw', { amount });
            if (res.data.success) {
                toast.success('Your withdrawal request has been submitted successfully.');
                setWithdrawAmount('');
                setShowWithdrawModal(false);
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
                                            {user?.isInfluencer && (!user?.influencerRequestStatus || user?.influencerRequestStatus === 'APPROVED') && (
                                                <>
                                                    <li className="active"><Link to="/account/influencer">Influencer Dashboard</Link></li>
                                                    <li><Link to="/account/influencer/withdrawals">Withdrawal History</Link></li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <section className="col-xl-9 account-wrapper mt-4 mt-xl-0">
                            {['INACTIVE', 'Inactive'].includes(dashboardData?.status || user?.influencerStatus) && (
                                <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                                    <div>
                                        <strong>Account Inactive:</strong> Your influencer account is currently inactive. Referral link tracking and withdrawals are temporarily disabled.
                                    </div>
                                </div>
                            )}
                            {['BLOCKED', 'Blocked'].includes(dashboardData?.status || user?.influencerStatus) && (
                                <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                                    <div>
                                        <strong>Account Blocked:</strong> Your influencer account has been blocked by the administrator. Referral link tracking and withdrawals are disabled.
                                    </div>
                                </div>
                            )}

                            {/* Wallet Cards Grid */}
                            <div className="row mb-4">
                                <div className="col-md-4 col-lg-2-4 mb-3">
                                    <div className="card text-center p-3 h-100 d-flex flex-column justify-content-between shadow-sm">
                                        <div>
                                            <h6 className="text-muted mb-2">Wallet Balance</h6>
                                            <h3 className="text-primary fw-bold mb-2">₹{dashboardData?.walletBalance?.toFixed(2) || '0.00'}</h3>
                                        </div>
                                        <button className="btn btn-primary btn-sm w-100 mt-2" onClick={openWithdrawModal}>
                                            Request Withdrawal
                                        </button>
                                    </div>
                                </div>

                                <div className="col-md-4 col-lg-2-4 mb-3">
                                    <div className="card text-center p-3 h-100 shadow-sm">
                                        <h6 className="text-muted mb-2">Withdrawal Hold</h6>
                                        <h3 className="text-secondary fw-bold">₹{dashboardData?.withdrawalHold?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>

                                <div className="col-md-4 col-lg-2-4 mb-3">
                                    <div className="card text-center p-3 h-100 shadow-sm">
                                        <h6 className="text-muted mb-2">Pending Commission</h6>
                                        <h3 className="text-warning fw-bold">₹{dashboardData?.pendingBalance?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>

                                <div className="col-md-4 col-lg-2-4 mb-3">
                                    <div className="card text-center p-3 h-100 shadow-sm">
                                        <h6 className="text-muted mb-2">Approved Commission</h6>
                                        <h3 className="text-success fw-bold">₹{dashboardData?.totalEarned?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>

                                <div className="col-md-4 col-lg-2-4 mb-3">
                                    <div className="card text-center p-3 h-100 shadow-sm">
                                        <h6 className="text-muted mb-2">Total Withdrawn</h6>
                                        <h3 className="text-info fw-bold">₹{dashboardData?.totalWithdrawn?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <div className="card text-center p-3 mb-3 border-start border-4 border-info">
                                        <h6 className="text-muted mb-1">Referral Visits</h6>
                                        <h4 className="fw-bold mb-0">{dashboardData?.referralVisits || 0}</h4>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card text-center p-3 mb-3 border-start border-4 border-success">
                                        <h6 className="text-muted mb-1">Unique Customers</h6>
                                        <h4 className="fw-bold mb-0">{dashboardData?.uniqueCustomers || 0}</h4>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card text-center p-3 mb-3 border-start border-4 border-primary">
                                        <h6 className="text-muted mb-1">Total Orders</h6>
                                        <h4 className="fw-bold mb-0">{dashboardData?.totalOrders || 0}</h4>
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-6 col-md-3">
                                    <div className="card text-center p-2 mb-2 bg-light">
                                        <small className="text-muted">Completed Orders</small>
                                        <span className="fs-5 fw-bold text-success">{dashboardData?.completedOrders || 0}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card text-center p-2 mb-2 bg-light">
                                        <small className="text-muted">Pending Orders</small>
                                        <span className="fs-5 fw-bold text-warning">{dashboardData?.pendingOrders || 0}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card text-center p-2 mb-2 bg-light">
                                        <small className="text-muted">Cancelled Orders</small>
                                        <span className="fs-5 fw-bold text-secondary">{dashboardData?.cancelledOrders || 0}</span>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card text-center p-2 mb-2 bg-light">
                                        <small className="text-muted">Returned Orders</small>
                                        <span className="fs-5 fw-bold text-danger">{dashboardData?.returnedOrders || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-4 mb-4 shadow-sm">
                                <h4 className="mb-3">Your Referral Link</h4>
                                <div className="input-group mb-3">
                                    <input type="text" className="form-control" readOnly value={`${window.location.origin}/?ref=${dashboardData?.referralCode}`} />
                                    <button className="btn btn-primary" type="button" onClick={copyReferralLink}>Copy Link</button>
                                </div>
                                <p className="text-muted">Share this link to earn commission on every successful purchase.</p>
                            </div>

                            <div className="card p-4 mb-4 shadow-sm">
                                <h4 className="mb-3">Top Selling Products</h4>
                                {(!dashboardData?.topProducts || dashboardData?.topProducts?.length === 0) ? (
                                    <p className="text-muted">No products sold via your referral links yet.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th className="text-center">Total Sold</th>
                                                    <th className="text-end">Revenue Generated</th>
                                                    <th className="text-end">Commission Earned</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardData.topProducts.map((prod: any, idx: number) => (
                                                    <tr key={prod._id || idx}>
                                                        <td className="d-flex align-items-center">
                                                            {prod.image && (
                                                                <img src={prod.image} alt={prod.productName} className="rounded me-3" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                                                            )}
                                                            <strong>{prod.productName || `Product #${prod._id}`}</strong>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge bg-secondary rounded-pill px-3 py-2">{prod.totalSold}</span>
                                                        </td>
                                                        <td className="text-end">₹{Number(prod.totalRevenue || 0).toFixed(2)}</td>
                                                        <td className="text-end text-success fw-bold">₹{Number(prod.totalCommission || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="card p-4 shadow-sm">
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
                                    <div className="card p-4 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h4 className="mb-0">Recent Withdrawal Requests</h4>
                                            <Link to="/account/influencer/withdrawals" className="btn btn-sm btn-outline-primary">View All</Link>
                                        </div>
                                        <ul className="list-group">
                                            {dashboardData?.withdrawalRequests?.length === 0 ? <p>No requests yet.</p> : dashboardData?.withdrawalRequests?.map((req: any) => (
                                                <li key={req._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>₹{req.amount?.toFixed(2)}</strong><br/>
                                                        <small>{new Date(req.requestedAt).toLocaleDateString()}</small>
                                                    </div>
                                                    <span className={`badge ${req.status === 'Approved' || req.status === 'Paid' ? 'bg-success' : req.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'} rounded-pill`}>{req.status}</span>
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

            {/* Request Withdrawal Modal */}
            {showWithdrawModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '16px',
                        padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '100%', maxWidth: '480px'
                    }}>
                        <h4 className="mb-3 fw-bold">Request Withdrawal</h4>

                        <div className="bg-light p-3 rounded mb-4 border">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Available Balance:</span>
                                <strong className="text-primary fs-6">₹{dashboardData?.walletBalance?.toFixed(2) || '0.00'}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Minimum Withdrawal:</span>
                                <strong className="text-dark fs-6">₹{dashboardData?.minWithdrawalAmount || 500}</strong>
                            </div>
                        </div>

                        <form onSubmit={handleWithdrawSubmit}>
                            <div className="mb-4">
                                <label className="form-label fw-bold">Enter Withdrawal Amount (₹) <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    className="form-control form-control-lg"
                                    placeholder={`Min ₹${dashboardData?.minWithdrawalAmount || 500}`}
                                    min={dashboardData?.minWithdrawalAmount || 500}
                                    max={dashboardData?.walletBalance || 0}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    required
                                />
                                {Number(withdrawAmount) > 0 && Number(withdrawAmount) < (dashboardData?.minWithdrawalAmount || 500) && (
                                    <div className="text-danger small mt-1">Amount must be at least ₹{dashboardData?.minWithdrawalAmount || 500}.</div>
                                )}
                                {Number(withdrawAmount) > (dashboardData?.walletBalance || 0) && (
                                    <div className="text-danger small mt-1">Amount cannot exceed available balance of ₹{dashboardData?.walletBalance?.toFixed(2)}.</div>
                                )}
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <button type="button" onClick={() => setShowWithdrawModal(false)} disabled={withdrawing} className="btn btn-light">
                                    Cancel
                                </button>
                                <button type="submit" disabled={withdrawing} className="btn btn-primary px-4">
                                    {withdrawing ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfluencerDashboard;
