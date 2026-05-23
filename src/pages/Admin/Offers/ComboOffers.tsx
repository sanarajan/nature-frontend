import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Zap, Power, ListChecks, Search, ChevronDown, Upload, X, Crop } from 'lucide-react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './Offers.css';

const ComboOffers: React.FC = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [productSearch, setProductSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Image & Cropping states
    const [src, setSrc] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const cropperRef = React.useRef<any>(null);

    const [formData, setFormData] = useState({
        offerName: '',
        products: [] as { productId: string; requiredQuantity: number }[],
        discountType: 'amount',
        discountValue: 0,
        maxUsagePerOrder: 0,
        startDate: '',
        endDate: '',
        status: true,
        image: '' // Reverting name to image to match typing expectation
    });
    
    // Preview URL for existing images
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const offerRes = await adminApiClient.get('/admin/combo-listing/list');
            if (offerRes.data.success) setOffers(offerRes.data.data);
            
            // Fetch initial products
            await fetchProducts('');
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (search: string = '') => {
        try {
            const prodRes = await adminApiClient.get(`/admin/products?search=${search}`);
            if (prodRes.data.success) {
                setProducts(prodRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;
        const handler = setTimeout(() => {
            fetchProducts(productSearch);
        }, 300);
        return () => clearTimeout(handler);
    }, [productSearch, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // If start date changes and is now after current end date, reset end date
            if (name === 'startDate' && newState.endDate && value > newState.endDate) {
                newState.endDate = '';
            }
            return newState;
        });
    };

    const toggleProductSelection = (pid: string) => {
        setFormData(prev => {
            const isSelected = prev.products.some(p => p.productId === pid);
            if (isSelected) {
                return { ...prev, products: prev.products.filter(p => p.productId !== pid) };
            } else {
                return { ...prev, products: [...prev.products, { productId: pid, requiredQuantity: 1 }] };
            }
        });
    };

    const updateProductQuantity = (productId: string, quantity: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.map(p => 
                p.productId === productId ? { ...p, requiredQuantity: Math.max(1, quantity) } : p
            )
        }));
    };

    // --- Image Handling Logic ---
    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSrc(reader.result?.toString() || '');
                setIsCropModalOpen(true);
            });
            reader.readAsDataURL(e.target.files[0]);
            e.target.value = ''; // Reset input
        }
    };

    const saveCroppedImage = () => {
        if (typeof cropperRef.current?.cropper !== 'undefined') {
            const croppedBase64 = cropperRef.current?.cropper.getCroppedCanvas().toDataURL('image/jpeg');
            if (croppedBase64) {
                setFormData(prev => ({ ...prev, image: croppedBase64 })); // Changed imageUrl to image
                setImagePreview(croppedBase64);
                setIsCropModalOpen(false);
                setSrc(null);
                console.log('[ComboOffers] Image successfully cropped and set in formData.image');
                toast.info('Combo image ready to save');
            } else {
                toast.error('Failed to crop image');
            }
        } else {
            toast.error('Cropper not initialized');
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: '' })); // Changed imageUrl to image
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.products.length < 1) {
            toast.warning('Please select at least 1 product for a combo');
            return;
        }

        const isValidCombo = (formData.products.length > 1) || (formData.products.some(p => p.requiredQuantity > 1));
        if (!isValidCombo) {
            toast.warning('Combo must contain multiple products or at least one product with quantity greater than 1');
            return;
        }

        // Validation for discount value
        let totalComboPrice = 0;
        formData.products.forEach(item => {
            const p = products.find(prod => String(prod._id) === item.productId);
            if (p) totalComboPrice += (p.price || 0) * item.requiredQuantity;
        });

        if (formData.discountType === 'amount') {
            if (Number(formData.discountValue) >= totalComboPrice) {
                toast.error(`Discount amount (₹${formData.discountValue}) must be less than the total combo price (₹${totalComboPrice})`);
                return;
            }
        } else {
            if (Number(formData.discountValue) >= 100) {
                toast.error('Discount percentage must be less than 100%');
                return;
            }
        }

        try { // Added try-catch block around API call
            const payload = {
                ...formData,
                discountValue: Number(formData.discountValue),
                // Ensure image field is correctly named
                image: formData.image 
            };

            console.log('[ComboOffers Submit] FULL PAYLOAD KEYS:', Object.keys(payload));
            console.log('[ComboOffers Submit] Image status in payload:', !!payload.image);
            if (payload.image && typeof payload.image === 'string') {
                console.log('[ComboOffers Submit] Image string start:', payload.image.substring(0, 30));
            }

            if (editingOffer) {
                console.log('[ComboOffers Submit] Using adminApiClient for Update...');
                const res = await adminApiClient.put(`/admin/combo-listing/${editingOffer._id}`, payload);
                if (res.data.success) {
                    toast.success('Combo Offer updated');
                    setShowModal(false);
                    fetchInitialData();
                }
            } else {
                console.log('[ComboOffers Submit] Using adminApiClient for Create...');
                const res = await adminApiClient.post('/admin/combo-listing', payload);
                if (res.data.success) {
                    toast.success('Combo Offer created');
                    setShowModal(false);
                    fetchInitialData();
                }
            }
        } catch (error: any) {
            console.error('[ComboOffers Submit] Submission FAILED:', error);
            const errMsg = error.response?.data?.message || error.message || 'Failed to save combo offer';
            console.error('[ComboOffers Submit] Error response data:', error.response?.data);
            toast.error(errMsg);
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
    const validateDiscountOnBlur = () => {
        let totalComboValue = 0;
        formData.products.forEach(item => {
            const p = products.find(prod => String(prod._id) === item.productId);
            if (p) totalComboValue += (p.price || 0) * item.requiredQuantity;
        });

        if (formData.discountType === 'amount' && Number(formData.discountValue) >= totalComboValue && totalComboValue > 0) {
            toast.warning(`Discount amount should be less than the total combo value (₹${totalComboValue})`);
        } else if (formData.discountType === 'percentage' && Number(formData.discountValue) >= 100) {
            toast.warning('Discount percentage must be less than 100%');
        }
    };

    const getComboTotal = () => {
        let total = 0;
        formData.products.forEach(item => {
            const p = products.find(prod => String(prod._id) === item.productId);
            if (p) total += (p.price || 0) * item.requiredQuantity;
        });
        return total;
    };

    const openModal = () => {
        resetForm();
        setProductSearch('');
        setShowModal(true);
        // Ensure products are loaded
        if (products.length === 0) {
            fetchInitialData();
        }
    };

    const openEditModal = (offer: any) => {
        setEditingOffer(offer);
        setFormData({
            offerName: offer.offerName,
            products: offer.products.map((p: any) => ({
                productId: p.productId?._id || p._id || p.productId || p.product?._id || p.product,
                requiredQuantity: p.requiredQuantity || p.quantity || 1
            })),
            discountType: offer.discountType || 'amount', // Added
            discountValue: offer.discountValue,
            maxUsagePerOrder: offer.maxUsagePerOrder || 0,
            startDate: offer.startDate.split('T')[0],
            endDate: offer.endDate.split('T')[0],
            status: offer.status,
            image: offer.imageUrl || '' // Changed to image
        });
        setImagePreview(offer.imageUrl || null);
        setProductSearch('');
        setShowModal(true);
        // Ensure products are loaded if we don't have them in state (unlikely but safe)
        if (products.length === 0) {
            fetchProducts('');
        }
    };

    const resetForm = () => {
        setEditingOffer(null);
        setProductSearch('');
        setFormData({
            offerName: '',
            products: [],
            discountType: 'amount',
            discountValue: 0,
            maxUsagePerOrder: 0,
            startDate: '',
            endDate: '',
            status: true,
            image: ''
        });
        setImagePreview(null);
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
                    onClick={openModal}
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
                                <tr><td colSpan={6} className="text-center p-5">Loading...</td></tr>
                            ) : offers.length === 0 ? (
                                <tr><td colSpan={6} className="text-center p-5">No combo offers found.</td></tr>
                            ) : (
                                offers.map(offer => (
                                    <tr key={offer._id}>
                                        <td>
                                            {offer.imageUrl ? (
                                                <img src={offer.imageUrl} alt={offer.offerName} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                                    < Zap size={20} />
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
                    <div className="admin-modal max-width-700">
                        <div className="modal-header">
                            <h3>{editingOffer ? 'Edit Combo Offer' : 'Create Combo Offer'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body scrollable-modal-body">
                                <div className="form-group mb-3">
                                    <label>Combo Offer Name *</label>
                                    <input 
                                        type="text" 
                                        name="offerName"
                                        value={formData.offerName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Skin Care Duo"
                                        required
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label>Promotional Image (Optional)</label>
                                    <div className="d-flex align-items-center gap-3">
                                        <div 
                                            className="image-preview-box" 
                                            style={{ 
                                                width: '100px', 
                                                height: '100px', 
                                                border: '2px dashed #ddd', 
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                background: '#f8fafc',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => document.getElementById('comboImageUpload')?.click()}
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Upload size={24} color="#64748b" />
                                            )}
                                        </div>
                                        <div className="flex-grow-1">
                                            <input 
                                                type="file" 
                                                id="comboImageUpload"
                                                accept="image/*"
                                                onChange={onSelectFile}
                                                style={{ display: 'none' }}
                                            />
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-outline-primary mb-2"
                                                onClick={() => document.getElementById('comboImageUpload')?.click()}
                                            >
                                                Select & Crop
                                            </button>
                                            {imagePreview && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn-sm btn-outline-danger d-block"
                                                    onClick={removeImage}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                            <p className="text-muted small mb-0 mt-1">Select an image to represent this combo offer.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group mb-4">
                                    <label className="fw-bold mb-2">Select Products</label>
                                    
                                    {/* Selected Products Chips */}
                                    <div className="selected-products-container mb-2">
                                        {formData.products.length > 0 ? (
                                            <div className="d-flex flex-column gap-2">
                                                {formData.products.map(item => {
                                                    const p = products.find(prod => String(prod._id) === item.productId);
                                                    return (
                                                        <div key={item.productId} className="product-selection-row d-flex align-items-center gap-3 p-2 bg-light rounded border">
                                                            <div className="flex-grow-1">
                                                                <div className="fw-semibold">{p?.productName || 'Unknown'}</div>
                                                                <div className="small text-muted">₹{p?.price || 0} / unit</div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <label className="small mb-0">Qty:</label>
                                                                <input 
                                                                    type="number" 
                                                                    className="form-control form-control-sm" 
                                                                    style={{ width: '60px' }}
                                                                    value={item.requiredQuantity}
                                                                    min="1"
                                                                    onChange={(e) => updateProductQuantity(item.productId, parseInt(e.target.value))}
                                                                />
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger p-1"
                                                                onClick={() => toggleProductSelection(item.productId)}
                                                                title="Remove"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-muted small italic">No products selected yet</div>
                                        )}
                                    </div>

                                    {/* Searchable Dropdown */}
                                    <div className="custom-multiselect-wrapper" ref={dropdownRef}>
                                        <div className="search-input-wrapper">
                                            <Search size={14} className="search-icon" />
                                            <input 
                                                type="text" 
                                                placeholder="Type to search products..." 
                                                value={productSearch}
                                                onChange={(e) => {
                                                    setProductSearch(e.target.value);
                                                    setIsOpen(true);
                                                }}
                                                onFocus={() => {
                                                    setIsOpen(true);
                                                    if (products.length === 0) fetchInitialData();
                                                }}
                                                className="form-control"
                                            />
                                            <button 
                                                type="button" 
                                                className="dropdown-toggle-btn"
                                                onClick={() => setIsOpen(!isOpen)}
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>

                                        {isOpen && (
                                            <div className="multiselect-dropdown">
                                                {products && products.length > 0 ? (
                                                    [...products]
                                                        .sort((a, b) => {
                                                            const nameA = a.productName.toLowerCase();
                                                            const nameB = b.productName.toLowerCase();
                                                            const search = productSearch.toLowerCase();
                                                            
                                                            if (!search) return nameA.localeCompare(nameB);

                                                            const startsA = nameA.startsWith(search);
                                                            const startsB = nameB.startsWith(search);
                                                            
                                                            // Word boundary match (e.g. " moisturizer")
                                                            const wordA = nameA.includes(" " + search);
                                                            const wordB = nameB.includes(" " + search);

                                                            if (startsA && !startsB) return -1;
                                                            if (!startsA && startsB) return 1;
                                                            
                                                            if (wordA && !wordB) return -1;
                                                            if (!wordA && wordB) return 1;

                                                            return nameA.localeCompare(nameB);
                                                        })
                                                        .map(p => {
                                                        const pid = String(p._id);
                                                        const isSelected = formData.products.some(item => item.productId === pid);
                                                        return (
                                                            <div 
                                                                key={pid} 
                                                                className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    toggleProductSelection(pid);
                                                                    // Clear search if selecting, so they can see all options again
                                                                    if (!isSelected) setProductSearch('');
                                                                }}
                                                            >
                                                                <div className="option-checkbox">
                                                                    {isSelected ? <ListChecks size={12} /> : null}
                                                                </div>
                                                                <div className="option-info">
                                                                    <div className="option-name">{p.productName}</div>
                                                                    <div className="option-meta">
                                                                        {p.sku && <span>{p.sku} • </span>}
                                                                        <span>₹{p.price}</span>
                                                                        {p.stock <= 5 && <span className="text-danger ms-2">Low Stock: {p.stock}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="no-options">
                                                        {productSearch ? `No products match "${productSearch}"` : 'No products found. Please add more in products section.'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="small text-muted">{formData.products.length} selected</span>
                                            {formData.products.length > 0 && (
                                                <span className="badge bg-light text-primary border">
                                                    Total Value: ₹{getComboTotal()}
                                                </span>
                                            )}
                                        </div>
                                        {formData.products.length > 0 && (
                                            <button 
                                                type="button" 
                                                className="btn btn-link btn-sm text-danger p-0 text-decoration-none"
                                                onClick={() => setFormData(prev => ({ ...prev, products: [] }))}
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="form-group mb-3">
                                            <label>Discount Type</label>
                                            <select name="discountType" value={formData.discountType} onChange={handleInputChange}>
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="amount">Fixed Amount (₹)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group mb-3">
                                            <label>Discount Value</label>
                                            <input 
                                                type="number" 
                                                name="discountValue"
                                                value={formData.discountValue}
                                                onChange={handleInputChange}
                                                onBlur={validateDiscountOnBlur}
                                                min="1"
                                                className="form-control"
                                                required
                                            />
                                            {formData.discountType === 'amount' && formData.products.length > 0 && (
                                                <div className="small text-muted mt-1">
                                                    Must be less than ₹{getComboTotal()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group mb-3">
                                            <label>Start Date</label>
                                            <input 
                                                type="date" 
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group mb-3">
                                            <label>End Date</label>
                                            <input 
                                                type="date" 
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group mb-3">
                                            <label>Max Usage / Order</label>
                                            <input 
                                                type="number" 
                                                name="maxUsagePerOrder"
                                                value={formData.maxUsagePerOrder}
                                                onChange={handleInputChange}
                                                min="0"
                                                className="form-control"
                                            />
                                            <div className="small text-muted">0 = Unlimited</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="admin-btn-primary">
                                    {editingOffer ? 'Save Changes' : 'Create Combo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Crop Modal */}
            {isCropModalOpen && src && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '16px',
                        padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
                        width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0"><Crop size={20} className="me-2" /> Crop Promotional Image</h4>
                            <button onClick={() => { setIsCropModalOpen(false); setSrc(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ maxWidth: '500px', margin: '0 auto', background: '#333' }}>
                            <Cropper
                                src={src || undefined}
                                style={{ height: 350, width: '100%' }}
                                aspectRatio={1}
                                guides={true}
                                ref={cropperRef}
                                viewMode={1}
                                dragMode="move"
                                background={false}
                            />
                        </div>

                        <div className="d-flex justify-content-end mt-4 gap-2">
                            <button className="btn btn-light" type="button" onClick={() => { setIsCropModalOpen(false); setSrc(null); }}>Cancel</button>
                            <button onClick={saveCroppedImage} type="button" className="admin-btn-primary">
                                Set Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComboOffers;
