import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, Edit2, Calendar, Tag, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import '../../../styles/admin-pages.css';

const AdminCoupons: React.FC = () => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/admin/coupon');
            if (res.data.success) {
                setCoupons(res.data.data || []);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        try {
            const res = await apiClient.delete(`/admin/coupon/${id}`);
            if (res.data.success) {
                toast.success('Coupon deleted successfully');
                fetchCoupons();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const res = await apiClient.patch(`/admin/coupon/${id}/toggle-status`);
            if (res.data.success) {
                toast.success('Status updated');
                setCoupons(prev => prev.map(c => c._id === id ? { ...c, status: !c.status } : c));
            }
        } catch (error: any) {
            toast.error('Failed to toggle status');
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.couponName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Coupons</h1>
                <Link to="/admin/coupons/add" className="btn-primary-admin">
                    <Plus size={18} /> Add Coupon
                </Link>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search coupons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Coupon Details</th>
                                <th>Discount</th>
                                <th>Validity</th>
                                <th>Min Purchase</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading coupons...</td></tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No coupons found.</td></tr>
                            ) : filteredCoupons.map((coupon) => (
                                <tr key={coupon._id}>
                                    <td>
                                        <div className="product-info">
                                            {coupon.couponImage?.[0] ? (
                                                <img className="product-img" src={coupon.couponImage[0]} alt={coupon.couponName} />
                                            ) : (
                                                <div className="product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                                                    <Tag size={20} color="#64748b" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="product-name">{coupon.couponName}</div>
                                                <div className="product-category" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {coupon.description}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#059669' }}>
                                            {coupon.discountType === 'Percentage'
                                                ? `${coupon.discountPercentage}% OFF`
                                                : `₹${coupon.discountValue} OFF`}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> {new Date(coupon.startDate).toLocaleDateString()}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                                                to {new Date(coupon.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td>₹{coupon.minPurchase}</td>
                                    <td>
                                        <button
                                            onClick={() => toggleStatus(coupon._id)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            {coupon.status ? (
                                                <span className="admin-badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={10} /> Active
                                                </span>
                                            ) : (
                                                <span className="admin-badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <XCircle size={10} /> Inactive
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <Link to={`/admin/coupons/edit/${coupon._id}`} className="action-btn" title="Edit">
                                                <Edit2 size={16} />
                                            </Link>
                                            <button className="action-btn delete" title="Delete" onClick={() => handleDelete(coupon._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCoupons;
