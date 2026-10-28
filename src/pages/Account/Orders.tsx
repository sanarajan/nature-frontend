import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import userApiClient from '../../services/userApiClient';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { toast } from 'react-toastify';
import { openRazorpayCheckout } from '../../utils/paymentHelper';
const Orders: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth.user);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('user_accessToken')) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            const loadStart = performance.now();
            try {
                const res = await userApiClient.get('/user/order');
                if (res.data.success) {
                    setOrders(res.data.data.orders || []);
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                const loadMs = Math.round(performance.now() - loadStart);
                console.log("Orders page load time (ms):", loadMs);
                setLoading(false);
            }
        };

        fetchOrders();
    }, [isAuthenticated, navigate]);



    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING': return '#ff9f00';
            case 'EXPIRED': return '#6c757d';
            case 'ORDER PLACED':
            case 'PLACED': return '#2874f0'; // Specific Flipkart/Clear Blue
            case 'PENDING CANCELLATION':
            case 'PARTIALLY_CANCELLED': return '#ff9f00';
            case 'CANCELLED': return '#ff6161';
            case 'PROCESSING': return '#00d2ff';
            case 'SHIPPED':
            case 'PARTIALLY_SHIPPED': return '#00d2ff';
            case 'DELIVERED':
            case 'COMPLETED': return '#4caf50';
            case 'PARTIALLY_DELIVERED': return '#4caf50';
            case 'RETURN':
            case 'PARTIALLY_RETURNED': return '#ff9f00';
            case 'RETURNED': return '#333';
            default: return '#878787';
        }
    };

    const isOrderEligibleForRetry = (order: any) => {
        if (!order) return false;
        const isOnline = order.paymentMethod !== 'COD';
        const isPending = order.globalOrderStatus === 'PENDING' && ['Pending', 'Failed'].includes(order.paymentStatus || 'Pending');
        const isWithin24Hours = (Date.now() - new Date(order.createdAt).getTime()) <= 24 * 60 * 60 * 1000;
        return isOnline && isPending && isWithin24Hours;
    };

    const handleRetryPayment = async (order: any) => {
        if (retryingOrderId) return;
        setRetryingOrderId(order._id);
        try {
            const res = await userApiClient.post(`/user/order/${order._id}/retry-payment`);
            if (res.data.success) {
                const { razorpayOrderId, amount, key_id } = res.data.data;
                openRazorpayCheckout({
                    key_id,
                    amount,
                    razorpayOrderId,
                    orderId: order.orderId,
                    onSuccess: () => {
                        navigate('/checkout/success', { replace: true });
                    },
                    onError: () => {
                        const fetchOrders = async () => {
                            try {
                                const r = await userApiClient.get('/user/order');
                                if (r.data.success) setOrders(r.data.data.orders || []);
                            } catch (e) {}
                        };
                        fetchOrders();
                    },
                    onDismiss: () => {
                        const fetchOrders = async () => {
                            try {
                                const r = await userApiClient.get('/user/order');
                                if (r.data.success) setOrders(r.data.data.orders || []);
                            } catch (e) {}
                        };
                        fetchOrders();
                    }
                });
            } else {
                toast.error(res.data.message || 'Failed to initiate payment retry');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error initiating payment retry');
        } finally {
            setRetryingOrderId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
    };

    return (
        <div className="page-content bg-light">
            <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Account Orders</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item">Account Orders</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="content-inner-1">
                <div className="container">
                    <div className="row">
                        <AccountSidebar activePage="orders" />

                        <section className="col-xl-9 account-wrapper">
                            <div className="account-card">
                                <div className="table-responsive table-style-1">
                                    <table className="table table-hover mb-3">
                                        <thead className="text-center">
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Date Purchased</th>
                                                <th>Status</th>
                                                <th>Total Amount</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-center">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="py-4">Loading your orders...</td>
                                                </tr>
                                            ) : orders.length > 0 ? (
                                                orders.map((order, idx) => (
                                                    <tr key={order._id || idx}>
                                                        <td><span className="fw-medium text-dark">{order.orderId}</span></td>
                                                        <td>{formatDate(order.createdAt)}</td>
                                                        {/* For simplification, grabbing status of first orderedProduct, since order status tracking is per-product in this schema */}
                                                        <td className="text-center">
                                                            {(() => {
                                                                const isFailedPayment = order.globalOrderStatus === 'PENDING' && order.paymentStatus === 'Failed';
                                                                const displayStatus = isFailedPayment ? 'PAYMENT FAILED' : (order.globalOrderStatus || 'PLACED');
                                                                const badgeBg = isFailedPayment ? '#ff6161' : getStatusColor(order.globalOrderStatus || 'PLACED');
                                                                return (
                                                                    <span
                                                                        className="badge"
                                                                        style={{
                                                                            backgroundColor: badgeBg,
                                                                            color: '#fff',
                                                                            position: 'static',
                                                                            display: 'inline-block',
                                                                            padding: '4px 12px',
                                                                            borderRadius: '50px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            textTransform: 'uppercase',
                                                                            margin: '0'
                                                                        }}
                                                                    >
                                                                        {displayStatus}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td><span className="text-secondary">₹{parseFloat(order.totalAmount).toFixed(2)}</span></td>
                                                        <td>
                                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                                <Link to={`/account/orders/${order._id}`} className="btn-link text-underline p-0">View</Link>
                                                                {isOrderEligibleForRetry(order) && (
                                                                    <>
                                                                        <span className="text-muted">|</span>
                                                                        <button
                                                                            onClick={() => handleRetryPayment(order)}
                                                                            disabled={retryingOrderId === order._id}
                                                                            className="btn btn-sm btn-primary py-0 px-2"
                                                                            style={{ fontSize: '11px', lineHeight: '1.6' }}
                                                                        >
                                                                            {retryingOrderId === order._id ? 'Processing...' : 'Retry Payment'}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-4">You have not placed any orders yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orders;
