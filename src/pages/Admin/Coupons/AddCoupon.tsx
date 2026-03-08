import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Upload, X, Save, Crop } from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import apiClient from '../../../services/adminApiClient';
import '../../../styles/admin-pages.css';

const AddCoupon: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [form, setForm] = useState({
        couponName: '',
        startDate: '',
        endDate: '',
        description: '',
        minPurchase: '',
        discountType: 'Percentage' as 'Percentage' | 'Amount',
        discountPercentage: '',
        discountValue: '',
        status: true,
        userUsageLimit: ''
    });

    const [images, setImages] = useState<string[]>([]);
    const [src, setSrc] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const cropperRef = useRef<any>(null);

    useEffect(() => {
        if (isEdit) {
            const fetchCoupon = async () => {
                try {
                    const res = await apiClient.get(`/admin/coupon/${id}`);
                    if (res.data.success) {
                        const c = res.data.data;
                        setForm({
                            couponName: c.couponName,
                            startDate: new Date(c.startDate).toISOString().split('T')[0],
                            endDate: new Date(c.endDate).toISOString().split('T')[0],
                            description: c.description,
                            minPurchase: c.minPurchase.toString(),
                            discountType: c.discountType,
                            discountPercentage: c.discountPercentage?.toString() || '',
                            discountValue: c.discountValue?.toString() || '',
                            status: c.status,
                            userUsageLimit: c.userUsageLimit?.toString() || ''
                        });
                        if (c.couponImage) setImages(c.couponImage);
                    }
                } catch (error) {
                    toast.error('Failed to load coupon details');
                }
            };
            fetchCoupon();
        }
    }, [id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setForm(prev => ({ ...prev, [name]: val }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                setSrc(reader.result as string);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCrop = () => {
        if (cropperRef.current) {
            const canvas = cropperRef.current.cropper.getCroppedCanvas();
            if (canvas) {
                const croppedData = canvas.toDataURL();
                setImages([croppedData]); // Coupons only have 1 image
                setIsCropModalOpen(false);
                setSrc(null);
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Basic Required Fields Validation
        if (!form.couponName.trim() || !form.startDate || !form.endDate || !form.description.trim() || !form.minPurchase) {
            return toast.error('Please fill all required fields');
        }

        const minPurchaseNum = Number(form.minPurchase);
        const userUsageLimitNum = form.userUsageLimit ? Number(form.userUsageLimit) : null;

        // 2. Date Validation
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        if (end <= start) {
            return toast.error('Expiry date must be after start date');
        }

        // 3. Discount Validation
        if (form.discountType === 'Percentage') {
            const perc = Number(form.discountPercentage);
            if (!perc || perc <= 0 || perc > 100) {
                return toast.error('Please enter a valid percentage (1-100)');
            }
        } else {
            const val = Number(form.discountValue);
            if (!val || val <= 0) {
                return toast.error('Please enter a valid discount amount');
            }
            // 4. Amount Logic: Min Purchase >= Discount Value + 100
            if (minPurchaseNum < val + 100) {
                return toast.error(`Minimum purchase for this discount must be at least ₹${val + 100} (Difference of ₹100 required)`);
            }
        }

        // 5. Image Validation
        if (images.length === 0) {
            return toast.error('Please upload a coupon image');
        }

        try {
            const payload = {
                ...form,
                couponName: form.couponName.trim(),
                description: form.description.trim(),
                minPurchase: minPurchaseNum,
                userUsageLimit: userUsageLimitNum,
                couponImage: images
            };

            const apiCall = isEdit
                ? apiClient.put(`/admin/coupon/${id}`, payload)
                : apiClient.post('/admin/coupon/add', payload);

            const res = await apiCall;
            if (res.data.success) {
                toast.success(isEdit ? 'Coupon updated successfully!' : 'Coupon added successfully!');
                navigate('/admin/coupons');
            }
        } catch (error: any) {
            // Unique Name check is handled by backend and returning message
            toast.error(error.response?.data?.message || 'Failed to save coupon');
        }
    };

    return (
        <div className="admin-page-container position-relative">
            <div className="page-header d-flex align-items-center mb-4">
                <button
                    onClick={() => navigate('/admin/coupons')}
                    className="btn btn-light d-flex align-items-center justify-content-center me-3"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="page-title m-0">{isEdit ? 'Edit Coupon' : 'Add New Coupon'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="row">
                <div className="col-lg-8">
                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Basic Information</h5>

                        <div className="form-group mb-4">
                            <label className="form-label" style={{ fontWeight: 600 }}>Coupon Name *</label>
                            <input
                                type="text"
                                className="form-control admin-input"
                                placeholder="E.g., WELCOME20 (Must be unique)"
                                name="couponName"
                                value={form.couponName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Start Date *</label>
                                <input
                                    type="date"
                                    className="form-control admin-input"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>End Date *</label>
                                <input
                                    type="date"
                                    className="form-control admin-input"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label" style={{ fontWeight: 600 }}>Description *</label>
                            <textarea
                                className="form-control admin-input"
                                rows={3}
                                placeholder="Describe the offer..."
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Minimum Purchase (₹) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control admin-input"
                                    placeholder="Min purchase (Must be ₹100 more than discount)"
                                    name="minPurchase"
                                    value={form.minPurchase}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Usage Limit (Per User)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control admin-input"
                                    placeholder="Unlimited if empty"
                                    name="userUsageLimit"
                                    value={form.userUsageLimit}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Discount Details</h5>
                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label" style={{ fontWeight: 600 }}>Discount Type *</label>
                                <select
                                    className="form-control admin-input"
                                    name="discountType"
                                    value={form.discountType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Percentage">Percentage (%)</option>
                                    <option value="Amount">Flat Amount (₹)</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-4">
                                {form.discountType === 'Percentage' ? (
                                    <>
                                        <label className="form-label" style={{ fontWeight: 600 }}>Discount Percentage (%) *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="form-control admin-input"
                                            placeholder="E.g., 20"
                                            name="discountPercentage"
                                            value={form.discountPercentage}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label className="form-label" style={{ fontWeight: 600 }}>Discount Value (₹) *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control admin-input"
                                            placeholder="E.g., 500"
                                            name="discountValue"
                                            value={form.discountValue}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Coupon Image</h5>
                        <div className="image-upload-wrapper mb-4 text-center p-4" style={{ border: '2px dashed #ddd', borderRadius: '12px', background: '#f8fafc' }}>
                            <input
                                type="file"
                                accept="image/*"
                                id="imageUpload"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                disabled={images.length >= 1}
                            />
                            <label htmlFor="imageUpload" style={{ cursor: images.length >= 1 ? 'not-allowed' : 'pointer', margin: 0 }}>
                                <Upload size={30} color={images.length >= 1 ? '#ccc' : '#1e523b'} className="mb-2" />
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Click to upload and crop</div>
                            </label>
                        </div>

                        <div className="row g-2">
                            {images.map((imgSrc, i) => (
                                <div className="col-12 position-relative" key={i}>
                                    <img src={imgSrc} alt={`preview ${i}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="position-absolute d-flex align-items-center justify-content-center"
                                        style={{ top: '8px', right: '8px', background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-card mb-4" style={{ padding: '24px' }}>
                        <h5 className="mb-4" style={{ fontWeight: 600 }}>Status</h5>
                        <label className="d-flex align-items-center mb-0" style={{ cursor: 'pointer', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', backgroundColor: form.status ? '#f0fdf4' : 'transparent', borderColor: form.status ? 'var(--admin-primary)' : '#e2e8f0' }}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={form.status}
                                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.checked }))}
                                style={{ width: '18px', height: '18px', marginTop: 0 }}
                            />
                            <span className="ms-2" style={{ fontWeight: 600, color: form.status ? 'var(--admin-primary-dark)' : '#1e293b' }}>
                                {form.status ? 'Coupon Active' : 'Coupon Inactive'}
                            </span>
                        </label>
                        <p className="text-muted mt-2 small">Only active coupons can be used during checkout.</p>
                    </div>

                    <div className="admin-card" style={{ padding: '24px' }}>
                        <button type="submit" className="btn w-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--admin-primary-dark)', color: '#fff', borderRadius: '8px', padding: '12px', fontWeight: 600 }}>
                            <Save size={18} className="me-2" /> {isEdit ? 'Update Coupon' : 'Save Coupon'}
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
                            <h4 className="m-0"><Crop size={20} className="me-2" /> Crop Coupon Image</h4>
                            <button onClick={() => { setIsCropModalOpen(false); setSrc(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#333' }}>
                            <Cropper
                                src={src}
                                style={{ height: 400, width: '100%' }}
                                aspectRatio={16 / 9}
                                guides={true}
                                ref={cropperRef}
                                viewMode={1}
                                dragMode="move"
                                background={false}
                            />
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button onClick={handleCrop} style={{ padding: '10px 20px', background: 'var(--admin-primary-dark)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
                                Set Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddCoupon;
