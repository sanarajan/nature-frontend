import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, Tags } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';

interface Category {
    _id: string;
    categoryName: string;
}

interface SubCategory {
    _id: string;
    subcategoryName: string;
    categoryId: Category;
    description: string;
    isActive: boolean;
    createdAt: string;
}

const AdminSubcategories: React.FC = () => {
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [subcategoryName, setSubcategoryName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [subRes, catRes] = await Promise.all([
                apiClient.get('/admin/subcategories'),
                apiClient.get('/admin/categories')
            ]);

            if (subRes.data.success) {
                setSubcategories(subRes.data.data);
            }
            if (catRes.data.success) {
                setCategories(catRes.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch data', err);
            toast.error('Failed to load subcategories or categories');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setSubcategoryName('');
        setCategoryId('');
        setDescription('');
        setIsActive(true);
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', sub?: SubCategory) => {
        setModalMode(mode);
        if (sub) {
            setSelectedSubCategoryId(sub._id);
            setSubcategoryName(sub.subcategoryName);
            setCategoryId(sub.categoryId?._id || '');
            setDescription(sub.description || '');
            setIsActive(sub.isActive);
        } else {
            resetForm();
            setSelectedSubCategoryId(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.1rem', fontWeight: 600 }}>Delete Subcategory?</h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666' }}>This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                try {
                                    const res = await apiClient.delete(`/admin/subcategories/${id}`);
                                    if (res.data.success) {
                                        toast.success('Subcategory deleted successfully!');
                                        fetchData();
                                    }
                                } catch (error: any) {
                                    toast.error(error.response?.data?.message || 'Failed to delete subcategory.');
                                }
                            }}
                            style={{ padding: '6px 12px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={closeToast as any}
                            style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (modalMode === 'view') {
            handleCloseModal();
            return;
        }

        if (!subcategoryName.trim()) {
            toast.error('Subcategory Name is required.');
            return;
        }
        if (!categoryId) {
            toast.error('Parent Category is required.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                subcategoryName: subcategoryName.trim(),
                categoryId,
                description: description.trim(),
                isActive
            };

            if (modalMode === 'edit' && selectedSubCategoryId) {
                const res = await apiClient.put(`/admin/subcategories/${selectedSubCategoryId}`, payload);
                if (res.data.success) {
                    toast.success('Subcategory updated successfully!');
                    fetchData();
                    handleCloseModal();
                }
            } else {
                const res = await apiClient.post('/admin/subcategories', payload);
                if (res.data.success) {
                    toast.success('Subcategory successfully added!');
                    fetchData();
                    handleCloseModal();
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save subcategory.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: boolean) => {
        return status ? (
            <span className="admin-badge badge-success">Active</span>
        ) : (
            <span className="admin-badge badge-danger">Inactive</span>
        );
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Subcategories</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin" onClick={() => handleOpenModal('add')}>
                        <Plus size={18} /> Add Subcategory
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search subcategories..." />
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Subcategory Name</th>
                                <th>Parent Category</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subcategories.map((sub) => (
                                <tr key={sub._id}>
                                    <td style={{ fontWeight: 600 }}>{sub.subcategoryName}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Tags size={14} color="#64748b" />
                                            {sub.categoryId?.categoryName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>{sub.description || '--'}</td>
                                    <td>{getStatusBadge(sub.isActive)}</td>
                                    <td>{formatDate(sub.createdAt)}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn" title="View" onClick={() => handleOpenModal('view', sub)}>
                                                <Eye size={16} />
                                            </button>
                                            <button className="action-btn" title="Edit" onClick={() => handleOpenModal('edit', sub)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="action-btn delete" title="Delete" onClick={() => handleDelete(sub._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subcategories.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                                        No subcategories found. Click "Add Subcategory" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="admin-modal" style={{ maxWidth: '500px', padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                {modalMode === 'add' ? 'Add Subcategory' : modalMode === 'edit' ? 'Edit Subcategory' : 'Subcategory Details'}
                            </h3>
                            <button onClick={handleCloseModal} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '10px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label className="form-label">Parent Category *</label>
                                <select
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    disabled={modalMode === 'view'}
                                    required
                                >
                                    <option value="">Select Parent Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Subcategory Name *</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                    value={subcategoryName}
                                    onChange={(e) => setSubcategoryName(e.target.value)}
                                    placeholder="e.g. Organic Vegetables"
                                    disabled={modalMode === 'view'}
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="admin-input"
                                    rows={3}
                                    style={{ width: '100%' }}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter subcategory description"
                                    disabled={modalMode === 'view'}
                                ></textarea>
                            </div>

                            <div className="form-group mb-4" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    disabled={modalMode === 'view'}
                                />
                                <label htmlFor="isActive" style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Active Status</label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                                <button type="button" onClick={handleCloseModal} className="btn-primary-admin secondary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#475569', boxShadow: 'none' }}>
                                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                                </button>
                                {modalMode !== 'view' && (
                                    <button type="submit" disabled={loading} className="btn-primary-admin" style={{ flex: 1, justifyContent: 'center' }}>
                                        {loading ? 'Saving...' : 'Save Subcategory'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubcategories;
