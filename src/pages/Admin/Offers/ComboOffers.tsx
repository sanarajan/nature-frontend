import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Zap, Power } from 'lucide-react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import './Offers.css';

const ComboOffers: React.FC = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const offerRes = await adminApiClient.get('/admin/combo-listing/list');
            if (offerRes.data.success) setOffers(offerRes.data.data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        toast.info(
            <div>
                <p className="mb-2">Delete this combo offer?</p>
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        className="btn btn-sm btn-light"
                        onClick={() => toast.dismiss()}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                            toast.dismiss();
                            confirmDelete(id);
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false
            }
        );
    };

    const confirmDelete = async (id: string) => {
        try {
            const res = await adminApiClient.delete(`/admin/combo-listing/${id}`);
            if (res.data.success) {
                toast.success('Deleted');
                setOffers(prev => prev.filter(o => o._id !== id));
            }
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const toggleOfferStatus = async (id: string) => {
        try {
            const res = await adminApiClient.put(`/admin/combo-listing/${id}/toggle`);
            if (res.data.success) {
                toast.success('Status updated');
                fetchInitialData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Combo Offers</h2>
                    <p className="admin-page-subtitle">Create discounts for specific groupings of products (e.g. A + B = ₹100 Off).</p>
                </div>
                <button
                    className="admin-btn-primary"
                    onClick={() => navigate('/admin/offers/combo/create')}
                >
                    <Plus size={18} />
                    <span>Create Combo</span>
                </button>
            </div>

            <div className="admin-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Zap size={24} />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Total Combos</p>
                        <h3 className="stat-value">{offers.length}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <Power size={24} />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Active</p>
                        <h3 className="stat-value">{offers.filter(o => o.status).length}</h3>
                    </div>
                </div>
            </div>

            <div className="admin-table-card mt-4">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Combo Name</th>
                                <th>Products Included</th>
                                <th>Discount</th>
                                <th>Validity</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center p-5">Loading...</td></tr>
                            ) : offers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-5">No combo offers found.</td></tr>
                            ) : (
                                offers.map(offer => (
                                    <tr key={offer._id}>
                                        <td>
                                            {offer.imageUrl ? (
                                                <img src={offer.imageUrl} alt={offer.offerName} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                                    <Zap size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td><strong>{offer.offerName}</strong></td>
                                        <td>
                                            <div className="combo-products-list">
                                                {offer.products.map((p: any) => (
                                                    <span key={p.productId?._id} className="combo-p-tag">
                                                        {p.productId?.productName} (x{p.requiredQuantity || p.quantity})
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="discount-value">
                                                {offer.discountType === 'percentage' ? `${offer.discountValue}% Off` : `₹${offer.discountValue} Off`}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="small">
                                                <div>{new Date(offer.startDate).toLocaleDateString()}</div>
                                                <div className="text-muted text-center">to</div>
                                                <div>{new Date(offer.endDate).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className={`status-chip ${offer.status ? 'active' : 'inactive'}`}
                                                onClick={() => toggleOfferStatus(offer._id)}
                                            >
                                                {offer.status ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-end gap-2">
                                                <button className="icon-btn-edit" onClick={() => navigate(`/admin/offers/combo/edit/${offer._id}`)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="icon-btn-delete" onClick={() => handleDelete(offer._id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComboOffers;
