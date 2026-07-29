import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { toast } from 'react-toastify';
import userApiClient from '../../services/userApiClient';
import { Eye, Clock, CheckCircle2, AlertCircle, CheckCheck, X } from 'lucide-react';

// Asset Imports
import bg1 from '../../assets/images/background/bg1.jpg';
import profileImgFallback from '../../assets/images/profile4.jpg';

interface BankSnapshot {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
}

interface WithdrawalRequestItem {
    _id: string;
    requestId: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
    requestedAt: string;
    approvedAt?: string;
    paidAt?: string;
    rejectedAt?: string;
    reason?: string;
    remarks?: string;
    adminRemarks?: string;
    transactionReference?: string;
    paymentMethod?: string;
    bankSnapshot?: BankSnapshot;
}

const WithdrawalHistory: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, data: user } = useSelector((state: RootState) => state.auth.user);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<WithdrawalRequestItem[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestItem | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [page, setPage] = useState<number>(1);
    const [pagination, setPagination] = useState<any>({ page: 1, limit: 10, total: 0, pages: 1 });

    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('user_accessToken')) {
            navigate('/login');
        } else if (user && (!user.isInfluencer || (user.influencerRequestStatus && user.influencerRequestStatus !== 'APPROVED'))) {
            toast.error('Withdrawal history is only accessible to approved influencers.');
            navigate('/account/profile');
        } else if (user && user.isInfluencer) {
            fetchWithdrawals(page, statusFilter);
        }
    }, [isAuthenticated, navigate, user, page, statusFilter]);

    const fetchWithdrawals = async (pageNum = 1, status = 'ALL') => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', String(pageNum));
            queryParams.append('limit', '10');
            if (status !== 'ALL') {
                queryParams.append('status', status);
            }

            const res = await userApiClient.get(`/user/influencer/withdrawals?${queryParams.toString()}`);
            if (res.data.success) {
                setRequests(res.data.data || []);
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch withdrawal history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
                return <span className="badge bg-info text-white px-3 py-2 rounded-pill"><Clock size={14} className="me-1" /> Approved</span>;
            case 'Paid':
                return <span className="badge bg-success px-3 py-2 rounded-pill"><CheckCheck size={14} className="me-1" /> Completed</span>;
            case 'Rejected':
                return <span className="badge bg-danger px-3 py-2 rounded-pill"><AlertCircle size={14} className="me-1" /> Rejected</span>;
            default:
                return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill"><Clock size={14} className="me-1" /> Pending</span>;
        }
    };

    const renderStatusBanner = (req: WithdrawalRequestItem) => {
        switch (req.status) {
            case 'Pending':
                return (
                    <div className="alert alert-warning border-0 shadow-sm p-4 rounded-3 mb-4">
                        <div className="d-flex align-items-start">
                            <Clock className="text-warning me-3 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h5 className="alert-heading text-dark fw-bold mb-1">Withdrawal Request Submitted</h5>
                                <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-line' }}>
                                    Your withdrawal request has been submitted successfully.{'\n'}
                                    Our team will review your request shortly.{'\n'}
                                    Please wait for approval.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'Approved':
                return (
                    <div className="alert alert-info border-0 shadow-sm p-4 rounded-3 mb-4" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        <div className="d-flex align-items-start">
                            <CheckCircle2 className="text-info me-3 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h5 className="alert-heading fw-bold mb-1" style={{ color: '#0369a1' }}>Withdrawal Request Approved</h5>
                                <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-line' }}>
                                    Good news!{'\n'}
                                    Your withdrawal request has been approved.{'\n'}
                                    Our finance team will manually transfer the payment to your registered bank account.{'\n'}
                                    You will receive another update once the payment has been completed.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'Paid':
                return (
                    <div className="alert alert-success border-0 shadow-sm p-4 rounded-3 mb-4">
                        <div className="d-flex align-items-start">
                            <CheckCheck className="text-success me-3 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h5 className="alert-heading text-success fw-bold mb-1">Withdrawal Completed</h5>
                                <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-line' }}>
                                    Congratulations!{'\n'}
                                    Your withdrawal request has been successfully completed.{'\n'}
                                    The payment has been transferred to your registered bank account.{'\n'}
                                    Thank you.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'Rejected':
                return (
                    <div className="alert alert-danger border-0 shadow-sm p-4 rounded-3 mb-4">
                        <div className="d-flex align-items-start">
                            <AlertCircle className="text-danger me-3 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h5 className="alert-heading text-danger fw-bold mb-1">Withdrawal Request Rejected</h5>
                                <p className="mb-2 text-muted" style={{ whiteSpace: 'pre-line' }}>
                                    Unfortunately your withdrawal request has been rejected.
                                </p>
                                {(req.reason || req.adminRemarks) && (
                                    <div className="bg-white p-3 rounded border border-danger-subtle text-danger mb-2">
                                        <strong>Reason:</strong> {req.reason || req.adminRemarks}
                                    </div>
                                )}
                                <p className="mb-0 text-muted small">
                                    Please update your bank details or resolve the issue and submit a new withdrawal request.
                                </p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="page-content bg-light position-relative">
            {/* Banner Section */}
            <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: `url(${bg1})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Withdrawal History</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item"><Link to="/account/influencer">Influencer</Link></li>
                                <li className="breadcrumb-item">Withdrawal History</li>
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
                                            <li><Link to="/account/influencer">Influencer Dashboard</Link></li>
                                            <li className="active"><Link to="/account/influencer/withdrawals">Withdrawal History</Link></li>
                                            <li><Link to="/account/address">Address</Link></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <section className="col-xl-9 account-wrapper mt-4 mt-xl-0">
                            <div className="card shadow-sm border-0 p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                    <h4 className="mb-0">Withdrawal History</h4>
                                    <div className="d-flex gap-2">
                                        {['ALL', 'Pending', 'Approved', 'Paid', 'Rejected'].map(st => (
                                            <button
                                                key={st}
                                                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => { setStatusFilter(st); setPage(1); }}
                                            >
                                                {st === 'ALL' ? 'All Requests' : st}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="mt-2 text-muted">Loading withdrawal history...</p>
                                    </div>
                                ) : requests.length === 0 ? (
                                    <div className="text-center py-5 bg-light rounded">
                                        <p className="mb-1 fw-bold text-dark">No withdrawal requests found.</p>
                                        <p className="text-muted small mb-0">When you submit a withdrawal request from your Influencer Dashboard, it will appear here.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Request ID</th>
                                                        <th>Request Date</th>
                                                        <th>Amount</th>
                                                        <th>Status</th>
                                                        <th>Paid Date</th>
                                                        <th className="text-end">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {requests.map(req => (
                                                        <tr key={req._id}>
                                                            <td><strong className="text-primary">{req.requestId || req._id}</strong></td>
                                                            <td>{new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                            <td className="fw-bold text-dark">₹{req.amount.toFixed(2)}</td>
                                                            <td>{getStatusBadge(req.status)}</td>
                                                            <td>{req.paidAt ? new Date(req.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                                            <td className="text-end">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                                                    onClick={() => setSelectedRequest(req)}
                                                                >
                                                                    <Eye size={14} /> View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {pagination.pages > 1 && (
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <span className="text-muted small">Showing Page {pagination.page} of {pagination.pages} ({pagination.total} requests)</span>
                                                <div className="btn-group">
                                                    <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                                                    <button className="btn btn-sm btn-outline-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Withdrawal Details Modal */}
            {selectedRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '16px',
                        padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="m-0 fw-bold">Withdrawal Details</h4>
                            <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {renderStatusBanner(selectedRequest)}

                        <div className="row g-3 mb-4">
                            <div className="col-sm-6">
                                <div className="p-3 bg-light rounded border">
                                    <small className="text-muted d-block">Request ID</small>
                                    <strong className="fs-6 text-primary">{selectedRequest.requestId || selectedRequest._id}</strong>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="p-3 bg-light rounded border">
                                    <small className="text-muted d-block">Requested Amount</small>
                                    <strong className="fs-5 text-success">₹{selectedRequest.amount.toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="card border p-3 mb-4">
                            <h6 className="fw-bold mb-3 border-bottom pb-2">Timeline & Status Updates</h6>
                            <div className="row g-2 small">
                                <div className="col-6 col-sm-3">
                                    <span className="text-muted d-block">Requested Date</span>
                                    <strong>{new Date(selectedRequest.requestedAt).toLocaleDateString()}</strong>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <span className="text-muted d-block">Approved Date</span>
                                    <strong>{selectedRequest.approvedAt ? new Date(selectedRequest.approvedAt).toLocaleDateString() : '-'}</strong>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <span className="text-muted d-block">Paid Date</span>
                                    <strong>{selectedRequest.paidAt ? new Date(selectedRequest.paidAt).toLocaleDateString() : '-'}</strong>
                                </div>
                                <div className="col-6 col-sm-3">
                                    <span className="text-muted d-block">Rejected Date</span>
                                    <strong>{selectedRequest.rejectedAt ? new Date(selectedRequest.rejectedAt).toLocaleDateString() : '-'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details Snapshot */}
                        <div className="card border p-3 mb-4 bg-light">
                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-dark">Bank Details Snapshot</h6>
                            {selectedRequest.bankSnapshot ? (
                                <div className="row g-2 small">
                                    <div className="col-sm-6">
                                        <span className="text-muted d-block">Account Holder Name</span>
                                        <strong className="text-dark">{selectedRequest.bankSnapshot.accountHolderName || '-'}</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        <span className="text-muted d-block">Bank Name</span>
                                        <strong className="text-dark">{selectedRequest.bankSnapshot.bankName || '-'}</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        <span className="text-muted d-block">Account Number</span>
                                        <strong className="text-dark">{selectedRequest.bankSnapshot.accountNumber || '-'}</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        <span className="text-muted d-block">IFSC Code</span>
                                        <strong className="text-dark">{selectedRequest.bankSnapshot.ifscCode || '-'}</strong>
                                    </div>
                                    {selectedRequest.bankSnapshot.upiId && (
                                        <div className="col-sm-12">
                                            <span className="text-muted d-block">UPI ID</span>
                                            <strong className="text-dark">{selectedRequest.bankSnapshot.upiId}</strong>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted small mb-0">No bank details snapshot recorded.</p>
                            )}
                        </div>

                        {/* Transaction Reference & Admin Remarks */}
                        {(selectedRequest.transactionReference || selectedRequest.remarks || selectedRequest.adminRemarks || selectedRequest.reason) && (
                            <div className="card border p-3 mb-4">
                                <h6 className="fw-bold mb-3 border-bottom pb-2">Payment Details & Admin Notes</h6>
                                {selectedRequest.transactionReference && (
                                    <div className="mb-2">
                                        <small className="text-muted d-block">Transaction Reference / UTR</small>
                                        <strong className="text-success">{selectedRequest.transactionReference}</strong>
                                    </div>
                                )}
                                {(selectedRequest.adminRemarks || selectedRequest.remarks) && (
                                    <div className="mb-2">
                                        <small className="text-muted d-block">Admin Remarks</small>
                                        <span>{selectedRequest.adminRemarks || selectedRequest.remarks}</span>
                                    </div>
                                )}
                                {selectedRequest.reason && (
                                    <div>
                                        <small className="text-muted d-block">Rejection Reason</small>
                                        <span className="text-danger fw-bold">{selectedRequest.reason}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="d-flex justify-content-end">
                            <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalHistory;
