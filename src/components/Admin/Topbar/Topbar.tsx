import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { adminLogout } from '../../../store/authSlice';
import { adminAuthService } from '../../../services/admin/adminAuthService';
import adminApiClient from '../../../services/adminApiClient';
import type { RootState } from '../../../store';
import noimage from '../../../assets/images/noimage.png';
import {
    Search,
    Sun,
    Grid,
    Languages,
    Bell,
    ChevronDown,
    LogOut,
    User
} from 'lucide-react';
import './Topbar.css';

const Topbar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const adminName = adminData?.name || adminData?.displayName || 'Admin';
    const adminEmail = adminData?.email || 'admin@naturalayam.com';
    const adminPhoto = adminData?.imageUrl || noimage;

    const fetchNotifications = async () => {
        try {
            const res = await adminApiClient.get('/admin/influencers/notifications');
            if (res.data?.success && res.data?.data) {
                if (Array.isArray(res.data.data.notifications)) {
                    setNotifications(res.data.data.notifications);
                } else if (Array.isArray(res.data.data)) {
                    setNotifications(res.data.data);
                } else {
                    setNotifications([]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch admin notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const unreadCount = safeNotifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        setIsDropdownOpen(false);
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.2rem', fontWeight: 600 }}>Ready to leave?</h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666' }}>You are about to securely log out of the admin panel.</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                try {
                                    await adminAuthService.logout();
                                    dispatch(adminLogout());
                                    toast.success('Successfully logged out!');
                                    navigate('/admin');
                                } catch (error) {
                                    toast.error('Logout failed. Please try again.');
                                }
                            }}
                            style={{ padding: '8px 16px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Yes, log out
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
                toastId: "logout-confirm"
            }
        );
    };

    return (
        <header className="admin-topbar">
            <div className="topbar-left">
                <div className="topbar-search">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Type for search..." />
                    </div>
                </div>
            </div>

            <div className="topbar-right">
                <div className="topbar-actions">
                    <button className="action-btn">
                        <Search size={20} />
                    </button>
                    <button className="action-btn">
                        <Sun size={20} />
                    </button>
                    <button className="action-btn">
                        <Grid size={20} />
                    </button>
                    <button className="action-btn">
                        <Languages size={20} />
                    </button>
                    <div style={{ position: 'relative' }}>
                        <button className="action-btn" onClick={() => { setShowNotifications(!showNotifications); setIsDropdownOpen(false); if (!showNotifications) fetchNotifications(); }}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                        </button>
                        {showNotifications && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 100
                            }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Notifications</span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{unreadCount} unread</span>
                                </div>
                                <div>
                                    {safeNotifications.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No notifications</div>
                                    ) : (
                                        safeNotifications.map(n => (
                                            <div key={n._id} onClick={async () => {
                                                if (!n.isRead) {
                                                    try {
                                                        await adminApiClient.put(`/admin/influencers/notifications/${n._id}/read`);
                                                        setNotifications(prev => (Array.isArray(prev) ? prev : []).map(item => item._id === n._id ? { ...item, isRead: true } : item));
                                                    } catch (e) {}
                                                }
                                                setShowNotifications(false);
                                                const isInfluencerRequest =
                                                    n.type === 'INFLUENCER_REQUEST' ||
                                                    (typeof n.message === 'string' && n.message.toLowerCase().includes('influencer request')) ||
                                                    (typeof n.title === 'string' && n.title.toLowerCase().includes('influencer request')) ||
                                                    (typeof n.link === 'string' && n.link.includes('requests'));
                                                if (isInfluencerRequest) {
                                                    navigate('/admin/influencers?tab=requests', { state: { tab: 'requests' } });
                                                } else {
                                                    navigate(n.link || '/admin/influencers');
                                                }
                                            }} style={{
                                                padding: '12px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                                                backgroundColor: n.isRead ? '#fff' : '#f8fafc', transition: 'background-color 0.2s'
                                            }} className="notification-item-hover">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{n.title || 'Notification'}</strong>
                                                    {!n.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }}></span>}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{n.message}</div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="user-profile" onClick={() => { setIsDropdownOpen(!isDropdownOpen); setShowNotifications(false); }} style={{ cursor: 'pointer', position: 'relative' }}>
                    <div className="user-avatar">
                        <img src={adminPhoto} alt={adminName} />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{adminName}</span>
                        <span className="user-role">{adminData?.role?.toUpperCase() === 'STAFF' ? 'Staff' : 'Store Owner'}</span>
                    </div>
                    <ChevronDown size={14} className="dropdown-arrow" />

                    {isDropdownOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '200px', zIndex: 100
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{adminName}</div>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{adminEmail}</div>
                            </div>
                            <div style={{ padding: '8px' }}>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        navigate('/admin/profile');
                                    }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#475569', textAlign: 'left' }}
                                    className="dropdown-item-hover"
                                >
                                    <User size={16} /> My Profile
                                </button>
                                <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', textAlign: 'left' }} className="dropdown-item-hover">
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
