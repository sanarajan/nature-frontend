import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import userApiClient from '../../services/userApiClient';
import type { RootState } from '../../store';
import './Checkout.css';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

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
    const [appliedCode, setAppliedCode] = useState<{ code: string, type: 'referral' | 'coupon' | 'influencer' | null, source?: 'LINK' | 'CODE' | null }>({ code: '', type: null, source: null });
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [appliedComboOffer, setAppliedComboOffer] = useState<any>(null);
    
    // Nature Points
    const [useNaturePoints, setUseNaturePoints] = useState(false);
    const [naturePointsDiscount, setNaturePointsDiscount] = useState(0);
    const [availableNaturePoints, setAvailableNaturePoints] = useState(0);
    const [naturePointsEligibility, setNaturePointsEligibility] = useState<any>(null);
    const [naturePointsUsed, setNaturePointsUsed] = useState(0);
    
    // Influencer logic
    const [influencerDiscountPercent, setInfluencerDiscountPercent] = useState<number>(0);
    const [influencerCookie, setInfluencerCookie] = useState<string | null>(null);
    const [influencerDiscountAmount, setInfluencerDiscountAmount] = useState<number>(0);
    const [influencerEligibility, setInfluencerEligibility] = useState<{ isEligible: boolean; daysRemaining: number } | null>(null);
    
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
                        
                        // Fetch user nature points balance
                        try {
                            const pointsRes = await userApiClient.get('/user/loyalty/points');
                            if (pointsRes.data.success) {
                                setAvailableNaturePoints(pointsRes.data.data.points || 0);
                            }
                        } catch (err) {
                            console.error('Failed to fetch nature points', err);
                        }
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
                        setAppliedComboOffer(res.data.data.appliedComboOffer || null);
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

        const fetchInfluencerSettings = async () => {
            try {
                // Check if influencer cookie exists
                const cookieValue = document.cookie.split('; ').find(row => row.startsWith('influencer_ref='))?.split('=')[1];
                if (cookieValue) {
                    setInfluencerCookie(cookieValue);
                    console.log("[DEBUG] Influencer cookie found:", cookieValue);
                    const res = await userApiClient.get('/user/influencer/settings/public');
                    if (res.data.success) {
                        setInfluencerDiscountPercent(res.data.data.influencerDiscountPercent);
                        console.log("[DEBUG] Influencer settings fetched. Discount %:", res.data.data.influencerDiscountPercent);
                    }
                } else {
                    console.log("[DEBUG] No influencer cookie found.");
                }
            } catch (err) {
                console.log("[DEBUG] Failed to fetch influencer settings:", err);
            }
        };

        fetchUserData();
        fetchCartItems();
        fetchInfluencerSettings();
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
        const fetchCartItems = async () => {
            try {
                const res = await userApiClient.get('/user/cart');
                if (res.data.success && res.data.data) {
                    setCartItems(res.data.data.products || []);
                    setAppliedComboOffer(res.data.data.appliedComboOffer || null);
                }
            } catch (err) {
                console.error("Failed to fetch cart", err);
            }
        };

        fetchCartItems();

        const handleCartUpdated = () => {
            fetchCartItems();
        };
        window.addEventListener('cart-updated', handleCartUpdated);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdated);
        };
    }, [navigate]);

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
        const fetchCentralizedTotals = async () => {
            if (cartItems.length === 0) {
                setSubtotal(0);
                setInfluencerDiscountAmount(0);
                setShipping(0);
                setTotal(0);
                return;
            }

            const activeAddrId = (showNewAddressForm || editingAddressId) ? null : (tempSelectedId || selectedAddressId);

            try {
                const payload = {
                    addressId: activeAddrId,
                    couponCode: (appliedCode.type === 'coupon' || (appliedCode.type === 'influencer' && appliedCode.source === 'CODE')) ? appliedCode.code : '',
                    referralCode: appliedCode.type === 'referral' ? appliedCode.code : '',
                    influencerRef: (appliedCode.source === 'LINK' || (appliedCode.type === 'influencer' && appliedCode.source !== 'CODE') || (!appliedCode.source && influencerCookie && !appliedCode.code)) ? (influencerCookie || appliedCode.code || '') : '',
                    useNaturePoints
                };
                
                const res = await userApiClient.post('/user/order/checkout/totals', payload);
                if (res.data.success) {
                    const data = res.data.data;
                    setSubtotal(data.originalPrice || data.subtotal);
                    setInfluencerDiscountAmount(data.influencerDiscountAmount || 0);
                    setInfluencerEligibility(data.influencerEligibility || (data.influencerApplied ? { isEligible: data.influencerApplied.isEligible ?? true, daysRemaining: data.influencerApplied.daysRemaining || 0 } : null));
                    setShipping(data.deliveryCharge || 0);
                    
                    setNaturePointsDiscount(data.naturePointsDiscount || 0);
                    setNaturePointsUsed(data.naturePointsUsed || 0);
                    setNaturePointsEligibility(data.naturePointsEligibility || null);
                    setTotal(data.finalPrice || data.total);
                    
                    // Safely clear applied code if backend rejected it due to priority (e.g. combo offer appeared)
                    if (appliedCode.code && !data.appliedDiscounts?.coupon && !data.appliedDiscounts?.referral && !data.influencerApplied && !(data.appliedDiscounts && data.appliedDiscounts.influencer) && !data.influencerDiscountAmount) {
                        setAppliedCode({ code: '', type: null, source: null });
                        setAppliedDiscount(0);
                        setCouponInput('');
                    } else if (!appliedCode.code && (data.influencerApplied || data.influencerDiscountAmount > 0) && data.influencerCode) {
                        setAppliedCode({ code: data.influencerCode, type: 'influencer', source: influencerCookie ? 'LINK' : 'CODE' });
                        setCouponInput(data.influencerCode);
                    } else if (appliedCode.code && appliedCode.type === 'influencer' && !appliedCode.source) {
                        setAppliedCode(prev => ({ ...prev, source: influencerCookie ? 'LINK' : 'CODE' }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch checkout totals", error);
            }
        };

        fetchCentralizedTotals();
    }, [cartItems, influencerCookie, influencerDiscountPercent, appliedComboOffer, appliedDiscount, appliedCode, formData.state, tempSelectedId, isChanging, showNewAddressForm, editingAddressId, editFormData.state, selectedAddressId, savedAddresses, useNaturePoints]);

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
        if (appliedComboOffer) {
            toast.warning("Coupon or referral cannot be applied when combo offer is active.");
            return;
        }
        const code = (codeToApply || couponInput).trim().toUpperCase();
        if (!code) return;

        // Check if link-based attribution is active and protected
        const isLinkActive = appliedCode.source === 'LINK' || (influencerCookie && (appliedCode.type === 'influencer' || !appliedCode.code) && appliedCode.source !== 'CODE');
        if (isLinkActive) {
            toast.warning("Link-based influencer discount is already active and cannot be replaced.");
            return;
        }

        try {
            // 0. Check if it's an influencer code first via checkout totals or active validation
            const activeAddrId = (showNewAddressForm || editingAddressId) ? null : (tempSelectedId || selectedAddressId);
            try {
                const testRes = await userApiClient.post('/user/order/checkout/totals', {
                    addressId: activeAddrId,
                    couponCode: code,
                    useNaturePoints
                });
                if (testRes.data?.success) {
                    const totalsData = testRes.data.data;
                    if (totalsData.influencerApplied || totalsData.influencerDiscountAmount > 0) {
                        setAppliedDiscount(totalsData.influencerDiscountAmount);
                        setAppliedCode({ code: totalsData.influencerCode || code, type: 'influencer', source: 'CODE' });
                        setCouponInput(totalsData.influencerCode || code);
                        setInfluencerDiscountAmount(totalsData.influencerDiscountAmount);
                        toast.success(`Influencer code "${totalsData.influencerCode || code}" applied!`);
                        setIsModalOpen(false);
                        return;
                    }
                }
            } catch (infErr) {
                // Ignore and continue checking regular coupons/referrals
            }

            // 1. Try validating as a regular coupon first
            try {
                const couponRes = await userApiClient.post('/user/coupon/validate', { code, amount: subtotal });
                if (couponRes.data.success) {
                    const coupon = couponRes.data.data.coupon;
                    setAppliedDiscount(coupon.discountValue);
                    setAppliedCode({ code: coupon.couponName, type: 'coupon', source: 'CODE' });
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
                setAppliedCode({ code: code, type: 'referral', source: 'CODE' });
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
                isOnline: isOnline,
                useNaturePoints
            };

            if (appliedCode.type === 'referral') {
                orderData.referralCode = appliedCode.code;
            } else if (appliedCode.type === 'coupon' || appliedCode.type === 'influencer') {
                orderData.couponCode = appliedCode.code;
            }

            const res = await userApiClient.post('/user/order', orderData);

            if (res.data.success) {
                if (isOnline) {
                    const { razorpayOrderId, amount, key_id, order } = res.data.data;
console.log(razorpayOrderId,"razprpayid",amount,key_id,order)
                    const options = {
                        key: key_id,
                        amount: amount,
                        currency: "INR",
                        name: "Naturalayam",
                        description: `Order Payment for ${order.orderId}`,
                        image: "/src/assets/images/favicon.png",
                        order_id: razorpayOrderId,
                        // method: 'upi',
                        config: {
                            display: {
                                blocks: {
                                    upi: {
                                        name: 'UPI / QR Code',
                                        instruments: [
                                            {
                                                method: 'upi'
                                            }
                                        ]
                                    },
                                    other_methods: {
                                        name: 'Other Payment Methods',
                                        instruments: [
                                            {
                                                method: 'card'
                                            },
                                            {
                                                method: 'netbanking'
                                            },
                                            {
                                                method: 'wallet'
                                            }
                                        ]
                                    }
                                },
                                sequence: ['block.upi', 'block.other_methods'],
                            },
                        },
                        retry: {
                            enabled: true,
                            max_count: 3
                        },
                        handler: async (response: any) => {
                            console.log("[Razorpay] Payment success response:", response);
                            toast.info("Verifying payment, please wait...");
                            try {
                                const verifyRes = await userApiClient.post('/user/order/verify-payment', {
                                    orderId: order.orderId,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature
                                });

                                if (verifyRes.data.success) {
                                    toast.success("Payment verified successfully!");
                                    window.dispatchEvent(new Event('cart-updated'));
                                    navigate('/checkout/success', { replace: true });
                                } else {
                                    console.error("[Verify] Failed:", verifyRes.data);
                                    toast.error(verifyRes.data.message || "Payment verification failed.");
                                }
                            } catch (err: any) {
                                console.error("[Verify] API Error:", err);
                                toast.error(err.response?.data?.message || "Error communicating with server for verification");
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
                                console.log("[Razorpay] Modal closed by user");
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Payment Incomplete',
                                    text: 'The payment process was closed before completion. If any amount was debited, it will generally be refunded by your bank according to their processing timeline.',
                                    confirmButtonText: 'Try Again',
                                    confirmButtonColor: '#0d6efd'
                                });
                            }
                        }
                    };

                    const rzp = new (window as any).Razorpay(options);
                    rzp.on('payment.failed', function (response: any) {
                        console.error("[Razorpay] Payment failed event:", response.error);
                        
                        let errorTitle = 'Payment Failed';
                        let errorMessage = response.error.description || 'An unknown error occurred during payment.';
                        
                        if (errorMessage.toLowerCase().includes('3dsecure is not enabled')) {
                            errorMessage = 'Your bank or card could not complete authentication (3D Secure). Please try another card, use UPI or Net Banking, or contact your bank if the issue persists.';
                        }

                        errorMessage += '\n\nIf any amount was debited due to a failed payment attempt, it will generally be refunded by your bank according to their processing timeline.';
                        
                        Swal.fire({
                            icon: 'error',
                            title: errorTitle,
                            text: errorMessage,
                            confirmButtonText: 'Retry Payment',
                            confirmButtonColor: '#0d6efd'
                        });
                    });
                    rzp.open();
                } else {
                    // Clear frontend cart state by notifying components
                    window.dispatchEvent(new Event('cart-updated'));
                    toast.success("Order placed successfully!");
                    navigate('/checkout/success');
                }
            } else {
                console.log(res.data.message,"messagesfgf")
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
                                {(() => {
                                    // Group combo-split items by productId for clean display
                                    const grouped: Record<string, { product: any; totalQty: number }> = {};
                                    cartItems.forEach(item => {
                                        if (!item.product) return;
                                        const pId = item.product._id;
                                        if (!grouped[pId]) grouped[pId] = { product: item.product, totalQty: 0 };
                                        grouped[pId].totalQty += item.quantity;
                                    });
                                    return Object.values(grouped).map(g => (
                                        <div className="cart-item style-1" key={g.product._id}>
                                            <div className="dz-media"><img src={g.product?.images?.[0] || product1} alt="Product" /></div>
                                            <div className="dz-content">
                                                <h6 className="title mb-0">{g.product?.productName} <span className="text-secondary">x{g.totalQty}</span></h6>
                                                <span className="price">₹{((g.product?.price || 0) * g.totalQty).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ));
                                })()}

                                {cartItems.length === 0 && (
                                    <p className="m-b20">Your cart is empty.</p>
                                )}

                                <table>
                                    <tbody>
                                        <tr className="subtotal">
                                            <td>Subtotal (MRP)</td>
                                            <td className="price">₹{cartItems.reduce((a, item) => a + ((item.product?.price || 0) * item.quantity), 0).toFixed(2)}</td>
                                        </tr>
                                        {appliedDiscount > 0 && appliedCode.type !== 'influencer' && (
                                            <tr className="discount text-success">
                                                <td>{appliedCode.type === 'referral' ? 'Referral' : 'Coupon'} Discount</td>
                                                <td className="price">-₹{appliedDiscount.toFixed(2)}</td>
                                            </tr>
                                        )}
                                        {appliedComboOffer && (
                                            <tr className="discount text-success" style={{ border: '2px dashed #28a745', background: '#f8fff8', borderRadius: '10px' }}>
                                                <td style={{ padding: '15px 10px' }}>
                                                    <h6 className="mb-0 fw-bold">{appliedComboOffer.offerName}</h6>
                                                    <div className="small opacity-75">Combo Discount Applied</div>
                                                </td>
                                                <td className="price fw-bold" style={{ padding: '15px 10px', fontSize: '1.2rem' }}>
                                                    -₹{appliedComboOffer.discountValue.toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="shipping">
                                            <td>Shipping</td>
                                            <td className="price">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</td>
                                        </tr>
                                        {influencerDiscountAmount > 0 && (
                                            <tr className="discount text-success">
                                                <td>Influencer Discount {appliedCode.type === 'influencer' && appliedCode.code ? `(${appliedCode.code})` : influencerCookie ? `(${influencerCookie})` : ''}</td>
                                                <td className="price">-₹{influencerDiscountAmount.toFixed(2)}</td>
                                            </tr>
                                        )}
                                        {naturePointsDiscount > 0 && (
                                            <tr className="discount text-success">
                                                <td>Nature Points Redeemed</td>
                                                <td className="price">-₹{naturePointsDiscount.toFixed(2)}</td>
                                            </tr>
                                        )}
                                        <tr className="total">
                                            <td>Total</td>
                                            <td className="price">₹{total.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Nature Points Section */}
                                {availableNaturePoints > 0 && (
                                    <div className="coupon-input-container mb-3" style={{ background: '#f5fff5', borderColor: '#c3e6cb' }}>
                                        {useNaturePoints && (naturePointsUsed > 0 || naturePointsDiscount > 0) ? (
                                            <div>
                                                <h6 className="mb-3 text-success fw-bold">
                                                    <i className="fas fa-leaf me-2"></i>Nature Points Applied ✅
                                                </h6>
                                                <div className="small mb-3">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted">Available Balance:</span>
                                                        <span className="fw-bold">{availableNaturePoints} Points</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted">Redeemed:</span>
                                                        <span className="fw-bold text-danger">
                                                            -{naturePointsUsed > 0 ? naturePointsUsed : naturePointsDiscount} Points
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between border-top pt-1 mt-1">
                                                        <span className="text-muted">Remaining Balance:</span>
                                                        <span className="fw-bold text-success">
                                                            {availableNaturePoints - (naturePointsUsed > 0 ? naturePointsUsed : naturePointsDiscount)} Points
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-danger btn-sm w-100"
                                                    onClick={() => {
                                                        setUseNaturePoints(false);
                                                        setNaturePointsUsed(0);
                                                        setNaturePointsDiscount(0);
                                                    }}
                                                >
                                                    Remove Applied Nature Points
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <h6 className="mb-2 text-success"><i className="fas fa-leaf me-2"></i>Nature Points</h6>
                                                <div className="form-check custom-checkbox mb-2">
                                                    <input 
                                                        type="checkbox" 
                                                        className="form-check-input" 
                                                        id="useNaturePoints"
                                                        checked={useNaturePoints}
                                                        disabled={naturePointsEligibility && !naturePointsEligibility.isEligible}
                                                        onChange={(e) => setUseNaturePoints(e.target.checked)}
                                                    />
                                                    <label className="form-check-label ms-2" htmlFor="useNaturePoints" style={{ cursor: 'pointer' }}>
                                                        Use my Nature Points ({availableNaturePoints} Available)
                                                    </label>
                                                </div>
                                                {naturePointsEligibility && !naturePointsEligibility.isEligible && naturePointsEligibility.disabledReason && (
                                                    <small className="text-danger d-block mt-1">
                                                        <i className="fas fa-info-circle me-1"></i> {naturePointsEligibility.disabledReason}
                                                    </small>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Coupon / Referral Section */}
                                <div className="coupon-input-container">
                                    <h6 className="mb-2">Apply Coupon / Referral</h6>
                                    
                                    {appliedComboOffer && (
                                        <div className="alert alert-info py-2 mb-2" style={{ fontSize: '13px', borderLeft: '4px solid #0dcaf0' }}>
                                            <i className="fas fa-info-circle me-2"></i>
                                            Combo offer applied. Coupons cannot be used.
                                        </div>
                                    )}

                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={appliedComboOffer ? "Disabled" : "Code"}
                                            value={couponInput}
                                            disabled={!!appliedComboOffer}
                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        />
                                        <button
                                            className="btn btn-secondary"
                                            disabled={!!appliedComboOffer}
                                            onClick={() => handleApplyCode(couponInput)}
                                        >
                                            APPLY
                                        </button>
                                    </div>
                                    
                                    {!appliedComboOffer && (
                                        <div
                                            className="coupon-link"
                                            onClick={() => {
                                                fetchCoupons();
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            Show all active coupons
                                        </div>
                                    )}
                                    {(appliedCode.code || influencerCookie || (influencerEligibility && !influencerEligibility.isEligible)) && (() => {
                                        const isInfluencer = appliedCode.type === 'influencer' || (!appliedCode.code && (influencerCookie || influencerEligibility));

                                        if (isInfluencer) {
                                            const isEligible = influencerEligibility ? influencerEligibility.isEligible : (influencerDiscountAmount > 0);
                                            const daysRemaining = influencerEligibility?.daysRemaining || 0;
                                            const isLinkAttribution = appliedCode.source === 'LINK' || (appliedCode.type === 'influencer' && !appliedCode.source && influencerCookie) || (!appliedCode.code && influencerCookie);
                                            const codeName = appliedCode.code || influencerCookie || '';

                                            if (isEligible) {
                                                return (
                                                    <div className="mt-2 text-success d-flex align-items-center justify-content-between bg-light p-2 rounded border border-success-subtle" style={{ fontSize: '13px' }}>
                                                        <div>
                                                            <i className="fas fa-check-circle me-1 text-success"></i>
                                                            Influencer Welcome Discount Applied.{codeName ? <strong className="ms-1">({codeName})</strong> : ''}
                                                        </div>
                                                        {!isLinkAttribution && (
                                                            <span
                                                                className="text-danger fw-medium cursor-pointer ms-3"
                                                                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                                                onClick={() => {
                                                                    setAppliedDiscount(0);
                                                                    setAppliedCode({ code: '', type: null, source: null });
                                                                    setCouponInput('');
                                                                    setInfluencerDiscountAmount(0);
                                                                    toast.info('Discount removed.');
                                                                }}
                                                            >
                                                                Remove
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="mt-2 p-3 rounded bg-warning-subtle border border-warning-subtle" style={{ fontSize: '13px', color: '#856404' }}>
                                                        <div className="fw-bold mb-1 d-flex align-items-center">
                                                            <i className="fas fa-info-circle me-2 text-warning fs-6"></i>
                                                            You are connected with this Influencer.{codeName ? <span className="badge bg-warning text-dark ms-2">{codeName}</span> : ''}
                                                        </div>
                                                        <div className="text-muted small">
                                                            Your next Influencer Welcome Discount will be available after 90 days from your last eligible discounted purchase.
                                                        </div>
                                                        {daysRemaining > 0 && (
                                                            <div className="fw-bold mt-2 text-dark">
                                                                Next discount available in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        }

                                        const isLinkAttribution = appliedCode.source === 'LINK' || (appliedCode.type === 'influencer' && !appliedCode.source && influencerCookie) || (!appliedCode.code && influencerCookie && influencerDiscountAmount > 0);
                                        return (
                                            <div className="mt-2 text-success d-flex align-items-center justify-content-between bg-light p-2 rounded border border-success-subtle" style={{ fontSize: '13px' }}>
                                                <div>
                                                    <i className="fas fa-check-circle me-1 text-success"></i>
                                                    Applied: <strong>{appliedCode.code || influencerCookie}</strong>
                                                    <span className="badge bg-success-subtle text-success border border-success ms-2">
                                                        {appliedCode.type === 'coupon' ? 'Coupon' : appliedCode.type === 'referral' ? 'Referral' : 'Influencer'}
                                                    </span>
                                                </div>
                                                {!isLinkAttribution && (
                                                    <span
                                                        className="text-danger fw-medium cursor-pointer ms-3"
                                                        style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            setAppliedDiscount(0);
                                                            setAppliedCode({ code: '', type: null, source: null });
                                                            setCouponInput('');
                                                            if (appliedCode.type === 'influencer') {
                                                                setInfluencerDiscountAmount(0);
                                                            }
                                                            toast.info('Discount removed.');
                                                        }}
                                                    >
                                                        Remove
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
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
