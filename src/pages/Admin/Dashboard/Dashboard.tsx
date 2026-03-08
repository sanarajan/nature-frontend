import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area,
    ResponsiveContainer
} from 'recharts';
import {
    MoreVertical,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import noimage from '../../../assets/images/noimage.png';
import './Dashboard.css';

const data = [
    { name: 'Mon', revenue: 4000, orders: 240 },
    { name: 'Tue', revenue: 3000, orders: 138 },
    { name: 'Wed', revenue: 2000, orders: 980 },
    { name: 'Thu', revenue: 2780, orders: 390 },
    { name: 'Fri', revenue: 1890, orders: 480 },
    { name: 'Sat', revenue: 2390, orders: 380 },
    { name: 'Sun', revenue: 3490, orders: 430 },
];

const Dashboard: React.FC = () => {
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const adminName = adminData?.name || adminData?.displayName || 'Admin';
    const adminPhoto = adminData?.imageUrl || noimage;

    const [currentTime, setCurrentTime] = useState(new Date());

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
                            <h2 className="welcome-label">Welcome,</h2>
                            <h1 className="admin-name">{adminName}</h1>
                        </div>
                    </div>
                    <div className="hero-stats">
                        <div className="circle-stat">
                            <div className="circle-progress" style={{ '--progress': '85%' } as any}>
                                <span className="progress-value">85%</span>
                                <span className="progress-label">Ready</span>
                            </div>
                        </div>
                        <div className="divider"></div>
                        <div className="text-stats">
                            <div className="stat-item">
                                <span className="stat-label">Orders</span>
                                <div className="stat-value-group">
                                    <span className="stat-value">162</span>
                                    <span className="stat-trend up">▲ 8.01%</span>
                                </div>
                            </div>
                        </div>
                        <div className="circle-stat">
                            <div className="circle-progress secondary" style={{ '--progress': '65%' } as any}>
                                <span className="progress-value">65%</span>
                                <span className="progress-label">Done</span>
                            </div>
                        </div>
                        <div className="divider"></div>
                        <div className="text-stats">
                            <div className="stat-item">
                                <span className="stat-label">Return</span>
                                <div className="stat-value-group">
                                    <span className="stat-value">6</span>
                                    <span className="stat-trend down">▼ 1.50%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="main-stats-card amount-card">
                    <div className="card-top">
                        <h2 className="amount">$2501.00</h2>
                        <p className="subtitle">Open order amount</p>
                        <p className="detail">$1500.50 received - 65% prepaid orders</p>
                    </div>
                    <div className="amount-visual">
                        <div className="pill-visual"></div>
                        <div className="pill-visual"></div>
                        <div className="pill-visual"></div>
                    </div>
                    <div className="summary-footer">
                        <div className="footer-icon"><TrendingUp size={16} /></div>
                        <div className="footer-text">
                            <span className="footer-label">Summary</span>
                            <span className="footer-value">Product Sales Growth <span className="trend-up">2.11%</span></span>
                        </div>
                    </div>
                </div>

                <div className="main-stats-card chart-card">
                    <div className="card-header-flex">
                        <div>
                            <div className="icon-badge"><ShoppingBag size={20} /></div>
                            <h3 className="card-title">Order Summary</h3>
                            <p className="card-subtitle">Order Received <span className="trend-up">▲ 1.11%</span></p>
                        </div>
                        <button className="btn-more"><MoreVertical size={18} /></button>
                    </div>
                    <div className="chart-value">2501.00</div>
                    <p className="chart-label">Total Order Completed</p>
                    <div className="chart-container-small">
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6b9e5d" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6b9e5d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="orders" stroke="#6b9e5d" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="main-stats-card chart-card">
                    <div className="card-header-flex">
                        <div>
                            <div className="icon-badge secondary"><DollarSign size={20} /></div>
                            <h3 className="card-title">Revenue Generated</h3>
                            <p className="card-subtitle">Total decreased from previous <span className="trend-down">▼ 0.86%</span></p>
                        </div>
                        <button className="btn-more"><MoreVertical size={18} /></button>
                    </div>
                    <div className="chart-value">$12,501.00</div>
                    <p className="chart-label">Total Order Completed</p>
                    <div className="chart-container-small">
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={data}>
                                <Area type="monotone" dataKey="revenue" stroke="#A8D5BA" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
