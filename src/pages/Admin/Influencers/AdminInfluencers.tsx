import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import adminApiClient from '../../../services/adminApiClient';
import { Users, DollarSign, CheckCircle, XCircle, Tag, Search } from 'lucide-react';
import './AdminInfluencers.css';

const AdminInfluencers: React.FC = () => {
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const isAdmin = adminData?.role?.toUpperCase() === 'ADMIN';

    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'list' | 'requests' | 'withdrawals' | 'settings' | 'products'>(() => {
        const tabParam = new URLSearchParams(location.search).get('tab') || location.state?.tab;
        if (tabParam === 'requests' || tabParam === 'list' || tabParam === 'withdrawals' || tabParam === 'settings' || tabParam === 'products') {
            return tabParam as any;
        }
        return 'list';
    });
    const [settings, setSettings] = useState<any>({ influencerDiscountPercent: 20, influencerCommissionPercent: 20, minWithdrawalAmount: 500, influencerEnabled: true });
    const [savingSettings, setSavingSettings] = useState(false);

    const [rejectionModalUser, setRejectionModalUser] = useState<any | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [processingRequest, setProcessingRequest] = useState<boolean>(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
    const [statsLoading, setStatsLoading] = useState<boolean>(false);

    const [products, setProducts] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [editingProductDiscount, setEditingProductDiscount] = useState<{ [productId: string]: string }>({});
    const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

    // Withdrawal Tab State
    const [withdrawalSearch, setWithdrawalSearch] = useState('');
    const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('ALL');
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const [withdrawalPagination, setWithdrawalPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    // Withdrawal Modals
    const [approveModalRequest, setApproveModalRequest] = useState<any | null>(null);
    const [approveRemarksInput, setApproveRemarksInput] = useState('');

    const [rejectModalRequest, setRejectModalRequest] = useState<any | null>(null);
    const [rejectReasonInput, setRejectReasonInput] = useState('');

    const [paidModalRequest, setPaidModalRequest] = useState<any | null>(null);
    const [paidTxnRefInput, setPaidTxnRefInput] = useState('');
    const [paidRemarksInput, setPaidRemarksInput] = useState('');

    const [viewWithdrawalModalRequest, setViewWithdrawalModalRequest] = useState<any | null>(null);

    useEffect(() => {
        fetchData(true);
    }, []);

    useEffect(() => {
        const tabParam = searchParams.get('tab') || location.state?.tab;
        if (tabParam === 'requests' || tabParam === 'list' || tabParam === 'withdrawals' || tabParam === 'settings' || tabParam === 'products') {
            setActiveTab(tabParam as any);
            if (tabParam === 'products') {
                fetchProducts('');
            }
        }
        if (location.key && tabParam !== 'products') {
            fetchData(false);
        }
    }, [location.key, location.search, location.state, searchParams]);

    const handleTabChange = (tab: 'list' | 'requests' | 'withdrawals' | 'settings' | 'products') => {
        setActiveTab(tab);
        setSearchParams({ tab });
        if (tab === 'products') {
            fetchProducts(productSearch);
        }
    };

    const fetchProducts = async (query = '') => {
        setProductsLoading(true);
        try {
            const res = await adminApiClient.get(`/admin/influencers/products?search=${encodeURIComponent(query)}`);
            const fetchedData = res?.data?.data ?? res?.data?.products ?? res?.data;
            if (Array.isArray(fetchedData)) {
                setProducts(fetchedData);
            } else if (fetchedData && typeof fetchedData === 'object' && Array.isArray(fetchedData.products)) {
                setProducts(fetchedData.products);
            } else if (fetchedData && typeof fetchedData === 'object' && Array.isArray(fetchedData.data)) {
                setProducts(fetchedData.data);
            } else {
                setProducts([]);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch products');
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleUpdateProductDiscount = async (productId: string, discountVal: number | null) => {
        setUpdatingProductId(productId);
        try {
            const res = await adminApiClient.put(`/admin/influencers/products/${productId}/discount`, {
                influencerDiscount: discountVal
            });
            if (res.data?.success) {
                toast.success(discountVal !== null && discountVal > 0 ? 'Product influencer discount updated' : 'Product influencer discount removed');
                setProducts((prev: any[]) => Array.isArray(prev) ? prev.map((p: any) => (p && p._id === productId) ? { ...p, influencerDiscount: discountVal || 0 } : p) : []);
                setEditingProductDiscount((prev: any) => {
                    const next = { ...prev };
                    delete next[productId];
                    return next;
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update discount');
        } finally {
            setUpdatingProductId(null);
        }
    };

    const fetchWithdrawals = async (page = 1, status = 'ALL', search = '') => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', String(page));
            queryParams.append('limit', '10');
            if (status !== 'ALL') queryParams.append('status', status);
            if (search.trim()) queryParams.append('search', search.trim());

            const res = await adminApiClient.get(`/admin/influencers/withdrawals?${queryParams.toString()}`);
            if (res.data.success) {
                if (Array.isArray(res.data.data)) {
                    setWithdrawals(res.data.data);
                } else {
                    setWithdrawals(res.data.data || []);
                    if (res.data.pagination) setWithdrawalPagination(res.data.pagination);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch withdrawals');
        }
    };

    const fetchData = async (isInitial = false) => {
        if (isInitial && influencers.length === 0 && requests.length === 0) {
            setLoading(true);
        }
        try {
            const [influencerRes, withdrawalRes, settingsRes, requestsRes] = await Promise.all([
                adminApiClient.get('/admin/influencers'),
                adminApiClient.get('/admin/influencers/withdrawals'),
                adminApiClient.get('/admin/influencers/settings'),
                adminApiClient.get('/admin/influencers/requests')
            ]);
            
            if (influencerRes.data.success) setInfluencers(influencerRes.data.data);
            if (withdrawalRes.data.success) {
                if (Array.isArray(withdrawalRes.data.data)) {
                    setWithdrawals(withdrawalRes.data.data);
                } else {
                    setWithdrawals(withdrawalRes.data.data || []);
                    if (withdrawalRes.data.pagination) setWithdrawalPagination(withdrawalRes.data.pagination);
                }
            }
            if (settingsRes.data.success && settingsRes.data.data) {
                setSettings({ minWithdrawalAmount: 500, ...settingsRes.data.data });
            }
            if (requestsRes.data.success) setRequests(requestsRes.data.data);
        } catch (error: any) {
            if (isInitial) {
                toast.error(error.response?.data?.message || 'Failed to fetch data');
            }
        } finally {
            if (isInitial) {
                setLoading(false);
            }
        }
    };

    const handleApproveWithdrawalSubmit = async () => {
        if (!approveModalRequest) return;
        setProcessingRequest(true);
        try {
            const res = await adminApiClient.post(`/admin/influencers/withdrawals/${approveModalRequest._id}/approve`, {
                remarks: approveRemarksInput.trim()
            });
            if (res.data.success) {
                toast.success('Withdrawal request approved successfully');
                setApproveModalRequest(null);
                setApproveRemarksInput('');
                fetchWithdrawals(withdrawalPage, withdrawalStatusFilter, withdrawalSearch);
                fetchData(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to approve withdrawal request');
        } finally {
            setProcessingRequest(false);
        }
    };

    const handleRejectWithdrawalSubmit = async () => {
        if (!rejectModalRequest) return;
        if (!rejectReasonInput || !rejectReasonInput.trim()) {
            toast.error('Rejection reason is mandatory.');
            return;
        }
        setProcessingRequest(true);
        try {
            const res = await adminApiClient.post(`/admin/influencers/withdrawals/${rejectModalRequest._id}/reject`, {
                reason: rejectReasonInput.trim()
            });
            if (res.data.success) {
                toast.success('Withdrawal request rejected successfully');
                setRejectModalRequest(null);
                setRejectReasonInput('');
                fetchWithdrawals(withdrawalPage, withdrawalStatusFilter, withdrawalSearch);
                fetchData(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reject withdrawal request');
        } finally {
            setProcessingRequest(false);
        }
    };

    const handleMarkPaidSubmit = async () => {
        if (!paidModalRequest) return;
        setProcessingRequest(true);
        try {
            const res = await adminApiClient.post(`/admin/influencers/withdrawals/${paidModalRequest._id}/pay`, {
                transactionReference: paidTxnRefInput.trim(),
                remarks: paidRemarksInput.trim()
            });
            if (res.data.success) {
                toast.success('Withdrawal request marked as Paid successfully');
                setPaidModalRequest(null);
                setPaidTxnRefInput('');
                setPaidRemarksInput('');
                fetchWithdrawals(withdrawalPage, withdrawalStatusFilter, withdrawalSearch);
                fetchData(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to mark withdrawal as Paid');
        } finally {
            setProcessingRequest(false);
        }
    };

    const handleConfirmApprove = (userId: string) => {
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}>Approve this influencer request?</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>Are you sure you want to approve this user as an Influencer?</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                await handleApproveRequest(userId);
                            }}
                            style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Confirm / Approve
                        </button>
                        <button
                            onClick={closeToast as any}
                            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
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
                toastId: `approve-confirm-${userId}`
            }
        );
    };

    const handleApproveRequest = async (userId: string) => {
        setProcessingRequest(true);
        try {
            const res = await adminApiClient.post(`/admin/influencers/requests/${userId}/approve`);
            if (res.data?.success) {
                toast.success('Influencer request approved successfully');
                const updatedUser = res.data.data;
                setRequests((prev: any[]) => prev.map((req: any) => req._id === userId ? (updatedUser || { ...req, influencerRequestStatus: 'APPROVED' }) : req));
                if (updatedUser) {
                    setInfluencers((prev: any[]) => {
                        const exists = prev.some((inf: any) => inf._id === updatedUser._id);
                        return exists ? prev.map((inf: any) => inf._id === updatedUser._id ? updatedUser : inf) : [...prev, updatedUser];
                    });
                }
                fetchData(false);
            } else {
                toast.error('Failed to approve influencer request');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to approve influencer request');
        } finally {
            setProcessingRequest(false);
        }
    };

    const handleRejectRequest = async () => {
        if (!rejectionModalUser) return;
        if (!rejectionReason || rejectionReason.trim().length === 0) {
            toast.error('Please enter a rejection reason.');
            return;
        }
        setProcessingRequest(true);
        try {
            const res = await adminApiClient.post(`/admin/influencers/requests/${rejectionModalUser._id}/reject`, {
                reason: rejectionReason.trim()
            });
            if (res.data?.success) {
                toast.success('Influencer request rejected successfully');
                const updatedUser = res.data.data;
                const targetId = rejectionModalUser._id;
                const reasonUsed = rejectionReason.trim();
                setRequests((prev: any[]) => prev.map((req: any) => req._id === targetId ? (updatedUser || { ...req, influencerRequestStatus: 'REJECTED', influencerRejectionReason: reasonUsed }) : req));
                setRejectionModalUser(null);
                setRejectionReason('');
                fetchData(false);
            } else {
                toast.error('Failed to reject influencer request');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reject influencer request');
        } finally {
            setProcessingRequest(false);
        }
    };

    const openInfluencerDetail = async (user: any) => {
        setSelectedUserDetail(user);
        if (user && (user.isInfluencer || user.influencerRequestStatus === 'APPROVED')) {
            setStatsLoading(true);
            try {
                const res = await adminApiClient.get(`/admin/influencers/${user._id}/stats`);
                if (res.data?.success) {
                    setSelectedUserDetail((prev: any) => prev && prev._id === user._id ? { ...prev, stats: res.data.data } : prev);
                }
            } catch (err) {
                console.error("Failed to load influencer stats:", err);
            } finally {
                setStatsLoading(false);
            }
        }
    };

    const handleConfirmStatusChange = (influencerId: string, _currentStatus: string, targetStatus: string) => {
        const targetLabel = targetStatus === 'Active' ? 'Activate' : targetStatus === 'Inactive' ? 'Inactivate' : 'Block';
        const buttonColor = targetStatus === 'Active' ? '#10b981' : targetStatus === 'Inactive' ? '#f59e0b' : '#ef4444';
        
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}>{targetLabel} Influencer?</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>Are you sure you want to change this influencer's status to <strong>{targetStatus}</strong>?</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                await handleStatusTransition(influencerId, targetStatus);
                            }}
                            style={{ padding: '8px 16px', background: buttonColor, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Confirm / {targetLabel}
                        </button>
                        <button
                            onClick={closeToast as any}
                            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
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
                toastId: `status-confirm-${influencerId}-${targetStatus}`
            }
        );
    };

    const handleStatusTransition = async (influencerId: string, targetStatus: string) => {
        setProcessingRequest(true);
        try {
            const res = await adminApiClient.put(`/admin/influencers/${influencerId}`, {
                influencerStatus: targetStatus
            });
            if (res.data?.success) {
                toast.success(`Influencer status updated to ${targetStatus}`);
                const updatedUser = res.data.data;
                setInfluencers((prev: any[]) => prev.map((inf: any) => inf._id === influencerId ? (updatedUser || { ...inf, influencerStatus: targetStatus }) : inf));
                fetchData(false);
            } else {
                toast.error('Failed to update status');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setProcessingRequest(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (settings.minWithdrawalAmount !== undefined) {
            const minAmt = Number(settings.minWithdrawalAmount);
            if (isNaN(minAmt) || minAmt <= 0) {
                toast.error('Minimum withdrawal amount must be greater than zero.');
                return;
            }
        }
        setSavingSettings(true);
        try {
            const res = await adminApiClient.put('/admin/influencers/settings', settings);
            if (res.data.success) {
                toast.success('Settings updated successfully');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="admin-influencers-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Influencer Management</h2>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'list' ? 'active' : ''}`} onClick={() => handleTabChange('list')}>
                        <Users size={18} className="me-2"/> Influencers
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => handleTabChange('requests')}>
                        <Users size={18} className="me-2"/> Requests
                        {requests.filter((req: any) => !req.influencerRequestStatus || req.influencerRequestStatus === 'PENDING').length > 0 && (
                            <span className="badge bg-danger ms-2">{requests.filter((req: any) => !req.influencerRequestStatus || req.influencerRequestStatus === 'PENDING').length}</span>
                        )}
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => handleTabChange('withdrawals')}>
                        <DollarSign size={18} className="me-2"/> Withdrawal Requests
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabChange('settings')}>
                        <CheckCircle size={18} className="me-2"/> Configuration
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => handleTabChange('products')}>
                        <Tag size={18} className="me-2"/> Product Discounts
                    </button>
                </li>
            </ul>

            {activeTab === 'list' && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Ref Code</th>
                                    <th>Commission %</th>
                                    <th>Wallet Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {influencers.map((inf: any) => {
                                    const status = inf.influencerStatus || 'Active';
                                    const isActive = ['Active', 'ACTIVE'].includes(status);
                                    const isBlocked = ['Blocked', 'BLOCKED'].includes(status);
                                    return (
                                        <tr key={inf._id}>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-start fw-bold text-decoration-none text-primary"
                                                    onClick={() => openInfluencerDetail(inf)}
                                                >
                                                    {inf.displayName || inf.username}
                                                </button>
                                            </td>
                                            <td>{inf.email}</td>
                                            <td>{inf.influencerCode}</td>
                                            <td>{settings.influencerCommissionPercent ?? 20}%</td>
                                            <td>₹{inf.influencerWalletBalance?.toFixed(2) || '0.00'}</td>
                                            <td>
                                                <span className={`badge ${isActive ? 'bg-success' : isBlocked ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                    {status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-info text-white d-flex align-items-center gap-1"
                                                        onClick={() => openInfluencerDetail(inf)}
                                                    >
                                                        Stats
                                                    </button>
                                                    {isActive ? (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-warning text-dark d-flex align-items-center gap-1"
                                                                onClick={() => handleConfirmStatusChange(inf._id, status, 'Inactive')}
                                                                disabled={processingRequest}
                                                            >
                                                                Inactivate
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                                                onClick={() => handleConfirmStatusChange(inf._id, status, 'Blocked')}
                                                                disabled={processingRequest}
                                                            >
                                                                Block
                                                            </button>
                                                        </>
                                                    ) : isBlocked ? (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                                                onClick={() => handleConfirmStatusChange(inf._id, status, 'Active')}
                                                                disabled={processingRequest}
                                                            >
                                                                <CheckCircle size={14}/> Unblock
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-warning text-dark d-flex align-items-center gap-1"
                                                                onClick={() => handleConfirmStatusChange(inf._id, status, 'Inactive')}
                                                                disabled={processingRequest}
                                                            >
                                                                Inactivate
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                                                onClick={() => handleConfirmStatusChange(inf._id, status, 'Active')}
                                                                disabled={processingRequest}
                                                            >
                                                                <CheckCircle size={14}/> Activate
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                                                onClick={() => handleConfirmStatusChange(inf._id, status, 'Blocked')}
                                                                disabled={processingRequest}
                                                            >
                                                                Block
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {influencers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center">No influencers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>User / Email</th>
                                    <th>Phone</th>
                                    <th>Request Date</th>
                                    <th>Social Profiles</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req: any) => {
                                    const status = req.influencerRequestStatus || 'PENDING';
                                    const isPending = status === 'PENDING';
                                    const isApproved = status === 'APPROVED';
                                    const isRejected = status === 'REJECTED';

                                    return (
                                        <tr key={req._id}>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-start fw-bold text-decoration-none text-primary"
                                                    onClick={() => openInfluencerDetail(req)}
                                                >
                                                    {req.displayName || req.username || 'User'}
                                                </button>
                                                <div className="text-muted small">{req.email}</div>
                                            </td>
                                            <td>{req.phoneNumber || req.phone || 'N/A'}</td>
                                            <td>
                                                {req.influencerRequestDate ? new Date(req.influencerRequestDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-1 small">
                                                    {req.influencerSocialProfiles?.facebook ? (
                                                        <a href={req.influencerSocialProfiles.facebook} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                                                            Facebook
                                                        </a>
                                                    ) : <span className="text-muted">No FB</span>}
                                                    {req.influencerSocialProfiles?.instagram ? (
                                                        <a href={req.influencerSocialProfiles.instagram} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                                                            Instagram
                                                        </a>
                                                    ) : <span className="text-muted">No IG</span>}
                                                    {req.influencerSocialProfiles?.youtube ? (
                                                        <a href={req.influencerSocialProfiles.youtube} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                                                            YouTube
                                                        </a>
                                                    ) : <span className="text-muted">No YT</span>}
                                                </div>
                                            </td>
                                            <td>
                                                {isPending && <span className="badge bg-warning text-dark">PENDING</span>}
                                                {isApproved && <span className="badge bg-success">APPROVED</span>}
                                                {isRejected && (
                                                    <span
                                                        className="badge bg-danger"
                                                        style={{ cursor: 'pointer' }}
                                                        title={`Rejection Reason: ${req.influencerRejectionReason || 'No reason provided'}`}
                                                    >
                                                        REJECTED
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {isPending && isAdmin ? (
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                                            onClick={() => handleConfirmApprove(req._id)}
                                                            disabled={processingRequest}
                                                        >
                                                            <CheckCircle size={14}/> Approve
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                                            onClick={() => { setRejectionModalUser(req); setRejectionReason(''); }}
                                                            disabled={processingRequest}
                                                        >
                                                            <XCircle size={14}/> Reject
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4 text-muted">No influencer requests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'withdrawals' && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        {/* Search & Filter Bar */}
                        <div className="row g-3 mb-4 align-items-center">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0"><Search size={16} /></span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder="Search by Request ID, Influencer Name, Email..."
                                        value={withdrawalSearch}
                                        onChange={(e) => {
                                            setWithdrawalSearch(e.target.value);
                                            setWithdrawalPage(1);
                                            fetchWithdrawals(1, withdrawalStatusFilter, e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-7 d-flex justify-content-md-end gap-2 flex-wrap">
                                {['ALL', 'Pending', 'Approved', 'Paid', 'Rejected'].map(st => (
                                    <button
                                        key={st}
                                        className={`btn btn-sm ${withdrawalStatusFilter === st ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => {
                                            setWithdrawalStatusFilter(st);
                                            setWithdrawalPage(1);
                                            fetchWithdrawals(1, st, withdrawalSearch);
                                        }}
                                    >
                                        {st === 'ALL' ? 'All' : st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Request ID</th>
                                        <th>Influencer</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Requested Date</th>
                                        <th>Approved Date</th>
                                        <th>Paid Date</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.map((req: any) => (
                                        <tr key={req._id}>
                                            <td><strong className="text-primary">{req.requestId || req._id}</strong></td>
                                            <td>
                                                <div className="fw-bold">{req.influencerId?.displayName || req.influencerId?.username || req.influencerId?.name || 'N/A'}</div>
                                                <small className="text-muted">{req.influencerId?.email}</small>
                                            </td>
                                            <td className="fw-bold text-dark">₹{req.amount?.toFixed(2)}</td>
                                            <td>
                                                <span className={`badge ${req.status === 'Paid' ? 'bg-success' : req.status === 'Approved' ? 'bg-info text-white' : req.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                            <td>{req.approvedAt ? new Date(req.approvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                            <td>{req.paidAt ? new Date(req.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                            <td className="text-end">
                                                <div className="d-inline-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => setViewWithdrawalModalRequest(req)}
                                                        title="View Request Details"
                                                    >
                                                        Details
                                                    </button>

                                                    {isAdmin && req.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                                                                onClick={() => { setApproveModalRequest(req); setApproveRemarksInput(''); }}
                                                            >
                                                                <CheckCircle size={14} /> Approve
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger d-inline-flex align-items-center gap-1"
                                                                onClick={() => { setRejectModalRequest(req); setRejectReasonInput(''); }}
                                                            >
                                                                <XCircle size={14} /> Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {isAdmin && req.status === 'Approved' && (
                                                        <button
                                                            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                                                            onClick={() => { setPaidModalRequest(req); setPaidTxnRefInput(''); setPaidRemarksInput(''); }}
                                                        >
                                                            <DollarSign size={14} /> Mark as Paid
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {withdrawals.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4 text-muted">No withdrawal requests found matching criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {withdrawalPagination.pages > 1 && (
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <span className="text-muted small">Page {withdrawalPagination.page} of {withdrawalPagination.pages} ({withdrawalPagination.total} total requests)</span>
                                <div className="btn-group">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        disabled={withdrawalPage <= 1}
                                        onClick={() => {
                                            const p = Math.max(1, withdrawalPage - 1);
                                            setWithdrawalPage(p);
                                            fetchWithdrawals(p, withdrawalStatusFilter, withdrawalSearch);
                                        }}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        disabled={withdrawalPage >= withdrawalPagination.pages}
                                        onClick={() => {
                                            const p = withdrawalPage + 1;
                                            setWithdrawalPage(p);
                                            fetchWithdrawals(p, withdrawalStatusFilter, withdrawalSearch);
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="card shadow-sm" style={{ maxWidth: '600px' }}>
                    <div className="card-body">
                        <form onSubmit={handleSaveSettings}>
                            <h5 className="card-title mb-4">Global Influencer Settings</h5>
                            
                            <div className="mb-3">
                                <label className="form-label">Influencer Discount (%)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    min="0" 
                                    max="100"
                                    value={settings.influencerDiscountPercent} 
                                    onChange={(e) => setSettings({...settings, influencerDiscountPercent: Number(e.target.value)})}
                                    required
                                    disabled={!isAdmin}
                                />
                                <div className="form-text">Discount percentage given to customers using an influencer code.</div>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">Influencer Commission (%)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    min="0" 
                                    max="100"
                                    value={settings.influencerCommissionPercent} 
                                    onChange={(e) => setSettings({...settings, influencerCommissionPercent: Number(e.target.value)})}
                                    required
                                    disabled={!isAdmin}
                                />
                                <div className="form-text">Commission percentage awarded to the influencer based on the order's final payable amount.</div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Minimum Withdrawal Amount (₹)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    min="1"
                                    value={settings.minWithdrawalAmount || 500} 
                                    onChange={(e) => setSettings({...settings, minWithdrawalAmount: Number(e.target.value)})}
                                    required
                                    disabled={!isAdmin}
                                />
                                <div className="form-text">Configurable minimum wallet amount required before an influencer can submit a withdrawal request. Default: ₹500.</div>
                            </div>

                            <div className="mb-4 form-check form-switch">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="enableInfluencer" 
                                    checked={settings.influencerEnabled}
                                    onChange={(e) => setSettings({...settings, influencerEnabled: e.target.checked})}
                                    disabled={!isAdmin}
                                />
                                <label className="form-check-label" htmlFor="enableInfluencer">
                                    Enable Influencer Feature System-wide
                                </label>
                            </div>

                            {isAdmin && (
                                <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                                    {savingSettings ? 'Saving...' : 'Save Settings'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                            <div>
                                <h5 className="card-title mb-1">Per-Product Influencer Discounts</h5>
                                <p className="text-muted small mb-0">Set specific flat discount amounts (₹) for individual products when an influencer code is applied. Overrides or layers with standard pricing.</p>
                            </div>
                            <div className="d-flex gap-2" style={{ maxWidth: '350px', width: '100%' }}>
                                <div className="input-group">
                                    <span className="input-group-text bg-white"><Search size={16} /></span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search products by name or SKU..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && fetchProducts(productSearch)}
                                    />
                                    <button className="btn btn-outline-secondary" type="button" onClick={() => fetchProducts(productSearch)}>
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>

                        {productsLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading products...</p>
                            </div>
                        ) : (!Array.isArray(products) || products.length === 0) ? (
                            <div className="text-center py-5 text-muted">
                                <p className="mb-1 fw-medium">No influencer discounts configured yet.</p>
                                <p className="small mb-0">Configure an influencer discount for a product to get started.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Product Name</th>
                                            <th>SKU</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Offer Price</th>
                                            <th>Influencer Discount (₹)</th>
                                            <th>Status</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(products) ? products : []).map((product, index) => {
                                            if (!product || typeof product !== 'object') return null;
                                            const productId = product._id ? String(product._id) : `prod-${index}`;
                                            const currentDiscount = typeof product.influencerDiscount === 'number' && !isNaN(product.influencerDiscount) 
                                                ? product.influencerDiscount 
                                                : (Number(product.influencerDiscount) || 0);
                                            const isEditing = editingProductDiscount[productId] !== undefined;
                                            const editValue = isEditing ? editingProductDiscount[productId] : String(currentDiscount || '');
                                            const priceVal = typeof product.price === 'number' && !isNaN(product.price) 
                                                ? product.price 
                                                : (Number(product.price) || 0);
                                            const offerPriceVal = typeof product.offerPrice === 'number' && !isNaN(product.offerPrice) 
                                                ? product.offerPrice 
                                                : (product.offerPrice !== null && product.offerPrice !== undefined && !isNaN(Number(product.offerPrice)) ? Number(product.offerPrice) : null);

                                            return (
                                                <tr key={productId}>
                                                    <td className="fw-medium">{product.productName || 'Unnamed Product'}</td>
                                                    <td><span className="badge bg-light text-dark border">{product.sku || 'N/A'}</span></td>
                                                    <td>{product.categoryId?.categoryName || (typeof product.categoryId === 'string' ? product.categoryId : 'General')}</td>
                                                    <td>₹{priceVal.toFixed(2)}</td>
                                                    <td>
                                                        {offerPriceVal !== null && offerPriceVal < priceVal ? (
                                                            <span className="text-success fw-bold">₹{offerPriceVal.toFixed(2)}</span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td style={{ width: '180px' }}>
                                                        {isEditing ? (
                                                            <div className="input-group input-group-sm">
                                                                <span className="input-group-text">₹</span>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    value={editValue}
                                                                    onChange={(e) => setEditingProductDiscount((prev: any) => ({ ...prev, [productId]: e.target.value }))}
                                                                />
                                                            </div>
                                                        ) : currentDiscount > 0 ? (
                                                            <span className="badge bg-success-subtle text-success border border-success px-2 py-1 fs-6">
                                                                ₹{currentDiscount.toFixed(2)} OFF
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted small">Global default</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {currentDiscount > 0 ? (
                                                            <span className="badge bg-primary">Custom Active</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">Global %</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        {isEditing ? (
                                                            <div className="d-flex justify-content-end gap-1">
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    disabled={updatingProductId === productId}
                                                                    onClick={() => {
                                                                        const val = editValue.trim() === '' ? 0 : Number(editValue);
                                                                        handleUpdateProductDiscount(productId, val);
                                                                    }}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-light border"
                                                                    onClick={() => setEditingProductDiscount((prev: any) => {
                                                                        const next = { ...prev };
                                                                        delete next[productId];
                                                                        return next;
                                                                    })}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex justify-content-end gap-1">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => setEditingProductDiscount((prev: any) => ({ ...prev, [productId]: String(currentDiscount || '') }))}
                                                                >
                                                                    {currentDiscount > 0 ? 'Edit' : 'Set Discount'}
                                                                </button>
                                                                {currentDiscount > 0 && (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        disabled={updatingProductId === productId}
                                                                        onClick={() => handleUpdateProductDiscount(productId, 0)}
                                                                        title="Remove custom discount and revert to global settings"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionModalUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '12px',
                        padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '90%', maxWidth: '450px'
                    }}>
                        <h5 className="mb-3">Reject Influencer Request</h5>
                        <p className="text-muted small mb-3">
                            Please provide a clear reason for rejecting <strong>{rejectionModalUser.displayName || rejectionModalUser.username || rejectionModalUser.email}</strong>'s influencer application. This reason will be sent to the user via email and shown on their account page.
                        </p>
                        <div className="mb-4">
                            <label className="form-label small fw-bold">Rejection Reason <span className="text-danger">*</span></label>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="e.g., Social profile link inaccessible or does not meet audience criteria."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                            ></textarea>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() => { setRejectionModalUser(null); setRejectionReason(''); }}
                                disabled={processingRequest}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleRejectRequest}
                                disabled={processingRequest || !rejectionReason.trim()}
                            >
                                {processingRequest ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {selectedUserDetail && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '12px',
                        padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '90%', maxWidth: '650px',
                        maxHeight: '85vh', overflowY: 'auto'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                            <h5 className="mb-0">User & Influencer Request Details</h5>
                            <button type="button" className="btn-close" onClick={() => setSelectedUserDetail(null)}></button>
                        </div>

                        {/* User Information */}
                        <div className="mb-4">
                            <h6 className="text-primary fw-bold mb-2">User Information</h6>
                            <div className="row g-2 small">
                                <div className="col-sm-6"><strong>Full Name:</strong> {selectedUserDetail.displayName || selectedUserDetail.username || 'N/A'}</div>
                                <div className="col-sm-6"><strong>Email:</strong> {selectedUserDetail.email || 'N/A'}</div>
                                <div className="col-sm-6"><strong>Phone:</strong> {selectedUserDetail.phoneNumber || selectedUserDetail.phone || 'N/A'}</div>
                                <div className="col-sm-6"><strong>User ID:</strong> {selectedUserDetail._id}</div>
                                <div className="col-sm-6"><strong>Registration Date:</strong> {selectedUserDetail.createdAt ? new Date(selectedUserDetail.createdAt).toLocaleDateString() : 'N/A'}</div>
                            </div>
                        </div>

                        {/* Influencer Request Information */}
                        <div className="mb-4">
                            <h6 className="text-primary fw-bold mb-2">Influencer Request Information</h6>
                            <div className="row g-2 small">
                                <div className="col-sm-6"><strong>Request Date:</strong> {selectedUserDetail.influencerRequestDate ? new Date(selectedUserDetail.influencerRequestDate).toLocaleDateString() : 'N/A'}</div>
                                <div className="col-sm-6">
                                    <strong>Status:</strong>{' '}
                                    <span className={`badge ${selectedUserDetail.influencerRequestStatus === 'APPROVED' ? 'bg-success' : selectedUserDetail.influencerRequestStatus === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                        {selectedUserDetail.influencerRequestStatus || 'PENDING'}
                                    </span>
                                </div>
                                {selectedUserDetail.influencerRequestStatus === 'APPROVED' && (
                                    <div className="col-sm-6"><strong>Approval Date:</strong> {selectedUserDetail.updatedAt ? new Date(selectedUserDetail.updatedAt).toLocaleDateString() : 'N/A'}</div>
                                )}
                                {selectedUserDetail.influencerRequestStatus === 'REJECTED' && (
                                    <>
                                        <div className="col-sm-6"><strong>Rejection Date:</strong> {selectedUserDetail.updatedAt ? new Date(selectedUserDetail.updatedAt).toLocaleDateString() : 'N/A'}</div>
                                        <div className="col-12"><strong>Rejection Reason:</strong> <span className="text-danger">{selectedUserDetail.influencerRejectionReason || 'No reason provided'}</span></div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Social Profiles */}
                        <div className="mb-4">
                            <h6 className="text-primary fw-bold mb-2">Social Profiles</h6>
                            <div className="row g-2 small">
                                <div className="col-12">
                                    <strong>Facebook Profile:</strong>{' '}
                                    {selectedUserDetail.influencerSocialProfiles?.facebook ? (
                                        <a href={selectedUserDetail.influencerSocialProfiles.facebook} target="_blank" rel="noopener noreferrer" className="text-primary">
                                            {selectedUserDetail.influencerSocialProfiles.facebook}
                                        </a>
                                    ) : <span className="text-muted">Not provided</span>}
                                </div>
                                <div className="col-12">
                                    <strong>Instagram Profile:</strong>{' '}
                                    {selectedUserDetail.influencerSocialProfiles?.instagram ? (
                                        <a href={selectedUserDetail.influencerSocialProfiles.instagram} target="_blank" rel="noopener noreferrer" className="text-primary">
                                            {selectedUserDetail.influencerSocialProfiles.instagram}
                                        </a>
                                    ) : <span className="text-muted">Not provided</span>}
                                </div>
                                <div className="col-12">
                                    <strong>YouTube Profile/Channel:</strong>{' '}
                                    {selectedUserDetail.influencerSocialProfiles?.youtube ? (
                                        <a href={selectedUserDetail.influencerSocialProfiles.youtube} target="_blank" rel="noopener noreferrer" className="text-primary">
                                            {selectedUserDetail.influencerSocialProfiles.youtube}
                                        </a>
                                    ) : <span className="text-muted">Not provided</span>}
                                </div>
                            </div>
                        </div>

                        {/* Approved Influencer Details */}
                         {/* Approved Influencer Details */}
                        {selectedUserDetail.influencerRequestStatus === 'APPROVED' && (
                            <div className="mb-3 bg-light p-3 rounded">
                                <h6 className="text-success fw-bold mb-2">Approved Influencer Details</h6>
                                <div className="row g-2 small">
                                    <div className="col-sm-6"><strong>Influencer Code:</strong> <span className="badge bg-secondary">{selectedUserDetail.influencerCode || 'N/A'}</span></div>
                                    <div className="col-sm-6"><strong>Commission %:</strong> {settings.influencerCommissionPercent ?? 20}%</div>
                                    <div className="col-12 text-truncate">
                                        <strong>Referral Link:</strong>{' '}
                                        <a href={`${window.location.origin}?ref=${selectedUserDetail.influencerCode || ''}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                                            {`${window.location.origin}?ref=${selectedUserDetail.influencerCode || ''}`}
                                        </a>
                                    </div>
                                    <div className="col-sm-4"><strong>Wallet Balance:</strong> ₹{selectedUserDetail.influencerWalletBalance?.toFixed(2) || '0.00'}</div>
                                    <div className="col-sm-4"><strong>Total Earned:</strong> ₹{selectedUserDetail.influencerTotalEarned?.toFixed(2) || '0.00'}</div>
                                    <div className="col-sm-4"><strong>Total Withdrawn:</strong> ₹{selectedUserDetail.influencerTotalWithdrawn?.toFixed(2) || '0.00'}</div>
                                </div>
                            </div>
                        )}

                        {/* Comprehensive Analytics & Performance */}
                        {(selectedUserDetail.isInfluencer || selectedUserDetail.influencerRequestStatus === 'APPROVED') && (
                            <div className="mt-4 pt-3 border-top">
                                <h6 className="text-primary fw-bold mb-3">Influencer Analytics & Performance</h6>
                                {statsLoading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading Stats...</span>
                                        </div>
                                        <p className="text-muted small mt-2">Loading performance metrics...</p>
                                    </div>
                                ) : selectedUserDetail.stats ? (
                                    <div>
                                        <div className="row g-2 mb-3">
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center bg-light">
                                                    <small className="text-muted d-block">Referral Visits</small>
                                                    <strong className="fs-6 text-dark">{selectedUserDetail.stats.referralVisits || 0}</strong>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center bg-light">
                                                    <small className="text-muted d-block">Unique Customers</small>
                                                    <strong className="fs-6 text-success">{selectedUserDetail.stats.uniqueCustomers || 0}</strong>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center bg-light">
                                                    <small className="text-muted d-block">Total Orders</small>
                                                    <strong className="fs-6 text-primary">{selectedUserDetail.stats.totalOrders || 0}</strong>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center bg-light">
                                                    <small className="text-muted d-block">Total Sales</small>
                                                    <strong className="fs-6 text-info">₹{Number(selectedUserDetail.stats.totalSales || 0).toFixed(2)}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-2 mb-3">
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center">
                                                    <small className="text-muted d-block">Completed</small>
                                                    <span className="fw-bold text-success">{selectedUserDetail.stats.completedOrders || 0}</span>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center">
                                                    <small className="text-muted d-block">Pending</small>
                                                    <span className="fw-bold text-warning">{selectedUserDetail.stats.pendingOrders || 0}</span>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center">
                                                    <small className="text-muted d-block">Cancelled</small>
                                                    <span className="fw-bold text-secondary">{selectedUserDetail.stats.cancelledOrders || 0}</span>
                                                </div>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <div className="p-2 border rounded text-center">
                                                    <small className="text-muted d-block">Returned</small>
                                                    <span className="fw-bold text-danger">{selectedUserDetail.stats.returnedOrders || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-2 mb-4">
                                            <div className="col-sm-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <small className="text-muted d-block">Pending Commission</small>
                                                    <strong className="text-warning">₹{Number(selectedUserDetail.stats.pendingCommission || 0).toFixed(2)}</strong>
                                                </div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <small className="text-muted d-block">Approved Commission</small>
                                                    <strong className="text-success">₹{Number(selectedUserDetail.stats.approvedCommission || 0).toFixed(2)}</strong>
                                                </div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="p-2 border rounded bg-light">
                                                    <small className="text-muted d-block">Wallet Balance</small>
                                                    <strong className="text-primary">₹{Number(selectedUserDetail.stats.walletBalance || 0).toFixed(2)}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <h6 className="fw-bold small text-dark mb-2">Top Selling Products</h6>
                                        {(!selectedUserDetail.stats.topProducts || selectedUserDetail.stats.topProducts.length === 0) ? (
                                            <p className="text-muted small mb-3">No products sold yet via this referral code.</p>
                                        ) : (
                                            <div className="table-responsive mb-3">
                                                <table className="table table-sm table-bordered small">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Product</th>
                                                            <th className="text-center">Sold</th>
                                                            <th className="text-end">Revenue</th>
                                                            <th className="text-end">Commission</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedUserDetail.stats.topProducts.map((p: any, idx: number) => (
                                                            <tr key={p._id || idx}>
                                                                <td>{p.productName || `Product #${p._id}`}</td>
                                                                <td className="text-center">{p.totalSold}</td>
                                                                <td className="text-end">₹{Number(p.totalRevenue || 0).toFixed(2)}</td>
                                                                <td className="text-end text-success fw-bold">₹{Number(p.totalCommission || 0).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <h6 className="fw-bold small text-dark mb-2">Recent Orders ({selectedUserDetail.stats.recentOrders?.length || 0})</h6>
                                        {(!selectedUserDetail.stats.recentOrders || selectedUserDetail.stats.recentOrders.length === 0) ? (
                                            <p className="text-muted small mb-0">No recent orders found.</p>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover small mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Order ID</th>
                                                            <th>Date</th>
                                                            <th className="text-end">Commission</th>
                                                            <th className="text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedUserDetail.stats.recentOrders.map((o: any) => (
                                                            <tr key={o._id}>
                                                                <td><strong>{o.orderId}</strong></td>
                                                                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                                                                <td className="text-end">₹{Number(o.influencerCommissionAmount || 0).toFixed(2)}</td>
                                                                <td className="text-center">
                                                                    <span className={`badge ${o.influencerCommissionStatus === 'APPROVED' ? 'bg-success' : 'bg-warning text-dark'} rounded-pill`}>
                                                                        {o.influencerCommissionStatus}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted small">Analytics not available or account not yet approved.</p>
                                )}
                            </div>
                        )}

                        <div className="d-flex justify-content-end mt-4">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setSelectedUserDetail(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Withdrawal Modal */}
            {approveModalRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px'
                }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px' }}>
                        <h4 className="fw-bold mb-3">Approve Withdrawal Request</h4>
                        <p className="text-muted small">
                            Approving request <strong>{approveModalRequest.requestId || approveModalRequest._id}</strong> for <strong>₹{approveModalRequest.amount?.toFixed(2)}</strong>.
                        </p>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Admin Remarks <small className="text-muted">(Optional)</small></label>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Enter optional internal notes or instructions for finance team..."
                                value={approveRemarksInput}
                                onChange={(e) => setApproveRemarksInput(e.target.value)}
                            />
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setApproveModalRequest(null)} disabled={processingRequest}>Cancel</button>
                            <button className="btn btn-success" onClick={handleApproveWithdrawalSubmit} disabled={processingRequest}>
                                {processingRequest ? 'Approving...' : 'Confirm Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Withdrawal Modal */}
            {rejectModalRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px'
                }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px' }}>
                        <h4 className="fw-bold text-danger mb-3">Reject Withdrawal Request</h4>
                        <p className="text-muted small">
                            Rejecting request <strong>{rejectModalRequest.requestId || rejectModalRequest._id}</strong> for <strong>₹{rejectModalRequest.amount?.toFixed(2)}</strong>. Funds in hold will be returned to the influencer's wallet balance.
                        </p>
                        <div className="mb-3">
                            <label className="form-label fw-bold text-danger">Rejection Reason <span className="text-danger">* (Mandatory)</span></label>
                            <textarea
                                className="form-control border-danger"
                                rows={3}
                                placeholder="State clear reason (e.g., Incorrect bank details, Duplicate request...)"
                                value={rejectReasonInput}
                                onChange={(e) => setRejectReasonInput(e.target.value)}
                                required
                            />
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setRejectModalRequest(null)} disabled={processingRequest}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleRejectWithdrawalSubmit} disabled={processingRequest}>
                                {processingRequest ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mark as Paid Modal */}
            {paidModalRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px'
                }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px' }}>
                        <h4 className="fw-bold text-primary mb-3">Mark Withdrawal as Paid</h4>
                        <p className="text-muted small">
                            Complete payment transfer of <strong>₹{paidModalRequest.amount?.toFixed(2)}</strong> for request <strong>{paidModalRequest.requestId || paidModalRequest._id}</strong>.
                        </p>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Transaction Reference / UTR Number <small className="text-muted">(Optional)</small></label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. UTR1234987650"
                                value={paidTxnRefInput}
                                onChange={(e) => setPaidTxnRefInput(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Remarks <small className="text-muted">(Optional)</small></label>
                            <textarea
                                className="form-control"
                                rows={2}
                                placeholder="Payment notes..."
                                value={paidRemarksInput}
                                onChange={(e) => setPaidRemarksInput(e.target.value)}
                            />
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setPaidModalRequest(null)} disabled={processingRequest}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleMarkPaidSubmit} disabled={processingRequest}>
                                {processingRequest ? 'Processing...' : 'Mark as Paid'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Withdrawal Details Modal */}
            {viewWithdrawalModalRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px'
                }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h4 className="fw-bold mb-3">Withdrawal Request Details</h4>
                        <div className="row g-3 mb-3">
                            <div className="col-6">
                                <small className="text-muted d-block">Request ID</small>
                                <strong>{viewWithdrawalModalRequest.requestId || viewWithdrawalModalRequest._id}</strong>
                            </div>
                            <div className="col-6">
                                <small className="text-muted d-block">Status</small>
                                <span className={`badge ${viewWithdrawalModalRequest.status === 'Paid' ? 'bg-success' : viewWithdrawalModalRequest.status === 'Approved' ? 'bg-info text-white' : viewWithdrawalModalRequest.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                    {viewWithdrawalModalRequest.status}
                                </span>
                            </div>
                            <div className="col-6">
                                <small className="text-muted d-block">Influencer</small>
                                <strong>{viewWithdrawalModalRequest.influencerId?.displayName || viewWithdrawalModalRequest.influencerId?.name} ({viewWithdrawalModalRequest.influencerId?.email})</strong>
                            </div>
                            <div className="col-6">
                                <small className="text-muted d-block">Amount</small>
                                <strong className="fs-5 text-success">₹{viewWithdrawalModalRequest.amount?.toFixed(2)}</strong>
                            </div>
                        </div>

                        {/* Bank Details Snapshot */}
                        <div className="card p-3 bg-light mb-3 border">
                            <h6 className="fw-bold mb-2">Bank Details Snapshot</h6>
                            {viewWithdrawalModalRequest.bankSnapshot ? (
                                <div className="row g-2 small">
                                    <div className="col-6"><strong>Holder:</strong> {viewWithdrawalModalRequest.bankSnapshot.accountHolderName || '-'}</div>
                                    <div className="col-6"><strong>Bank:</strong> {viewWithdrawalModalRequest.bankSnapshot.bankName || '-'}</div>
                                    <div className="col-6"><strong>Account No:</strong> {viewWithdrawalModalRequest.bankSnapshot.accountNumber || '-'}</div>
                                    <div className="col-6"><strong>IFSC:</strong> {viewWithdrawalModalRequest.bankSnapshot.ifscCode || '-'}</div>
                                    {viewWithdrawalModalRequest.bankSnapshot.upiId && <div className="col-12"><strong>UPI ID:</strong> {viewWithdrawalModalRequest.bankSnapshot.upiId}</div>}
                                </div>
                            ) : <p className="text-muted small mb-0">No bank details snapshot available.</p>}
                        </div>

                        {/* Audit Timelines & Transaction Info */}
                        <div className="card p-3 mb-3 border">
                            <h6 className="fw-bold mb-2">Timeline & Audit</h6>
                            <div className="row g-2 small text-muted">
                                <div className="col-6">Requested: {viewWithdrawalModalRequest.requestedAt ? new Date(viewWithdrawalModalRequest.requestedAt).toLocaleString() : '-'}</div>
                                <div className="col-6">Approved: {viewWithdrawalModalRequest.approvedAt ? new Date(viewWithdrawalModalRequest.approvedAt).toLocaleString() : '-'}</div>
                                <div className="col-6">Paid: {viewWithdrawalModalRequest.paidAt ? new Date(viewWithdrawalModalRequest.paidAt).toLocaleString() : '-'}</div>
                                <div className="col-6">Rejected: {viewWithdrawalModalRequest.rejectedAt ? new Date(viewWithdrawalModalRequest.rejectedAt).toLocaleString() : '-'}</div>
                            </div>
                            {viewWithdrawalModalRequest.transactionReference && (
                                <div className="mt-2 text-dark"><strong>Txn Ref / UTR:</strong> {viewWithdrawalModalRequest.transactionReference}</div>
                            )}
                            {(viewWithdrawalModalRequest.remarks || viewWithdrawalModalRequest.adminRemarks) && (
                                <div className="mt-1 text-dark"><strong>Remarks:</strong> {viewWithdrawalModalRequest.remarks || viewWithdrawalModalRequest.adminRemarks}</div>
                            )}
                            {viewWithdrawalModalRequest.reason && (
                                <div className="mt-1 text-danger"><strong>Rejection Reason:</strong> {viewWithdrawalModalRequest.reason}</div>
                            )}
                        </div>

                        <div className="d-flex justify-content-end">
                            <button className="btn btn-secondary" onClick={() => setViewWithdrawalModalRequest(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInfluencers;
