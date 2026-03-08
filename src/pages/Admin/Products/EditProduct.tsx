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
    [key: string]: string; // Fallback for differing name fields
}

interface Spec {
    key: string;
    value: string;
}

const EditProduct: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // Options for dropdowns
    const [categories, setCategories] = useState<Option[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<any[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
    const [units, setUnits] = useState<Option[]>([]);

    // Form states
    const [productName, setProductName] = useState('');
    const [sku, setSku] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [stock, setStock] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [specifications, setSpecifications] = useState<Spec[]>([{ key: '', value: '' }]);
    const [featured, setFeatured] = useState(false);
    const [isPopular, setIsPopular] = useState(false);
    const [isTrending, setIsTrending] = useState(false);
    const [isBestSeller, setIsBestSeller] = useState(false);

    // Image states
    const [images, setImages] = useState<string[]>([]); // Base64 strings or URLs

    // Cropping states
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
            const filtered = allSubcategories.filter(sub => sub.categoryId === categoryId);
            setFilteredSubcategories(filtered);
        } else {
            setFilteredSubcategories([]);
        }
    }, [categoryId, allSubcategories]);

    const fetchProduct = async () => {
        try {
            const res = await apiClient.get(`/admin/products/${id}`);
            if (res.data.success) {
                const product = res.data.data;
                setProductName(product.productName);
                setSku(product.sku || '');
                setCategoryId(product.categoryId);
                setSubcategoryId(product.subcategoryId || '');
                setUnitId(product.unitId);
                setQuantity(product.quantity.toString());
                setStock(product.stock.toString());
                setPrice(product.price.toString());
                setDescription(product.description || '');
                setImages(product.images || []);
                setFeatured(product.featured || false);
                setIsPopular(product.isPopular || false);
                setIsTrending(product.isTrending || false);
                setIsBestSeller(product.isBestSeller || false);

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

    const addSpecRow = () => {
        if (specifications.length < 4) {
            setSpecifications([...specifications, { key: '', value: '' }]);
        } else {
            toast.warning('Maximum of 4 specifications allowed.');
        }
    };

    const removeSpecRow = (index: number) => {
        const newSpecs = specifications.filter((_, i) => i !== index);
        setSpecifications(newSpecs.length > 0 ? newSpecs : [{ key: '', value: '' }]);
    };

    // --- Image Selection & Cropping Logic ---
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
            e.target.value = ''; // Reset input
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
        } else {
            toast.error('Cropper not initialized');
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // --- Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!productName || !categoryId || !unitId || !quantity || !stock || !price) {
            toast.error('Please fill in all required fields.');
            return;
        }

        const validSpecs = specifications.filter(s => s.key.trim() && s.value.trim());
        const specMap: Record<string, string> = {};
        validSpecs.forEach(s => {
            specMap[s.key] = s.value;
        });

        const payload = {
            productName,
            categoryId,
            subcategoryId: subcategoryId || null,
            unitId,
            quantity: Number(quantity),
            stock: Number(stock),
            price: Number(price),
            description,
            specifications: specMap,
            images,
            featured,
            isPopular,
            isTrending,
            isBestSeller
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
            <div className="page-header d-flex align-items-center mb-4">
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
                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Basic Information</h5>

                        <div className="row">
                            <div className="col-md-8 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Product Name *</label>
                                <input
                                    type="text"
                                    className="form-control admin-input"
                                    placeholder="E.g., Vaneera Face Oil"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-4 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>SKU (Auto-generated)</label>
                                <input
                                    type="text"
                                    className="form-control admin-input"
                                    value={sku}
                                    readOnly
                                    style={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#64748b' }}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Category *</label>
                                <select
                                    className="form-control admin-input"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Subcategory (Optional)</label>
                                <select
                                    className="form-control admin-input"
                                    value={subcategoryId}
                                    onChange={(e) => setSubcategoryId(e.target.value)}
                                    disabled={!categoryId}
                                >
                                    <option value="">Select Subcategory</option>
                                    {filteredSubcategories.map(s => <option key={s._id} value={s._id}>{s.subcategoryName}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Price (₹) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="form-control admin-input"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Unit *</label>
                                <select
                                    className="form-control admin-input"
                                    value={unitId}
                                    onChange={(e) => setUnitId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select Unit</option>
                                    {units.map(u => <option key={u._id} value={u._id}>{u.unitName}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Volume / Quantity Value *</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control admin-input"
                                    placeholder="E.g., 50"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Inventory Stock *</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control admin-input"
                                    placeholder="Available items"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label" style={{ fontWeight: 600 }}>Description</label>
                            <textarea
                                className="form-control admin-input"
                                rows={4}
                                placeholder="Detailed description of the product..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="m-0" style={{ fontWeight: 600 }}>Specifications</h5>
                            <button type="button" className="btn btn-light" onClick={addSpecRow} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                <Plus size={14} className="me-1" /> Add Spec
                            </button>
                        </div>
                        {specifications.map((spec, i) => (
                            <div key={i} className="row mb-3 align-items-center">
                                <div className="col-5">
                                    <input
                                        type="text"
                                        className="form-control admin-input"
                                        placeholder="Key (e.g. Skin Type)"
                                        value={spec.key}
                                        onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
                                    />
                                </div>
                                <div className="col-6">
                                    <input
                                        type="text"
                                        className="form-control admin-input"
                                        placeholder="Value (e.g. All Skin Types)"
                                        value={spec.value}
                                        onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
                                    />
                                </div>
                                <div className="col-1 text-end">
                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeSpecRow(i)} style={{ padding: '6px' }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Product Images (Max 4)</h5>

                        <div className="image-upload-wrapper mb-4 text-center p-4" style={{ border: '2px dashed #ddd', borderRadius: '12px', background: '#f8fafc' }}>
                            <input
                                type="file"
                                accept="image/*"
                                id="imageUpload"
                                style={{ display: 'none' }}
                                onChange={onSelectFile}
                                disabled={images.length >= 4}
                            />
                            <label htmlFor="imageUpload" style={{ cursor: images.length >= 4 ? 'not-allowed' : 'pointer', margin: 0 }}>
                                <Upload size={30} color={images.length >= 4 ? '#ccc' : '#1e523b'} className="mb-2" />
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Click to upload and crop</div>
                            </label>
                        </div>

                        <div className="row g-2">
                            {images.map((imgSrc, i) => (
                                <div className="col-6 position-relative" key={i}>
                                    <img src={imgSrc} alt={`preview ${i}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="position-absolute d-flex align-items-center justify-content-center"
                                        style={{ top: '4px', right: '4px', background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', padding: 0 }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Product Highlights</h5>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Select features that apply to this product:</p>
                        <div className="d-flex flex-column gap-3">
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: featured ? '#f0fdf4' : 'transparent', borderColor: featured ? 'var(--admin-primary)' : '#e2e8f0' }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={featured}
                                    onChange={(e) => setFeatured(e.target.checked)}
                                    style={{ width: '18px', height: '18px', marginTop: 0 }}
                                />
                                <span className="ms-2" style={{ fontWeight: 600, color: featured ? 'var(--admin-primary-dark)' : '#1e293b' }}>Featured Product</span>
                            </label>
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: isPopular ? '#fdf9ec' : 'transparent', borderColor: isPopular ? '#f59e0b' : '#e2e8f0' }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isPopular}
                                    onChange={(e) => setIsPopular(e.target.checked)}
                                    style={{ width: '18px', height: '18px', marginTop: 0 }}
                                />
                                <span className="ms-2" style={{ fontWeight: 600, color: isPopular ? '#92400e' : '#1e293b' }}>Popular Item</span>
                            </label>
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: isTrending ? '#f5f3ff' : 'transparent', borderColor: isTrending ? '#7c3aed' : '#e2e8f0' }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isTrending}
                                    onChange={(e) => setIsTrending(e.target.checked)}
                                    style={{ width: '18px', height: '18px', marginTop: 0 }}
                                />
                                <span className="ms-2" style={{ fontWeight: 600, color: isTrending ? '#5b21b6' : '#1e293b' }}>Trending Now</span>
                            </label>
                            <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: isBestSeller ? '#ecfdf5' : 'transparent', borderColor: isBestSeller ? '#10b981' : '#e2e8f0' }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isBestSeller}
                                    onChange={(e) => setIsBestSeller(e.target.checked)}
                                    style={{ width: '18px', height: '18px', marginTop: 0 }}
                                />
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

            {/* Crop Modal */}
            {isCropModalOpen && src && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '16px',
                        padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0"><Crop size={20} className="me-2" /> Crop Image</h4>
                            <button onClick={() => { setIsCropModalOpen(false); setSrc(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ maxWidth: '500px', margin: '0 auto', background: '#333' }}>
                            <Cropper
                                src={src}
                                style={{ height: 400, width: '100%' }}
                                aspectRatio={1}
                                guides={true}
                                ref={cropperRef}
                                viewMode={1}
                                dragMode="move"
                                background={false}
                            />
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button onClick={saveCroppedImage} style={{ padding: '10px 20px', background: 'var(--admin-primary-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
                                Set Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProduct;
