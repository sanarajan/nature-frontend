import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import bgBanner from '../../assets/images/background/bg1.jpg';

interface ComboProduct {
    productId: {
        _id: string;
        productName: string;
        price: number;
        images: string[];
    };
    quantity: number;
    requiredQuantity: number;
}

interface Combo {
    _id: string;
    offerName: string;
    discountType: 'percentage' | 'amount';
    discountValue: number;
    imageUrl: string;
    products: ComboProduct[];
    totalMRP: number;
    comboPrice: number;
    savings: number;
    savingsPercent: number;
}

const ComboOffers: React.FC = () => {
    const navigate = useNavigate();
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    
    const [combos, setCombos] = useState<Combo[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedOfferTypes, setSelectedOfferTypes] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchCombos();
    }, [selectedCategories, selectedOfferTypes, sortOrder]);

    const fetchCombos = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategories.length > 0) {
                selectedCategories.forEach(id => params.append('categoryIds', id));
            }
            if (selectedOfferTypes.length > 0) {
                selectedOfferTypes.forEach(type => params.append('discountTypes', type));
            }
            params.append('sort', sortOrder);

            const res = await userApiClient.get(`/user/products/combo-offers?${params.toString()}`);
            if (res.data.success) {
                setCombos(res.data.data);
            }
        } catch (error: any) {
            console.error('Fetch Error:', error);
            toast.error('Could not refresh deals');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await userApiClient.get('/user/categories');
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (error) {}
    };

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    const handleOfferTypeToggle = (type: string) => {
        setSelectedOfferTypes(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            } else {
                return [...prev, type];
            }
        });
    };

    const handleAddToCart = async (combo: Combo) => {
        if (!combo.products || combo.products.length === 0) return;

        const cartItemsToAdd = combo.products.map(p => ({
            product: p.productId,
            quantity: p.requiredQuantity || p.quantity || 1
        }));

        if (isUser) {
            try {
                const apiItems = cartItemsToAdd.map(i => ({
                    product: i.product._id,
                    quantity: i.quantity
                }));
                const res = await userApiClient.post('/user/cart/sync', { cartItems: apiItems });
                if (res.data.success) {
                    toast.success(`Bundle Added!`);
                    window.dispatchEvent(new Event('cart-updated'));
                }
            } catch (err) {
                toast.error('Failed to add to cart');
            }
        } else {
            const localCartStr = localStorage.getItem('offlineCart');
            let offlineItems: any[] = [];
            if (localCartStr) {
                try {
                    offlineItems = JSON.parse(localCartStr);
                } catch (err) {
                    offlineItems = [];
                }
            }

            cartItemsToAdd.forEach((newItem: any) => {
                const existsIndex = offlineItems.findIndex(p => p.product?._id === newItem.product?._id);
                if (existsIndex > -1) {
                    offlineItems[existsIndex].quantity += newItem.quantity;
                } else {
                    offlineItems.push(newItem);
                }
            });

            localStorage.setItem('offlineCart', JSON.stringify(offlineItems));
            toast.success(`Bundle Added Offline!`);
            window.dispatchEvent(new Event('cart-updated'));
        }
        navigate('/shop-cart');
    };

    return (
        <div className="page-content bg-white">
            <Header />
            
            <div className="dz-bnr-inr dz-bnr-inr-sm text-center overlay-black-middle" style={{ backgroundImage: `url(${bgBanner})`, backgroundSize: 'cover' }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1 className="text-white">Exclusive Combo Deals</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item active text-primary">Combo Offers</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <section className="content-inner bg-light overflow-visible">
                <div className="container">
                    <div className="row">
                        {/* Sidebar Filters */}
                        <div className="col-xl-3 col-lg-4 m-b30">
                            <aside className="side-bar sticky-top-custom p-4 bg-white rounded-4 shadow-sm border">
                                <div className="widget">
                                    <div className="d-flex justify-content-between align-items-center m-b30 border-bottom pb-2">
                                        <h5 className="widget-title mb-0" style={{ fontSize: '18px', fontWeight: '800' }}>Active Filters</h5>
                                        {(selectedCategories.length > 0 || selectedOfferTypes.length > 0) && (
                                            <button 
                                                className="btn btn-sm btn-danger rounded-pill px-3 py-1 text-white"
                                                onClick={() => { setSelectedCategories([]); setSelectedOfferTypes([]); }}
                                                style={{ fontSize: '11px', fontWeight: 'bold' }}
                                            >
                                                RESET ALL
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="filter-group m-b35">
                                        <h6 className="filter-title m-b20">Product Category</h6>
                                        <div className="filter-list scroll-bar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {categories.map(cat => (
                                                <div key={cat._id} className="custom-check-item mb-3">
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden-check"
                                                        id={`cat-${cat._id}`}
                                                        checked={selectedCategories.includes(cat._id)}
                                                        onChange={() => handleCategoryToggle(cat._id)}
                                                    />
                                                    <label className="check-label" htmlFor={`cat-${cat._id}`}>
                                                        <span className="check-box-ui">
                                                            {selectedCategories.includes(cat._id) && <i className="fa-solid fa-check"></i>}
                                                        </span>
                                                        <span className="text-name">{cat.categoryName}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="filter-group">
                                        <h6 className="filter-title m-b20">Offer Types</h6>
                                        <div className="custom-check-item mb-3">
                                            <input 
                                                type="checkbox" 
                                                className="hidden-check"
                                                id="type-percentage"
                                                checked={selectedOfferTypes.includes('percentage')}
                                                onChange={() => handleOfferTypeToggle('percentage')}
                                            />
                                            <label className="check-label" htmlFor="type-percentage">
                                                <span className="check-box-ui">
                                                    {selectedOfferTypes.includes('percentage') && <i className="fa-solid fa-check"></i>}
                                                </span>
                                                <span className="text-name">Percentage Discount</span>
                                            </label>
                                        </div>
                                        <div className="custom-check-item mb-3">
                                            <input 
                                                type="checkbox" 
                                                className="hidden-check"
                                                id="type-amount"
                                                checked={selectedOfferTypes.includes('amount')}
                                                onChange={() => handleOfferTypeToggle('amount')}
                                            />
                                            <label className="check-label" htmlFor="type-amount">
                                                <span className="check-box-ui">
                                                    {selectedOfferTypes.includes('amount') && <i className="fa-solid fa-check"></i>}
                                                </span>
                                                <span className="text-name">Flat Cash Discount</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* Main Grid */}
                        <div className="col-xl-9 col-lg-8">
                            <div className="combo-sort-bar d-flex justify-content-between align-items-center m-b30">
                                <div className="result-info">
                                    <p className="mb-0 text-muted">Found <span className="text-primary fw-bold">{combos.length}</span> active bundles</p>
                                </div>
                                <div className="sort-controls d-flex align-items-center gap-3">
                                    <span className="text-muted fw-600 d-none d-sm-inline">SORT BY:</span>
                                    <select 
                                        className="form-select combo-select shadow-sm"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                    >
                                        <option value="newest">Latest arrivals</option>
                                        <option value="best-savings">Biggest Savings</option>
                                        <option value="price-low-high">Price: Low to High</option>
                                        <option value="price-high-low">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="loading-container py-5 text-center">
                                    <div className="lds-ripple"><div></div><div></div></div>
                                    <p className="mt-4 text-primary fw-bold text-uppercase">Refreshing exclusive deals...</p>
                                </div>
                            ) : (
                                <div className="row">
                                    {combos.length > 0 ? combos.map((combo) => (
                                        <div key={combo._id} className="col-xl-6 col-md-12 m-b40">
                                            <div className="premium-combo-card h-100 shadow-sm">
                                                <div className="card-top">
                                                    <img src={combo.imageUrl} alt={combo.offerName} className="card-image" />
                                                    <div className="badge-float">
                                                        {combo.discountType === 'percentage' ? (
                                                            <div className="badge-inner">
                                                                <span className="val">{combo.discountValue}%</span>
                                                                <span className="lab">OFF</span>
                                                            </div>
                                                        ) : (
                                                            <div className="badge-inner">
                                                                <span className="val">₹{combo.discountValue}</span>
                                                                <span className="lab">OFF</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="card-body p-4">
                                                    <h4 className="combo-name mb-3">{combo.offerName}</h4>
                                                    
                                                    <div className="contents-box mb-4">
                                                        <label>INCLUDES:</label>
                                                        <div className="tags-list">
                                                            {combo.products.map((p, i) => (
                                                                <span key={i} className="item-tag">
                                                                    {p.productId?.productName || 'Bundle Item'} <b>x{p.quantity}</b>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="card-bottom border-top pt-3 d-flex justify-content-between align-items-center">
                                                        <div className="price-info">
                                                            <del className="mrp text-muted d-block">MRP ₹{combo.totalMRP}</del>
                                                            <div className="deal-price text-success">₹{combo.comboPrice}</div>
                                                            <div className="savings-alert">Save ₹{combo.savings}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleAddToCart(combo)}
                                                            className="btn btn-primary rounded-pill btn-purchase"
                                                        >
                                                            Grab Deal
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-12 text-center py-5 empty-deals">
                                            <i className="fa-solid fa-layer-group fa-4x mb-4 opacity-10"></i>
                                            <h3 className="text-secondary fw-bold">No bundles match these filters</h3>
                                            <p className="text-muted">Try resetting filters to explore all our amazing deals.</p>
                                            <button 
                                                className="btn btn-outline-primary rounded-pill mt-3 px-5 mb-5"
                                                onClick={() => { setSelectedCategories([]); setSelectedOfferTypes([]); }}
                                            >
                                                EXPLORE ALL DEALS
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            <style>{`
                .sticky-top-custom {
                    position: sticky;
                    top: 100px;
                    z-index: 5;
                }
                .filter-title {
                    font-size: 14px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #222;
                    letter-spacing: 1px;
                    border-left: 3px solid #38996E;
                    padding-left: 10px;
                }
                
                /* Custom Checkbox UX */
                .custom-check-item {
                    position: relative;
                }
                .hidden-check {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                }
                .check-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }
                .check-box-ui {
                    height: 20px;
                    width: 20px;
                    background-color: #f0f0f0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .hidden-check:checked + .check-label .check-box-ui {
                    background-color: #38996E;
                    border-color: #38996E;
                    color: white;
                }
                .hidden-check:checked + .check-label .text-name {
                    color: #38996E;
                    font-weight: 600;
                }
                .text-name {
                    font-size: 14px;
                    color: #555;
                    transition: all 0.2s;
                }
                .check-label:hover .check-box-ui {
                    background-color: #e8e8e8;
                }
                
                /* Sorting Bar */
                .combo-sort-bar {
                    background: #fff;
                    padding: 15px 25px;
                    border-radius: 15px;
                    border: 1px solid #eee;
                }
                .combo-select {
                    width: 200px;
                    border-radius: 30px;
                    height: 40px;
                    padding: 0 20px;
                    border-color: #ddd;
                    font-size: 14px;
                    cursor: pointer;
                }
                
                /* Premium Card */
                .premium-combo-card {
                    background: #fff;
                    border-radius: 20px;
                    overflow: hidden;
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid #f0f0f0;
                }
                .premium-combo-card:hover {
                    transform: scale(1.02);
                }
                .card-top {
                    height: 250px;
                    position: relative;
                    background: #f8f8f8;
                }
                .card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .badge-float {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    z-index: 2;
                }
                .badge-inner {
                    background: linear-gradient(135deg, #38996E 0%, #2e7d32 100%);
                    color: #fff;
                    width: 65px;
                    height: 65px;
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 5px 15px rgba(56, 153, 110, 0.4);
                }
                .badge-inner .val {
                    font-size: 16px;
                    font-weight: 900;
                    line-height: 1;
                }
                .badge-inner .lab {
                    font-size: 10px;
                    font-weight: 700;
                }
                .combo-name {
                    font-size: 20px;
                    font-weight: 800;
                    color: #333;
                    text-transform: capitalize;
                }
                .contents-box label {
                    font-size: 11px;
                    font-weight: 800;
                    color: #aaa;
                    margin-bottom: 10px;
                    display: block;
                    letter-spacing: 0.5px;
                }
                .item-tag {
                    display: inline-block;
                    background: #f1f8f5;
                    border: 1px solid #e1eee8;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 12px;
                    color: #38996E;
                    margin-right: 6px;
                    margin-bottom: 6px;
                    font-weight: 500;
                }
                .item-tag b {
                    margin-left: 4px;
                    color: #2e7d32;
                }
                .price-info .mrp {
                    font-size: 13px;
                }
                .price-info .deal-price {
                    font-size: 28px;
                    font-weight: 900;
                    line-height: 1;
                }
                .savings-alert {
                    display: inline-block;
                    background: #e8f5e9;
                    color: #2e7d32;
                    padding: 2px 10px;
                    border-radius: 5px;
                    font-size: 11px;
                    font-weight: 800;
                    margin-top: 5px;
                }
                .btn-purchase {
                    padding: 12px 30px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(56, 153, 110, 0.2);
                }
                .btn-purchase:hover {
                    box-shadow: 0 8px 20px rgba(56, 153, 110, 0.4);
                    transform: translateY(-2px);
                }
                
                /* Loader Animation */
                .lds-ripple {
                    display: inline-block;
                    position: relative;
                    width: 80px;
                    height: 80px;
                }
                .lds-ripple div {
                    position: absolute;
                    border: 4px solid #38996E;
                    opacity: 1;
                    border-radius: 50%;
                    animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
                }
                .lds-ripple div:nth-child(2) {
                    animation-delay: -0.5s;
                }
                @keyframes lds-ripple {
                    0% {
                        top: 36px;
                        left: 36px;
                        width: 0;
                        height: 0;
                        opacity: 0;
                    }
                    4.9% {
                        top: 36px;
                        left: 36px;
                        width: 0;
                        height: 0;
                        opacity: 0;
                    }
                    5% {
                        top: 36px;
                        left: 36px;
                        width: 0;
                        height: 0;
                        opacity: 1;
                    }
                    100% {
                        top: 0px;
                        left: 0px;
                        width: 72px;
                        height: 72px;
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default ComboOffers;
