import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit2, Trash2, Filter, Download, AlertTriangle, Eye, X, Star, Zap, Flame, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';

const AdminProducts: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/products');
            if (res.data.success) {
                setProducts(res.data.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleHighlight = async (productId: string, field: string, value: boolean) => {
        try {
            // Optimistic update
            setProducts(prev => prev.map(p =>
                p._id === productId ? { ...p, [field]: value } : p
            ));

            const res = await apiClient.patch(`/admin/products/${productId}/highlight`, { field, value });
            if (!res.data.success) {
                // Revert on failure
                fetchProducts();
                toast.error('Failed to update highlight');
            }
        } catch (err: any) {
            fetchProducts();
            toast.error('Error updating highlight');
        }
    };

    const handleDelete = (id: string, name: string) => {
        const ConfirmDelete = ({ closeToast }: { closeToast?: () => void }) => (
            <div className="delete-confirm-toast">
                <div className="d-flex align-items-center mb-2">
                    <AlertTriangle size={20} color="#ef4444" className="me-2" />
                    <strong style={{ fontSize: '0.95rem' }}>Confirm Delete</strong>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '12px', color: '#64748b' }}>
                    Are you sure you want to delete <strong>"{name}"</strong>?
                </p>
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        className="btn btn-sm btn-light"
                        onClick={closeToast}
                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={async () => {
                            try {
                                const res = await apiClient.delete(`/admin/products/${id}`);
                                if (res.data.success) {
                                    toast.success('Product deleted successfully');
                                    setProducts(prev => prev.filter(p => p._id !== id));
                                    if (closeToast) closeToast();
                                }
                            } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Failed to delete product');
                                if (closeToast) closeToast();
                            }
                        }}
                        style={{ fontSize: '0.8rem', padding: '4px 12px', backgroundColor: '#ef4444' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        );

        toast(<ConfirmDelete />, {
            position: "top-center",
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            closeButton: false,
            className: 'custom-confirm-toast'
        });
    };

    const getStatusBadge = (stock: number) => {
        if (stock === 0) return <span className="admin-badge badge-danger">Out of Stock</span>;
        if (stock <= 10) return <span className="admin-badge badge-warning">Low Stock</span>;
        return <span className="admin-badge badge-success">Active</span>;
    };

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoryId?.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Products</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin secondary" style={{ backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Download size={18} /> Export
                    </button>
                    <button className="btn-primary-admin" onClick={() => navigate('/admin/products/add')}>
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="action-btn" title="Filters">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Highlights</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No products found</td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product._id}>
                                        <td>
                                            <div className="product-info">
                                                {product.images && product.images.length > 0 ? (
                                                    <img className="product-img" src={product.images[0]} alt={product.productName} />
                                                ) : (
                                                    <div className="product-img-placeholder" style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Search size={20} color="#94a3b8" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="product-name">{product.productName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{product.quantity} {product.unitId?.unitName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{product.sku || 'N/A'}</code></td>
                                        <td>{product.categoryId?.categoryName || 'N/A'}</td>
                                        <td>₹{product.price.toFixed(2)}</td>
                                        <td>{product.stock} items</td>
                                        <td>{getStatusBadge(product.stock)}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    onClick={() => handleToggleHighlight(product._id, 'featured', !product.featured)}
                                                    className={`highlight-toggle-btn ${product.featured ? 'active-featured' : ''}`}
                                                    title="Featured"
                                                >
                                                    <Star size={16} fill={product.featured ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleHighlight(product._id, 'isPopular', !product.isPopular)}
                                                    className={`highlight-toggle-btn ${product.isPopular ? 'active-popular' : ''}`}
                                                    title="Popular"
                                                >
                                                    <Award size={16} fill={product.isPopular ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleHighlight(product._id, 'isTrending', !product.isTrending)}
                                                    className={`highlight-toggle-btn ${product.isTrending ? 'active-trending' : ''}`}
                                                    title="Trending"
                                                >
                                                    <Zap size={16} fill={product.isTrending ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleHighlight(product._id, 'isBestSeller', !product.isBestSeller)}
                                                    className={`highlight-toggle-btn ${product.isBestSeller ? 'active-bestseller' : ''}`}
                                                    title="Best Seller"
                                                >
                                                    <Flame size={16} fill={product.isBestSeller ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                        </td>
                                        <td>{formatDate(product.createdAt)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="action-btn"
                                                    title="View"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setActiveImgIndex(0);
                                                        setShowViewModal(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Edit"
                                                    onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    title="Delete"
                                                    onClick={() => handleDelete(product._id, product.productName)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="action-btn" title="More">
                                                    <MoreHorizontal size={16} />
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
            {showViewModal && selectedProduct && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowViewModal(false)}>
                            <X size={20} />
                        </button>
                        <div className="product-view-container">
                            <div className="product-view-grid">
                                <div className="view-image-section">
                                    <div className="main-view-container">
                                        <img
                                            src={selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[activeImgIndex] : ''}
                                            alt={selectedProduct.productName}
                                            className="main-view-img"
                                        />
                                    </div>
                                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                                        <div className="thumb-grid">
                                            {selectedProduct.images.map((img: string, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`thumb-item ${activeImgIndex === idx ? 'active' : ''}`}
                                                    onClick={() => setActiveImgIndex(idx)}
                                                >
                                                    <img src={img} alt={`${selectedProduct.productName} thumb ${idx}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="view-content-section">
                                    <div>
                                        <div className="view-sku">{selectedProduct.sku || 'NO SKU'}</div>
                                        <div className="d-flex flex-wrap gap-2 mb-2 pt-1">
                                            {selectedProduct.featured && <span className="admin-badge badge-info" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>Featured</span>}
                                            {selectedProduct.isPopular && <span className="admin-badge badge-info" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Popular</span>}
                                            {selectedProduct.isTrending && <span className="admin-badge badge-info" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>Trending</span>}
                                            {selectedProduct.isBestSeller && <span className="admin-badge badge-info" style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Best Seller</span>}
                                        </div>
                                        <h2 className="view-title" style={{ marginTop: '0.5rem' }}>{selectedProduct.productName}</h2>
                                        <div className="view-price-tag">
                                            ₹{selectedProduct.price.toFixed(2)}
                                            <small> / {selectedProduct.quantity} {selectedProduct.unitId?.unitName}</small>
                                        </div>
                                    </div>

                                    <div className="view-stats-grid">
                                        <div className="stat-item">
                                            <label>Category</label>
                                            <span>{selectedProduct.categoryId?.categoryName || 'Uncategorized'}</span>
                                        </div>
                                        {selectedProduct.subcategoryId && (
                                            <div className="stat-item">
                                                <label>Subcategory</label>
                                                <span>{selectedProduct.subcategoryId?.subcategoryName || '--'}</span>
                                            </div>
                                        )}
                                        <div className="stat-item">
                                            <label>Inventory</label>
                                            <span>{selectedProduct.stock} items in stock</span>
                                        </div>
                                        <div className="stat-item">
                                            <label>Added On</label>
                                            <span>{formatDate(selectedProduct.createdAt)}</span>
                                        </div>
                                        <div className="stat-item">
                                            <label>Status</label>
                                            <span>{selectedProduct.stock > 0 ? 'ACTIVE' : 'OUT OF STOCK'}</span>
                                        </div>
                                    </div>

                                    <div className="view-description">
                                        <h4>Description</h4>
                                        <p>{selectedProduct.description || 'No description provided for this product.'}</p>
                                    </div>

                                    <div className="d-flex gap-3 mt-auto">
                                        <button
                                            className="btn-primary-admin"
                                            style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => {
                                                setShowViewModal(false);
                                                navigate(`/admin/products/edit/${selectedProduct._id}`);
                                            }}
                                        >
                                            <Edit2 size={18} /> Edit Product
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
