import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ChevronRight,
    Printer,
    RefreshCcw
} from 'lucide-react';
import apiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';

const AdminOrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showShipModal, setShowShipModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    // const [showReturnModal, setShowReturnModal] = useState(false);
    // const [returnReason, setReturnReason] = useState('');
    const [agencies, setAgencies] = useState<any[]>([]);
    const [shippingData, setShippingData] = useState({
        agencyName: '',
        trackingNumber: '',
        agencyUrl: ''
    });
    const [viewReason, setViewReason] = useState<{ id: string; text: string } | null>(null);

    // Refund Logic States
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [processingRefund, setProcessingRefund] = useState(false);
    const [refundAmount, setRefundAmount] = useState(0);

    useEffect(() => {
        fetchOrderDetails();
        fetchAgencies();
    }, [id]);

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
                        // Smart appending if no placeholder is found
                        const hasParams = template.includes('?');
                        const endsWithSpecial = template.endsWith('=') || template.endsWith('/');

                        if (endsWithSpecial) {
                            generatedUrl = template + shippingData.trackingNumber;
                        } else {
                            generatedUrl = template + (hasParams ? '&id=' : '/') + shippingData.trackingNumber;
                        }
                    }
                }

                // Only update if it actually changed to prevent infinite loops
                if (generatedUrl !== shippingData.agencyUrl) {
                    setShippingData(prev => ({
                        ...prev,
                        agencyUrl: generatedUrl
                    }));
                }
            } else if (shippingData.agencyUrl) {
                // Clear if no template found
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

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/admin/orders/${id}`);
            if (res.data.success) {
                setOrder(res.data.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string, reason?: string, productId?: string, shippingDetails?: any) => {
        setUpdatingStatus(true);
        try {
            const res = await apiClient.patch(`/admin/orders/${id}/status`, {
                status: newStatus,
                reason: reason,
                productId: productId,
                shippingDetails: shippingDetails
            });
            if (res.data.success) {
                toast.success(`Order status updated to ${newStatus}`);
                setOrder(res.data.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingStatus(false);
            setShowCancelModal(false);
            setShowShipModal(false);
            // setShowReturnModal(false);
            setCancelReason('');
            // setReturnReason('');
            setShippingData({ agencyName: '', trackingNumber: '', agencyUrl: '' });
        }
    };

    const handleCancelOrder = () => {
        if (!cancelReason.trim()) {
            toast.warn('Please provide a reason for cancellation');
            return;
        }
        handleUpdateStatus('Cancelled', cancelReason, selectedProductId || undefined);
    };

    const handleShipItem = () => {
        if (!shippingData.agencyName || !shippingData.trackingNumber) {
            toast.warn('Please provide agency name and tracking number');
            return;
        }
        handleUpdateStatus('Shipped', undefined, selectedProductId || undefined, shippingData);
    };

    const openCancelModal = (productId?: string) => {
        if (productId) {
            setSelectedProductId(productId);
            const product = order?.orderedProducts?.find((p: any) => p.productId === productId || (p as any)._id === productId);
            setCancelReason(product?.cancellation?.reason || '');
        } else {
            setSelectedProductId(null);
            setCancelReason('');
        }
        setShowCancelModal(true);
    };

    const openShipModal = (productId?: string) => {
        if (productId) {
            setSelectedProductId(productId);
        } else {
            setSelectedProductId(null);
        }
        setShowShipModal(true);
    };

    /*
    const openReturnModal = (productId: string) => {
        setSelectedProductId(productId);
        const product = order?.orderedProducts?.find((p: any) => p.productId === productId || (p as any)._id === productId);
        // Customer return reason is stored in cancellation.reason typically
        setReturnReason(product?.cancellation?.reason || 'No reason provided by customer');
        setShowReturnModal(true);
    };

    const handleConfirmReturn = () => {
        handleUpdateStatus('Returned', returnReason, selectedProductId || undefined);
    };
    */

    const handleAgencyChange = (agencyName: string) => {
        const agency = agencies.find(a => a.name === agencyName);
        if (agency) {
            setShippingData({
                ...shippingData,
                agencyName: agency.name
            });
        } else {
            setShippingData({
                ...shippingData,
                agencyName: '',
                agencyUrl: ''
            });
        }
    };

    const handlePaymentStatusUpdate = async (status: string, amount?: number) => {
        setProcessingRefund(true);
        try {
            const res = await apiClient.patch(`/admin/orders/${id}/payment-status`, {
                status,
                refundedAmount: amount
            });

            if (res.data.success) {
                toast.success(`Payment status updated to ${status}`);
                setOrder(res.data.data);
                setShowRefundModal(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update payment status');
        } finally {
            setProcessingRefund(false);
        }
    };

    if (loading) {
        return <div className="admin-page-container"><div className="admin-card p-5 text-center">Loading order details...</div></div>;
    }

    if (!order) {
        return <div className="admin-page-container"><div className="admin-card p-5 text-center">Order not found.</div></div>;
    }

    const statusSteps = ['PLACED', 'CANCELLATION_REQUEST', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURN_REQUEST', 'RETURNED'];

    const getStatusIndex = () => {
        if (!order) return 0;
        let globalStatus = order.globalOrderStatus || order.orderStatus; // Fallback for safety

        // Map partial statuses to the next main milestone for the tracker
        if (globalStatus === 'PARTIALLY_PROCESSING') globalStatus = 'PLACED';
        if (globalStatus === 'PARTIALLY_SHIPPED') globalStatus = 'PROCESSING';
        if (globalStatus === 'PARTIALLY_DELIVERED') globalStatus = 'SHIPPED';
        if (globalStatus === 'PARTIALLY_CANCELLED') globalStatus = 'CANCELLED';
        if (globalStatus === 'PARTIALLY_RETURNED') globalStatus = 'RETURNED';

        const index = statusSteps.indexOf(globalStatus);

        // Final terminal fallback
        if (index < 0) {
            if (globalStatus === 'RETURN') return statusSteps.indexOf('RETURN_REQUEST');
            return 0;
        }
        return index;
    };

    const currentIndex = getStatusIndex();

    return (
        <div className="admin-page-container">
            {/* Breadcrumbs */}
            <div className="admin-breadcrumbs">
                <Link to="/admin/dashboard">Dashboard</Link>
                <ChevronRight size={14} />
                <Link to="/admin/orders">Orders</Link>
                <ChevronRight size={14} />
                <span>Order Details</span>
            </div>

            {/* Header */}
            <div className="page-header mt-3">
                <div>
                    <h1 className="page-title">Order Details #{order.orderId}</h1>
                    <div className="order-meta-info mt-1">
                        <span className="text-muted">{formatDate(order.createdAt)} • {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span>
                        {(() => {
                            const gs = order.globalOrderStatus;
                            const isCancelledOrReturned = gs === 'CANCELLED' || gs === 'RETURNED' || gs === 'PARTIALLY_RETURNED' || gs === 'PARTIALLY_CANCELLED' || gs === 'CANCELLATION_REQUEST' || gs === 'RETURN_REQUEST';
                            const reasonText = order.statusHistory?.slice().reverse().find((h: any) => h.comment || h.reason)?.comment ||
                                order.orderedProducts?.find((p: any) => p.cancellation?.reason || p.returnStatus?.reason)?.cancellation?.reason;

                            const badgeClass = gs === 'CANCELLED' ? 'badge-danger' :
                                gs === 'COMPLETED' ? 'badge-success' :
                                    (gs === 'PROCESSING' || gs === 'PARTIALLY_PROCESSING') ? 'badge-warning' :
                                        (gs === 'RETURNED' || gs === 'PARTIALLY_RETURNED') ? 'badge-returned' :
                                            'badge-info';

                            return (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <span
                                        className={`admin-badge ms-3 ${badgeClass}`}
                                        style={{ cursor: (isCancelledOrReturned && reasonText) ? 'pointer' : 'default' }}
                                        onClick={(e) => {
                                            if (isCancelledOrReturned && reasonText) {
                                                e.stopPropagation();
                                                setViewReason(viewReason && viewReason.id === 'global' ? null : { id: 'global', text: reasonText });
                                            }
                                        }}
                                        onMouseEnter={() => {
                                            if (isCancelledOrReturned && reasonText) {
                                                setViewReason({ id: 'global', text: reasonText });
                                            }
                                        }}
                                        onMouseLeave={() => setViewReason(null)}
                                    >
                                        {gs?.replace(/_/g, ' ')}
                                    </span>
                                    {viewReason && viewReason.id === 'global' && (
                                        <div className="reason-popup" style={{ left: '100%', right: 'auto', marginLeft: '10px', top: '0', bottom: 'auto' }}>
                                            <div className="reason-popup-arrow" style={{ top: '10px', right: '100%', borderRightColor: '#1e293b', borderTopColor: 'transparent' }}></div>
                                            <strong>Reason:</strong> {viewReason.text}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
                <div className="header-actions">
                    {/* Global Status Actions */}
                    <div className="d-flex gap-2 me-3">
                        {order.globalOrderStatus === 'PLACED' && (
                            <button
                                className="btn-primary-admin"
                                onClick={() => handleUpdateStatus('Processing')}
                                disabled={updatingStatus}
                            >
                                Process Order
                            </button>
                        )}
                        {(order.globalOrderStatus === 'PLACED' || order.globalOrderStatus === 'PROCESSING' || order.globalOrderStatus === 'PARTIALLY_PROCESSING') && (
                            <button
                                className="btn-primary-admin"
                                onClick={() => openShipModal()}
                                disabled={updatingStatus}
                            >
                                Ship Order
                            </button>
                        )}
                        {(order.globalOrderStatus === 'SHIPPED' || order.globalOrderStatus === 'PARTIALLY_SHIPPED') && (
                            <button
                                className="btn-primary-admin"
                                onClick={() => handleUpdateStatus('Delivered')}
                                disabled={updatingStatus}
                            >
                                Deliver Order
                            </button>
                        )}
                        {['PLACED', 'PROCESSING', 'PARTIALLY_PROCESSING', 'PENDING'].includes(order.globalOrderStatus) && (
                            <button
                                className="btn btn-outline-danger"
                                style={{ borderRadius: '12px', padding: '8px 20px', fontWeight: '600' }}
                                onClick={() => openCancelModal()}
                                disabled={updatingStatus}
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>

                    <button
                        className="btn-primary-admin secondary"
                        style={{ backgroundColor: '#fff', color: 'var(--admin-primary)', border: '1px solid var(--admin-primary)', boxShadow: 'none' }}
                        disabled={updatingStatus}
                        onClick={() => fetchOrderDetails()}
                    >
                        <RefreshCcw size={18} className={updatingStatus ? 'animate-spin' : ''} /> Update
                    </button>
                    <button className="btn-primary-admin secondary" style={{ backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Printer size={18} /> Print Invoice
                    </button>
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="row mt-4">
                {/* Customer Card */}
                <div className="col-xl-4 col-md-6 mb-4">
                    <div className="admin-card h-100 p-4" style={{ borderRadius: '24px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                        <div className="d-flex align-items-center mb-4">
                            <div className="customer-avatar-large me-3" style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: 'var(--admin-primary)'
                            }}>
                                {order.userId?.displayName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'CU'}
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">{order.userId?.displayName || 'Unknown Customer'}</h5>
                            </div>
                        </div>
                        <div className="customer-info-list" style={{ fontSize: '0.9rem' }}>
                            <div className="d-flex mb-2 text-truncate">
                                <span className="text-muted me-3" style={{ width: '16px' }}>✉️</span>
                                <span className="text-primary">{order.userId?.email || 'N/A'}</span>
                            </div>
                            <div className="d-flex mb-4">
                                <span className="text-muted me-3" style={{ width: '16px' }}>📞</span>
                                <span>{order.userId?.phoneNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Card */}
                <div className="col-xl-4 col-md-6 mb-4">
                    <div className="admin-card h-100 p-4" style={{ borderRadius: '24px', border: 'none' }}>
                        <h5 className="fw-bold mb-4">Shipping Address</h5>
                        <div className="shipping-address-content" style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6 }}>
                            <p className="mb-0">
                                {order.userId?.displayName || 'Customer'}<br />
                                {order.address.house}, {order.address.place}<br />
                                {order.address.city}, {order.address.district},<br />
                                {order.address.state}, {order.address.pincode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="col-xl-4 col-md-12 mb-4">
                    <div className="admin-card h-100 p-4" style={{ borderRadius: '24px', border: 'none' }}>
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <h2 className="mb-0 fw-bold" style={{ fontSize: '2rem' }}>₹{order.totalAmount.toFixed(2)}</h2>
                            {(() => {
                                const status = order.paymentStatus;
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
                                            ...(status === 'Refunded' ? { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' } : {}),
                                            ...(isRefundPending ? { border: '1px solid #fde68a' } : {})
                                        }}
                                        onClick={() => {
                                            if (isRefundPending) {
                                                setRefundAmount(order.totalAmount);
                                                setShowRefundModal(true);
                                            }
                                        }}
                                    >
                                        {label}
                                    </span>
                                );
                            })()}
                        </div>
                        <div className="billing-summary" style={{ fontSize: '0.95rem' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Sub Total</span>
                                <span className="fw-bold">₹{order.totalPrice.toFixed(2)}</span>
                            </div>
                            {order.couponName && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Coupon Name</span>
                                    <span className="fw-bold">{order.couponName}</span>
                                </div>
                            )}
                            {order.referralCode && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Referral Code</span>
                                    <span className="fw-bold">{order.referralCode}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Discount</span>
                                <span className="fw-bold text-danger">- ₹{(order.discount || 0).toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Shipping Charge</span>
                                <span className="fw-bold text-success">{order.deliveryCharge > 0 ? `₹${order.deliveryCharge.toFixed(2)}` : 'FREE'}</span>
                            </div>
                            {(order.refundedAmount > 0 || order.returnedAmount > 0) && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Refunded Amount</span>
                                    <span className="fw-bold text-danger">₹{(order.refundedAmount || order.returnedAmount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between mb-4 pb-2 border-bottom border-light">
                                <span className="text-muted">Gift Packaging</span>
                                <span className="fw-bold">00.00</span>
                            </div>

                            <h6 className="fw-bold mb-3">Payment details</h6>
                            <div className="payment-method-details" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                <div className="mb-1 fw-bold text-dark">{order.paymentMethod}</div>
                                {order.razorpayPaymentId && <div className="mb-3">Transaction ID: {order.razorpayPaymentId}</div>}
                                {(() => {
                                    const status = order.paymentStatus;
                                    const label = status === 'Refund_Pending'
                                        ? 'Refund Pending'
                                        : (status === 'Refunded' ? 'Refunded' : (['Paid', 'Success', 'Completed'].includes(status) ? 'Paid' : status));
                                    let badgeClass = 'badge-secondary';
                                    if (['Paid', 'Success', 'Completed'].includes(status)) badgeClass = 'badge-success';
                                    if (status === 'Failed' || status === 'Cancelled') badgeClass = 'badge-danger';
                                    if (status === 'Pending' || status === 'Refund_Pending') badgeClass = 'badge-warning';
                                    if (status === 'Refunded' || status === 'Returned') badgeClass = 'badge-info';

                                    return (
                                        <span className={`admin-badge ${badgeClass}`} style={{
                                            border: 'none',
                                            borderRadius: '4px',
                                            ...(status === 'Refunded' ? { backgroundColor: '#e0f2fe', color: '#0369a1' } : {})
                                        }}>
                                            {label}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="admin-card p-0 mt-4 overflow-hidden" style={{ borderRadius: '24px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Order ({order.orderedProducts.length} Items)</h5>
                </div>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <tbody style={{ border: 0 }}>
                            {order.orderedProducts.map((p: any, idx: number) => (
                                <tr key={idx}>
                                    <td style={{ width: '80px' }}>
                                        <img src={p.image} alt={p.productName} className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                                    </td>
                                    <td>
                                        <div className="fw-bold text-dark">{p.productName}</div>
                                        <div className="small text-muted">ID: {p.productId}</div>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                            <button className="btn btn-sm btn-light rounded-circle shadow-none p-0" style={{ width: '28px', height: '28px' }}>-</button>
                                            <span className="fw-bold px-2">{p.quantity}</span>
                                            <button className="btn btn-sm btn-light rounded-circle shadow-none p-0" style={{ width: '28px', height: '28px' }}>+</button>
                                        </div>
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex flex-column align-items-end">
                                            <div className="d-flex align-items-center gap-2">
                                                {p.offerPrice && p.offerPrice < p.price && (
                                                    <span className="text-muted text-decoration-line-through small">₹{p.price.toFixed(2)}</span>
                                                )}
                                                <span className="fw-bold text-dark">₹{(p.offerPrice || p.price).toFixed(2)}</span>
                                            </div>
                                            {p.offerPercentage > 0 && (
                                                <div className="small text-success fw-bold">{p.offerPercentage}% OFF</div>
                                            )}
                                            <div className="small text-muted">{p.quantity} Item</div>
                                        </div>
                                    </td>
                                    <td className="text-end" style={{ minWidth: '220px' }}>
                                        <div className="d-flex flex-column align-items-end gap-2">
                                            {(() => {
                                                const s = p.orderStatus;
                                                const isCancelledOrReturned = s === 'Cancelled' || s === 'Return' || s === 'Returned';
                                                const reasonText = p.cancellation?.reason || p.returnStatus?.reason;
                                                const badgeClass = s === 'Cancelled' ? 'badge-danger' :
                                                    s === 'Delivered' ? 'badge-success' :
                                                        s === 'Return' ? 'badge-return' :
                                                            s === 'Returned' ? 'badge-returned' :
                                                                'badge-info';

                                                return (
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <span
                                                            className={`admin-badge ${badgeClass}`}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '4px 10px',
                                                                cursor: (isCancelledOrReturned && reasonText) ? 'pointer' : 'default'
                                                            }}
                                                            onClick={(e) => {
                                                                if (isCancelledOrReturned && reasonText) {
                                                                    e.stopPropagation();
                                                                    setViewReason(viewReason && viewReason.id === p._id ? null : { id: p._id, text: reasonText });
                                                                }
                                                            }}
                                                            onMouseEnter={() => {
                                                                if (isCancelledOrReturned && reasonText) {
                                                                    setViewReason({ id: p._id, text: reasonText });
                                                                }
                                                            }}
                                                            onMouseLeave={() => setViewReason(null)}
                                                        >
                                                            {s}
                                                        </span>
                                                        {viewReason && viewReason.id === p._id && (
                                                            <div className="reason-popup">
                                                                <div className="reason-popup-arrow"></div>
                                                                <strong>Reason:</strong> {viewReason.text}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            {/* Status change buttons hidden as per request (Order-wise management only) */}
                                            {/* {p.orderStatus !== 'Cancelled' && p.orderStatus !== 'Delivered' && p.orderStatus !== 'Returned' && (
                                                <div className="d-flex gap-2">
                                                    {p.orderStatus === 'Order Placed' && (
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            style={{ borderRadius: '8px', fontSize: '0.8rem' }}
                                                            onClick={() => handleUpdateStatus('Processing', undefined, p.productId)}
                                                            disabled={updatingStatus}
                                                        >
                                                            Process
                                                        </button>
                                                    )}
                                                    {(p.orderStatus === 'Order Placed' || p.orderStatus === 'Processing') && (
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            style={{ borderRadius: '8px', fontSize: '0.8rem' }}
                                                            onClick={() => openShipModal(p.productId)}
                                                            disabled={updatingStatus}
                                                        >
                                                            Ship
                                                        </button>
                                                    )}
                                                    {p.orderStatus === 'Shipped' && (
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            style={{ borderRadius: '8px', fontSize: '0.8rem' }}
                                                            onClick={() => handleUpdateStatus('Delivered', undefined, p.productId)}
                                                            disabled={updatingStatus}
                                                        >
                                                            Deliver
                                                        </button>
                                                    )}
                                                    {p.orderStatus !== 'Return' && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            style={{ borderRadius: '8px', fontSize: '0.8rem' }}
                                                            onClick={() => openCancelModal(p.productId)}
                                                            disabled={updatingStatus}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {p.orderStatus === 'Return' && (
                                                        <button
                                                            className="btn btn-sm btn-outline-warning"
                                                            style={{ borderRadius: '8px', fontSize: '0.8rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                                                            onClick={() => openReturnModal(p.productId)}
                                                            disabled={updatingStatus}
                                                        >
                                                            Confirm Return
                                                        </button>
                                                    )}
                                                </div>
                                            )} */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Status Tracker */}
            <div className="status-tracker-card mt-4">
                <h5 className="fw-bold mb-4" style={{ color: '#334155' }}>Order Status</h5>
                <div className="status-progress-container">
                    <div className="progress-track">
                        <div
                            className="progress-track-fill"
                            style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                    <div className="status-steps-wrapper">
                        {statusSteps.map((step, idx) => (
                            <div key={idx} className={`status-step-item ${idx <= currentIndex ? 'completed' : ''} ${idx === currentIndex ? 'active' : ''}`}>
                                <div className="step-dot">
                                    {idx <= currentIndex && <div className="step-dot-inner"></div>}
                                </div>
                                <div className="step-label">{step.replace(/_/g, ' ')}</div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Status History Table */}
                <div className="status-history-container mt-5">
                    <div className="row fw-bold text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                        <div className="col-4">Date</div>
                        <div className="col-4">Status</div>
                        <div className="col-4">Updated by</div>
                    </div>
                    {order.statusHistory && order.statusHistory.length > 0 ? (
                        order.statusHistory.map((history: any, idx: number) => (
                            <div className="row mb-3 align-items-center" key={idx} style={{ fontSize: '0.95rem' }}>
                                <div className="col-4">{formatDate(history.timestamp)}</div>
                                <div className="col-4 fw-medium text-dark">{history.status}</div>
                                <div className="col-4">{history.updatedBy === 'User' ? 'Customer' : history.updatedBy}</div>
                            </div>
                        ))
                    ) : (
                        <div className="row mb-3 align-items-center" style={{ fontSize: '0.95rem' }}>
                            <div className="col-4">{formatDate(order.createdAt)}</div>
                            <div className="col-4 fw-medium text-dark">Order Placed</div>
                            <div className="col-4">Customer</div>
                        </div>
                    )}
                </div>

                {/* Status Update Actions moved to items list */}
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <p className="text-muted small mb-0">Update individual item status using the actions in the item list above.</p>
                </div>
            </div>

            {/* Shipping Detail Modal */}
            {showShipModal && (
                <div className="cancellation-reason-overlay">
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '450px' }}>
                        <h5 className="fw-bold mb-3">Ship Item</h5>
                        <p className="text-muted small mb-4">Select a shipping agency and enter the tracking details for this item.</p>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Shipping Agency</label>
                            <select
                                className="admin-input w-100"
                                value={shippingData.agencyName}
                                onChange={(e) => handleAgencyChange(e.target.value)}
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
                            <div
                                className="admin-input w-100 d-flex align-items-center"
                                style={{
                                    backgroundColor: '#f8fafc',
                                    borderColor: '#e2e8f0',
                                    minHeight: '42px',
                                    borderRadius: '12px',
                                    padding: '8px 15px',
                                    fontSize: '0.85rem',
                                    color: shippingData.agencyUrl ? '#334155' : '#94a3b8',
                                    wordBreak: 'break-all'
                                }}
                            >
                                {shippingData.agencyUrl || 'Auto-generated URL'}
                            </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px', padding: '8px 20px' }} onClick={() => setShowShipModal(false)} disabled={updatingStatus}>Cancel</button>
                            <button className="btn btn-primary" style={{ borderRadius: '12px', padding: '8px 20px', backgroundColor: 'var(--admin-primary)', border: 'none' }} onClick={handleShipItem} disabled={updatingStatus}>
                                {updatingStatus ? 'Syncing...' : 'Confirm Shipping'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Styles for this page */}
            <style>{`
                .status-tracker-card {
                    background-color: #ecf6f1 !important;
                    border-radius: 24px !important;
                    padding: 32px !important;
                    border: none !important;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.02) !important;
                }
                .status-progress-container {
                    position: relative;
                    padding: 20px 0 30px;
                    margin-bottom: 20px;
                }
                .progress-track {
                    position: absolute;
                    top: 35px;
                    left: 50px;
                    right: 50px;
                    height: 6px;
                    background-color: #e2e8f0;
                    border-radius: 10px;
                    z-index: 1;
                }
                .progress-track-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background-color: #82b440;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
                .status-steps-wrapper {
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    z-index: 2;
                }
                .status-step-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    min-width: 80px;
                }
                .step-dot {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background-color: #fff;
                    border: 3px solid #cbd5e1;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .status-step-item.completed .step-dot,
                .status-step-item.active .step-dot {
                    border-color: #82b440;
                    background-color: #82b440;
                    box-shadow: 0 0 0 6px rgba(130, 180, 64, 0.15);
                }
                .step-dot-inner {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: #fff;
                }
                .step-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #64748b;
                    text-align: center;
                    transition: color 0.3s ease;
                }
                .status-step-item.completed .step-label,
                .status-step-item.active .step-label {
                    color: #1e293b;
                }
                .cancellation-reason-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }
                .cancellation-reason-box {
                    width: 100%;
                    max-width: 450px;
                    border: 1px solid #fee2e2 !important;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15) !important;
                    border-radius: 24px !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .admin-input {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 12px;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }
                .admin-input:focus {
                    outline: none;
                    border-color: var(--admin-primary);
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
                }
                .admin-badge.badge-return {
                    background-color: #fef3c7;
                    color: #d97706;
                }
                .admin-badge.badge-returned {
                    background-color: #fce7f3;
                    color: #db2777;
                }
                .reason-popup {
                    position: absolute;
                    bottom: 100%;
                    right: 0;
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
                    text-align: left;
                }
                .reason-popup-arrow {
                    position: absolute;
                    top: 100%;
                    right: 20px;
                    border-width: 6px;
                    border-style: solid;
                    border-color: #1e293b transparent transparent transparent;
                }
            `}</style>

            {/* Return Confirmation Modal - Hidden until needed for per-product returns */}
            {/* {showReturnModal && (
                <div className="cancellation-reason-overlay">
                    <div className="cancellation-reason-box admin-card p-4" style={{ borderColor: '#fde68a !important' }}>
                        <h5 className="fw-bold mb-3" style={{ color: '#92400e' }}>Confirm Customer Return</h5>
                        <p className="text-muted small mb-3">Customer has requested a return for this product. Please review the reason below and confirm if you accept the return.</p>

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Customer's Reason</label>
                            <div className="admin-input w-100" style={{ backgroundColor: '#fffbeb', color: '#92400e', minHeight: '80px', border: '1px solid #fde68a', paddingTop: '10px' }}>
                                {returnReason}
                            </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px', padding: '8px 20px' }} onClick={() => setShowReturnModal(false)} disabled={updatingStatus}>Cancel</button>
                            <button className="btn btn-warning" style={{ borderRadius: '12px', padding: '8px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none' }} onClick={handleConfirmReturn} disabled={updatingStatus}>
                                {updatingStatus ? 'Updating...' : 'Confirm & Mark Returned'}
                            </button>
                        </div>
                    </div>
                </div>
            )} */}

            {/* Cancellation Reason Modal */}
            {showCancelModal && (
                <div className="cancellation-reason-overlay">
                    <div className="cancellation-reason-box admin-card p-4">
                        <h5 className="fw-bold mb-3">Cancel Item</h5>
                        <p className="text-muted small mb-3">Please provide a reason for canceling this item. This will be visible in the order history.</p>
                        <textarea
                            className="admin-input w-100 mb-3"
                            placeholder="Enter reason for cancellation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                        ></textarea>
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px', padding: '8px 20px' }} onClick={() => setShowCancelModal(false)} disabled={updatingStatus}>Cancel</button>
                            <button className="btn btn-danger" style={{ borderRadius: '12px', padding: '8px 20px' }} onClick={handleCancelOrder} disabled={updatingStatus}>
                                {updatingStatus ? 'Updating...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Confirmation Modal */}
            {showRefundModal && (
                <div className="cancellation-reason-overlay" style={{ zIndex: 10001 }}>
                    <div className="cancellation-reason-box admin-card p-4" style={{ backgroundColor: '#fff', maxWidth: '400px' }}>
                        <h5 className="fw-bold mb-3">Process Refund</h5>
                        <p className="small text-muted mb-4">
                            Please confirm that you have processed the refund for order <strong>#{order.orderId}</strong>.
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
                                onClick={() => handlePaymentStatusUpdate('Refunded', refundAmount)}
                                disabled={processingRefund}
                            >
                                {processingRefund ? 'Processing...' : 'Mark as Refunded'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderDetails;
