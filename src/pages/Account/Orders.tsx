import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import userApiClient from '../../services/userApiClient';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
const Orders: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth.user);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                                                            <span
                                                                className="badge"
                                                                style={{
                                                                    backgroundColor: getStatusColor(order.globalOrderStatus || 'PLACED'),
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
                                                                {order.globalOrderStatus || 'PLACED'}
                                                            </span>
                                                        </td>
                                                        <td><span className="text-secondary">₹{parseFloat(order.totalAmount).toFixed(2)}</span></td>
                                                        <td><Link to={`/account/orders/${order._id}`} className="btn-link text-underline p-0">View</Link></td>
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
