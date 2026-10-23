import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    ShoppingBag,
    Users,
    Clock,
    AlertTriangle,
    Eye,
    ArrowRight,
    Calendar,
    RefreshCw,
    Package
} from 'lucide-react';
import type { RootState } from '../../../store';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import noimage from '../../../assets/images/noimage.png';
import '../../../styles/admin-pages.css';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const adminName = adminData?.name || adminData?.displayName || 'Admin';
    const adminPhoto = adminData?.imageUrl || noimage;

    const [currentTime, setCurrentTime] = useState(new Date());

    // Data States
    const [orders, setOrders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Loading & Error States
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const [ordersError, setOrdersError] = useState<string | null>(null);
    const [customersError, setCustomersError] = useState<string | null>(null);
    const [productsError, setProductsError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date: Date) => {
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).replace(/,/g, ' |');
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        setOrdersError(null);
        try {
            const res = await apiClient.get('/admin/orders');
            if (res.data.success) {
                setOrders(res.data.data || []);
            } else {
                setOrdersError('Failed to load orders');
            }
        } catch (err: any) {
            setOrdersError(err.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        setCustomersError(null);
        try {
            const res = await apiClient.get('/admin/users');
            if (res.data.success) {
                setCustomers(res.data.data || []);
            } else {
                setCustomersError('Failed to load customers');
            }
        } catch (err: any) {
            setCustomersError(err.response?.data?.message || 'Failed to load customers');
        } finally {
            setLoadingCustomers(false);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        setProductsError(null);
        try {
            const res = await apiClient.get('/admin/products');
            if (res.data.success) {
                setProducts(res.data.data || []);
            } else {
                setProductsError('Failed to load products');
            }
        } catch (err: any) {
            setProductsError(err.response?.data?.message || 'Failed to load products');
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchCustomers();
        fetchProducts();
    }, []);

    // Existing project order-status logic for pending orders
    const isOrderPending = (order: any): boolean => {
        const s = (order.globalOrderStatus || '').toUpperCase().replace(/_/g, ' ');
        if (
            s.includes('DELIVERED') ||
            s.includes('COMPLETED') ||
            s.includes('CANCELLED') ||
            s.includes('RETURNED') ||
            s === 'CLOSED' ||
            s.includes('EXPIRED')
        ) {
            return false;
        }
        return true;
    };

    const pendingOrdersCount = orders.filter(isOrderPending).length;

    // Latest Orders: max 5, prioritizing pending orders, then filling with most recent other orders
    const latestOrders = useMemo(() => {
        const sorted = [...orders].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

        const pending = sorted.filter(isOrderPending);
        const others = sorted.filter(o => !isOrderPending(o));

        const result: any[] = [];
        const seenIds = new Set<string>();

        for (const order of pending) {
            if (result.length >= 5) break;
            if (!seenIds.has(order._id)) {
                seenIds.add(order._id);
                result.push(order);
            }
        }

        for (const order of others) {
            if (result.length >= 5) break;
            if (!seenIds.has(order._id)) {
                seenIds.add(order._id);
                result.push(order);
            }
        }

        return result;
    }, [orders]);

    // Low Stock Products: using existing threshold (stock <= 10)
    const lowStockProducts = useMemo(() => {
        return products
            .filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 10)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5);
    }, [products]);

    // Recent Customers: max 5, sorted by creation date newest first (already filtered to regular users)
    const recentCustomers = useMemo(() => {
        return [...customers]
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            })
            .slice(0, 5);
    }, [customers]);

    // Reusing existing order status badge styling
    const getOrderStatusBadge = (status: string) => {
        const s = (status || 'PLACED').toUpperCase().replace(/_/g, ' ');
        if (s.includes('SHIPPED')) {
            return <span className="admin-badge badge-info">{s}</span>;
        }
        if (s.includes('PROCESSING')) {
            return (
                <span className="admin-badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    {s}
                </span>
            );
        }
        if (s.includes('DELIVERED') || s.includes('COMPLETED')) {
            return <span className="admin-badge badge-success">{s}</span>;
        }
        if (s.includes('CANCELLED')) {
            return <span className="admin-badge badge-danger">{s}</span>;
        }
        if (s.includes('RETURN REQUEST') || s.includes('CANCELLATION REQUEST') || s.includes('ACTION REQUIRED')) {
            return (
                <span className="admin-badge badge-warning" style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                    {s}
                </span>
            );
        }
        if (s.includes('RETURN')) {
            return (
                <span className="admin-badge badge-dark" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                    {s}
                </span>
            );
        }
        if (s.includes('PLACED') || s.includes('PENDING')) {
            return (
                <span className="admin-badge badge-info" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                    {s}
                </span>
            );
        }
        return <span className="admin-badge badge-info">{s}</span>;
    };

    // Reusing existing stock badge styling
    const getStockConditionBadge = (stock: number) => {
        if (stock === 0) {
            return <span className="admin-badge badge-danger">Out of Stock</span>;
        }
        if (stock <= 10) {
            return <span className="admin-badge badge-warning">Low Stock ({stock})</span>;
        }
        return <span className="admin-badge badge-success">In Stock ({stock})</span>;
    };

    return (
        <div className="dashboard-content admin-body">
            <div className="dashboard-header">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">🏠 Home</span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-active">Dashboard</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <div className="date-picker-placeholder" style={{ minWidth: '220px' }}>
                        <span>{formatDateTime(currentTime)}</span>
                        <Calendar size={18} />
                    </div>
                </div>
            </div>

            <div className="dashboard-hero-row">
                <div className="hero-card">
                    <div className="hero-content">
                        <div className="hero-avatar">
                            <img src={adminPhoto} alt={adminName} />
                        </div>
                        <div className="hero-text">
                            <h2 className="welcome-label">Welcome back,</h2>
                            <h1 className="admin-name">{adminName}</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exactly Three Summary Cards */}
            <div className="dashboard-grid">
                {/* 1. Total Orders */}
                <div className="main-stats-card">
                    <div className="card-header-flex">
                        <div>
                            <div className="icon-badge">
                                <ShoppingBag size={22} color="var(--admin-primary)" />
                            </div>
                            <h3 className="card-title">Total Orders</h3>
                            <p className="card-subtitle">All-time customer orders</p>
                        </div>
                    </div>
                    <div className="chart-value">
                        {loadingOrders ? '...' : orders.length}
                    </div>
                    <p className="chart-label">
                        {ordersError ? (
                            <span className="text-danger">{ordersError}</span>
                        ) : (
                            `${orders.length} order${orders.length === 1 ? '' : 's'} recorded`
                        )}
                    </p>
                </div>

                {/* 2. Pending Orders */}
                <div className="main-stats-card">
                    <div className="card-header-flex">
                        <div>
                            <div className="icon-badge warning-badge" style={{ backgroundColor: '#fffbeb' }}>
                                <Clock size={22} color="#d97706" />
                            </div>
                            <h3 className="card-title">Pending Orders</h3>
                            <p className="card-subtitle">Orders requiring attention</p>
                        </div>
                    </div>
                    <div className="chart-value" style={{ color: pendingOrdersCount > 0 ? '#d97706' : 'inherit' }}>
                        {loadingOrders ? '...' : pendingOrdersCount}
                    </div>
                    <p className="chart-label">
                        {ordersError ? (
                            <span className="text-danger">{ordersError}</span>
                        ) : (
                            `${pendingOrdersCount} pending fulfillment`
                        )}
                    </p>
                </div>

                {/* 3. Total Customers */}
                <div className="main-stats-card">
                    <div className="card-header-flex">
                        <div>
                            <div className="icon-badge info-badge" style={{ backgroundColor: '#eff6ff' }}>
                                <Users size={22} color="#2563eb" />
                            </div>
                            <h3 className="card-title">Total Customers</h3>
                            <p className="card-subtitle">Registered customer accounts</p>
                        </div>
                    </div>
                    <div className="chart-value">
                        {loadingCustomers ? '...' : customers.length}
                    </div>
                    <p className="chart-label">
                        {customersError ? (
                            <span className="text-danger">{customersError}</span>
                        ) : (
                            `${customers.length} registered customer${customers.length === 1 ? '' : 's'}`
                        )}
                    </p>
                </div>
            </div>

            {/* Latest Orders Section */}
            <div className="dashboard-section">
                <div className="admin-card">
                    <div className="dashboard-card-header">
                        <div className="d-flex align-items-center gap-2">
                            <h2 className="dashboard-card-title">
                                <ShoppingBag size={20} color="var(--admin-primary)" />
                                Latest Orders
                            </h2>
                            {pendingOrdersCount > 0 && (
                                <span className="admin-badge badge-warning" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                                    {pendingOrdersCount} Pending
                                </span>
                            )}
                        </div>
                        <button
                            className="btn-view-all"
                            onClick={() => navigate('/admin/orders')}
                            title="View all orders in Admin Orders"
                        >
                            View All <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingOrders ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                <RefreshCw size={18} className="spinner-icon" />
                                                <span>Loading latest orders...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : ordersError ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
                                            {ordersError}
                                        </td>
                                    </tr>
                                ) : latestOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                            No orders placed yet
                                        </td>
                                    </tr>
                                ) : (
                                    latestOrders.map((order) => (
                                        <tr key={order._id}>
                                            <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                                                {order.orderId}
                                            </td>
                                            <td>
                                                <div className="product-info">
                                                    <img
                                                        className="product-img"
                                                        style={{ borderRadius: '50%' }}
                                                        src={order.userId?.imageUrl || '/images/profile4.jpg'}
                                                        alt={order.userId?.displayName || 'Customer'}
                                                    />
                                                    <div>
                                                        <div className="product-name">
                                                            {order.userId?.displayName || 'Unknown Customer'}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            {order.userId?.email || 'No email provided'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatDate(order.createdAt)}</td>
                                            <td style={{ fontWeight: 700 }}>
                                                ₹{(order.totalAmount || 0).toFixed(2)}
                                            </td>
                                            <td>{getOrderStatusBadge(order.globalOrderStatus)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className="action-btn"
                                                    title="View Order Details"
                                                    style={{ margin: '0 auto' }}
                                                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Low Stock Products & Recent Customers Row */}
            <div className="dashboard-two-col-grid">
                {/* Low Stock Products Section */}
                <div className="admin-card">
                    <div className="dashboard-card-header">
                        <div className="d-flex align-items-center gap-2">
                            <h2 className="dashboard-card-title">
                                <AlertTriangle size={20} color="#d97706" />
                                Low Stock Products
                            </h2>
                            {lowStockProducts.length > 0 && (
                                <span className="admin-badge badge-warning" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                                    {lowStockProducts.length} Alert{lowStockProducts.length === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                        <button
                            className="btn-view-all"
                            onClick={() => navigate('/admin/products')}
                            title="View all products in Admin Products"
                        >
                            View All <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingProducts ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                <RefreshCw size={18} className="spinner-icon" />
                                                <span>Loading inventory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : productsError ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
                                            {productsError}
                                        </td>
                                    </tr>
                                ) : lowStockProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                            All product stock levels are healthy
                                        </td>
                                    </tr>
                                ) : (
                                    lowStockProducts.map((product) => (
                                        <tr key={product._id}>
                                            <td>
                                                <div className="product-info">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            className="product-img"
                                                            src={product.images[0]}
                                                            alt={product.productName}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="product-img"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: '#f1f5f9'
                                                            }}
                                                        >
                                                            <Package size={20} color="#94a3b8" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div
                                                            className="product-name"
                                                            style={{
                                                                maxWidth: '180px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}
                                                            title={product.productName}
                                                        >
                                                            {product.productName}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            SKU: {product.sku || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: product.stock === 0 ? '#dc2626' : '#d97706' }}>
                                                {product.stock} items
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                ₹{(product.price || 0).toFixed(2)}
                                            </td>
                                            <td>{getStockConditionBadge(product.stock)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Customers Section */}
                <div className="admin-card">
                    <div className="dashboard-card-header">
                        <div className="d-flex align-items-center gap-2">
                            <h2 className="dashboard-card-title">
                                <Users size={20} color="#2563eb" />
                                Recent Customers
                            </h2>
                        </div>
                        <button
                            className="btn-view-all"
                            onClick={() => navigate('/admin/customers')}
                            title="View all customers in Admin Customers"
                        >
                            View All <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Joined</th>
                                    <th>Orders</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingCustomers ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                <RefreshCw size={18} className="spinner-icon" />
                                                <span>Loading customers...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : customersError ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
                                            {customersError}
                                        </td>
                                    </tr>
                                ) : recentCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                            No registered customers found
                                        </td>
                                    </tr>
                                ) : (
                                    recentCustomers.map((customer) => (
                                        <tr key={customer._id}>
                                            <td>
                                                <div className="product-info">
                                                    <img
                                                        className="product-img"
                                                        style={{ borderRadius: '50%' }}
                                                        src={customer.imageUrl || '/images/profile4.jpg'}
                                                        alt={customer.displayName || 'Customer'}
                                                    />
                                                    <div>
                                                        <div className="product-name">
                                                            {customer.displayName || 'Customer'}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            {customer.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatDate(customer.createdAt)}</td>
                                            <td style={{ fontWeight: 600 }}>
                                                {customer.orderCount || 0}
                                            </td>
                                            <td>
                                                <span className={`admin-badge ${customer.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                                                    {customer.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

