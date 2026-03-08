import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { adminLogout } from '../../../store/authSlice';
import { adminAuthService } from '../../../services/admin/adminAuthService';
import logo from '../../../assets/images/logo.png';
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    BarChart3,
    Layers,
    Settings,
    BookOpen,
    Heart,
    ChevronLeft,
    ChevronDown,
    ClipboardList,
    CheckCircle2,
    Wallet,
    Receipt,
    Percent,
    Tags,
    Truck,
    LogOut
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
        orders: true,
        finance: true
    });

    const toggleMenu = (menu: string) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
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
        <aside className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon-wrapper" style={{ background: 'none' }}>
                        <img src={logo} alt="Naturalayam" style={{ height: '35px', width: 'auto' }} />
                    </div>
                    <div className="logo-details">
                        <span className="logo-text">Naturalayam</span>
                        <span className="logo-subtext">Online Shopping</span>
                    </div>
                </div>
                <button className="collapse-toggle" onClick={toggleSidebar}>
                    <ChevronLeft size={18} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <p className="section-label">MAIN</p>

                    <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <div className={`nav-group ${expandedMenus.orders ? 'expanded' : ''}`}>
                        <div className="nav-item-toggle" onClick={() => toggleMenu('orders')}>
                            <div className="nav-item-left">
                                <ShoppingCart size={20} />
                                <span>Orders</span>
                            </div>
                            <ChevronDown size={14} className="group-arrow" />
                        </div>

                        <div className="sub-menu">
                            <NavLink to="/admin/orders" end className={({ isActive }) => isActive ? 'sub-nav-item active' : 'sub-nav-item'}>
                                <ClipboardList size={18} />
                                <span>All Orders</span>
                            </NavLink>
                            <NavLink to="/admin/orders/completed" className={({ isActive }) => isActive ? 'sub-nav-item active' : 'sub-nav-item'}>
                                <CheckCircle2 size={18} />
                                <span>Completed Orders</span>
                            </NavLink>
                        </div>
                    </div>

                    <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Users size={20} />
                        <span>Customers</span>
                    </NavLink>

                    <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Package size={20} />
                        <span>Products</span>
                    </NavLink>

                    <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Tags size={20} />
                        <span>Categories</span>
                    </NavLink>

                    <NavLink to="/admin/subcategories" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Layers size={20} />
                        <span>Subcategories</span>
                    </NavLink>

                    <NavLink to="/admin/coupons" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Percent size={20} />
                        <span>Coupons</span>
                    </NavLink>

                    <NavLink to="/admin/shipping-agencies" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Truck size={20} />
                        <span>Shipping Agencies</span>
                    </NavLink>

                    <NavLink to="/admin/shipping-charges" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Receipt size={20} />
                        <span>Shipping Charges</span>
                    </NavLink>

                    <div className={`nav-group ${expandedMenus.finance ? 'expanded' : ''}`}>
                        <div className="nav-item-toggle" onClick={() => toggleMenu('finance')}>
                            <div className="nav-item-left">
                                <BarChart3 size={20} />
                                <span>Finance</span>
                            </div>
                            <ChevronDown size={14} className="group-arrow" />
                        </div>

                        <div className="sub-menu">
                            <NavLink to="/admin/finance/billing" className={({ isActive }) => isActive ? 'sub-nav-item active' : 'sub-nav-item'}>
                                <Wallet size={18} />
                                <span>Billing</span>
                            </NavLink>
                            <NavLink to="/admin/finance/invoices" className={({ isActive }) => isActive ? 'sub-nav-item active' : 'sub-nav-item'}>
                                <Receipt size={18} />
                                <span>Invoices</span>
                            </NavLink>
                            <NavLink to="/admin/finance/discount" className={({ isActive }) => isActive ? 'sub-nav-item active' : 'sub-nav-item'}>
                                <Percent size={18} />
                                <span>Discount</span>
                            </NavLink>
                        </div>
                    </div>

                    <NavLink to="/admin/integrations" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Layers size={20} />
                        <span>Integrations</span>
                    </NavLink>

                    <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </NavLink>
                </div>

                <div className="nav-section mt-4">
                    <p className="section-label">OTHER</p>
                    <NavLink to="/admin/pages" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <BookOpen size={20} />
                        <span>Pages</span>
                        <span className="badge-pill">45+</span>
                    </NavLink>
                    <NavLink to="/admin/personalize" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <Heart size={20} />
                        <span>Personalize ❤️</span>
                    </NavLink>
                </div>

                <div className="nav-section mt-4" style={{ marginTop: 'auto', paddingBottom: '20px' }}>
                    <button className="nav-item" onClick={handleLogout} style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ff4d4f', marginTop: '20px' }}>
                        <LogOut size={20} />
                        <span style={{ fontWeight: 600 }}>Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
