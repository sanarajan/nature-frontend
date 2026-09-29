import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, ListChecks, Search, ChevronDown, Upload, Crop, ChevronUp } from 'lucide-react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './Offers.css';

const ComboOfferForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();


    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [productSearch, setProductSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Image & Cropping states
    const [src, setSrc] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const cropperRef = React.useRef<any>(null);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        products: true,
        content: false,
        usage: false,
        safety: false,
        faq: false,
        seo: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const [formData, setFormData] = useState({
        offerName: '',
        products: [] as { productId: string; requiredQuantity: number; comboRole?: string; comboRoleDescription?: string }[],
        discountType: 'amount',
        discountValue: 0,
        maxUsagePerOrder: 0,
        startDate: '',
        endDate: '',
        status: true,
        image: '',
        subtitle: '',
        tagline: '',
        shortDescription: '',
        overviewTitle: '',
        overviewDescription: '',
        routineLabel: '',
        targetConcerns: [] as string[],
        whySpecial: [] as string[],
        howToUseSteps: [] as { title: string; description: string }[],
        recommendedRoutine: '',
        whoMayBenefit: [] as string[],
        resultsAndExpectations: [] as string[],
        safetyInformation: [] as string[],
        patchTestGuidance: '',
        storageInstructions: '',
        disclaimer: '',
        faqs: [] as { question: string; answer: string }[],
        seoTitle: '',
        metaDescription: '',
        slug: '',
        imageAltText: '',
        productBadge: '',
        promotionalBadge: '',
        ctaLabel: '',
        supportingCtaLabel: ''
    });

    // Preview URL for existing images
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);
                await fetchProducts('');
                if (id) {
                    const res = await adminApiClient.get(`/admin/combo-listing/list`);
                    if (res.data.success) {
                        const offer = res.data.data.find((c: any) => c._id === id);
                        if (offer) {
                            setEditingOffer(offer);
                            setFormData({
                                offerName: offer.offerName,
                                products: offer.products.map((p: any) => ({
                                    productId: p.productId?._id || p._id || p.productId || p.product?._id || p.product,
                                    requiredQuantity: p.requiredQuantity || p.quantity || 1,
                                    comboRole: p.comboRole || '',
                                    comboRoleDescription: p.comboRoleDescription || ''
                                })),
                                discountType: offer.discountType || 'amount',
                                discountValue: offer.discountValue,
                                maxUsagePerOrder: offer.maxUsagePerOrder || 0,
                                startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
                                endDate: offer.endDate ? offer.endDate.split('T')[0] : '',
                                status: offer.status,
                                image: offer.imageUrl || '',
                                subtitle: offer.subtitle || '',
                                tagline: offer.tagline || '',
                                shortDescription: offer.shortDescription || '',
                                overviewTitle: offer.overviewTitle || '',
                                overviewDescription: offer.overviewDescription || '',
                                routineLabel: offer.routineLabel || '',
                                targetConcerns: offer.targetConcerns || [],
                                whySpecial: offer.whySpecial || [],
                                howToUseSteps: offer.howToUseSteps || [],
                                recommendedRoutine: offer.recommendedRoutine || '',
                                whoMayBenefit: offer.whoMayBenefit || [],
                                resultsAndExpectations: offer.resultsAndExpectations || [],
                                safetyInformation: offer.safetyInformation || [],
                                patchTestGuidance: offer.patchTestGuidance || '',
                                storageInstructions: offer.storageInstructions || '',
                                disclaimer: offer.disclaimer || '',
                                faqs: offer.faqs || [],
                                seoTitle: offer.seoTitle || '',
                                metaDescription: offer.metaDescription || '',
                                slug: offer.slug || '',
                                imageAltText: offer.imageAltText || '',
                                productBadge: offer.productBadge || '',
                                promotionalBadge: offer.promotionalBadge || '',
                                ctaLabel: offer.ctaLabel || '',
                                supportingCtaLabel: offer.supportingCtaLabel || ''
                            });
                            setImagePreview(offer.imageUrl || null);
                        } else {
                            toast.error('Combo Offer not found');
                        }
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadInitial();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id]);

    const fetchInitialData = async () => {
        try {
            await fetchProducts('');
        } catch (error) {
            console.error('Fetch error:', error);
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

    const handleArrayChange = (field: string, index: number, value: string) => {
        setFormData(prev => {
            const arr = [...(prev as any)[field]];
            arr[index] = value;
            return { ...prev, [field]: arr };
        });
    };

    const addArrayItem = (field: string) => {
        setFormData(prev => ({ ...prev, [field]: [...(prev as any)[field], ''] }));
    };

    const removeArrayItem = (field: string, index: number) => {
        setFormData(prev => {
            const arr = [...(prev as any)[field]];
            arr.splice(index, 1);
            return { ...prev, [field]: arr };
        });
    };

    const handleObjectArrayChange = (field: string, index: number, key: string, value: string) => {
        setFormData(prev => {
            const arr = [...(prev as any)[field]];
            arr[index] = { ...arr[index], [key]: value };
            return { ...prev, [field]: arr };
        });
    };

    const addHowToUseStep = () => {
        setFormData(prev => ({ ...prev, howToUseSteps: [...prev.howToUseSteps, { title: '', description: '' }] }));
    };

    const removeHowToUseStep = (index: number) => {
        setFormData(prev => {
            const arr = [...prev.howToUseSteps];
            arr.splice(index, 1);
            return { ...prev, howToUseSteps: arr };
        });
    };

    const addFaq = () => {
        setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
    };

    const removeFaq = (index: number) => {
        setFormData(prev => {
            const arr = [...prev.faqs];
            arr.splice(index, 1);
            return { ...prev, faqs: arr };
        });
    };

    const updateProductRole = (productId: string, field: 'comboRole' | 'comboRoleDescription', value: string) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.map(p =>
                p.productId === productId ? { ...p, [field]: value } : p
            )
        }));
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
                setFormData(prev => ({ ...prev, image: croppedBase64 }));
                setImagePreview(croppedBase64);
                setIsCropModalOpen(false);
                setSrc(null);
                console.log('[ComboOfferForm] Image successfully cropped and set in formData.image');
                toast.info('Combo image ready to save');
            } else {
                toast.error('Failed to crop image');
            }
        } else {
            toast.error('Cropper not initialized');
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: '' }));
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

        try {
            const payload = {
                ...formData,
                discountValue: Number(formData.discountValue),
                image: formData.image
            };

            console.log('[ComboOfferForm Submit] FULL PAYLOAD KEYS:', Object.keys(payload));
            console.log('[ComboOfferForm Submit] Image status in payload:', !!payload.image);

            if (editingOffer) {
                console.log('[ComboOfferForm Submit] Using adminApiClient for Update...');
                const res = await adminApiClient.put(`/admin/combo-listing/${editingOffer._id}`, payload);
                if (res.data.success) {
                    toast.success('Combo Offer updated');
                    navigate('/admin/offers/combo');
                }
            } else {
                console.log('[ComboOfferForm Submit] Using adminApiClient for Create...');
                const res = await adminApiClient.post('/admin/combo-listing', payload);
                if (res.data.success) {
                    toast.success('Combo Offer created');
                    navigate('/admin/offers/combo');
                }
            }
        } catch (error: any) {
            console.error('[ComboOfferForm Submit] Submission FAILED:', error);
            const errMsg = error.response?.data?.message || error.message || 'Failed to save combo offer';
            console.error('[ComboOfferForm Submit] Error response data:', error.response?.data);
            toast.error(errMsg);
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

    if (loading) {
        return (
            <div className="admin-page-container d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                    <p className="mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container pb-5">
            <div className="admin-page-header mb-4 d-flex align-items-center gap-3">
                <button className="btn btn-light rounded-circle shadow-sm" onClick={() => navigate('/admin/offers/combo')} style={{ width: '40px', height: '40px' }}>
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <h2 className="admin-page-title mb-0">{id ? 'Edit Combo Offer' : 'Create Combo Offer'}</h2>
                    <p className="text-muted small mb-0 mt-1">Configure products, offer rules and customer-facing Combo content.</p>
                </div>
            </div>

            <div className="admin-card">
                <form onSubmit={handleSubmit}>
                    <div className="modal-body scrollable-modal-body p-0">
                        {/* SECTION 1: BASIC DETAILS */}
                        <div className="accordion-item border-bottom">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-dark w-100 text-start p-3 fw-bold d-flex justify-content-between align-items-center"
                                onClick={() => toggleSection('basic')}
                            >
                                1. BASIC DETAILS
                                {expandedSections.basic ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {expandedSections.basic && (
                                <div className="p-3 bg-light">
                                    <div className="form-group mb-3">
                                        <label>Combo Offer Name *</label>
                                        <input
                                            type="text"
                                            name="offerName"
                                            value={formData.offerName}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Skin Care Duo"
                                            required
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Subtitle</label>
                                        <input
                                            type="text"
                                            name="subtitle"
                                            value={formData.subtitle}
                                            onChange={handleInputChange}
                                            placeholder="e.g. For Dandruff-Prone Scalp..."
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Tagline</label>
                                        <input
                                            type="text"
                                            name="tagline"
                                            value={formData.tagline}
                                            onChange={handleInputChange}
                                            placeholder="e.g. One complete botanical ritual..."
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Short Description</label>
                                        <textarea
                                            name="shortDescription"
                                            value={formData.shortDescription}
                                            onChange={handleInputChange as any}
                                            className="form-control"
                                            rows={2}
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
                                                    Select &amp; Crop
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
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: PRODUCTS & OFFER */}
                        <div className="accordion-item border-bottom">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-dark w-100 text-start p-3 fw-bold d-flex justify-content-between align-items-center"
                                onClick={() => toggleSection('products')}
                            >
                                2. PRODUCTS &amp; OFFER
                                {expandedSections.products ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {expandedSections.products && (
                                <div className="p-3 bg-light">
                                    <div className="form-group mb-4">
                                        <label className="fw-bold mb-2">Select Products</label>

                                        {/* Selected Products */}
                                        <div className="selected-products-container mb-2">
                                            {formData.products.length > 0 ? (
                                                <div className="d-flex flex-column gap-2">
                                                    {formData.products.map(item => {
                                                        const p = products.find(prod => String(prod._id) === item.productId);
                                                        return (
                                                            <div key={item.productId} className="product-selection-row p-3 bg-white rounded border">
                                                                <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
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
                                                                <div className="row mt-2">
                                                                    <div className="col-md-6">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm"
                                                                            placeholder="Combo Role (e.g. Pre-shampoo)"
                                                                            value={item.comboRole || ''}
                                                                            onChange={(e) => updateProductRole(item.productId, 'comboRole', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm"
                                                                            placeholder="Role Description"
                                                                            value={item.comboRoleDescription || ''}
                                                                            onChange={(e) => updateProductRole(item.productId, 'comboRoleDescription', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
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

                                                                const wordA = nameA.includes(' ' + search);
                                                                const wordB = nameB.includes(' ' + search);

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
                                                <select className="form-select" name="discountType" value={formData.discountType} onChange={handleInputChange}>
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
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="form-control"
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
                                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                                    className="form-control"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Read-Only Pricing Preview */}
                                    {formData.products.length > 0 && (
                                        <div className="alert alert-info mt-3 p-3">
                                            <h6 className="mb-2">Pricing Preview</h6>
                                            <div className="d-flex justify-content-between">
                                                <span>Total MRP:</span>
                                                <strong>₹{getComboTotal()}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1">
                                                <span>Calculated Combo Price:</span>
                                                <strong>
                                                    ₹{formData.discountType === 'amount'
                                                        ? Math.max(0, getComboTotal() - formData.discountValue)
                                                        : Math.max(0, getComboTotal() - (getComboTotal() * formData.discountValue / 100))}
                                                </strong>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1 text-success">
                                                <span>Customer Saving:</span>
                                                <strong>
                                                    {formData.discountType === 'amount'
                                                        ? `₹${formData.discountValue}`
                                                        : `${formData.discountValue}% (₹${(getComboTotal() * formData.discountValue / 100).toFixed(2)})`}
                                                </strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: COMBO CONTENT */}
                        <div className="accordion-item border-bottom">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-dark w-100 text-start p-3 fw-bold d-flex justify-content-between align-items-center"
                                onClick={() => toggleSection('content')}
                            >
                                3. COMBO CONTENT
                                {expandedSections.content ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {expandedSections.content && (
                                <div className="p-3 bg-light">
                                    <div className="form-group mb-3">
                                        <label>Overview Title</label>
                                        <input type="text" className="form-control" name="overviewTitle" value={formData.overviewTitle} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Overview Description</label>
                                        <textarea className="form-control" name="overviewDescription" value={formData.overviewDescription} onChange={handleInputChange as any} rows={3}></textarea>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Routine Label</label>
                                        <input type="text" className="form-control" name="routineLabel" value={formData.routineLabel} onChange={handleInputChange} placeholder="e.g. OIL • CLEANSE • NOURISH" />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Target Concerns</label>
                                        {formData.targetConcerns.map((tc, idx) => (
                                            <div key={idx} className="d-flex gap-2 mb-2">
                                                <input type="text" className="form-control" value={tc} onChange={(e) => handleArrayChange('targetConcerns', idx, e.target.value)} />
                                                <button type="button" className="btn btn-outline-danger" onClick={() => removeArrayItem('targetConcerns', idx)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addArrayItem('targetConcerns')}>+ Add Concern</button>
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Why This Combo Is Special</label>
                                        {formData.whySpecial.map((ws, idx) => (
                                            <div key={idx} className="d-flex gap-2 mb-2">
                                                <input type="text" className="form-control" value={ws} onChange={(e) => handleArrayChange('whySpecial', idx, e.target.value)} />
                                                <button type="button" className="btn btn-outline-danger" onClick={() => removeArrayItem('whySpecial', idx)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addArrayItem('whySpecial')}>+ Add Item</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 4: USAGE & CUSTOMER INFORMATION */}
                        <div className="accordion-item border-bottom">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-dark w-100 text-start p-3 fw-bold d-flex justify-content-between align-items-center"
                                onClick={() => toggleSection('usage')}
                            >
                                4. USAGE &amp; CUSTOMER INFORMATION
                                {expandedSections.usage ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {expandedSections.usage && (
                                <div className="p-3 bg-light">
                                    <div className="form-group mb-3">
                                        <label>How To Use Steps</label>
                                        {formData.howToUseSteps.map((step, idx) => (
                                            <div key={idx} className="p-2 mb-2 border bg-white rounded">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <strong className="small">Step {idx + 1}</strong>
                                                    <button type="button" className="btn btn-sm text-danger p-0" onClick={() => removeHowToUseStep(idx)}><Trash2 size={14} /></button>
                                                </div>
                                                <input type="text" className="form-control form-control-sm mb-2" placeholder="Step Title" value={step.title} onChange={(e) => handleObjectArrayChange('howToUseSteps', idx, 'title', e.target.value)} />
                                                <textarea className="form-control form-control-sm" placeholder="Step Description" value={step.description} onChange={(e) => handleObjectArrayChange('howToUseSteps', idx, 'description', e.target.value)} rows={2}></textarea>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addHowToUseStep}>+ Add Step</button>
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Recommended Routine</label>
                                        <textarea className="form-control" name="recommendedRoutine" value={formData.recommendedRoutine} onChange={handleInputChange as any} rows={2}></textarea>
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Who May Benefit</label>
                                        {formData.whoMayBenefit.map((wb, idx) => (
                                            <div key={idx} className="d-flex gap-2 mb-2">
                                                <input type="text" className="form-control" value={wb} onChange={(e) => handleArrayChange('whoMayBenefit', idx, e.target.value)} />
                                                <button type="button" className="btn btn-outline-danger" onClick={() => removeArrayItem('whoMayBenefit', idx)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addArrayItem('whoMayBenefit')}>+ Add Item</button>
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Results &amp; Expectations</label>
                                        {formData.resultsAndExpectations.map((re, idx) => (
                                            <div key={idx} className="d-flex gap-2 mb-2">
                                                <input type="text" className="form-control" value={re} onChange={(e) => handleArrayChange('resultsAndExpectations', idx, e.target.value)} />
                                                <button type="button" className="btn btn-outline-danger" onClick={() => removeArrayItem('resultsAndExpectations', idx)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addArrayItem('resultsAndExpectations')}>+ Add Item</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 5: SAFETY */}
                        <div className="accordion-item border-bottom">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-dark w-100 text-start p-3 fw-bold d-flex justify-content-between align-items-center"
                                onClick={() => toggleSection('safety')}
                            >
                                5. SAFETY &amp; IMPORTANT INFORMATION
                                {expandedSections.safety ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {expandedSections.safety && (
                                <div className="p-3 bg-light">
                                    <div className="form-group mb-3">
                                        <label>Safety Information</label>
                                        {formData.safetyInformation.map((si, idx) => (
                                            <div key={idx} className="d-flex gap-2 mb-2">
                                                <input type="text" className="form-control" value={si} onChange={(e) => handleArrayChange('safetyInformation', idx, e.target.value)} />
                                                <button type="button" className="btn btn-outline-danger" onClick={() => removeArrayItem('safetyInformation', idx)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addArrayItem('safetyInformation')}>+ Add Item</button>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Patch-Test Guidance</label>
                                        <textarea className="form-control" name="patchTestGuidance" value={formData.patchTestGuidance} onChange={handleInputChange as any} rows={2}></textarea>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Storage Instructions</label>
                                        <textarea className="form-control" name="storageInstructions" value={formData.storageInstructions} onChange={handleInputChange as any} rows={2}></textarea>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Disclaimer</label>
                                        <textarea className="form-control" name="disclaimer" value={formData.disclaimer} onChange={handleInputChange as any} rows={2}></textarea>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 6: FAQ */}
                        <div className="accordion-item border-bottom">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-dark w-100 text-start p-3 fw-bold d-flex justify-content-between align-items-center"
                                onClick={() => toggleSection('faq')}
                            >
                                6. FREQUENTLY ASKED QUESTIONS
                                {expandedSections.faq ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {expandedSections.faq && (
                                <div className="p-3 bg-light">
                                    {formData.faqs.map((faq, idx) => (
                                        <div key={idx} className="p-2 mb-2 border bg-white rounded">
                                            <div className="d-flex justify-content-end mb-2">
                                                <button type="button" className="btn btn-sm text-danger p-0" onClick={() => removeFaq(idx)}><Trash2 size={14} /></button>
                                            </div>
                                            <input type="text" className="form-control form-control-sm mb-2" placeholder="Question" value={faq.question} onChange={(e) => handleObjectArrayChange('faqs', idx, 'question', e.target.value)} />
                                            <textarea className="form-control form-control-sm" placeholder="Answer" value={faq.answer} onChange={(e) => handleObjectArrayChange('faqs', idx, 'answer', e.target.value)} rows={2}></textarea>
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addFaq}>+ Add FAQ</button>
                                </div>
                            )}
                        </div>

                        {/* SECTION 7: SEO & DISPLAY */}
                        <div className="accordion-item">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-dark w-100 text-start p-3 fw-bold d-flex justify-content-between align-items-center"
                                onClick={() => toggleSection('seo')}
                            >
                                7. SEO &amp; DISPLAY
                                {expandedSections.seo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {expandedSections.seo && (
                                <div className="p-3 bg-light">
                                    <div className="row">
                                        <div className="col-md-6 form-group mb-3">
                                            <label>SEO Title</label>
                                            <input type="text" className="form-control" name="seoTitle" value={formData.seoTitle} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-md-6 form-group mb-3">
                                            <label>URL Slug</label>
                                            <input type="text" className="form-control" name="slug" value={formData.slug} onChange={handleInputChange} placeholder="e.g. anti-dandruff-combo" />
                                        </div>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Meta Description</label>
                                        <textarea className="form-control" name="metaDescription" value={formData.metaDescription} onChange={handleInputChange as any} rows={2}></textarea>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 form-group mb-3">
                                            <label>Image Alt Text</label>
                                            <input type="text" className="form-control" name="imageAltText" value={formData.imageAltText} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-md-6 form-group mb-3">
                                            <label>Product Badge</label>
                                            <input type="text" className="form-control" name="productBadge" value={formData.productBadge} onChange={handleInputChange} placeholder="e.g. Best Seller" />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 form-group mb-3">
                                            <label>Promotional Badge</label>
                                            <input type="text" className="form-control" name="promotionalBadge" value={formData.promotionalBadge} onChange={handleInputChange} placeholder="e.g. 20% OFF" />
                                        </div>
                                        <div className="col-md-6 form-group mb-3">
                                            <label>CTA Label</label>
                                            <input type="text" className="form-control" name="ctaLabel" value={formData.ctaLabel} onChange={handleInputChange} placeholder="e.g. Grab This Deal" />
                                        </div>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Supporting CTA Label</label>
                                        <input type="text" className="form-control" name="supportingCtaLabel" value={formData.supportingCtaLabel} onChange={handleInputChange} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="d-flex justify-content-end gap-3 p-3 border-top mt-3">
                        <button type="button" className="btn btn-light" onClick={() => navigate('/admin/offers/combo')}>Cancel</button>
                        <button type="submit" className="admin-btn-primary">
                            {editingOffer ? 'Save Changes' : 'Create Combo'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Image Crop Modal */}
            {isCropModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Crop Image</h3>
                            <button className="close-btn" onClick={() => { setIsCropModalOpen(false); setSrc(null); }}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '400px', overflow: 'hidden' }}>
                            {src && (
                                <Cropper
                                    ref={cropperRef}
                                    src={src}
                                    style={{ height: 380, width: '100%' }}
                                    aspectRatio={16 / 9}
                                    guides={true}
                                    viewMode={1}
                                />
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-light" onClick={() => { setIsCropModalOpen(false); setSrc(null); }}>Cancel</button>
                            <button type="button" className="admin-btn-primary" onClick={saveCroppedImage}>
                                <Crop size={16} /> Crop &amp; Use
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComboOfferForm;
