import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, FileText } from 'lucide-react';
import apiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';

const AdminOrders: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Status Update State
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showModal, setShowModal] = useState<'ship' | 'cancel' | 'return' | 'confirm' | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [newStatus, setNewStatus] = useState('');
    const [agencies, setAgencies] = useState<any[]>([]);
    const [reason, setReason] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [viewReason, setViewReason] = useState<{ id: string, text: string } | null>(null);
    const [shippingData, setShippingData] = useState({
        agencyName: '',
        trackingNumber: '',
        agencyUrl: ''
    });

    // Refund Logic States
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [processingRefund, setProcessingRefund] = useState(false);
    const [refundAmount, setRefundAmount] = useState(0);

    useEffect(() => {
        fetchOrders();
        fetchAgencies();

        // Close dropdown on outside click
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Tracking URL Logic (Replicated from AdminOrderDetails)
    useEffect(() => {
        if (shippingData.agencyName) {
            const agency = agencies.find(a => a.name === shippingData.agencyName);
            const template = agency?.trackingUrlTemplate || (agency as any)?.url;

            if (template) {
                let generatedUrl = template;
                if (shippingData.trackingNumber) {
                    if (template.includes('[TRACKING_ID]')) {
                        generatedUrl = template.replace('[TRACKING_ID]', shippingData.trackingNumber);
                    } else {
                        const hasParams = template.includes('?');
                        const endsWithSpecial = template.endsWith('=') || template.endsWith('/');
                        if (endsWithSpecial) {
                            generatedUrl = template + shippingData.trackingNumber;
                        } else {
                            generatedUrl = template + (hasParams ? '&id=' : '/') + shippingData.trackingNumber;
                        }
                    }
                }
                if (generatedUrl !== shippingData.agencyUrl) {
                    setShippingData(prev => ({ ...prev, agencyUrl: generatedUrl }));
                }
            } else if (shippingData.agencyUrl) {
                setShippingData(prev => ({ ...prev, agencyUrl: '' }));
            }
        }
    }, [shippingData.agencyName, shippingData.trackingNumber, agencies, shippingData.agencyUrl]);

    const fetchAgencies = async () => {
        try {
            const res = await apiClient.get('/admin/shipping-agencies');
            if (res.data.success) {
                setAgencies(res.data.data.filter((a: any) => a.isActive));
            }
        } catch (error) {
            console.error('Failed to fetch agencies');
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/orders');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalStatusChange = (order: any, s: string) => {
        setSelectedOrder(order);
        setNewStatus(s);

        // Find existing reason if updating to 'Returned' or if status is currently 'Return' or 'Cancelled'
        const findReason = () => {
            // Check products for cancellation/return reasons
            for (const p of order.orderedProducts || []) {
                if (p.cancellation?.reason) return p.cancellation.reason;
                if (p.returnStatus?.reason) return p.returnStatus.reason;
            }
            // Check history
            const historyWithReason = order.statusHistory?.slice().reverse().find((h: any) => h.comment || h.reason);
            if (historyWithReason) return historyWithReason.comment || historyWithReason.reason;

            return '';
        };

        const existingReason = findReason();
        setReason(existingReason);
        setShippingData({ agencyName: '', trackingNumber: '', agencyUrl: '' });

        if (s === 'Shipped') {
            setShowModal('ship');
        } else if (s === 'Cancelled') {
            setShowModal('cancel');
        } else if (s === 'Returned' || s === 'Return') {
            setShowModal('return');
        } else {
            setShowModal('confirm');
        }
    };

    const confirmStatusUpdate = async () => {
        if (!selectedOrder || !newStatus) return;

        // Validation
        if (newStatus === 'Shipped') {
            if (!shippingData.agencyName || !shippingData.trackingNumber) {
                toast.warn('Please provide shipping agency and tracking number');
                return;
            }
        }
        if ((newStatus === 'Cancelled' || newStatus === 'Returned' || newStatus === 'Return') && !reason.trim()) {
            toast.warn('Please provide a reason');
            return;
        }

        setUpdatingStatus(true);
        try {
            const res = await apiClient.patch(`/admin/orders/${selectedOrder._id}/status`, {
                status: newStatus,
                reason: reason,
                shippingDetails: newStatus === 'Shipped' ? shippingData : undefined
            });

            if (res.data.success) {
                toast.success(`Order ${selectedOrder.orderId} status updated to ${newStatus}`);
                fetchOrders(); // Refresh list
                setShowModal(null);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handlePaymentStatusUpdate = async (orderId: string, status: string, amount?: number) => {
        setProcessingRefund(true);
        try {
            const res = await apiClient.patch(`/admin/orders/${orderId}/payment-status`, {
                status,
                refundedAmount: amount
            });

            if (res.data.success) {
                toast.success(`Payment status updated to ${status}`);
                fetchOrders();
                setShowRefundModal(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update payment status');
        } finally {
            setProcessingRefund(false);
        }
    };

    const getLogicalStatuses = (currentStatus: string) => {
        const s = currentStatus?.toUpperCase()?.replace(/_/g, ' ') || '';

        // Final states - no more changes allowed
        if (s.includes('DELIVERED') || s.includes('COMPLETED') || s.includes('CANCELLED') || s.includes('RETURNED')) {
            return [];
        }

        // Logic transitions
        if (s.includes('RETURNED')) return [];
        if (s.includes('RETURN')) return ['Returned'];
        if (s.includes('PLACED')) return ['Processing', 'Cancelled'];
        if (s.includes('PROCESSING')) return ['Shipped', 'Delivered', 'Cancelled'];
        if (s.includes('SHIPPED')) return ['Delivered', 'Cancelled'];
        if (s.includes('CANCELLATION REQUEST')) return ['Cancelled'];
        if (s.includes('RETURN REQUEST')) return ['Returned'];

        return []; // Default to no transitions for terminal/unknown states
    };

    const getStatusBadge = (status: string, order?: any) => {
        const s = status?.toUpperCase()?.replace(/_/g, ' ');
        const availableStatuses = order ? getLogicalStatuses(order.globalOrderStatus || 'PLACED') : [];
        const isClickable = order && availableStatuses.length > 0;

        const badgeProps = {
            className: `admin-badge ${isClickable ? 'clickable-badge' : ''} ${s.includes('PROCESSING') ? 'badge-processing' :
                s.includes('SHIPPED') ? 'badge-info' :
                    s.includes('PLACED') ? 'badge-placed' : ''
                }`,
            style: isClickable ? { cursor: 'pointer', transition: 'all 0.2s' } : { cursor: 'default' },
            onClick: (e: React.MouseEvent) => {
                if (isClickable) {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === order._id ? null : order._id);
                }
            }
        };

        const renderBadge = (content: string, className: string, style?: any) => {
            const isCancelledOrReturned = s.includes('CANCELLED') || s.includes('RETURN') || s.includes('CANCELLATION');
            const reasonText = order?.orderedProducts?.find((p: any) =>
                (p.orderStatus?.toUpperCase()?.replace(/_/g, ' ') === s ||
                    (s === 'RETURNED' && (p.orderStatus === 'Return' || p.orderStatus === 'Return Request')) ||
                    (s === 'CANCELLED' && p.orderStatus === 'Cancellation Request') ||
                    (s === 'PARTIALLY RETURNED' && (p.orderStatus === 'Return' || p.orderStatus === 'Returned' || p.orderStatus === 'Return Request'))) &&
                (p.cancellation?.reason || p.returnStatus?.reason)
            )?.cancellation?.reason ||
                order?.orderedProducts?.find((p: any) => p.returnStatus?.reason)?.returnStatus?.reason ||
                order?.orderHistory?.find((h: any) => h.comment)?.comment;

            return (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <span
                        className={`admin-badge ${className} ${badgeProps.className}`}
                        style={{ ...style, ...badgeProps.style }}
                        onClick={(e) => {
                            if (isClickable) {
                                e.stopPropagation();
                                setViewReason(null); // Hide reason if opening dropdown
                                badgeProps.onClick(e);
                            } else if (isCancelledOrReturned && reasonText) {
                                e.stopPropagation();
                                setViewReason(viewReason && viewReason.id === order._id ? null : { id: order._id, text: reasonText });
                            }
                        }}
                        onMouseEnter={() => {
                            if (isCancelledOrReturned && reasonText) {
                                setViewReason({ id: order._id, text: reasonText });
                            }
                        }}
                        onMouseLeave={() => setViewReason(null)}
                    >
                        {content}
                    </span>
                    {viewReason && viewReason.id === order._id && (
                        <div className="reason-popup">
                            <div className="reason-popup-arrow"></div>
                            <strong>Reason:</strong> {viewReason.text}
                        </div>
                    )}
                </div>
            );
        };

        switch (s) {
            case 'SHIPPED':
            case 'PARTIALLY SHIPPED':
                return renderBadge(s, 'badge-info');
            case 'PROCESSING':
            case 'PARTIALLY PROCESSING':
                return renderBadge(s, 'badge-warning', { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' });
            case 'DELIVERED':
            case 'COMPLETED':
            case 'PARTIALLY DELIVERED':
                return renderBadge(s, 'badge-success');
            case 'CANCELLED':
            case 'PARTIALLY CANCELLED':
                return renderBadge(s, 'badge-danger');
            case 'PLACED':
            case 'ORDER PLACED':
                return renderBadge(s, 'badge-info', { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' });
            case 'RETURN':
            case 'PARTIALLY RETURNED':
            case 'RETURNED':
                return renderBadge(s, 'badge-dark', { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' });
            case 'RETURN REQUEST':
                return renderBadge(s, 'badge-warning', { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' });
            case 'CANCELLATION REQUEST':
                return renderBadge(s, 'badge-warning', { backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' });
            default: return renderBadge(s || status, '');
        }
    };

    const getPaymentBadge = (status: string, order?: any) => {
        const isRefundPending = status === 'Refund_Pending';
        const label = status === 'Refund_Pending'
            ? 'Refund Pending'
            : (status === 'Refunded' ? 'Refunded' : (['Paid', 'Success', 'Completed'].includes(status) ? 'Paid' : status));

        let badgeClass = 'badge-secondary';
        if (['Paid', 'Success', 'Completed'].includes(status)) badgeClass = 'badge-success';
        if (status === 'Failed' || status === 'Cancelled') badgeClass = 'badge-danger';
        if (status === 'Pending' || status === 'Refund_Pending') badgeClass = 'badge-warning';
        if (status === 'Refunded' || status === 'Returned') badgeClass = 'badge-info';

        return (
            <span
                className={`admin-badge ${badgeClass} ${isRefundPending ? 'clickable-badge' : ''}`}
                style={{
                    fontWeight: 700,
                    cursor: isRefundPending ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    ...(status === 'Refunded' ? { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' } : {})
                }}
                onClick={(e) => {
                    if (isRefundPending) {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        setRefundAmount(order.totalAmount);
                        setShowRefundModal(true);
                    }
                }}
            >
                {label}
            </span>
        );
    };

    const filteredOrders = orders.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.userId?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Orders</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin secondary" style={{ backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Download size={18} /> Export CSV
                    </button>
                    <button className="btn-primary-admin">
                        <FileText size={18} /> New Order
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="action-btn" title="Filters">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="admin-table-container" style={{ paddingBottom: '100px' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Refund</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No orders found</td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>{order.orderId}</td>
                                        <td>
                                            <div className="product-info">
                                                <img className="product-img" style={{ borderRadius: '50%' }} src={order.userId?.imageUrl || '/images/profile4.jpg'} alt={order.userId?.displayName} />
                                                <div>
                                                    <div className="product-name">{order.userId?.displayName || 'Unknown Customer'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.userId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{formatDate(order.createdAt)}</td>
                                        <td style={{ fontWeight: 700 }}>₹{order.totalAmount.toFixed(2)}</td>
                                        <td style={{ fontWeight: 600, color: order.refundedAmount > 0 || order.returnedAmount > 0 ? '#dc2626' : '#94a3b8' }}>
                                            {order.refundedAmount > 0 ? `₹${order.refundedAmount.toFixed(2)}` : (order.returnedAmount > 0 ? `₹${order.returnedAmount.toFixed(2)}` : '—')}
                                        </td>
                                        <td>{getPaymentBadge(order.paymentStatus, order)}</td>
                                        <td style={{ position: 'relative' }}>
                                            {getStatusBadge(order.globalOrderStatus || 'PLACED', order)}

                                            {openDropdownId === order._id && (
                                                <div className={`status-dropdown-menu ${filteredOrders.indexOf(order) >= filteredOrders.length - 3 && filteredOrders.length > 3 ? 'open-top' : ''}`}>
                                                    <div className="dropdown-title">Quick Status Change</div>

                                                    {/* Show Reason if available */}
                                                    {(() => {
                                                        const r = order?.orderedProducts?.find((p: any) => p.cancellation?.reason || p.returnStatus?.reason)?.cancellation?.reason ||
                                                            order?.orderedProducts?.find((p: any) => p.returnStatus?.reason)?.returnStatus?.reason ||
                                                            order?.statusHistory?.slice().reverse().find((h: any) => h.comment || h.reason)?.comment;
                                                        if (r) {
                                                            return (
                                                                <div className="dropdown-reason-info" style={{
                                                                    padding: '8px 12px',
                                                                    fontSize: '0.75rem',
                                                                    backgroundColor: '#fef3c7',
                                                                    color: '#92400e',
                                                                    borderBottom: '1px solid #fde68a',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    <strong>Note:</strong> {r}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {getLogicalStatuses(order.globalOrderStatus || 'PLACED').map(status => (
                                                        <div
                                                            key={status}
                                                            className="dropdown-item"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleGlobalStatusChange(order, status);
                                                                setOpenDropdownId(null);
                                                            }}
                                                        >
                                                            {status}
                                                        </div>
                                                    ))}
                                                    {getLogicalStatuses(order.globalOrderStatus || 'PLACED').length === 0 && (
                                                        <div className="dropdown-item disabled" style={{ color: '#94a3b8', cursor: 'default' }}>No transitions allowed</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="action-btn"
                                                    title="View Details"
                                                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button className="action-btn" title="Invoice">
                                                    <FileText size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Update Modals */}
            {showModal && (
                <div className="cancellation-reason-overlay">
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '500px' }}>
                        <h5 className="fw-bold mb-3">
                            {showModal === 'ship' ? 'Global Shipped Update' :
                                showModal === 'cancel' ? 'Global Cancel Update' :
                                    showModal === 'return' ? 'Global Return Update' : 'Confirm Global Update'}
                        </h5>

                        <div className="alert alert-warning mb-4" style={{ fontSize: '0.85rem', border: '1px solid #fde68a', backgroundColor: '#fffbeb', borderRadius: '12px', padding: '12px' }}>
                            <strong>Notice:</strong> This will change the status of <strong>ALL products</strong> in order <strong>#{selectedOrder?.orderId}</strong> to <strong>{newStatus.toUpperCase()}</strong>.
                        </div>

                        {showModal === 'ship' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Shipping Agency</label>
                                    <select
                                        className="admin-input w-100"
                                        value={shippingData.agencyName}
                                        onChange={(e) => {
                                            const agency = agencies.find(a => a.name === e.target.value);
                                            setShippingData({ ...shippingData, agencyName: e.target.value, agencyUrl: agency?.trackingUrlTemplate || '' });
                                        }}
                                    >
                                        <option value="">Select Agency</option>
                                        {agencies.map(a => (
                                            <option key={a._id} value={a.name}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Tracking Number</label>
                                    <input
                                        type="text"
                                        className="admin-input w-100"
                                        placeholder="Enter tracking number"
                                        value={shippingData.trackingNumber}
                                        onChange={(e) => setShippingData({ ...shippingData, trackingNumber: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold small">Tracking URL</label>
                                    <div className="admin-input w-100" style={{ backgroundColor: '#f8fafc', fontSize: '0.8rem', wordBreak: 'break-all', minHeight: '40px' }}>
                                        {shippingData.agencyUrl || 'Auto-generated'}
                                    </div>
                                </div>
                            </>
                        )}

                        {(showModal === 'cancel' || showModal === 'return') && (
                            <div className="mb-4">
                                <label className="form-label fw-bold small">
                                    {showModal === 'return' ? 'Return Reason (from customer/admin)' : 'Cancellation Reason'}
                                </label>
                                <textarea
                                    className="admin-input w-100"
                                    rows={3}
                                    placeholder={showModal === 'return' ? "Customer return reason will appear here..." : "Enter reason for cancellation..."}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    style={{ border: reason.trim() === '' ? '1px solid #ef4444' : '1px solid #e2e8f0' }}
                                />
                                {reason.trim() === '' && (
                                    <div className="text-danger small mt-1">Reason is required to proceed.</div>
                                )}
                            </div>
                        )}

                        {showModal === 'confirm' && (
                            <p className="mb-4">Are you sure you want to update the entire order to <strong>{newStatus}</strong>?</p>
                        )}

                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px' }} onClick={() => setShowModal(null)} disabled={updatingStatus}>Cancel</button>
                            <button
                                className={`btn ${showModal === 'cancel' ? 'btn-danger' : 'btn-primary'}`}
                                style={{ borderRadius: '12px', minWidth: '120px' }}
                                onClick={confirmStatusUpdate}
                                disabled={updatingStatus}
                            >
                                {updatingStatus ? 'Updating...' : 'Confirm Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRefundModal && (
                <div className="cancellation-reason-overlay">
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '400px' }}>
                        <h5 className="fw-bold mb-3">Process Refund</h5>
                        <p className="small text-muted mb-4">
                            Please confirm that you have processed the refund for order <strong>#{selectedOrder?.orderId}</strong>.
                        </p>
                        <div className="mb-4">
                            <label className="form-label fw-bold small">Refund Amount (₹)</label>
                            <input
                                type="number"
                                className="admin-input w-100"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px' }} onClick={() => setShowRefundModal(false)} disabled={processingRefund}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ borderRadius: '12px', minWidth: '130px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                                onClick={() => handlePaymentStatusUpdate(selectedOrder?._id, 'Refunded', refundAmount)}
                                disabled={processingRefund}
                            >
                                {processingRefund ? 'Processing...' : 'Mark as Refunded'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .cancellation-reason-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center; z-index: 9999;
                }
                .cancellation-reason-box {
                    width: 100%; border-radius: 24px !important; box-shadow: 0 30px 60px rgba(0,0,0,0.15) !important;
                }
                .admin-input {
                    border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-size: 0.95rem; outline: none;
                }
                .admin-input:focus { border-color: var(--admin-primary); box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); }

                .clickable-badge {
                    transition: all 0.2s ease;
                    border: 1px solid transparent !important;
                }
                .clickable-badge:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    filter: brightness(0.95);
                    border-color: rgba(0,0,0,0.1) !important;
                }
                
                .status-dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 5px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                    z-index: 1000;
                    min-width: 160px;
                    overflow: hidden;
                    animation: slideDown 0.2s ease;
                }
                
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .dropdown-title {
                    padding: 10px 15px;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #94a3b8;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 700;
                }
                
                .dropdown-item {
                    padding: 10px 15px;
                    font-size: 0.85rem;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .dropdown-item:hover {
                    background-color: #f1f5f9;
                    color: var(--admin-primary);
                    padding-left: 20px;
                }

                .status-dropdown-menu.open-top {
                    top: auto;
                    bottom: 100%;
                    margin-top: 0;
                    margin-bottom: 8px;
                    animation: slideUpDropdown 0.2s ease;
                }
                
                @keyframes slideUpDropdown {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .reason-popup {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 10px;
                    background: #1e293b;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    white-space: normal;
                    width: 200px;
                    z-index: 1001;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    pointer-events: none;
                }
                
                .reason-popup-arrow {
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 6px;
                    border-style: solid;
                    border-color: #1e293b transparent transparent transparent;
                }

                .admin-badge.badge-return {
                    background-color: #fef3c7;
                    color: #d97706;
                }
                .admin-badge.badge-returned {
                    background-color: #fce7f3;
                    color: #db2777;
                }
            `}</style>
        </div>
    );
};

export default AdminOrders;
