import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
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
    maxUsagePerOrder?: number;
    slug?: string;
    subtitle?: string;
    shortDescription?: string;
    productBadge?: string;
}

const ComboOffers: React.FC = () => {
    const navigate = useNavigate();
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    
    const [combos, setCombos] = useState<Combo[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(5000);
    const [sortOrder, setSortOrder] = useState('newest');

    const [cartItems, setCartItems] = useState<any[]>([]);

    const fetchCart = async () => {
        if (isUser) {
            try {
                const res = await userApiClient.get('/user/cart');
                if (res.data.success && res.data.data) {
                    setCartItems(res.data.data.products || []);
                }
            } catch (err) {}
        } else {
            const localCartStr = localStorage.getItem('offlineCart');
            if (localCartStr) {
                try {
                    setCartItems(JSON.parse(localCartStr));
                } catch (err) {
                    setCartItems([]);
                }
            } else {
                setCartItems([]);
            }
        }
    };

    useEffect(() => {
        fetchCart();
        
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'offlineCart') fetchCart();
        };
        const handleCustomUpdate = () => fetchCart();
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('cart-updated', handleCustomUpdate);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cart-updated', handleCustomUpdate);
        };
    }, [isUser]);

    const getComboSetsInCart = (combo: Combo) => {
        if (!combo.products || combo.products.length === 0) return 0;
        let sets = Infinity;
        combo.products.forEach(cp => {
            const reqQty = cp.requiredQuantity || cp.quantity || 1;
            const cartItem = cartItems.find((ci: any) => {
                const id = typeof ci.product === 'string' ? ci.product : ci.product?._id;
                return id === cp.productId?._id;
            });
            const cartQty = cartItem ? cartItem.quantity : 0;
            sets = Math.min(sets, Math.floor(cartQty / reqQty));
        });
        return sets === Infinity ? 0 : sets;
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchCombos();
    }, [selectedCategories, sortOrder]);

    const fetchCombos = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategories.length > 0) {
                selectedCategories.forEach(id => params.append('categoryIds', id));
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

    const handleAddToCart = async (combo: Combo, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!combo.products || combo.products.length === 0) return;

        if (combo.maxUsagePerOrder && combo.maxUsagePerOrder > 0) {
            const currentSets = getComboSetsInCart(combo);
            if (currentSets >= combo.maxUsagePerOrder) {
                toast.warning(`Maximum ${combo.maxUsagePerOrder} combos per order. You’ve already reached the limit for this offer.`);
                return;
            }
        }

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

    const filteredCombos = combos.filter(combo => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchName = combo.offerName.toLowerCase().includes(query);
            const matchProduct = combo.products.some(p => p.productId?.productName.toLowerCase().includes(query));
            if (!matchName && !matchProduct) return false;
        }
        if (combo.comboPrice < priceMin || combo.comboPrice > priceMax) {
            return false;
        }
        return true;
    });

    return (
        <div className="page-content bg-white combo-offers-page">
            
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
                                        {(selectedCategories.length > 0 || searchQuery || priceMin > 0 || priceMax < 5000) && (
                                            <button 
                                                className="btn btn-sm btn-danger rounded-pill px-3 py-1 text-white"
                                                onClick={() => { setSelectedCategories([]); setSearchQuery(''); setPriceMin(0); setPriceMax(5000); }}
                                                style={{ fontSize: '11px', fontWeight: 'bold' }}
                                            >
                                                RESET ALL
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="filter-group m-b35">
                                        <h6 className="filter-title m-b20">Search Combo</h6>
                                        <div className="input-group search-bx">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Combo"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
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
                                        <h6 className="filter-title m-b20">Price Range</h6>
                                        <div className="price-slide">
                                            <div style={{ padding: '8px 0' }}>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={5000}
                                                    step={50}
                                                    value={priceMin}
                                                    onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                                                    style={{ width: '100%', accentColor: '#38996E' }}
                                                />
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={5000}
                                                    step={50}
                                                    value={priceMax}
                                                    onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 100))}
                                                    style={{ width: '100%', accentColor: '#38996E', marginTop: '8px' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginTop: '4px' }}>
                                                <span>Min: ₹{priceMin}</span>
                                                <span>Max: ₹{priceMax}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* Main Grid */}
                        <div className="col-xl-9 col-lg-8">
                            <div className="combo-sort-bar d-flex justify-content-between align-items-center m-b30">
                                <div className="result-info">
                                    <p className="mb-0 text-muted">Found <span className="text-primary fw-bold">{filteredCombos.length}</span> active bundles</p>
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
                                    {filteredCombos.length > 0 ? filteredCombos.map((combo) => (
                                        <div key={combo._id} className="col-xl-6 col-md-12 m-b40">
                                            <div className="premium-combo-card h-100 shadow-sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/combo-offers/${combo.slug || combo._id}`)}>
                                                <div className="card-top">
                                                    <img src={combo.imageUrl} alt={combo.offerName} className="card-image" />
                                                    {combo.productBadge && (
                                                        <div className="badge-float" style={{ left: '15px', right: 'auto' }}>
                                                            <div className="badge-inner-rect" style={{ background: '#38996E', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                                {combo.productBadge}
                                                            </div>
                                                        </div>
                                                    )}
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
                                                    <h4 className="combo-name mb-1">{combo.offerName}</h4>
                                                    {combo.subtitle && <p className="text-muted small mb-3">{combo.subtitle}</p>}
                                                    
                                                    <div className="contents-box mb-4">
                                                        <label>INCLUDES:</label>
                                                        <div className="tags-list">
                                                            {combo.products.map((p, i) => (
                                                                <span key={i} className="item-tag">
                                                                    {p.productId?.productName || 'Bundle Item'} <b>x{p.quantity || p.requiredQuantity}</b>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {(combo.maxUsagePerOrder ?? 0) > 0 && (
                                                            <div className="max-usage-alert mt-2" style={{fontSize: '13px', color: '#b91c1c', fontWeight: 600}}>
                                                                Max {combo.maxUsagePerOrder} combos per order
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="card-bottom border-top pt-3 d-flex justify-content-between align-items-center">
                                                        <div className="price-info">
                                                            <del className="mrp text-muted d-block">MRP ₹{combo.totalMRP}</del>
                                                            <div className="deal-price text-success">₹{combo.comboPrice}</div>
                                                            <div className="savings-alert">Save ₹{combo.savings}</div>
                                                        </div>
                                                        {((combo.maxUsagePerOrder ?? 0) > 0 && getComboSetsInCart(combo) >= combo.maxUsagePerOrder!) ? (
                                                            <button 
                                                                className="btn btn-secondary rounded-pill btn-purchase"
                                                                disabled
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Limit Reached
                                                            </button>
                                                        ) : (
                                                            <div className="d-flex flex-column gap-2 align-items-end">
                                                                <button 
                                                                    onClick={(e) => handleAddToCart(combo, e)}
                                                                    className="btn btn-primary rounded-pill btn-purchase"
                                                                >
                                                                    Grab Deal
                                                                </button>
                                                                <Link to={`/combo-offers/${combo.slug || combo._id}`} className="small text-primary fw-bold" onClick={(e) => e.stopPropagation()}>View Details <i className="fa-solid fa-arrow-right ms-1"></i></Link>
                                                            </div>
                                                        )}
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
                                                onClick={() => { setSelectedCategories([]); setSearchQuery(''); setPriceMin(0); setPriceMax(5000); }}
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

            <style>{`
                .combo-offers-page .sticky-top-custom {
                    position: sticky;
                    top: 100px;
                    z-index: 5;
                }
                .combo-offers-page .filter-title {
                    font-size: 14px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #222;
                    letter-spacing: 1px;
                    border-left: 3px solid #38996E;
                    padding-left: 10px;
                }
                
                /* Custom Checkbox UX */
                .combo-offers-page .custom-check-item {
                    position: relative;
                }
                .combo-offers-page .hidden-check {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                }
                .combo-offers-page .check-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }
                .combo-offers-page .check-box-ui {
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
                .combo-offers-page .hidden-check:checked + .check-label .check-box-ui {
                    background-color: #38996E;
                    border-color: #38996E;
                    color: white;
                }
                .combo-offers-page .hidden-check:checked + .check-label .text-name {
                    color: #38996E;
                    font-weight: 600;
                }
                .combo-offers-page .text-name {
                    font-size: 14px;
                    color: #555;
                    transition: all 0.2s;
                }
                .combo-offers-page .check-label:hover .check-box-ui {
                    background-color: #e8e8e8;
                }
                
                /* Sorting Bar */
                .combo-offers-page .combo-sort-bar {
                    background: #fff;
                    padding: 15px 25px;
                    border-radius: 15px;
                    border: 1px solid #eee;
                }
                .combo-offers-page .combo-select {
                    width: 200px;
                    border-radius: 30px;
                    height: 40px;
                    padding: 0 20px;
                    border-color: #ddd;
                    font-size: 14px;
                    cursor: pointer;
                }
                
                /* Premium Card */
                .combo-offers-page .premium-combo-card {
                    background: #fff;
                    border-radius: 20px;
                    overflow: hidden;
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid #f0f0f0;
                }
                .combo-offers-page .premium-combo-card:hover {
                    transform: scale(1.02);
                }
                .combo-offers-page .card-top {
                    height: 250px;
                    position: relative;
                    background: #f8f8f8;
                }
                .combo-offers-page .card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .combo-offers-page .badge-float {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    z-index: 2;
                }
                .combo-offers-page .badge-inner {
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
                .combo-offers-page .badge-inner .val {
                    font-size: 16px;
                    font-weight: 900;
                    line-height: 1;
                }
                .combo-offers-page .badge-inner .lab {
                    font-size: 10px;
                    font-weight: 700;
                }
                .combo-offers-page .combo-name {
                    font-size: 20px;
                    font-weight: 800;
                    color: #333;
                    text-transform: capitalize;
                }
                .combo-offers-page .contents-box label {
                    font-size: 11px;
                    font-weight: 800;
                    color: #aaa;
                    margin-bottom: 10px;
                    display: block;
                    letter-spacing: 0.5px;
                }
                .combo-offers-page .item-tag {
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
                .combo-offers-page .item-tag b {
                    margin-left: 4px;
                    color: #2e7d32;
                }
                .combo-offers-page .price-info .mrp {
                    font-size: 13px;
                }
                .combo-offers-page .price-info .deal-price {
                    font-size: 28px;
                    font-weight: 900;
                    line-height: 1;
                }
                .combo-offers-page .savings-alert {
                    display: inline-block;
                    background: #e8f5e9;
                    color: #2e7d32;
                    padding: 2px 10px;
                    border-radius: 5px;
                    font-size: 11px;
                    font-weight: 800;
                    margin-top: 5px;
                }
                .combo-offers-page .btn-purchase {
                    padding: 12px 30px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(56, 153, 110, 0.2);
                }
                .combo-offers-page .btn-purchase:hover {
                    box-shadow: 0 8px 20px rgba(56, 153, 110, 0.4);
                    transform: translateY(-2px);
                }
                
                /* Loader Animation */
                .combo-offers-page .lds-ripple {
                    display: inline-block;
                    position: relative;
                    width: 80px;
                    height: 80px;
                }
                .combo-offers-page .lds-ripple div {
                    position: absolute;
                    border: 4px solid #38996E;
                    opacity: 1;
                    border-radius: 50%;
                    animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
                }
                .combo-offers-page .lds-ripple div:nth-child(2) {
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
