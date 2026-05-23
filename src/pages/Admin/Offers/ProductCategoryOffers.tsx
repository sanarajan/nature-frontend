import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Calendar, Power, Search, LayoutGrid, Package } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { toast } from 'react-toastify';
import './Offers.css';

const ProductCategoryOffers: React.FC = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingOffer, setEditingOffer] = useState<any>(null);

    const [formData, setFormData] = useState({
        offerName: '',
        offerFor: 'product',
        productId: '',
        categoryId: '',
        discountType: 'percentage',
        discountValue: 0,
        startDate: '',
        endDate: '',
        status: true
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [offerRes, prodRes, catRes] = await Promise.all([
                apiClient.get('/admin/offers'),
                apiClient.get('/admin/products'),
                apiClient.get('/admin/categories')
            ]);
            
            if (offerRes.data.success) setOffers(offerRes.data.data);
            if (prodRes.data.success) setProducts(prodRes.data.data);
            if (catRes.data.success) setCategories(catRes.data.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                discountValue: Number(formData.discountValue),
                productId: formData.offerFor === 'product' ? formData.productId : undefined,
                categoryId: formData.offerFor === 'category' ? formData.categoryId : undefined
            };

            if (editingOffer) {
                const res = await apiClient.put(`/admin/offers/${editingOffer._id}`, payload);
                if (res.data.success) {
                    toast.success('Offer updated successfully');
                    setShowModal(false);
                    fetchInitialData();
                }
            } else {
                const res = await apiClient.post('/admin/offers', payload);
                if (res.data.success) {
                    toast.success('Offer created successfully');
                    setShowModal(false);
                    fetchInitialData();
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save offer');
        }
    };

    const handleDelete = (id: string) => {
        toast.info(
            <div>
                <p className="mb-2">Delete this offer?</p>
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
            const res = await apiClient.delete(`/admin/offers/${id}`);
            if (res.data.success) {
                toast.success('Offer deleted');
                setOffers(prev => prev.filter(o => o._id !== id));
            }
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const toggleOfferStatus = async (id: string) => {
        try {
            const res = await apiClient.patch(`/admin/offers/${id}/toggle`);
            if (res.data.success) {
                toast.success('Status updated');
                fetchInitialData();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const openEditModal = (offer: any) => {
        setEditingOffer(offer);
        setFormData({
            offerName: offer.offerName,
            offerFor: offer.offerFor,
            productId: offer.productId?._id || '',
            categoryId: offer.categoryId?._id || '',
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            startDate: offer.startDate.split('T')[0],
            endDate: offer.endDate.split('T')[0],
            status: offer.status
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingOffer(null);
        setFormData({
            offerName: '',
            offerFor: 'product',
            productId: '',
            categoryId: '',
            discountType: 'percentage',
            discountValue: 0,
            startDate: '',
            endDate: '',
            status: true
        });
    };

    const filteredOffers = offers.filter(offer =>
        offer.offerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Product & Category Offers</h2>
                    <p className="admin-page-subtitle">Manage automatic discounts for specific products or entire categories.</p>
                </div>
                <button 
                    className="admin-btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    <span>Create Offer</span>
                </button>
            </div>

            <div className="admin-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Tag size={24} />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Total Offers</p>
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
                <div className="stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                        <Calendar size={24} />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Upcoming</p>
                        <h3 className="stat-value">{offers.filter(o => new Date(o.startDate) > new Date()).length}</h3>
                    </div>
                </div>
            </div>

            <div className="admin-table-controls">
                <div className="search-bar">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search offers..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="admin-table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Offer Name</th>
                                <th>Applicable To</th>
                                <th>Discount</th>
                                <th>Validity</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="mt-2">Loading offers...</p>
                                    </td>
                                </tr>
                            ) : filteredOffers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-5 text-muted">
                                        No offers found. Create your first offer!
                                    </td>
                                </tr>
                            ) : (
                                filteredOffers.map(offer => (
                                    <tr key={offer._id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="offer-icon">
                                                    {offer.offerFor === 'product' ? <Package size={16} /> : <LayoutGrid size={16} />}
                                                </div>
                                                <div>
                                                    <span className="fw-semibold">{offer.offerName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${offer.offerFor === 'product' ? 'badge-blue' : 'badge-purple'}`}>
                                                {offer.offerFor === 'product' ? 'Product' : 'Category'}
                                            </span>
                                            <div className="small text-muted mt-1">
                                                {offer.offerFor === 'product' ? offer.productId?.productName : offer.categoryId?.categoryName}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="discount-value">
                                                {offer.discountType === 'percentage' ? `${offer.discountValue}% Off` : `₹${offer.discountValue} Off`}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="small">
                                                <div className="text-success">From: {new Date(offer.startDate).toLocaleDateString()}</div>
                                                <div className="text-danger">To: {new Date(offer.endDate).toLocaleDateString()}</div>
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
                                                <button className="icon-btn-edit" onClick={() => openEditModal(offer)}>
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

            {showModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="modal-header">
                            <h3>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group mb-3">
                                    <label>Offer Name</label>
                                    <input 
                                        type="text" 
                                        name="offerName"
                                        value={formData.offerName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Summer Sale"
                                        required
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label>Offer For</label>
                                            <select name="offerFor" value={formData.offerFor} onChange={handleInputChange}>
                                                <option value="product">Product</option>
                                                <option value="category">Category</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        {formData.offerFor === 'product' ? (
                                            <div className="form-group mb-3">
                                                <label>Select Product</label>
                                                <select name="productId" value={formData.productId} onChange={handleInputChange} required>
                                                    <option value="">Choose...</option>
                                                    {products.map(p => (
                                                        <option key={p._id} value={p._id}>{p.productName} (₹{p.price})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="form-group mb-3">
                                                <label>Select Category</label>
                                                <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                                                    <option value="">Choose...</option>
                                                    {categories.map(c => (
                                                        <option key={c._id} value={c._id}>{c.categoryName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label>Discount Type</label>
                                            <select name="discountType" value={formData.discountType} onChange={handleInputChange}>
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="amount">Fixed Amount (₹)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label>Discount Value</label>
                                            <input 
                                                type="number" 
                                                name="discountValue"
                                                value={formData.discountValue}
                                                onChange={handleInputChange}
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label>Start Date</label>
                                            <input 
                                                type="date" 
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label>End Date</label>
                                            <input 
                                                type="date" 
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="admin-btn-primary">
                                    {editingOffer ? 'Save Changes' : 'Create Offer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCategoryOffers;
