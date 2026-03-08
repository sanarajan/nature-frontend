import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import userApiClient from '../../services/userApiClient';
import type { RootState } from '../../store';
import './Checkout.css';
import { toast } from 'react-toastify';

// Asset Imports
import bg2 from '../../assets/images/background/bg2.jpg';
import product1 from '../../assets/images/shop/product/1.png';

const Checkout: React.FC = () => {
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [shipping, setShipping] = useState(0);
    const [total, setTotal] = useState(0);
    const [couponInput, setCouponInput] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [appliedCode, setAppliedCode] = useState<{ code: string, type: 'referral' | 'coupon' | null }>({ code: '', type: null });
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addressLoading, setAddressLoading] = useState(true);

    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [tempSelectedId, setTempSelectedId] = useState<string>('');
    const [isChanging, setIsChanging] = useState(false);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [statesList, setStatesList] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        country: 'India',
        address: '',
        city: '',
        district: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        notes: ''
    });

    const [editFormData, setEditFormData] = useState({
        house: '',
        place: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
        name: '',
        phone: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            setAddressLoading(true);
            if (isUser) {
                try {
                    const res = await userApiClient.get('/user/auth/me');
                    if (res.data.success && res.data.data.user) {
                        const user = res.data.data.user;
                        setFormData(prev => ({
                            ...prev,
                            name: user.displayName || user.username || user.name || '',
                            email: user.email || '',
                            phone: user.phoneNumber || user.phone || user.mobile || ''
                        }));
                    }
                } catch (err) {
                    console.error('Failed to fetch user data for checkout', err);
                }

                try {
                    const addressRes = await userApiClient.get('/user/auth/address');
                    if (addressRes.data.success) {
                        const addresses = addressRes.data.data.addresses || [];
                        if (addresses.length > 0) {
                            setSavedAddresses(addresses);
                            // Do not auto-select to summary; show list first
                            setSelectedAddressId('');
                            setTempSelectedId(addresses[0]._id || addresses[0].id);
                            setShowNewAddressForm(false);
                            setIsChanging(true);
                        } else {
                            setSavedAddresses([]);
                            setShowNewAddressForm(true);
                            setSelectedAddressId('');
                            setIsChanging(true);
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch addresses for checkout', err);
                }
            } else {
                const localData = localStorage.getItem('user_data');
                // For guests, use dummy addresses for easier testing
                const demoAddrs = [
                    { _id: 'dummy1', house: 'Sample House, 123', place: 'Green Colony', city: 'Kochi', district: 'Ernakulam', state: 'Kerala', pincode: '682001' }
                ];
                setSavedAddresses(demoAddrs);
                setSelectedAddressId(demoAddrs[0]._id);
                setTempSelectedId(demoAddrs[0]._id);
                setShowNewAddressForm(false);
                setIsChanging(false);

                if (localData) {
                    try {
                        const user = JSON.parse(localData);
                        setFormData(prev => ({
                            ...prev,
                            name: user.displayName || user.username || user.name || '',
                            email: user.email || '',
                            phone: user.phoneNumber || user.phone || user.mobile || ''
                        }));
                    } catch (e) { }
                }
            }
            setAddressLoading(false);
        };

        const fetchCartItems = async () => {
            if (isUser) {
                try {
                    const res = await userApiClient.get('/user/cart');
                    if (res.data.success && res.data.data) {
                        setCartItems(res.data.data.products || []);
                    }
                } catch (err) { }
            } else {
                const localCart = localStorage.getItem('offlineCart');
                if (localCart) {
                    try {
                        setCartItems(JSON.parse(localCart));
                    } catch (e) { }
                }
            }
        };

        fetchUserData();
        fetchCartItems();
    }, [isUser]);

    useEffect(() => {
        if (selectedAddressId && selectedAddressId !== 'new') {
            const addr = savedAddresses.find(a => (a._id || a.id) === selectedAddressId);
            if (addr) {
                setFormData(prev => ({
                    ...prev,
                    address: addr.house + (addr.place ? ', ' + addr.place : ''),
                    city: addr.city,
                    district: addr.district || '',
                    state: addr.state,
                    zip: addr.pincode,
                    name: addr.firstName || addr.name || prev.name,
                    phone: addr.phone || prev.phone
                }));
            }
        }
    }, [selectedAddressId, savedAddresses]);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const res = await userApiClient.get('/user/auth/states');
                if (res.data.success) {
                    setStatesList(res.data.data.states || []);
                }
            } catch (err) { }
        };
        fetchStates();
    }, []);

    const handleDeliverHere = (id: string) => {
        setSelectedAddressId(id);
        setIsChanging(false);
        setEditingAddressId(null);
        setShowNewAddressForm(false);
    };

    const handleEditClick = (e: React.MouseEvent, addr: any) => {
        e.stopPropagation();
        setEditingAddressId(addr._id || addr.id);
        setTempSelectedId(addr._id || addr.id);
        setShowNewAddressForm(false);
        setEditFormData({
            house: addr.house || '',
            place: addr.place || '',
            city: addr.city || addr.district || '',
            district: addr.district || addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            name: addr.firstName || formData.name,
            phone: addr.phone || formData.phone
        } as any);
    };

    const handleSaveEdit = async (id: string) => {
        const { house, place, district, state, pincode } = editFormData;
        if (!house || !place || !district || !state || !pincode) {
            toast.error("Please fill all required fields");
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            toast.error("Pincode must be exactly 6 digits");
            return;
        }

        try {
            const formDataToSubmit = {
                _id: id,
                ...editFormData
            };
            const res = await userApiClient.post('/user/auth/address', formDataToSubmit);
            if (res.data.success) {
                // Update local list manually instead of refetching
                setSavedAddresses(prev => prev.map(a => (a._id || a.id) === id ? { ...a, ...editFormData } : a));
                setEditingAddressId(null);
                setSelectedAddressId(id);
                setTempSelectedId(id);
                setIsChanging(false);
            }
        } catch (error) {
            console.error("Failed to update address", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingAddressId(null);
    };

    const handleEditFormFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'district' ? { city: value } : {})
        }));
    };

    const handleAddNewClick = () => {
        setShowNewAddressForm(true);
        setEditingAddressId(null);
        setTempSelectedId('');
        setEditFormData({
            house: '',
            place: '',
            city: '',
            district: '',
            state: '',
            pincode: '',
            // Populate with user defaults for convenience
            name: formData.name,
            phone: formData.phone
        });
    };

    const handleSaveNewAddress = async () => {
        const { house, place, district, state, pincode, name, phone } = editFormData as any;
        if (!house || !place || !district || !state || !pincode) {
            toast.error("Please fill all required fields");
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            toast.error("Pincode must be exactly 6 digits");
            return;
        }

        try {
            // Mapping name to firstName for backend compatibility if needed
            const payload = { ...editFormData, firstName: name || formData.name };
            const res = await userApiClient.post('/user/auth/address', payload);
            if (res.data.success) {
                const newAddr = res.data.data.address;
                setSavedAddresses(prev => [...prev, newAddr]);
                setShowNewAddressForm(false);
                setSelectedAddressId(newAddr._id || newAddr.id);
                setTempSelectedId(newAddr._id || newAddr.id);
                setIsChanging(false);
                setEditFormData({ house: '', place: '', city: '', district: '', state: '', pincode: '', name: '', phone: '' });
                if (name) setFormData(prev => ({ ...prev, name }));
                if (phone) setFormData(prev => ({ ...prev, phone }));
            }
        } catch (error) {
            console.error("Failed to save new address", error);
        }
    };

    useEffect(() => {
        const sub = cartItems.reduce((acc, item) => {
            const price = item.product?.price || 0;
            return acc + (price * item.quantity);
        }, 0);
        setSubtotal(sub);
    }, [cartItems]);

    useEffect(() => {
        const updateShipping = async () => {
            if (subtotal === 0) {
                setShipping(0);
                setTotal(0);
                return;
            }

            let currentState = '';

            if (showNewAddressForm || editingAddressId) {
                // If adding/editing, use the state from the form
                currentState = editFormData.state;
            } else if (isChanging && tempSelectedId) {
                // If selecting from list, use the state of the highlighted one
                const tempAddr = savedAddresses.find(a => (a._id || a.id) === tempSelectedId);
                if (tempAddr) currentState = tempAddr.state;
            } else {
                // Otherwise use the confirmed address state
                currentState = formData.state;
            }

            if (!currentState) {
                const defaultShip = subtotal > 0 ? 50 : 0;
                setShipping(defaultShip);
                setTotal(subtotal + defaultShip);
                return;
            }

            try {
                const res = await userApiClient.get(`/user/order/shipping-charge/${encodeURIComponent(currentState)}`);
                if (res.data.success && res.data.data) {
                    const chargeData = res.data.data;
                    setShipping(chargeData.charge);
                    setTotal(subtotal + chargeData.charge);
                } else {
                    const defaultShip = subtotal > 0 ? 50 : 0;
                    setShipping(defaultShip);
                    setTotal(subtotal + defaultShip);
                }
            } catch (err) {
                const defaultShip = subtotal > 0 ? 50 : 0;
                setShipping(defaultShip);
                setTotal(subtotal + defaultShip);
            }
        };

        updateShipping();
    }, [subtotal, formData.state, tempSelectedId, isChanging, showNewAddressForm, editingAddressId, editFormData.state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const fetchCoupons = async () => {
        try {
            const res = await userApiClient.get('/user/coupon/active');
            if (res.data.success) {
                setAvailableCoupons(res.data.data.coupons || []);
            }
        } catch (err) {
            console.error("Failed to fetch coupons", err);
        }
    };

    const handleApplyCode = async (codeToApply: string) => {
        const code = (codeToApply || couponInput).trim().toUpperCase();
        if (!code) return;

        try {
            // 1. Try validating as a regular coupon first
            try {
                const couponRes = await userApiClient.post('/user/coupon/validate', { code, amount: subtotal });
                if (couponRes.data.success) {
                    const coupon = couponRes.data.data.coupon;
                    setAppliedDiscount(coupon.discountValue);
                    setAppliedCode({ code: coupon.couponName, type: 'coupon' });
                    setCouponInput(coupon.couponName);
                    toast.success(`Coupon "${coupon.couponName}" applied!`);
                    setIsModalOpen(false);
                    return;
                }
            } catch (couponErr: any) {
                // If the error is specifically about minimum purchase, do NOT fallback to referral
                if (couponErr.response?.status === 400 || (couponErr.response?.data?.message && couponErr.response.data.message.toLowerCase().includes('minimum purchase'))) {
                    toast.error(couponErr.response?.data?.message || "Coupon requirements not met.");
                    return;
                }

                // If it's a 404 (Coupon not found), then it MIGHT be a referral code. 
                // Any other error (like 500) we should just show the error.
                if (couponErr.response?.status !== 404) {
                    toast.error(couponErr.response?.data?.message || "Error validating code.");
                    return;
                }
            }

            // 2. If coupon not found (404), check if it's a referral code
            const meRes = await userApiClient.get('/user/auth/me');
            if (meRes.data.success) {
                const myInfo = meRes.data.data.user;

                if (myInfo.referralId === code) {
                    toast.error("You cannot use your own referral code.");
                    return;
                }

                // For referral codes, the backend placeOrder handles the actual validation.
                // We'll apply it here for UI feedback, but it's "tentative".
                setAppliedDiscount(subtotal * 0.20);
                setAppliedCode({ code: code, type: 'referral' });
                setCouponInput(code);
                toast.success("Referral discount applied!");
                setIsModalOpen(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid code or application error.");
        }
    };

    const handlePlaceOrder = async () => {
        if (!isUser) {
            toast.error("Please login to place an order");
            navigate('/login');
            return;
        }

        const isOnline = paymentMethod !== 'cod';

        try {
            const orderData: any = {
                addressId: selectedAddressId,
                paymentMethod: paymentMethod === 'cod' ? 'COD' : paymentMethod,
                isOnline: isOnline
            };

            if (appliedCode.type === 'referral') {
                orderData.referralCode = appliedCode.code;
            } else if (appliedCode.type === 'coupon') {
                orderData.couponCode = appliedCode.code;
            }

            const res = await userApiClient.post('/user/order', orderData);

            if (res.data.success) {
                if (isOnline) {
                    const { razorpayOrderId, amount, key_id, order } = res.data.data;

                    const options = {
                        key: key_id,
                        amount: amount,
                        currency: "INR",
                        name: "Naturalayam",
                        description: `Order Payment for ${order.orderId}`,
                        image: "/src/assets/images/favicon.png",
                        order_id: razorpayOrderId,
                        handler: async (response: any) => {
                            try {
                                const verifyRes = await userApiClient.post('/user/order/verify-payment', {
                                    orderId: order.orderId,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature
                                });

                                if (verifyRes.data.success) {
                                    toast.success("Payment successful!");
                                    window.dispatchEvent(new Event('cart-updated'));
                                    navigate('/checkout/success');
                                } else {
                                    toast.error(verifyRes.data.message || "Payment verification failed.");
                                }
                            } catch (err: any) {
                                console.error("Verification Error:", err);
                                toast.error(err.response?.data?.message || "Error verifying payment");
                            }
                        },
                        prefill: {
                            name: formData.name,
                            email: formData.email,
                            contact: formData.phone
                        },
                        theme: {
                            color: "#0d6efd"
                        },
                        modal: {
                            ondismiss: function () {
                                toast.warning("Payment cancelled by user.");
                            }
                        }
                    };

                    const rzp = new (window as any).Razorpay(options);
                    rzp.open();
                } else {
                    // Clear frontend cart state by notifying components
                    window.dispatchEvent(new Event('cart-updated'));
                    toast.success("Order placed successfully!");
                    navigate('/checkout/success');
                }
            } else {
                toast.error(res.data.message || "Failed to place order.");
            }
        } catch (error: any) {
            console.error("Order Place Error:", error);
            toast.error(error.response?.data?.message || "Failed to process the order");
        }
    };

    return (
        <div className="page-content">
            <div className="dz-bnr-inr" style={{ backgroundImage: `url(${bg2})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Check Out</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/"> Home</Link></li>
                                <li className="breadcrumb-item">Check Out</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="content-inner-1 bg-light">
                <div className="container">
                    <div className="row shop-checkout">
                        <div className="col-xl-8">
                            <div className="customer-detail-section mb-4">
                                <div className="checkout-section-header inactive">
                                    <span className="section-num">1</span>
                                    <span>USER DETAILS</span>
                                    <i className="fas fa-check-circle text-success ms-auto"></i>
                                </div>
                                <div className="summary-content">
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="label-title">USER NAME</div>
                                            <p className="mb-0"><strong>{formData.name}</strong></p>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="label-title">EMAIL ADDRESS</div>
                                            <p className="mb-0"><strong>{formData.email}</strong></p>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="label-title">PHONE NUMBER</div>
                                            <p className="mb-0"><strong>{formData.phone}</strong></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: DELIVERY ADDRESS */}
                            <div className="address-selection-container mb-4">
                                {addressLoading ? (
                                    <div className="p-4 text-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2 mb-0">Loading your addresses...</p>
                                    </div>
                                ) : !isChanging && selectedAddressId ? (
                                    <>
                                        <div className="checkout-section-header inactive">
                                            <span className="section-num">2</span>
                                            <span>DELIVERY ADDRESS</span>
                                            <i className="fas fa-check-circle text-success ms-2"></i>
                                        </div>
                                        <div className="selected-address-summary">
                                            <div className="address-content">
                                                <div className="d-flex align-items-center mb-1">
                                                    <strong className="addr-name">{formData.name}</strong>
                                                    <span className="address-tag">HOME</span>
                                                    <strong className="ms-3 addr-phone">{formData.phone}</strong>
                                                </div>
                                                <p className="address-text">
                                                    {formData.address}, {formData.city}, {formData.state} - {formData.zip}
                                                </p>
                                            </div>
                                            <div className="change-btn" onClick={() => { setIsChanging(true); setTempSelectedId(selectedAddressId); }}>CHANGE</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="checkout-section-header">
                                            <span className="section-num">2</span>
                                            <span>DELIVERY ADDRESS</span>
                                        </div>
                                        <div className="address-list">
                                            {savedAddresses.map((addr) => (
                                                <div key={addr._id || addr.id}>
                                                    {editingAddressId === (addr._id || addr.id) ? (
                                                        <div className="address-form-inline">
                                                            <h6 className="mb-3 text-primary">EDIT ADDRESS</h6>
                                                            <div className="row g-3">
                                                                <div className="col-md-6">
                                                                    <label className="label-title">Full Name *</label>
                                                                    <input type="text" name="name" value={editFormData.name} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="label-title">Phone Number *</label>
                                                                    <input type="text" name="phone" value={editFormData.phone} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                                </div>
                                                                <div className="col-md-12">
                                                                    <label className="label-title">House Name / Flat Name *</label>
                                                                    <input type="text" name="house" value={editFormData.house} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                                </div>
                                                                <div className="col-md-12">
                                                                    <label className="label-title">Place *</label>
                                                                    <input type="text" name="place" value={editFormData.place} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="label-title">District *</label>
                                                                    <input type="text" name="district" value={editFormData.district} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="label-title">State *</label>
                                                                    <select name="state" value={editFormData.state} onChange={handleEditFormFieldChange} required className="form-control form-control-fl p-2">
                                                                        <option value="">Select State</option>
                                                                        {statesList.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="label-title">Pincode *</label>
                                                                    <input type="text" pattern="\d{6}" maxLength={6} name="pincode" value={editFormData.pincode} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                                </div>
                                                                <div className="col-12 mt-4">
                                                                    <button className="deliver-here-btn me-3" onClick={() => handleSaveEdit(addr._id || addr.id)}>SAVE AND DELIVER HERE</button>
                                                                    <button className="btn btn-link text-primary p-0" onClick={handleCancelEdit}>CANCEL</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`address-item-card ${tempSelectedId === (addr._id || addr.id) ? 'active' : ''}`} onClick={() => { setTempSelectedId(addr._id || addr.id); setShowNewAddressForm(false); }}>
                                                            <div className="d-flex align-items-start">
                                                                <input type="radio" name="address_sel" checked={tempSelectedId === (addr._id || addr.id)} readOnly className="form-check-input mt-1 me-4" />
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex align-items-center mb-1">
                                                                        <strong className="addr-name">{addr.firstName || addr.name || formData.name}</strong>
                                                                        <span className="address-tag">HOME</span>
                                                                        <strong className="ms-3 addr-phone">{addr.phone || formData.phone}</strong>
                                                                        <span className="edit-btn" onClick={(e) => handleEditClick(e, addr)}>EDIT</span>
                                                                    </div>
                                                                    <p className="address-text mb-2 text-muted">
                                                                        {addr.house}, {addr.place}, {addr.city}, {addr.state} - {addr.pincode}
                                                                    </p>
                                                                    {tempSelectedId === (addr._id || addr.id) && (
                                                                        <button className="deliver-here-btn" onClick={(e) => { e.stopPropagation(); handleDeliverHere(addr._id || addr.id); }}>DELIVER HERE</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {!showNewAddressForm ? (
                                                <div className="add-address-bar" onClick={handleAddNewClick}>
                                                    <i className="fas fa-plus"></i>
                                                    <span>Add a new address</span>
                                                </div>
                                            ) : (
                                                <div className="address-form-inline">
                                                    <h6 className="mb-3 text-primary">ADD A NEW ADDRESS</h6>
                                                    <div className="row g-3">
                                                        <div className="col-md-6">
                                                            <label className="label-title">Full Name *</label>
                                                            <input type="text" name="name" value={editFormData.name} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="label-title">Phone Number *</label>
                                                            <input type="text" name="phone" value={editFormData.phone} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                        </div>
                                                        <div className="col-md-12">
                                                            <label className="label-title">House Name / Flat Name *</label>
                                                            <input type="text" name="house" value={editFormData.house} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                        </div>
                                                        <div className="col-md-12">
                                                            <label className="label-title">Place *</label>
                                                            <input type="text" name="place" value={editFormData.place} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="label-title">District *</label>
                                                            <input type="text" name="district" value={editFormData.district} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="label-title">State *</label>
                                                            <select name="state" value={editFormData.state} onChange={handleEditFormFieldChange} required className="form-control form-control-fl p-2">
                                                                <option value="">Select State</option>
                                                                {statesList.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="label-title">Pincode *</label>
                                                            <input type="text" pattern="\d{6}" maxLength={6} name="pincode" value={editFormData.pincode} onChange={handleEditFormFieldChange} required className="form-control form-control-fl" />
                                                        </div>
                                                        <div className="col-12 mt-4">
                                                            <button className="deliver-here-btn me-3" onClick={handleSaveNewAddress}>SAVE AND DELIVER HERE</button>
                                                            <button className="btn btn-link text-primary p-0" onClick={() => setShowNewAddressForm(false)}>CANCEL</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Section 3: ADDITIONAL INFORMATION */}
                            <div className="customer-detail-section mb-0">
                                <div className="checkout-section-header active">
                                    <span className="section-num">3</span>
                                    <span>ADDITIONAL INFORMATION</span>
                                </div>
                                <div className="summary-content">
                                    <div className="form-group">
                                        <label className="label-title">Order notes (optional)</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-control" rows={5} placeholder="Notes about your order..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-4 side-bar">
                            <h4 className="title m-b15">Your Order</h4>
                            <div className="order-detail sticky-top">
                                {cartItems.map((item, idx) => (
                                    <div className="cart-item style-1" key={item.product?._id || idx}>
                                        <div className="dz-media"><img src={item.product?.images?.[0] || product1} alt="Product" /></div>
                                        <div className="dz-content">
                                            <h6 className="title mb-0">{item.product?.productName} <span className="text-secondary">x{item.quantity}</span></h6>
                                            <span className="price">₹{(item.product?.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}

                                {cartItems.length === 0 && (
                                    <p className="m-b20">Your cart is empty.</p>
                                )}

                                <table>
                                    <tbody>
                                        <tr className="subtotal">
                                            <td>Subtotal</td>
                                            <td className="price">₹{subtotal.toFixed(2)}</td>
                                        </tr>
                                        {appliedDiscount > 0 && (
                                            <tr className="discount text-success">
                                                <td>{appliedCode.type === 'referral' ? 'Referral' : 'Coupon'} Discount</td>
                                                <td className="price">-₹{appliedDiscount.toFixed(2)}</td>
                                            </tr>
                                        )}
                                        <tr className="shipping">
                                            <td>Shipping</td>
                                            <td className="price">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</td>
                                        </tr>
                                        <tr className="total">
                                            <td>Total</td>
                                            <td className="price">₹{(total - appliedDiscount).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Coupon / Referral Section */}
                                <div className="coupon-input-container">
                                    <h6 className="mb-2">Apply Coupon / Referral</h6>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Code"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        />
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleApplyCode(couponInput)}
                                        >
                                            APPLY
                                        </button>
                                    </div>
                                    <div
                                        className="coupon-link"
                                        onClick={() => {
                                            fetchCoupons();
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        Show all active coupons
                                    </div>
                                    {appliedCode.code && (
                                        <div className="mt-2 text-success" style={{ fontSize: '13px' }}>
                                            <i className="fas fa-check-circle me-1"></i>
                                            Applied: <strong>{appliedCode.code}</strong>
                                            <span
                                                className="ms-2 text-danger cursor-pointer"
                                                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                                onClick={() => {
                                                    setAppliedDiscount(0);
                                                    setAppliedCode({ code: '', type: null });
                                                    setCouponInput('');
                                                }}
                                            >
                                                Remove
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="accordion dz-accordion accordion-sm mt-3">
                                    {/* <div className="accordion-item">
                                        <div className="accordion-header">
                                            <div className="custom-control custom-checkbox">
                                                <input type="radio" className="form-check-input" name="payment" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                                                <label className="form-check-label ps-2">Direct bank transfer</label>
                                            </div>
                                        </div>
                                        {paymentMethod === 'bank' && (
                                            <div className="accordion-body">
                                                <p className="m-b0">Make your payment directly into our bank account. Please use your Order ID as the payment reference.</p>
                                            </div>
                                        )}
                                    </div> */}
                                    <div className="accordion-item">
                                        <div className="accordion-header">
                                            <div className="custom-control custom-checkbox">
                                                <input type="radio" className="form-check-input" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                                <label className="form-check-label ps-2">Cash on delivery</label>
                                            </div>
                                        </div>
                                        {paymentMethod === 'cod' && (
                                            <div className="accordion-body">
                                                <p className="m-b0">Pay with cash upon delivery.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="accordion-item">
                                        <div className="accordion-header">
                                            <div className="custom-control custom-checkbox">
                                                <input type="radio" className="form-check-input" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                                                <label className="form-check-label ps-2">Online Payment (Razorpay)</label>
                                            </div>
                                        </div>
                                        {paymentMethod === 'online' && (
                                            <div className="accordion-body">
                                                <p className="m-b0">Pay securely with UPI, Cards, or Netbanking via Razorpay.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={handlePlaceOrder} disabled={cartItems.length === 0 || !selectedAddressId || selectedAddressId === 'new' || isChanging || showNewAddressForm || !!editingAddressId} className="btn btn-outline-secondary btn-lg w-100 mt-4">PLACE ORDER</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Coupon Modal */}
            {
                isModalOpen && (
                    <div className="custom-modal-overlay">
                        <div className="custom-modal-content">
                            <div className="custom-modal-header">
                                <h5>Available Coupons</h5>
                                <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                            </div>
                            <div className="custom-modal-body">
                                {availableCoupons.filter(c => subtotal >= c.minPurchase).length === 0 ? (
                                    <p className="text-center py-4">No coupons available for this order amount.</p>
                                ) : (
                                    availableCoupons
                                        .filter(coupon => subtotal >= coupon.minPurchase)
                                        .map((coupon) => (
                                            <div
                                                key={coupon._id}
                                                className="coupon-item"
                                                onClick={() => handleApplyCode(coupon.couponName)}
                                            >
                                                <div className="coupon-badge">{coupon.couponName}</div>
                                                <div className="coupon-desc">{coupon.description}</div>
                                                <div className="coupon-expiry">
                                                    Valid until: {new Date(coupon.endDate).toLocaleDateString()}
                                                    <br />
                                                    Min purchase: ₹{coupon.minPurchase}
                                                </div>
                                                <div className="text-primary mt-2" style={{ fontSize: '13px', fontWeight: '600' }}>
                                                    {coupon.discountType === 'Percentage' ? `${coupon.discountPercentage}% OFF` : `₹${coupon.discountValue} OFF`}
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Checkout;
