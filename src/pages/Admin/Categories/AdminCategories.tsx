import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';

interface Category {
    _id: string;
    categoryName: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    imageUrl?: string;
}

const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [categoryName, setCategoryName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState(''); // Holds existing cloudinary URL (for edit/view)
    const [imagePreview, setImagePreview] = useState<string>(''); // Base64 preview of new file, or existing URL
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            const res = await apiClient.get('/admin/categories');
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch categories', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setCategoryName('');
        setDescription('');
        setImageUrl('');
        setImagePreview('');
        setIsActive(true);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', cat?: Category) => {
        setModalMode(mode);
        if (cat) {
            setSelectedCategoryId(cat._id);
            setCategoryName(cat.categoryName);
            setDescription(cat.description || '');
            setImageUrl(cat.imageUrl || '');
            setImagePreview(cat.imageUrl || '');
            setIsActive(cat.isActive);
        } else {
            resetForm();
            setSelectedCategoryId(null);
        }
        setIsModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImagePreview('');
        setImageUrl('');
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.1rem', fontWeight: 600 }}>Delete Category?</h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666' }}>Products cannot be attached to this category.</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                try {
                                    const res = await apiClient.delete(`/admin/categories/${id}`);
                                    if (res.data.success) {
                                        toast.success('Category deleted successfully!');
                                        fetchCategories();
                                    }
                                } catch (error: any) {
                                    toast.error(error.response?.data?.message || 'Failed to delete category.');
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

        // Frontend validation
        if (!categoryName.trim()) {
            toast.error('Category Name is required.');
            return;
        }

        // Determine final image value: new base64 file takes priority, else existing URL
        const finalImageValue = imagePreview && imagePreview.startsWith('data:image')
            ? imagePreview
            : imageUrl.trim();

        setLoading(true);
        try {
            if (modalMode === 'edit' && selectedCategoryId) {
                const res = await apiClient.put(`/admin/categories/${selectedCategoryId}`, {
                    categoryName: categoryName.trim(),
                    description: description.trim(),
                    isActive,
                    imageUrl: finalImageValue
                });

                if (res.data.success) {
                    toast.success('Category updated successfully!');
                    fetchCategories();
                    handleCloseModal();
                }
            } else {
                const res = await apiClient.post('/admin/categories', {
                    categoryName: categoryName.trim(),
                    description: description.trim(),
                    isActive,
                    imageUrl: finalImageValue
                });

                if (res.data.success) {
                    toast.success('Category successfully added!');
                    fetchCategories();
                    handleCloseModal();
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add category. Category name might already exist.');
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
        <div className="admin-page-container" style={{ position: 'relative' }}>
            <div className="page-header">
                <h1 className="page-title">Categories</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin" onClick={() => handleOpenModal('add')}>
                        <Plus size={18} /> Add Category
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search categories..." />
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Image</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat._id}>
                                    <td style={{ fontWeight: 600 }}>{cat.categoryName}</td>
                                    <td style={{ width: 80 }}>
                                        {cat.imageUrl ? (
                                            <img src={cat.imageUrl} alt={cat.categoryName} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                        ) : (
                                            <div style={{ width: 60, height: 40, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: '#94a3b8', fontSize: 12 }}>No</div>
                                        )}
                                    </td>
                                    <td>{cat.description || '--'}</td>
                                    <td>{getStatusBadge(cat.isActive)}</td>
                                    <td>{formatDate(cat.createdAt)}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn" title="View" onClick={() => handleOpenModal('view', cat)}>
                                                <Eye size={16} />
                                            </button>
                                            <button className="action-btn" title="Edit" onClick={() => handleOpenModal('edit', cat)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="action-btn delete" title="Delete" onClick={() => handleDelete(cat._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                                        No categories found. Click "Add Category" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Popup */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', width: '450px', borderRadius: '16px',
                        padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                                {modalMode === 'add' ? 'Add New Category' : modalMode === 'edit' ? 'Edit Category' : 'View Category'}
                            </h3>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Category Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: modalMode === 'view' ? '#f8fafc' : '#fff' }}
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    placeholder="Enter category name"
                                    disabled={modalMode === 'view'}
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Description</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: modalMode === 'view' ? '#f8fafc' : '#fff' }}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                    disabled={modalMode === 'view'}
                                ></textarea>
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Category Image</label>

                                {/* Image Preview */}
                                {imagePreview ? (
                                    <div style={{ position: 'relative', display: 'block', marginBottom: 10, width: '100%' }}>
                                        <img
                                            src={imagePreview}
                                            alt="category preview"
                                            style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0', display: 'block' }}
                                        />
                                        {modalMode !== 'view' && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                title="Remove image"
                                                style={{
                                                    position: 'absolute', top: 6, right: 6,
                                                    background: 'rgba(220,38,38,0.85)', border: 'none',
                                                    borderRadius: '50%', width: 26, height: 26,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', color: '#fff'
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ) : null}

                                {/* Upload Button – shown in add/edit mode only */}
                                {modalMode !== 'view' && (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={imageInputRef}
                                            id="categoryImageUpload"
                                            style={{ display: 'none' }}
                                            onChange={handleImageChange}
                                        />
                                        <label
                                            htmlFor="categoryImageUpload"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: 8, padding: '10px 16px', borderRadius: 8,
                                                border: '1.5px dashed #94a3b8', background: '#f8fafc',
                                                cursor: 'pointer', color: '#475569', fontSize: '0.9rem',
                                                fontWeight: 500, transition: 'border-color 0.2s'
                                            }}
                                        >
                                            <Upload size={16} />
                                            {imagePreview ? 'Change Image' : 'Upload Image'}
                                        </label>
                                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>
                                            Recommended: JPG or PNG, up to 5 MB
                                        </p>
                                    </>
                                )}

                                {/* No image placeholder in view mode */}
                                {modalMode === 'view' && !imagePreview && (
                                    <div style={{
                                        width: '100%', height: 80, background: '#f1f5f9',
                                        borderRadius: 8, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem'
                                    }}>
                                        No image set
                                    </div>
                                )}
                            </div>

                            <div className="form-group mb-4" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                    disabled={modalMode === 'view'}
                                />
                                <label htmlFor="isActive" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: modalMode === 'view' ? 'default' : 'pointer' }}>Active Status</label>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={handleCloseModal} style={{
                                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd',
                                    background: '#fff', cursor: 'pointer', fontWeight: 600
                                }}>
                                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                                </button>
                                {modalMode !== 'view' && (
                                    <button type="submit" disabled={loading} style={{
                                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                                        background: 'var(--admin-primary-dark)', color: '#fff', cursor: 'pointer', fontWeight: 600
                                    }}>
                                        {loading ? 'Saving...' : 'Save Category'}
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

export default AdminCategories;
