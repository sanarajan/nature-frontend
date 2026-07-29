import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
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
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const isAdmin = adminData?.role?.toUpperCase() === 'ADMIN';

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
    
    // Request Processing State
    const [processRequestModal, setProcessRequestModal] = useState<{
        isOpen: boolean;
        type: 'cancel' | 'return';
        productId: string;
        action: 'accept' | 'reject' | 'complete' | null;
        adminNotes: string;
        rejectionReason: string;
    }>({
        isOpen: false,
        type: 'cancel',
        productId: '',
        action: null,
        adminNotes: '',
        rejectionReason: ''
    });
    const [shippingData, setShippingData] = useState({
        agencyName: '',
        trackingNumber: '',
        agencyUrl: '',
        expectedDeliveryDate: '',
        isOutForDeliveryAction: false
    });
    
    // Delivery Delay State
    const [showDeliveryDelayModal, setShowDeliveryDelayModal] = useState(false);
    const [deliveryDelayData, setDeliveryDelayData] = useState({
        productId: '',
        newExpectedDate: '',
        reason: ''
    });

    const [viewReason, setViewReason] = useState<{ id: string; text: string } | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = () => {
            if (activeDropdown) setActiveDropdown(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

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
            setShippingData({ agencyName: '', trackingNumber: '', agencyUrl: '', expectedDeliveryDate: '', isOutForDeliveryAction: false });
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
        if (!shippingData.expectedDeliveryDate) {
            toast.warn('Please provide an expected delivery date');
            return;
        }

        if (new Date(shippingData.expectedDeliveryDate) <= new Date()) {
            toast.warn('Expected delivery date must be tomorrow or later');
            return;
        }

        if (!shippingData.isOutForDeliveryAction && (!shippingData.agencyName || !shippingData.trackingNumber)) {
            toast.warn('Please provide agency name and tracking number');
            return;
        }

        handleUpdateStatus(shippingData.isOutForDeliveryAction ? 'Out for Delivery' : 'Shipped', undefined, selectedProductId || undefined, shippingData);
    };

    const handleDeliveryDelay = async () => {
        if (!deliveryDelayData.newExpectedDate || !deliveryDelayData.reason.trim()) {
            toast.warn('Please provide both reason and new expected delivery date');
            return;
        }

        if (new Date(deliveryDelayData.newExpectedDate) <= new Date()) {
            toast.warn('New expected delivery date must be tomorrow or later');
            return;
        }

        setUpdatingStatus(true);
        try {
            const res = await apiClient.patch(`/admin/orders/${id}/item/${deliveryDelayData.productId}/delivery-update`, {
                newExpectedDate: deliveryDelayData.newExpectedDate,
                reason: deliveryDelayData.reason
            });
            if (res.data.success) {
                toast.success('Delivery delay updated successfully');
                setOrder(res.data.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update delivery delay');
        } finally {
            setUpdatingStatus(false);
            setShowDeliveryDelayModal(false);
            setDeliveryDelayData({ productId: '', newExpectedDate: '', reason: '' });
        }
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

    const openShipModal = (productId?: string, isOutForDelivery: boolean = false) => {
        if (productId) {
            setSelectedProductId(productId);
            if (isOutForDelivery) {
                const product = order?.orderedProducts?.find((p: any) => p.productId === productId || (p as any)._id === productId);
                const prevDate = product?.shippingDetails?.expectedDeliveryDate;
                setShippingData(prev => ({
                    ...prev,
                    isOutForDeliveryAction: true,
                    expectedDeliveryDate: prevDate ? prevDate.split('T')[0] : ''
                }));
            } else {
                setShippingData(prev => ({ ...prev, isOutForDeliveryAction: false }));
            }
        } else {
            setSelectedProductId(null);
            setShippingData(prev => ({ ...prev, isOutForDeliveryAction: false }));
        }
        setShowShipModal(true);
    };

    const openDeliveryDelayModal = (productId: string) => {
        setDeliveryDelayData({ productId, newExpectedDate: '', reason: '' });
        setShowDeliveryDelayModal(true);
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

    const handleProcessRequest = async () => {
        const { productId, action, type, adminNotes, rejectionReason } = processRequestModal;
        
        if (!action) return;
        
        setUpdatingStatus(true);
        try {
            const payload: any = {};
            if (adminNotes.trim()) payload.adminNotes = adminNotes;
            if (rejectionReason.trim()) payload.rejectionReason = rejectionReason;
            
            // Construct the correct endpoint URL to match the backend routes
            // Example: /admin/orders/:id/item/:productId/cancel/accept
            const endpoint = `/admin/orders/${id}/item/${productId}/${type}/${action}`;
            const res = await apiClient.patch(endpoint, payload);
            
            if (res.data.success) {
                toast.success(res.data.message || 'Request processed successfully');
                setOrder(res.data.data.order);
                setProcessRequestModal(prev => ({ ...prev, isOpen: false }));
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process request');
        } finally {
            setUpdatingStatus(false);
        }
    };

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
                            
                            // Check if all items are equal for bulk update
                            const allEqual = order.orderedProducts && order.orderedProducts.length > 0 && order.orderedProducts.every((p: any) => p.orderStatus === order.orderedProducts[0].orderStatus);
                            const productStatus = order.orderedProducts?.[0]?.orderStatus;
                            
                            let nextGlobalStatuses: string[] = [];
                            if (allEqual) {
                                if (productStatus === 'Order Placed' || productStatus === 'Pending') {
                                    nextGlobalStatuses = ['Processing', 'Cancelled'];
                                } else if (productStatus === 'Processing') {
                                    nextGlobalStatuses = ['Shipped', 'Cancelled'];
                                } else if (productStatus === 'Shipped') {
                                    nextGlobalStatuses = ['Delivered', 'Cancelled'];
                                }
                            }
                            
                            const isBulkEditable = nextGlobalStatuses.length > 0;
                            
                            const isCancelledOrReturned = gs === 'Cancelled' || gs === 'Returned' || gs === 'Partially Returned' || gs === 'Partially Cancelled' || gs === 'Cancel Request Pending' || gs === 'Return Request Pending' || gs === 'Closed';
                            const reasonText = order.statusHistory?.slice().reverse().find((h: any) => h.comment || h.reason)?.comment ||
                                order.orderedProducts?.find((p: any) => p.cancellation?.reason || p.returnStatus?.reason)?.cancellation?.reason;

                            const badgeClass = gs === 'Cancelled' ? 'badge-danger' :
                                (gs === 'Completed' || gs === 'Closed' || gs === 'Delivered') ? 'badge-success' :
                                    (gs === 'Processing' || gs === 'Partially Processing' || gs === 'Action Required' || gs === 'Cancel Request Pending' || gs === 'Return Request Pending' || gs === 'Return Approved') ? 'badge-warning' :
                                        (gs === 'Returned' || gs === 'Partially Returned') ? 'badge-returned' :
                                            'badge-info';

                            return (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <span
                                        className={`admin-badge ms-3 ${badgeClass}`}
                                        style={{ cursor: (isCancelledOrReturned && reasonText) || isBulkEditable ? 'pointer' : 'default' }}
                                        onClick={(e) => {
                                            if (isBulkEditable) {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === 'global' ? null : 'global');
                                            } else if (isCancelledOrReturned && reasonText) {
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
                                        {gs?.replace(/_/g, ' ')} {isBulkEditable && <i className="fa-solid fa-chevron-down ms-1" style={{ fontSize: '0.65rem' }}></i>}
                                    </span>
                                    {viewReason && viewReason.id === 'global' && (
                                        <div className="reason-popup" style={{ left: '100%', right: 'auto', marginLeft: '10px', top: '0', bottom: 'auto' }}>
                                            <div className="reason-popup-arrow" style={{ top: '10px', right: '100%', borderRightColor: '#1e293b', borderTopColor: 'transparent' }}></div>
                                            <strong>Reason:</strong> {viewReason.text}
                                        </div>
                                    )}
                                    {isBulkEditable && activeDropdown === 'global' && (
                                        <div className="status-dropdown-menu" style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '1rem',
                                            marginTop: '5px',
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                            border: '1px solid #e2e8f0',
                                            zIndex: 100,
                                            minWidth: '150px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ padding: '6px 12px', fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>BULK UPDATE</div>
                                            {nextGlobalStatuses.map(ns => (
                                                <div 
                                                    key={ns} 
                                                    className="dropdown-item-status"
                                                    style={{
                                                        padding: '8px 12px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        color: ns === 'Cancelled' ? '#ef4444' : '#334155',
                                                        borderBottom: '1px solid #f1f5f9',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onClick={() => {
                                                        setActiveDropdown(null);
                                                        if (ns === 'Shipped') {
                                                            openShipModal();
                                                        } else if (ns === 'Cancelled') {
                                                            openCancelModal();
                                                        } else {
                                                            handleUpdateStatus(ns);
                                                        }
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                >
                                                    {ns}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
                <div className="header-actions">
                    {/* Old Global Status Actions Removed as per request */}

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
                                        className={`admin-badge ${badgeClass} ${isRefundPending && isAdmin ? 'clickable-badge' : ''}`}
                                        style={{
                                            fontWeight: 700,
                                            cursor: isRefundPending && isAdmin ? 'pointer' : 'default',
                                            ...(status === 'Refunded' ? { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' } : {}),
                                            ...(isRefundPending ? { border: '1px solid #fde68a' } : {})
                                        }}
                                        onClick={() => {
                                            if (isRefundPending && isAdmin) {
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
                                <span className="fw-bold">₹{(order.totalMRP || order.totalPrice || 0).toFixed(2)}</span>
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
                                <span className="fw-bold text-danger">- ₹{(order.totalDiscount || order.discount || 0).toFixed(2)}</span>
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
                                                const isCancelledOrReturned = s === 'Cancelled' || s === 'Return Request' || s === 'Cancellation Request' || s === 'Return' || s === 'Return Approved' || s === 'Returned' || s === 'Delivered';
                                                const reasonText = p.cancellation?.reason || p.returnRequest?.reason;
                                                const adminNotes = p.returnRequest?.adminNotes || p.cancellation?.adminNotes;
                                                const rejectionReason = p.returnRequest?.rejectionReason || p.cancellation?.rejectionReason;
                                                
                                                const badgeClass = s === 'Cancelled' ? 'badge-danger' :
                                                    s === 'Delivered' ? 'badge-success' :
                                                        s === 'Return Request' ? 'badge-warning' :
                                                        s === 'Cancellation Request' ? 'badge-warning' :
                                                        s === 'Return Approved' ? 'badge-warning' :
                                                        s === 'Return' ? 'badge-return' :
                                                            s === 'Returned' ? 'badge-returned' :
                                                                'badge-info';

                                                // Determine valid next statuses
                                                let nextStatuses: string[] = [];
                                                if (s === 'Order Placed' || s === 'Pending') {
                                                    nextStatuses = ['Processing', 'Cancelled'];
                                                } else if (s === 'Processing') {
                                                    nextStatuses = ['Shipped', 'Cancelled'];
                                                } else if (s === 'Shipped') {
                                                    nextStatuses = ['Out for Delivery', 'Delivered', 'Cancelled'];
                                                } else if (s === 'Out for Delivery') {
                                                    nextStatuses = ['Delivered', 'Cancelled'];
                                                }
                                                const isEditable = nextStatuses.length > 0;

                                                return (
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <span
                                                            className={`admin-badge ${badgeClass}`}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '4px 10px',
                                                                cursor: (isCancelledOrReturned && (reasonText || adminNotes || rejectionReason)) || isEditable ? 'pointer' : 'default'
                                                            }}
                                                            onClick={(e) => {
                                                                if (isEditable) {
                                                                    e.stopPropagation();
                                                                    setActiveDropdown(activeDropdown === p._id ? null : p._id);
                                                                } else if (isCancelledOrReturned && (reasonText || adminNotes || rejectionReason)) {
                                                                    e.stopPropagation();
                                                                    const fullText = [
                                                                        reasonText ? `User Reason: ${reasonText}` : null,
                                                                        adminNotes ? `Admin Note: ${adminNotes}` : null,
                                                                        rejectionReason ? `Rejection Reason: ${rejectionReason}` : null
                                                                    ].filter(Boolean).join('\n');
                                                                    setViewReason(viewReason && viewReason.id === p._id ? null : { id: p._id, text: fullText });
                                                                }
                                                            }}
                                                            onMouseEnter={() => {
                                                                if (isCancelledOrReturned && (reasonText || adminNotes || rejectionReason)) {
                                                                    const fullText = [
                                                                        reasonText ? `User Reason: ${reasonText}` : null,
                                                                        adminNotes ? `Admin Note: ${adminNotes}` : null,
                                                                        rejectionReason ? `Rejection Reason: ${rejectionReason}` : null
                                                                    ].filter(Boolean).join('\n');
                                                                    setViewReason({ id: p._id, text: fullText });
                                                                }
                                                            }}
                                                            onMouseLeave={() => setViewReason(null)}
                                                        >
                                                            {s} {isEditable && <i className="fa-solid fa-chevron-down ms-1" style={{ fontSize: '0.65rem' }}></i>}
                                                        </span>
                                                        {viewReason && viewReason.id === p._id && (
                                                            <div className="reason-popup">
                                                                <div className="reason-popup-arrow"></div>
                                                                <div style={{ whiteSpace: 'pre-line' }}>{viewReason.text}</div>
                                                            </div>
                                                        )}
                                                        {isEditable && activeDropdown === p._id && (
                                                            <div className="status-dropdown-menu" style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                right: 0,
                                                                marginTop: '5px',
                                                                backgroundColor: '#fff',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                                                border: '1px solid #e2e8f0',
                                                                zIndex: 100,
                                                                minWidth: '130px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {nextStatuses.map(ns => (
                                                                    <div 
                                                                        key={ns} 
                                                                        className="dropdown-item-status"
                                                                        style={{
                                                                            padding: '8px 12px',
                                                                            fontSize: '0.8rem',
                                                                            cursor: 'pointer',
                                                                            color: ns === 'Cancelled' ? '#ef4444' : '#334155',
                                                                            borderBottom: '1px solid #f1f5f9',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onClick={() => {
                                                                            setActiveDropdown(null);
                                                                            if (ns === 'Shipped') {
                                                                                openShipModal(p._id || p.productId, false);
                                                                            } else if (ns === 'Out for Delivery') {
                                                                                openShipModal(p._id || p.productId, true);
                                                                            } else if (ns === 'Cancelled') {
                                                                                openCancelModal(p._id || p.productId);
                                                                            } else {
                                                                                handleUpdateStatus(ns, undefined, p._id || p.productId);
                                                                            }
                                                                        }}
                                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                                    >
                                                                        {ns}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            <div className="d-flex flex-column gap-2 mt-2">
                                                {p.orderStatus === 'Out for Delivery' && (
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary" 
                                                        style={{ borderRadius: '8px', fontSize: '0.7rem' }}
                                                        onClick={() => openDeliveryDelayModal(p._id || p.productId)}
                                                    >
                                                        Update Expected Delivery
                                                    </button>
                                                )}
                                                {isAdmin && p.orderStatus === 'Cancellation Request' && (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        style={{ borderRadius: '8px', fontSize: '0.8rem' }}
                                                        onClick={() => setProcessRequestModal({
                                                            isOpen: true,
                                                            type: 'cancel',
                                                            productId: p._id || p.productId,
                                                            action: null,
                                                            adminNotes: '',
                                                            rejectionReason: ''
                                                        })}
                                                        disabled={updatingStatus}
                                                    >
                                                        Process Cancel
                                                    </button>
                                                )}
                                                {isAdmin && p.orderStatus === 'Return Request' && (
                                                    <button
                                                        className="btn btn-sm btn-outline-warning"
                                                        style={{ borderRadius: '8px', fontSize: '0.8rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                                                        onClick={() => setProcessRequestModal({
                                                            isOpen: true,
                                                            type: 'return',
                                                            productId: p._id || p.productId,
                                                            action: null,
                                                            adminNotes: '',
                                                            rejectionReason: ''
                                                        })}
                                                        disabled={updatingStatus}
                                                    >
                                                        Process Return
                                                    </button>
                                                )}
                                                {isAdmin && (p.orderStatus === 'Return' || p.orderStatus === 'Return Approved') && (
                                                    <button
                                                        className="btn btn-sm btn-outline-success"
                                                        style={{ borderRadius: '8px', fontSize: '0.8rem' }}
                                                        onClick={() => {
                                                            setProcessRequestModal({
                                                                isOpen: true,
                                                                type: 'return',
                                                                productId: p._id || p.productId,
                                                                action: 'complete',
                                                                adminNotes: '',
                                                                rejectionReason: ''
                                                            });
                                                        }}
                                                        disabled={updatingStatus}
                                                    >
                                                        Mark as Returned
                                                    </button>
                                                )}
                                            </div>
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
                        <h5 className="fw-bold mb-3">{shippingData.isOutForDeliveryAction ? 'Out for Delivery' : 'Ship Item'}</h5>
                        <p className="text-muted small mb-4">{shippingData.isOutForDeliveryAction ? 'Update expected delivery date for this item.' : 'Select a shipping agency and enter the tracking details for this item.'}</p>

                        {!shippingData.isOutForDeliveryAction && (
                            <>
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
                            </>
                        )}

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Expected Delivery Date *</label>
                            <input
                                type="date"
                                className="admin-input w-100"
                                value={shippingData.expectedDeliveryDate}
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                                onChange={(e) => setShippingData({ ...shippingData, expectedDeliveryDate: e.target.value })}
                            />
                        </div>

                        {!shippingData.isOutForDeliveryAction && (
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
                        )}

                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px', padding: '8px 20px' }} onClick={() => setShowShipModal(false)} disabled={updatingStatus}>Cancel</button>
                            <button className="btn btn-primary" style={{ borderRadius: '12px', padding: '8px 20px', backgroundColor: 'var(--admin-primary)', border: 'none' }} onClick={handleShipItem} disabled={updatingStatus}>
                                {updatingStatus ? 'Syncing...' : 'Confirm Shipping'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Delay Modal */}
            {showDeliveryDelayModal && (
                <div className="cancellation-reason-overlay">
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '450px' }}>
                        <h5 className="fw-bold mb-3">Update Expected Delivery</h5>
                        <p className="text-muted small mb-4">Postpone the expected delivery date for this product.</p>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">New Expected Delivery Date *</label>
                            <input
                                type="date"
                                className="admin-input w-100"
                                value={deliveryDelayData.newExpectedDate}
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                                onChange={(e) => setDeliveryDelayData({ ...deliveryDelayData, newExpectedDate: e.target.value })}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Delay Reason *</label>
                            <textarea
                                className="admin-input w-100"
                                placeholder="e.g. Heavy Rain, Vehicle Breakdown"
                                value={deliveryDelayData.reason}
                                onChange={(e) => setDeliveryDelayData({ ...deliveryDelayData, reason: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px', padding: '8px 20px' }} onClick={() => setShowDeliveryDelayModal(false)} disabled={updatingStatus}>Cancel</button>
                            <button className="btn btn-primary" style={{ borderRadius: '12px', padding: '8px 20px', backgroundColor: 'var(--admin-primary)', border: 'none' }} onClick={handleDeliveryDelay} disabled={updatingStatus}>
                                {updatingStatus ? 'Updating...' : 'Confirm Update'}
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

            {/* Request Processing Modal */}
            {processRequestModal.isOpen && (
                <div className="cancellation-reason-overlay">
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '600px' }}>
                        <h5 className="fw-bold mb-3">
                            Process {processRequestModal.type === 'cancel' ? 'Cancellation' : 'Return'} Request
                        </h5>
                        
                        {(() => {
                            const p = order?.orderedProducts?.find((prod: any) => (prod._id || prod.productId) === processRequestModal.productId);
                            const req = processRequestModal.type === 'cancel' ? p?.cancellation : p?.returnRequest;
                            
                            return (
                                <>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">User Reason</label>
                                        <div className="admin-input w-100 mb-2" style={{ backgroundColor: '#f8fafc', color: '#334155' }}>
                                            {req?.reason || 'No reason provided'}
                                        </div>
                                        {req?.remarks && (
                                            <>
                                                <label className="form-label fw-bold small mt-2">User Remarks</label>
                                                <div className="admin-input w-100" style={{ backgroundColor: '#f8fafc', color: '#334155' }}>
                                                    {req.remarks}
                                                </div>
                                            </>
                                        )}
                                        {req?.images && req.images.length > 0 && (
                                            <div className="mt-3">
                                                <label className="form-label fw-bold small">Uploaded Images</label>
                                                <div className="d-flex gap-2 flex-wrap">
                                                    {req.images.map((img: string, i: number) => (
                                                        <img key={i} src={img} alt={`Request ${i+1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!processRequestModal.action ? (
                                        <div className="d-flex gap-3 mb-4">
                                            <button 
                                                className="btn btn-outline-success flex-fill py-2"
                                                onClick={() => setProcessRequestModal(prev => ({ ...prev, action: 'accept' }))}
                                            >
                                                Accept Request
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger flex-fill py-2"
                                                onClick={() => setProcessRequestModal(prev => ({ ...prev, action: 'reject' }))}
                                            >
                                                Reject Request
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {!(processRequestModal.type === 'return' && processRequestModal.action === 'accept') && (
                                                <div className="mb-3">
                                                    <label className="form-label fw-bold small">Admin Notes (Internal)</label>
                                                    <textarea
                                                        className="admin-input w-100"
                                                        rows={2}
                                                        placeholder="Add any internal notes here..."
                                                        value={processRequestModal.adminNotes}
                                                        onChange={(e) => setProcessRequestModal(prev => ({ ...prev, adminNotes: e.target.value }))}
                                                    />
                                                </div>
                                            )}
                                            
                                            {processRequestModal.action === 'reject' && (
                                                <div className="mb-4">
                                                    <label className="form-label fw-bold small text-danger">Rejection Reason (Visible to User) *</label>
                                                    <textarea
                                                        className="admin-input w-100"
                                                        rows={2}
                                                        placeholder="Please explain why the request is rejected..."
                                                        value={processRequestModal.rejectionReason}
                                                        onChange={(e) => setProcessRequestModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                                    />
                                                </div>
                                            )}

                                            <div className="d-flex gap-2 justify-content-end">
                                                <button 
                                                    className="btn btn-light" 
                                                    style={{ borderRadius: '12px', padding: '8px 20px' }} 
                                                    onClick={() => setProcessRequestModal(prev => ({ ...prev, action: null, adminNotes: '', rejectionReason: '' }))} 
                                                    disabled={updatingStatus}
                                                >
                                                    Back
                                                </button>
                                                <button 
                                                    className={`btn ${processRequestModal.action === 'accept' ? 'btn-success' : processRequestModal.action === 'reject' ? 'btn-danger' : 'btn-primary'}`} 
                                                    style={{ borderRadius: '12px', padding: '8px 20px' }} 
                                                    onClick={handleProcessRequest} 
                                                    disabled={updatingStatus || (processRequestModal.action === 'reject' && !processRequestModal.rejectionReason.trim())}
                                                >
                                                    {updatingStatus ? 'Processing...' : 'Confirm'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        })()}
                        
                        {!processRequestModal.action && (
                            <div className="d-flex justify-content-end mt-2">
                                <button className="btn btn-light" style={{ borderRadius: '12px', padding: '8px 20px' }} onClick={() => setProcessRequestModal(prev => ({ ...prev, isOpen: false }))}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
