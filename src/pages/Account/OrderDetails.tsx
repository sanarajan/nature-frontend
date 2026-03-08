import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { toast } from 'react-toastify';
import userApiClient from '../../services/userApiClient';

const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, data: user } = useSelector((state: RootState) => state.auth.user);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        productId: string;
        productName: string;
        type: 'cancel' | 'return';
        reason: string;
    }>({
        isOpen: false,
        productId: '',
        productName: '',
        type: 'cancel',
        reason: ''
    });
    const [viewReason, setViewReason] = useState<{ id: string; text: string } | null>(null);


    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('user_accessToken')) {
            navigate('/login');
            return;
        }

        const fetchOrderDetails = async () => {
            try {
                const res = await userApiClient.get(`/user/order/${id}`);
                if (res.data.success) {
                    setOrder(res.data.data.order);
                }
            } catch (error) {
                console.error("Failed to fetch order details:", error);
                toast.error("Failed to load order tracking details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetails();
        }
    }, [id, isAuthenticated, navigate]);

    const handleReturnOrder = () => {
        setModalConfig({
            isOpen: true,
            productId: 'all',
            productName: 'Full Order',
            type: 'return',
            reason: ''
        });
    };

    const handleItemAction = async () => {
        const { productId, type, reason } = modalConfig;
        if (!reason.trim()) {
            toast.error("Please provide a reason.");
            return;
        }

        try {
            let endpoint = '';
            if (productId === 'all') {
                endpoint = type === 'cancel'
                    ? `/user/order/${id}/cancel`
                    : `/user/order/${id}/return`;
            } else {
                endpoint = type === 'cancel'
                    ? `/user/order/${id}/cancel-item/${productId}`
                    : `/user/order/${id}/return-item/${productId}`;
            }

            const res = await userApiClient.post(endpoint, { reason });

            if (res.data.success) {
                toast.success(res.data.message);
                setOrder(res.data.data.order);
                setModalConfig(prev => ({ ...prev, isOpen: false, reason: '' }));
            } else {
                toast.error(res.data.message || `Failed to ${type} ${productId === 'all' ? 'order' : 'item'}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Error requesting ${type}.`);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase()?.replace(/_/g, ' ');
        switch (s) {
            case 'ORDER PLACED':
            case 'PLACED': return 'bg-primary';
            case 'CANCELLATION REQUEST':
            case 'PARTIALLY CANCELLED': return 'bg-warning text-dark';
            case 'CANCELLED': return 'bg-danger';
            case 'PROCESSING': return 'bg-info';
            case 'SHIPPED':
            case 'PARTIALLY SHIPPED': return 'bg-info';
            case 'DELIVERED':
            case 'COMPLETED':
            case 'PARTIALLY DELIVERED': return 'bg-success';
            case 'RETURN':
            case 'RETURN REQUEST':
            case 'PARTIALLY RETURNED': return 'bg-warning text-dark';
            case 'RETURNED': return 'bg-dark';
            case 'CANCELLATION REQUEST': return 'bg-warning text-dark';
            default: return 'bg-light text-dark';
        }
    };

    const isProductReturnable = (p: any) => {
        if (p.orderStatus !== 'Delivered') return false;

        const historyEntry = order?.statusHistory?.slice().reverse().find((h: any) =>
            h.status.includes('Delivered') && (h.status.includes(p.productName) || h.status.includes('All Items'))
        );

        if (!historyEntry) return true; // Safety

        const deliveryDate = new Date(historyEntry.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - deliveryDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 7;
    };

    const isOrderReturnable = order?.orderedProducts?.length > 0 && order.orderedProducts.every((p: any) => isProductReturnable(p));

    if (loading) {
        return (
            <div className="page-content bg-light text-center py-5">
                <h4>Loading Order Details...</h4>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="page-content bg-light text-center py-5">
                <h4>Order not found!</h4>
                <Link to="/account/orders" className="btn btn-primary mt-3">Back to Orders</Link>
            </div>
        );
    }

    return (
        <>
            <div className="page-content bg-light">
                <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
                    <div className="container">
                        <div className="dz-bnr-inr-entry">
                            <h1>My Account</h1>
                            <nav aria-label="breadcrumb" className="breadcrumb-row">
                                <ul className="breadcrumb">
                                    <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                    <li className="breadcrumb-item"><Link to="/account/orders">Orders</Link></li>
                                    <li className="breadcrumb-item">Account Order Details</li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="content-inner-1">
                    <div className="container">
                        <div className="row">
                            <aside className="col-xl-3">
                                <div className="toggle-info">
                                    <h5 className="title mb-0">Account Navbar</h5>
                                    <a className="toggle-btn" href="#accountSidebar">Account Menu</a>
                                </div>
                                <div className="sticky-top account-sidebar-wrapper">
                                    <div className="account-sidebar" id="accountSidebar">
                                        <div className="profile-head">
                                            <div className="user-thumb">
                                                <img className="rounded-circle" src={user?.imageUrl || '/images/profile4.jpg'} alt="Profile" />
                                            </div>
                                            <h5 className="title mb-0">{user?.displayName || 'User'}</h5>
                                            <span className="text text-primary">{user?.email}</span>
                                        </div>
                                        <div className="account-nav">
                                            <div className="nav-title bg-light">DASHBOARD</div>
                                            <ul>
                                                <li><Link to="/account">Dashboard</Link></li>
                                                <li><Link to="/account/orders" className="active">Orders</Link></li>
                                                <li><Link to="#">Downloads</Link></li>
                                                <li><Link to="#">Return request</Link></li>
                                            </ul>
                                            <div className="nav-title bg-light">ACCOUNT SETTINGS</div>
                                            <ul className="account-info-list">
                                                <li><Link to="/account/profile">Profile</Link></li>
                                                <li><Link to="/account/address">Address</Link></li>
                                                <li><Link to="#">Shipping methods</Link></li>
                                                <li><Link to="#">Payment Methods</Link></li>
                                                <li><Link to="#">Review</Link></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            <section className="col-xl-9 account-wrapper">
                                <div className="account-card order-details">
                                    <div className="order-head d-flex align-items-center justify-content-between p-3 mb-4 border-bottom border-light bg-white rounded shadow-sm">
                                        <div className="d-flex align-items-center">
                                            <div className="head-thumb me-3">
                                                <img src={order.orderedProducts?.[0]?.image || '/images/shop/product/1.png'} alt="" style={{ width: '60px', borderRadius: '8px' }} />
                                            </div>
                                            <div>
                                                <h4 className="mb-0 fs-5 fw-bold">Order #{order.orderId}</h4>
                                                <small className="text-muted">Placed on {formatDate(order.createdAt)}</small>
                                            </div>
                                        </div>
                                        <div className="text-end d-flex flex-column align-items-end" style={{ position: 'relative' }}>
                                            <span className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: '10px' }}>Global Order Status</span>
                                            <span className={`badge ${getStatusColor(order.globalOrderStatus)} px-3 py-2 rounded-pill shadow-sm mb-2`} style={{ fontSize: '12px', minWidth: '120px', textAlign: 'center', position: 'static' }}>
                                                {order.globalOrderStatus?.replace(/_/g, ' ')}
                                            </span>
                                            {(() => {
                                                const gs = order.globalOrderStatus;
                                                const isCancelledOrReturned = gs === 'CANCELLED' || gs === 'RETURNED' || gs === 'PARTIALLY_RETURNED' || gs === 'PARTIALLY_CANCELLED' || gs === 'RETURN' || gs === 'CANCELLATION_REQUEST' || gs === 'RETURN_REQUEST';
                                                const reasonText = order.statusHistory?.slice().reverse().find((h: any) => h.reason || h.comment)?.reason ||
                                                    order.orderedProducts?.find((p: any) => p.cancellation?.reason || p.returnStatus?.reason)?.cancellation?.reason ||
                                                    order.orderedProducts?.find((p: any) => p.returnStatus?.reason)?.returnStatus?.reason;

                                                if (isCancelledOrReturned && reasonText) {
                                                    return (
                                                        <div className="alert alert-info py-1 px-2 mb-0 mt-1 shadow-sm" style={{ fontSize: '11px', borderRadius: '8px', maxWidth: '200px', backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                                                            <i className="fa-solid fa-circle-info me-1"></i>
                                                            <strong>{gs.includes('RETURN') ? 'Return' : 'Cancel'} Reason:</strong> {reasonText}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                    <div className="row mb-sm-4 mb-2">
                                        <div className="col-sm-6">
                                            <div className="shiping-tracker-detail">
                                                <span>Start Time</span>
                                                <h6 className="title">{formatDate(order.createdAt)}</h6>
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="shiping-tracker-detail">
                                                <span>Payment Method</span>
                                                <h6 className="title">{order.paymentMethod === 'COD' ? "Cash on Delivery" : order.paymentMethod}</h6>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="content-btn m-b15 d-flex align-items-center flex-wrap gap-2">
                                        <button className="btn btn-md btn-secondary btnhover20">Export Details</button>

                                        {/* Cancellation Button Logic */}
                                        {(['PLACED', 'PROCESSING', 'PENDING', 'PARTIALLY_PROCESSING'].includes(order.globalOrderStatus) &&
                                            !order.orderedProducts?.some((p: any) => p.orderStatus === 'Cancellation Request')) ? (
                                            <button
                                                onClick={() => setModalConfig({
                                                    isOpen: true,
                                                    productId: 'all',
                                                    productName: 'Full Order',
                                                    type: 'cancel',
                                                    reason: ''
                                                })}
                                                className="btn btn-md btn-outline-danger btnhover20"
                                            >
                                                Cancel Order
                                            </button>
                                        ) : (order.globalOrderStatus === 'CANCELLED' || order.globalOrderStatus === 'CANCELLATION_REQUEST' || order.globalOrderStatus === 'PARTIALLY_CANCELLED' || order.orderedProducts?.some((p: any) => p.orderStatus === 'Cancellation Request' || p.orderStatus === 'Cancelled')) && (
                                            <div className="alert alert-danger mb-0 py-2 px-3 d-inline-flex align-items-center" style={{ borderRadius: '10px', fontSize: '0.9rem' }}>
                                                <i className="fa-solid fa-ban me-2"></i>
                                                <span>This order has been {order.orderedProducts?.some((p: any) => p.orderStatus === 'Cancellation Request') ? 'requested for cancellation' : 'cancelled'}.</span>
                                            </div>
                                        )}

                                        {/* Return Button Logic */}
                                        {isOrderReturnable && !order.orderedProducts?.some((p: any) => p.orderStatus === 'Return Request') ? (
                                            <button onClick={handleReturnOrder} className="btn btn-md btn-outline-warning btnhover20">Return Order</button>
                                        ) : (order.globalOrderStatus === 'RETURNED' || order.globalOrderStatus === 'RETURN_REQUEST' || order.globalOrderStatus === 'PARTIALLY_RETURNED' || order.globalOrderStatus === 'RETURN' || order.orderedProducts?.some((p: any) => p.orderStatus === 'Return Request' || p.orderStatus === 'Returned')) && (
                                            <div className="alert alert-warning mb-0 py-2 px-3 d-inline-flex align-items-center" style={{ borderRadius: '10px', fontSize: '0.9rem', color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                                                <i className="fa-solid fa-rotate-left me-2"></i>
                                                <span>This order is {order.orderedProducts?.some((p: any) => p.orderStatus === 'Return Request') ? 'under return request' : 'returned'}.</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="clearfix mt-4">
                                        <div className="dz-tabs style-3">
                                            <div className="nav nav-tabs" id="nav-tab" role="tablist">
                                                <button className="nav-link active" id="nav-Item-tab" data-bs-toggle="tab" data-bs-target="#nav-Item" role="tab" aria-controls="nav-Item" aria-selected="true">Item Details</button>
                                                <button className="nav-link" id="nav-receiver-tab" data-bs-toggle="tab" data-bs-target="#nav-receiver" role="tab" aria-controls="nav-receiver" aria-selected="false">Receiver Details</button>
                                            </div>
                                        </div>

                                        <div className="tab-content" id="nav-tabContent">
                                            {/* Items */}
                                            <div className="tab-pane fade show active" id="nav-Item" role="tabpanel" aria-labelledby="nav-Item-tab" tabIndex={0}>
                                                <h5 className="mt-4">Ordered Products</h5>

                                                {order.orderedProducts.map((p: any, idx: number) => (
                                                    <div className="tracking-item" key={idx}>
                                                        <div className="tracking-product"><img src={p.image || '/images/shop/product/1.png'} alt="" /></div>
                                                        <div className="tracking-product-content">
                                                            <h6 className="title">{p.productName}</h6>
                                                            <div className="mb-2" style={{ position: 'relative' }}>
                                                                <small className="text-muted d-block mb-1 text-uppercase fw-bold" style={{ fontSize: '10px' }}>Item Status</small>
                                                                {(() => {
                                                                    const s = p.orderStatus;
                                                                    const isCancelledOrReturned = s === 'Cancelled' || s === 'Return' || s === 'Returned';
                                                                    const reasonText = p.cancellation?.reason || p.returnStatus?.reason;

                                                                    return (
                                                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                            <span
                                                                                className={`badge ${getStatusColor(s)}`}
                                                                                style={{
                                                                                    position: 'static',
                                                                                    cursor: (isCancelledOrReturned && reasonText) ? 'pointer' : 'default'
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    if (isCancelledOrReturned && reasonText) {
                                                                                        e.stopPropagation();
                                                                                        setViewReason(viewReason && viewReason.id === (p._id || p.productId) ? null : { id: (p._id || p.productId), text: reasonText });
                                                                                    }
                                                                                }}
                                                                                onMouseEnter={() => {
                                                                                    if (isCancelledOrReturned && reasonText) {
                                                                                        setViewReason({ id: (p._id || p.productId), text: reasonText });
                                                                                    }
                                                                                }}
                                                                                onMouseLeave={() => setViewReason(null)}
                                                                            >
                                                                                {s}
                                                                            </span>
                                                                            {viewReason && viewReason.id === (p._id || p.productId) && (
                                                                                <div className="reason-popup-user">
                                                                                    <div className="reason-popup-arrow-user"></div>
                                                                                    <strong>Reason:</strong> {viewReason.text}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="product-info-small">
                                                                <small className="d-block"><strong>Price</strong> : ₹{p.price}</small>
                                                                <small className="d-block"><strong>Quantity</strong> : {p.quantity}</small>
                                                                {p.shippingDetails && p.shippingDetails.trackingNumber && (
                                                                    <div className="mt-2 p-2 bg-light rounded border">
                                                                        <small className="d-block text-primary"><strong>Tracking:</strong> {p.shippingDetails.agencyName}</small>
                                                                        <small className="d-block text-muted"><strong>ID:</strong> {p.shippingDetails.trackingNumber}</small>
                                                                        {p.shippingDetails.agencyUrl && (
                                                                            <a href={p.shippingDetails.agencyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link btn-sm p-0 text-primary">Track Order</a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {/* Individual item buttons hidden temporarily per request */}
                                                                {/* <div className="mt-3">
                                                                     {(p.orderStatus === 'Order Placed' || p.orderStatus === 'Processing') && (
                                                                         <button
                                                                             onClick={() => setModalConfig({
                                                                                 isOpen: true,
                                                                                 productId: p._id,
                                                                                 productName: p.productName,
                                                                                 type: 'cancel',
                                                                                 reason: ''
                                                                             })}
                                                                             className="btn btn-sm btn-outline-danger"
                                                                         >
                                                                             Cancel Item
                                                                         </button>
                                                                     )}
                                                                     {isProductReturnable(p) && (
                                                                         <button
                                                                             onClick={() => setModalConfig({
                                                                                 isOpen: true,
                                                                                 productId: p._id,
                                                                                 productName: p.productName,
                                                                                 type: 'return',
                                                                                 reason: ''
                                                                             })}
                                                                             className="btn btn-sm btn-outline-warning"
                                                                         >
                                                                             Return Item
                                                                         </button>
                                                                     )}
                                                                </div> */}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="tracking-item-content mt-4">
                                                    <span>Subtotal</span>
                                                    <h6>₹{parseFloat(order.totalPrice || 0).toFixed(2)}</h6>
                                                </div>
                                                {order.discount > 0 && (
                                                    <div className="tracking-item-content">
                                                        <span className="text-danger">Discount</span>
                                                        <h6 className="text-danger">- ₹{parseFloat(order.discount).toFixed(2)}</h6>
                                                    </div>
                                                )}
                                                <div className="tracking-item-content border-bottom border-light mb-2">
                                                    <span className="text-secondary">Delivery Charge</span>
                                                    <h6>+ ₹{parseFloat(order.deliveryCharge || 0).toFixed(2)}</h6>
                                                </div>
                                                <div className="tracking-item-content">
                                                    <span className="fw-bold">Order Total</span>
                                                    <h6 className="fw-bold">₹{parseFloat(order.totalAmount || 0).toFixed(2)}</h6>
                                                </div>
                                                {order.returnedAmount > 0 && (
                                                    <div className="tracking-item-content mt-2 pt-2 border-top border-dotted">
                                                        <span className="text-danger fw-bold">Refunded Amount</span>
                                                        <h6 className="text-danger fw-bold">₹{parseFloat(order.returnedAmount).toFixed(2)}</h6>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="tab-pane fade" id="nav-receiver" role="tabpanel" aria-labelledby="nav-receiver-tab" tabIndex={0}>
                                                <h5 className="mb-4 mt-4">Delivery & Billing</h5>
                                                <ul className="tracking-receiver">
                                                    <li>Order Number : <strong>#{order.orderId}</strong></li>
                                                    <li>Date : <strong>{formatDate(order.createdAt)}</strong></li>
                                                    <li>Total : <strong>₹{parseFloat(order.totalAmount).toFixed(2)}</strong></li>
                                                    <li>Payment Method : <strong>{order.paymentMethod === 'COD' ? "Cash on Delivery" : order.paymentMethod}</strong></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>


            {/* Cancellation/Return Modal - Enhanced Beautiful UI */}
            {
                modalConfig.isOpen && (
                    <div className="modal-overlay-user">
                        <div className="modal-dialog-user">
                            <div className="modal-content-user shadow-lg">
                                <div className="modal-header-user">
                                    <h5 className="modal-title-user">
                                        {modalConfig.type === 'cancel' ? 'Cancel Order' : 'Return Order'}
                                    </h5>
                                    <button type="button" className="btn-close-user" onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}>&times;</button>
                                </div>
                                <div className="modal-body-user px-4 py-3">
                                    <div className="mb-4">
                                        <div className="alert alert-warning-user d-flex align-items-center mb-3">
                                            <i className="fa-solid fa-circle-exclamation me-2"></i>
                                            <span>Please provide a valid reason for this request.</span>
                                        </div>
                                        <label className="form-label-user text-muted small text-uppercase fw-bold mb-2">Notice</label>
                                        <p className="mb-0 text-dark fw-medium">You are requesting to {modalConfig.type} {modalConfig.productName === 'Full Order' ? 'the complete order' : 'this item'}.</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label-user text-muted small text-uppercase fw-bold mb-2">Reason for {modalConfig.type === 'cancel' ? 'Cancellation' : 'Return'} *</label>
                                        <textarea
                                            className="form-control-user"
                                            rows={4}
                                            placeholder={`Help us understand why you're requesting this ${modalConfig.type}...`}
                                            value={modalConfig.reason}
                                            onChange={(e) => setModalConfig(prev => ({ ...prev, reason: e.target.value }))}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer-user p-4 pt-0 d-flex justify-content-between">
                                    <button type="button" className="btn btn-link text-muted p-0" onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}>Discard</button>
                                    <button
                                        type="button"
                                        className={`btn-action-user ${modalConfig.type === 'cancel' ? 'cancel' : 'return'}`}
                                        onClick={handleItemAction}
                                    >
                                        Confirm {modalConfig.type === 'cancel' ? 'Cancellation' : 'Return'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            <style>{`
                /* Modal Styles */
                .modal-overlay-user {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center; z-index: 9999;
                    animation: fadeInFade 0.3s ease;
                }
                .modal-dialog-user {
                    width: 100%; max-width: 500px; padding: 20px;
                    animation: slideUpScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .modal-content-user {
                    background: white; border-radius: 24px; overflow: hidden; border: 1px solid rgba(0,0,0,0.05);
                }
                .modal-header-user {
                    padding: 20px 24px; display: flex; align-items: center; justify-content: space-between;
                    background: #f8fafc; border-bottom: 1px solid #f1f5f9;
                }
                .modal-title-user { margin: 0; font-family: 'Marcellus', serif; color: #1e293b; font-weight: 700; }
                .btn-close-user {
                    background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; line-height: 1;
                    transition: color 0.2s;
                }
                .btn-close-user:hover { color: #ef4444; }
                .form-control-user {
                    width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-size: 0.95rem;
                    outline: none; resize: none; transition: all 0.2s; background: #f8fafc;
                }
                .form-control-user:focus {
                    border-color: #A5BA8D; background: white; box-shadow: 0 0 0 4px rgba(165, 186, 141, 0.1);
                }
                .alert-warning-user {
                    background: #fffbeb; color: #92400e; border: 1px solid #fde68a; border-radius: 12px; padding: 10px 15px; font-size: 0.85rem;
                }
                .btn-action-user {
                    border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 0.95rem;
                    transition: all 0.2s ease; cursor: pointer;
                }
                .btn-action-user.cancel { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
                .btn-action-user.return { background: #f59e0b; color: white; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); }
                .btn-action-user:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.1); filter: brightness(1.1); }
                
                @keyframes fadeInFade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUpScale { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

                .reason-popup-user {
                    position: absolute;
                    bottom: 100%;
                    left: 0;
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
                    line-height: 1.4;
                }
                .reason-popup-arrow-user {
                    position: absolute;
                    top: 100%;
                    left: 15px;
                    border-width: 6px;
                    border-style: solid;
                    border-color: #1e293b transparent transparent transparent;
                }
            `}</style>
        </>
    );
};

export default OrderDetails;
