import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Upload, X, Save, Plus, Crop } from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import apiClient from '../../../services/adminApiClient';
import '../../../styles/admin-pages.css';

interface Option {
    _id: string;
    [key: string]: string;
}

interface Spec {
    key: string;
    value: string;
}

const EditProduct: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [categories, setCategories] = useState<Option[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<any[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
    const [units, setUnits] = useState<Option[]>([]);

    const [productName, setProductName] = useState('');
    const [sku, setSku] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    
    const [price, setPrice] = useState('');
    const [unitId, setUnitId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [stock, setStock] = useState('');

    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [howToUse, setHowToUse] = useState('');
    const [otherIngredients, setOtherIngredients] = useState('');
    const [keyBenefits, setKeyBenefits] = useState<string[]>(['']);
    const [keyIngredients, setKeyIngredients] = useState<{name: string, botanicalName: string, percentage: string, partType: string, websiteRole: string}[]>([{name: '', botanicalName: '', percentage: '', partType: '', websiteRole: ''}]);
    const [specifications, setSpecifications] = useState<Spec[]>([{ key: '', value: '' }]);
    const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([{question: '', answer: ''}]);

    const [suitableFor, setSuitableFor] = useState('');
    const [safetyInformation, setSafetyInformation] = useState('');
    const [patchTestGuidance, setPatchTestGuidance] = useState('');
    const [storageInstructions, setStorageInstructions] = useState('');
    const [disclaimer, setDisclaimer] = useState('');
    const [internalPublishingNote, setInternalPublishingNote] = useState('');
    const [slug, setSlug] = useState('');
    const [imageAltText, setImageAltText] = useState('');
    const [labelControl, setLabelControl] = useState('');
    const [specialPublishingClaimsNote, setSpecialPublishingClaimsNote] = useState('');

    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [tags, setTags] = useState('');

    const [featured, setFeatured] = useState(false);
    const [isPopular, setIsPopular] = useState(false);
    const [isTrending, setIsTrending] = useState(false);
    const [isBestSeller, setIsBestSeller] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const [images, setImages] = useState<string[]>([]);

    const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'media' | 'content' | 'seo'>('basic');
    const [src, setSrc] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const cropperRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            await fetchOptions();
            await fetchProduct();
        };
        init();
    }, [id]);

    const fetchOptions = async () => {
        try {
            const res = await apiClient.get('/admin/products/options');
            if (res.data.success) {
                setCategories(res.data.data.categories);
                setAllSubcategories(res.data.data.subcategories || []);
                setUnits(res.data.data.units);
            }
        } catch (err: any) {
            toast.error('Failed to fetch categories/subcategories/units.');
        }
    };

    useEffect(() => {
        if (categoryId) {
            const filtered = allSubcategories.filter(sub => {
                const parentId = typeof sub.categoryId === 'object' ? sub.categoryId?._id : sub.categoryId;
                return String(parentId) === String(categoryId);
            });
            setFilteredSubcategories(filtered);
            setSubcategoryId(prev => {
                if (!prev) return prev;
                if (allSubcategories.length === 0) return prev;
                const isValid = filtered.some(s => String(s._id) === String(prev));
                return isValid ? prev : '';
            });
        } else {
            setFilteredSubcategories([]);
            setSubcategoryId('');
        }
    }, [categoryId, allSubcategories]);

    const fetchProduct = async () => {
        try {
            const res = await apiClient.get(`/admin/products/${id}`);
            if (res.data.success) {
                const product = res.data.data;
                setProductName(product.productName || '');
                setSku(product.sku || '');
                setCategoryId(product.categoryId || '');
                setSubcategoryId(product.subcategoryId || '');
                setUnitId(product.unitId || '');
                setQuantity(product.quantity?.toString() || '');
                setStock(product.stock?.toString() || '0');
                setPrice(product.price?.toString() || '');
                setDescription(product.description || '');
                setShortDescription(product.shortDescription || '');
                setHowToUse(product.howToUse || '');
                setOtherIngredients(product.otherIngredients || '');
                setSuitableFor(product.suitableFor || '');
                setSafetyInformation(product.safetyInformation || '');
                setPatchTestGuidance(product.patchTestGuidance || '');
                setStorageInstructions(product.storageInstructions || '');
                setDisclaimer(product.disclaimer || '');
                setInternalPublishingNote(product.internalPublishingNote || '');
                setSlug(product.slug || '');
                setImageAltText(product.imageAltText || '');
                let fetchedLabelControl = product.labelControl || '';
                if (fetchedLabelControl.toUpperCase().startsWith('LABEL CONTROL')) {
                    fetchedLabelControl = fetchedLabelControl.substring(13).replace(/^[:\s-]+/, '').trim();
                }
                setLabelControl(fetchedLabelControl);

                let fetchedPublishingNote = product.specialPublishingClaimsNote || '';
                if (fetchedPublishingNote.toUpperCase().startsWith('REVIEW BEFORE PUBLISHING')) {
                    fetchedPublishingNote = fetchedPublishingNote.substring(24).replace(/^[:\s-]+/, '').trim();
                }
                setSpecialPublishingClaimsNote(fetchedPublishingNote);
                
                if (product.keyBenefits && product.keyBenefits.length > 0) {
                    setKeyBenefits(product.keyBenefits);
                } else {
                    setKeyBenefits(['']);
                }

                if (product.keyIngredients && product.keyIngredients.length > 0) {
                    setKeyIngredients(product.keyIngredients);
                } else {
                    setKeyIngredients([{name: '', botanicalName: '', percentage: '', partType: '', websiteRole: ''}]);
                }
                
                if (product.faqs && product.faqs.length > 0) {
                    setFaqs(product.faqs);
                } else {
                    setFaqs([{question: '', answer: ''}]);
                }

                setMetaTitle(product.metaTitle || '');
                setMetaDescription(product.metaDescription || '');
                if (product.tags && product.tags.length > 0) {
                    setTags(product.tags.join(', '));
                }

                setImages(product.images || []);
                setFeatured(product.featured || false);
                setIsPopular(product.isPopular || false);
                setIsTrending(product.isTrending || false);
                setIsBestSeller(product.isBestSeller || false);
                setIsActive(product.isActive !== false);

                if (product.specifications && Object.keys(product.specifications).length > 0) {
                    const specs = Object.entries(product.specifications).map(([key, value]) => ({
                        key,
                        value: value as string
                    }));
                    setSpecifications(specs);
                } else {
                    setSpecifications([{ key: '', value: '' }]);
                }
            }
        } catch (err: any) {
            toast.error('Failed to fetch product details.');
            navigate('/admin/products');
        } finally {
            setLoading(false);
        }
    };

    const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
        const newSpecs = [...specifications];
        newSpecs[index][field] = val;
        setSpecifications(newSpecs);
    };
    const addSpecRow = () => specifications.length < 10 ? setSpecifications([...specifications, { key: '', value: '' }]) : toast.warning('Max 10 specs allowed.');
    const removeSpecRow = (index: number) => setSpecifications(specifications.filter((_, i) => i !== index));

    const handleBenefitChange = (index: number, val: string) => {
        const newBen = [...keyBenefits];
        newBen[index] = val;
        setKeyBenefits(newBen);
    };
    const addBenefit = () => setKeyBenefits([...keyBenefits, '']);
    const removeBenefit = (index: number) => setKeyBenefits(keyBenefits.filter((_, i) => i !== index));

    const handleIngredientChange = (index: number, field: string, val: string) => {
        const newIng = [...keyIngredients];
        (newIng[index] as any)[field] = val;
        setKeyIngredients(newIng);
    };
    const addIngredient = () => setKeyIngredients([...keyIngredients, {name: '', botanicalName: '', percentage: '', partType: '', websiteRole: ''}]);
    const removeIngredient = (index: number) => setKeyIngredients(keyIngredients.filter((_, i) => i !== index));

    const handleFaqChange = (index: number, field: 'question' | 'answer', val: string) => {
        const newFaqs = [...faqs];
        newFaqs[index][field] = val;
        setFaqs(newFaqs);
    };
    const addFaq = () => setFaqs([...faqs, {question: '', answer: ''}]);
    const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index));

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (images.length >= 4) {
                toast.warning('Maximum 4 images allowed.');
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSrc(reader.result?.toString() || '');
                setIsCropModalOpen(true);
            });
            reader.readAsDataURL(e.target.files[0]);
            e.target.value = '';
        }
    };

    const saveCroppedImage = () => {
        if (typeof cropperRef.current?.cropper !== 'undefined') {
            const croppedBase64 = cropperRef.current?.cropper.getCroppedCanvas().toDataURL('image/jpeg');
            if (croppedBase64) {
                setImages([...images, croppedBase64]);
                setIsCropModalOpen(false);
                setSrc(null);
            } else {
                toast.error('Failed to crop image');
            }
        }
    };
    const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName || !categoryId || !unitId || !quantity || !stock || !price) {
            toast.error('Please fill in all required fields (Name, Category, Unit, Quantity, Stock, Price).');
            return;
        }

        const specMap: Record<string, string> = {};
        specifications.filter(s => s.key.trim() && s.value.trim()).forEach(s => { specMap[s.key] = s.value; });

        const payload = {
            productName, categoryId, subcategoryId: subcategoryId || null, unitId,
            quantity: Number(quantity), stock: Number(stock), price: Number(price),
            description, shortDescription, howToUse, otherIngredients,
            specifications: specMap,
            keyBenefits: keyBenefits.filter(b => b.trim()),
            keyIngredients: keyIngredients.filter(i => i.name.trim()),
            faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
            metaTitle, metaDescription,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            images, featured, isPopular, isTrending, isBestSeller, isActive,
            suitableFor, safetyInformation, patchTestGuidance, storageInstructions, disclaimer, internalPublishingNote, slug, imageAltText,
            labelControl, specialPublishingClaimsNote
        };

        setSaving(true);
        try {
            const res = await apiClient.put(`/admin/products/${id}`, payload);
            if (res.data.success) {
                toast.success('Product updated successfully!');
                navigate('/admin/products');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update product.');
        } finally {
            setSaving(false);
        }
    };

    const navTabs = [
        { id: 'basic', label: 'Basic Information' },
        { id: 'pricing', label: 'Pricing & Stock' },
        { id: 'media', label: 'Media' },
        { id: 'content', label: 'Description & Content' },
        { id: 'seo', label: 'SEO' }
    ] as const;

    if (loading) {
        return (
            <div className="admin-page-container d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container position-relative">
            <div className="page-header d-flex justify-content-start align-items-center mb-4">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="btn btn-light d-flex align-items-center justify-content-center me-3"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="page-title m-0">Edit Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="row">
                <div className="col-lg-8">
                    <div className="admin-card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="d-flex" style={{ borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                            {navTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`btn rounded-0 px-4 py-3 border-0`}
                                    style={{
                                        fontWeight: activeTab === tab.id ? 700 : 500,
                                        color: activeTab === tab.id ? 'var(--admin-primary-dark)' : '#64748b',
                                        borderBottom: activeTab === tab.id ? '3px solid var(--admin-primary-dark)' : '3px solid transparent',
                                        backgroundColor: activeTab === tab.id ? '#f8fafc' : 'transparent',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        {activeTab === 'basic' && (
                            <div>
                                <h5 className="mb-4" style={{ fontWeight: 600 }}>Basic Information</h5>
                                <div className="row">
                                    <div className="col-md-8 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>Product Name *</label>
                                        <input type="text" className="form-control admin-input" placeholder="E.g., Vaneera Face Oil" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                                    </div>
                                    <div className="col-md-4 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>SKU</label>
                                        <input type="text" className="form-control admin-input" value={sku} readOnly style={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#64748b' }} />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>Category *</label>
                                        <select className="form-control admin-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                                            <option value="" disabled>Select Category</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>Subcategory (Optional)</label>
                                        <select className="form-control admin-input" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} disabled={!categoryId}>
                                            <option value="">{filteredSubcategories.length === 0 && categoryId ? 'No subcategories available' : 'Select Subcategory'}</option>
                                            {filteredSubcategories.map(s => <option key={s._id} value={s._id}>{s.subcategoryName}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Short Description</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="A brief one-liner about the product" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}></textarea>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pricing' && (
                            <div>
                                <h5 className="mb-4" style={{ fontWeight: 600 }}>Pricing & Stock</h5>
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>Price (₹) *</label>
                                        <input type="number" min="0" step="0.01" className="form-control admin-input" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                    </div>
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>Unit *</label>
                                        <select className="form-control admin-input" value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
                                            <option value="" disabled>Select Unit</option>
                                            {units.map(u => <option key={u._id} value={u._id}>{u.unitName}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>Volume / Quantity Value *</label>
                                        <input type="number" min="1" className="form-control admin-input" placeholder="E.g., 50 (Positive Only)" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                                    </div>
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label" style={{ fontWeight: 600 }}>Inventory Stock *</label>
                                        <input type="number" min="0" className="form-control admin-input" placeholder="Available items" value={stock} onChange={(e) => setStock(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div>
                                <h5 className="mb-4" style={{ fontWeight: 600 }}>Product Images (Max 4)</h5>
                                <div className="image-upload-wrapper mb-4 text-center p-4" style={{ border: '2px dashed #ddd', borderRadius: '12px', background: '#f8fafc' }}>
                                    <input type="file" accept="image/*" id="imageUpload" style={{ display: 'none' }} onChange={onSelectFile} disabled={images.length >= 4} />
                                    <label htmlFor="imageUpload" style={{ cursor: images.length >= 4 ? 'not-allowed' : 'pointer', margin: 0 }}>
                                        <Upload size={30} color={images.length >= 4 ? '#ccc' : '#1e523b'} className="mb-2" />
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Click to upload and crop</div>
                                    </label>
                                </div>
                                <div className="row g-2">
                                    {images.map((imgSrc, i) => (
                                        <div className="col-3 position-relative" key={i}>
                                            <img src={imgSrc} alt={`preview ${i}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                                            <button type="button" onClick={() => removeImage(i)} className="position-absolute d-flex align-items-center justify-content-center" style={{ top: '4px', right: '4px', background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', padding: 0 }}>
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div>
                                <h5 className="mb-4" style={{ fontWeight: 600 }}>Description & Content</h5>
                                
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Short Description</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="Brief summary of the product..." value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}></textarea>
                                </div>

                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Product Overview</label>
                                    <textarea className="form-control admin-input" rows={4} placeholder="Detailed description of the product..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                                </div>

                                <hr className="my-4" />
                                
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-label m-0" style={{ fontWeight: 600 }}>Key Benefits</label>
                                    <button type="button" className="btn btn-sm btn-light" onClick={addBenefit}><Plus size={14}/> Add Benefit</button>
                                </div>
                                {keyBenefits.map((ben, i) => (
                                    <div key={i} className="d-flex mb-2">
                                        <input type="text" className="form-control admin-input me-2" placeholder="E.g. Hydrates skin" value={ben} onChange={(e) => handleBenefitChange(i, e.target.value)} />
                                        <button type="button" className="btn btn-outline-danger" onClick={() => removeBenefit(i)}><X size={16}/></button>
                                    </div>
                                ))}

                                <hr className="my-4" />

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-label m-0" style={{ fontWeight: 600 }}>Key Ingredients</label>
                                    <button type="button" className="btn btn-sm btn-light" onClick={addIngredient}><Plus size={14}/> Add Ingredient</button>
                                </div>
                                {keyIngredients.map((ing, i) => (
                                    <div key={i} className="row g-2 mb-3 p-3 bg-light rounded position-relative">
                                        <div className="col-md-6">
                                            <input type="text" className="form-control admin-input" placeholder="Name (e.g. Aloe Vera)" value={ing.name} onChange={(e) => handleIngredientChange(i, 'name', e.target.value)} />
                                        </div>
                                        <div className="col-md-6">
                                            <input type="text" className="form-control admin-input" placeholder="Botanical Name" value={ing.botanicalName} onChange={(e) => handleIngredientChange(i, 'botanicalName', e.target.value)} />
                                        </div>
                                        <div className="col-md-6">
                                            <input type="text" className="form-control admin-input" placeholder="Percentage (e.g. 10%)" value={ing.percentage} onChange={(e) => handleIngredientChange(i, 'percentage', e.target.value)} />
                                        </div>
                                        <div className="col-md-6">
                                            <input type="text" className="form-control admin-input" placeholder="Part Used (e.g. Leaf)" value={ing.partType} onChange={(e) => handleIngredientChange(i, 'partType', e.target.value)} />
                                        </div>
                                        <div className="col-md-12">
                                            <input type="text" className="form-control admin-input" placeholder="Website Role (e.g. Soothing hydration...)" value={ing.websiteRole} onChange={(e) => handleIngredientChange(i, 'websiteRole', e.target.value)} />
                                        </div>
                                        {keyIngredients.length > 1 && (
                                            <button type="button" className="btn btn-sm btn-danger position-absolute" style={{ top: '8px', right: '8px', width: 'auto', padding: '2px 6px' }} onClick={() => removeIngredient(i)}><X size={14}/></button>
                                        )}
                                    </div>
                                ))}
                                
                                <div className="form-group mb-4 mt-3">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Other Ingredients (Full List)</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="Water, Glycerin, etc..." value={otherIngredients} onChange={(e) => setOtherIngredients(e.target.value)}></textarea>
                                </div>
                                
                                <div className="form-group mb-4 mt-3">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Label Control</label>
                                    <p className="text-muted small mb-2">The 'LABEL CONTROL' heading is displayed automatically on the customer Product Detail page.</p>
                                    <textarea className="form-control admin-input" rows={3} placeholder="Percentages and common ingredient names..." value={labelControl} onChange={(e) => setLabelControl(e.target.value)}></textarea>
                                </div>

                                <hr className="my-4" />

                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>How to Use</label>
                                    <textarea className="form-control admin-input" rows={3} placeholder="1. Wash face... 2. Apply..." value={howToUse} onChange={(e) => setHowToUse(e.target.value)}></textarea>
                                </div>

                                <hr className="my-4" />

                                <hr className="my-4" />

                                <h6 className="fw-bold mb-3">Usage & Suitability</h6>
                                
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Who It Is Suitable For</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="E.g., All skin types..." value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)}></textarea>
                                </div>

                                <hr className="my-4" />

                                <h6 className="fw-bold mb-3">Safety & Care</h6>
                                
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Safety, Possible Side Effects & Allergy Information</label>
                                    <textarea className="form-control admin-input" rows={3} placeholder="For external use only..." value={safetyInformation} onChange={(e) => setSafetyInformation(e.target.value)}></textarea>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Patch-Test Guidance</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="Apply a small amount to inner arm..." value={patchTestGuidance} onChange={(e) => setPatchTestGuidance(e.target.value)}></textarea>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Storage & Product Care</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="Store in a cool, dry place..." value={storageInstructions} onChange={(e) => setStorageInstructions(e.target.value)}></textarea>
                                </div>

                                <hr className="my-4" />

                                <div className="form-group mb-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', padding: '16px', borderRadius: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, color: '#92400e' }}>
                                        <i className="bi bi-exclamation-triangle me-2"></i>Special Publishing & Claims Note
                                    </label>
                                    <p className="small mb-2" style={{ color: '#b45309' }}>The 'REVIEW BEFORE PUBLISHING' label is displayed automatically on the customer Product Detail page.</p>
                                    <textarea className="form-control admin-input" rows={3} placeholder="The exact Vitamin C derivative and pH must be confirmed..." value={specialPublishingClaimsNote} onChange={(e) => setSpecialPublishingClaimsNote(e.target.value)}></textarea>
                                </div>

                                <h6 className="fw-bold mb-3">Legal & Internal</h6>
                                
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Standard Website Disclaimer</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="This product is not intended to diagnose..." value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)}></textarea>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--admin-primary-dark)' }}>Internal Publishing Note (Admin Only)</label>
                                    <textarea className="form-control admin-input" rows={2} placeholder="Notes for reviewers..." value={internalPublishingNote} onChange={(e) => setInternalPublishingNote(e.target.value)}></textarea>
                                </div>

                                <hr className="my-4" />

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-label m-0" style={{ fontWeight: 600 }}>Specifications</label>
                                    <button type="button" className="btn btn-sm btn-light" onClick={addSpecRow}><Plus size={14}/> Add Spec</button>
                                </div>
                                {specifications.map((spec, i) => (
                                    <div key={i} className="row mb-2 align-items-center">
                                        <div className="col-5">
                                            <input type="text" className="form-control admin-input" placeholder="Key (e.g. Skin Type)" value={spec.key} onChange={(e) => handleSpecChange(i, 'key', e.target.value)} />
                                        </div>
                                        <div className="col-6">
                                            <input type="text" className="form-control admin-input" placeholder="Value (e.g. All Skin Types)" value={spec.value} onChange={(e) => handleSpecChange(i, 'value', e.target.value)} />
                                        </div>
                                        <div className="col-1 text-end">
                                            <button type="button" className="btn btn-sm btn-outline-danger p-1" onClick={() => removeSpecRow(i)}><X size={14}/></button>
                                        </div>
                                    </div>
                                ))}

                                <hr className="my-4" />

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-label m-0" style={{ fontWeight: 600 }}>FAQs</label>
                                    <button type="button" className="btn btn-sm btn-light" onClick={addFaq}><Plus size={14}/> Add FAQ</button>
                                </div>
                                {faqs.map((faq, i) => (
                                    <div key={i} className="mb-3 p-3 bg-light rounded position-relative">
                                        <input type="text" className="form-control admin-input mb-2" placeholder="Question" value={faq.question} onChange={(e) => handleFaqChange(i, 'question', e.target.value)} />
                                        <textarea className="form-control admin-input" rows={2} placeholder="Answer" value={faq.answer} onChange={(e) => handleFaqChange(i, 'answer', e.target.value)}></textarea>
                                        <button type="button" className="btn btn-sm btn-danger position-absolute" style={{ top: '8px', right: '8px', width: 'auto', padding: '2px 6px' }} onClick={() => removeFaq(i)}><X size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'seo' && (
                            <div>
                                <h5 className="mb-4" style={{ fontWeight: 600 }}>SEO Settings</h5>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>URL Slug</label>
                                    <input type="text" className="form-control admin-input" placeholder="e.g., vaneera-face-oil" value={slug} onChange={(e) => setSlug(e.target.value)} />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Image Alt Text</label>
                                    <input type="text" className="form-control admin-input" placeholder="e.g., Bottle of Vaneera Face Oil" value={imageAltText} onChange={(e) => setImageAltText(e.target.value)} />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Meta Title</label>
                                    <input type="text" className="form-control admin-input" placeholder="Best Face Oil | Naturalayam" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Meta Description</label>
                                    <textarea className="form-control admin-input" rows={3} placeholder="Buy the best face oil..." value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)}></textarea>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Tags (comma-separated)</label>
                                    <input type="text" className="form-control admin-input" placeholder="face oil, skincare, natural" value={tags} onChange={(e) => setTags(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Product Status</h5>
                        <div className="form-group mb-4">
                            <select className="form-control admin-input" value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')}>
                                <option value="true">Active (Published)</option>
                                <option value="false">Inactive (Hidden)</option>
                            </select>
                            <small className="text-muted mt-1 d-block">Inactive products will be hidden from the customer shop.</small>
                        </div>

                        <hr className="my-4" />

                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Product Highlights</h5>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Select features that apply to this product:</p>
                        <div className="d-flex flex-column gap-3">
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: featured ? '#f0fdf4' : 'transparent', borderColor: featured ? 'var(--admin-primary)' : '#e2e8f0' }}>
                                <input type="checkbox" className="form-check-input mt-0" checked={featured} onChange={(e) => setFeatured(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span className="ms-2" style={{ fontWeight: 600, color: featured ? 'var(--admin-primary-dark)' : '#1e293b' }}>Featured Product</span>
                            </label>
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: isPopular ? '#fdf9ec' : 'transparent', borderColor: isPopular ? '#f59e0b' : '#e2e8f0' }}>
                                <input type="checkbox" className="form-check-input mt-0" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span className="ms-2" style={{ fontWeight: 600, color: isPopular ? '#92400e' : '#1e293b' }}>Popular Item</span>
                            </label>
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: isTrending ? '#f5f3ff' : 'transparent', borderColor: isTrending ? '#7c3aed' : '#e2e8f0' }}>
                                <input type="checkbox" className="form-check-input mt-0" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span className="ms-2" style={{ fontWeight: 600, color: isTrending ? '#5b21b6' : '#1e293b' }}>Trending Now</span>
                            </label>
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: isBestSeller ? '#ecfdf5' : 'transparent', borderColor: isBestSeller ? '#10b981' : '#e2e8f0' }}>
                                <input type="checkbox" className="form-check-input mt-0" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                <span className="ms-2" style={{ fontWeight: 600, color: isBestSeller ? '#065f46' : '#1e293b' }}>Best Seller</span>
                            </label>
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px' }}>
                        <button type="submit" disabled={saving} className="btn w-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--admin-primary-dark)', color: '#fff', borderRadius: '8px', padding: '12px', fontWeight: 600 }}>
                            {saving ? 'Updating...' : <><Save size={18} className="me-2" /> Update Product</>}
                        </button>
                    </div>
                </div>
            </form>

            {isCropModalOpen && src && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0"><Crop size={20} className="me-2" /> Crop Image</h4>
                            <button onClick={() => { setIsCropModalOpen(false); setSrc(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ maxWidth: '500px', margin: '0 auto', background: '#333' }}>
                            <Cropper src={src} style={{ height: 400, width: '100%' }} aspectRatio={1} guides={true} ref={cropperRef} viewMode={1} dragMode="move" background={false} />
                        </div>
                        <div className="d-flex justify-content-end mt-4">
                            <button onClick={saveCroppedImage} style={{ padding: '10px 20px', background: 'var(--admin-primary-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>Set Image</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProduct;
