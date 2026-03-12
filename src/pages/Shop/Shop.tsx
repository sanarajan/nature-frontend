import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

// Asset Imports
import bg1 from '../../assets/images/background/bg1.jpg';
import product1 from '../../assets/images/shop/product/1.png';

// Star rating renderer
const StarRating = ({ count }: { count: number }) => (
    <ul className="dz-rating" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0, gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className={i <= count ? 'star-fill' : ''} style={{ display: 'inline-flex' }}>
                {i <= count ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC107" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                )}
            </li>
        ))}
    </ul>
);

// Heart / bookmark SVG
const HeartSVG = ({ filled }: { filled?: boolean }) => (
    <svg width="20" height="21" viewBox="0 0 20 21" fill={filled ? "#DC3545" : "none"} xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd"
            d="M2.39387 10.053C1.49971 7.2613 2.54471 4.07046 5.47554 3.1263C7.01721 2.6288 8.71887 2.92213 10.0005 3.8863C11.213 2.9488 12.9772 2.63213 14.5172 3.1263C17.448 4.07046 18.4997 7.2613 17.6064 10.053C16.2147 14.478 10.0005 17.8863 10.0005 17.8863C10.0005 17.8863 3.83221 14.5296 2.39387 10.053Z"
            stroke={filled ? "#DC3545" : "black"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Cart basket SVG
const CartBasketSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 9.24995H18.401L14.624 3.58395C14.394 3.23895 13.927 3.14495 13.584 3.37595C13.239 3.60595 13.146 4.07095 13.376 4.41595L16.599 9.24995H7.401L10.624 4.41595C10.854 4.07095 10.761 3.60595 10.416 3.37595C10.071 3.14595 9.606 3.23895 9.376 3.58395L5.599 9.24995H3C2.586 9.24995 2.25 9.58595 2.25 9.99995C2.25 10.4139 2.586 10.7499 3 10.7499H3.385L4.943 18.5389C5.199 19.8199 6.333 20.7499 7.64 20.7499H16.361C17.668 20.7499 18.801 19.8199 19.058 18.5389L20.616 10.7499H21.001C21.415 10.7499 21.751 10.4139 21.751 9.99995C21.751 9.58595 21.414 9.24995 21 9.24995ZM17.586 18.245C17.469 18.827 16.954 19.2499 16.36 19.2499H7.64C7.046 19.2499 6.531 18.827 6.414 18.245L4.915 10.7499H19.085L17.586 18.245Z" fill="white" />
        <path d="M14.75 14V16C14.75 16.414 14.414 16.75 14 16.75C13.586 16.75 13.25 16.414 13.25 16V14C13.25 13.586 13.586 13.25 14 13.25C14.414 13.25 14.75 13.586 14.75 14ZM10 13.25C9.586 13.25 9.25 13.586 9.25 14V16C9.25 16.414 9.586 16.75 10 16.75C10.414 16.75 10.75 16.414 10.75 16V14C10.75 13.586 10.414 13.25 10 13.25Z" fill="white" />
    </svg>
);

// ── Product type ──────────────────────────────────────────────
interface Product {
    _id: string;
    productName: string;
    sku: string;
    price: number;
    images: string[];
    featured?: boolean;
    isPopular?: boolean;
    isTrending?: boolean;
    isBestSeller?: boolean;
    specifications?: Record<string, string>;
    categoryId?: { _id: string; categoryName: string };
    subcategoryId?: { _id: string; subcategoryName: string };
}

// ── Quick View Modal ──────────────────────────────────────────
const QuickViewModal = ({ prod, onClose, inWishlist, onToggleWishlist, handleAddToCart }: { prod: Product; onClose: () => void; inWishlist: boolean; onToggleWishlist: (p: Product, redirect?: boolean) => void; handleAddToCart: (prod: Product, quantity?: number, redirect?: boolean) => void }) => {
    const [qty, setQty] = useState(1);
    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{ background: '#fff', width: '96vw', maxWidth: '1100px', height: '100vh', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', display: 'flex', overflow: 'hidden' }}>
                <button onClick={onClose} aria-label="Close"
                    style={{ position: 'absolute', top: '14px', right: '18px', background: 'none', border: 'none', fontSize: '28px', lineHeight: 1, cursor: 'pointer', color: '#222', zIndex: 20, fontWeight: 300 }}>
                    ×
                </button>

                <div style={{ flex: '0 0 48%', background: '#f2f2f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 32px', position: 'relative', overflow: 'hidden' }}>
                    {/* Badges in Quick View */}
                    {(prod.featured || prod.isBestSeller || prod.isPopular || prod.isTrending) && (
                        <div className="shop-badge-wrap" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {prod.featured && <span className="shop-featured-badge" style={{ display: 'inline-block', background: '#FFC107', color: '#000', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>FEATURED</span>}
                            {prod.isBestSeller && <span className="shop-offer-badge" style={{ display: 'inline-block', background: '#38996E', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>BEST SELLER</span>}
                            {prod.isPopular && <span className="shop-offer-badge" style={{ display: 'inline-block', background: '#0D6EFD', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>POPULAR</span>}
                            {prod.isTrending && <span className="shop-offer-badge" style={{ display: 'inline-block', background: '#DC3545', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>TRENDING</span>}
                        </div>
                    )}
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.5s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.5)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
                        <img src={prod.images && prod.images.length > 0 ? prod.images[0] : product1} alt={prod.productName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                </div>

                <div style={{ flex: 1, padding: '28px 36px 24px 40px', display: 'flex', flexDirection: 'column', gap: '9px', overflowY: 'auto', borderLeft: '1px solid #e8e8e8' }}>
                    <h2 style={{ margin: 0, fontSize: '42px', fontWeight: 400, lineHeight: 1.2, color: '#1a1a1a' }}>{prod.productName}</h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StarRating count={4} />
                        <span style={{ color: '#444', fontSize: '14px' }}>4.7 Rating</span>
                        <span style={{ color: '#888', fontSize: '14px' }}>(150 customer reviews)</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '15px', color: '#555', lineHeight: '1.6' }}>
                        High quality product from Naturalayam.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '60px', marginTop: '10px' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>Price</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                <span style={{ fontSize: '32px', fontWeight: 400, color: '#1a1a1a' }}>₹{prod.price}</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>Quantity</div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '38px', height: '38px', border: '1px solid #333', background: '#333', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>−</button>
                                <span style={{ width: '42px', height: '38px', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{qty}</span>
                                <button onClick={() => setQty(q => q + 1)} style={{ width: '38px', height: '38px', border: '1px solid #333', background: '#333', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>+</button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                        <button
                            onClick={() => { handleAddToCart(prod, qty, true); onClose(); }}
                            style={{ background: '#222', color: '#fff', border: 'none', padding: '14px 40px', fontSize: '14px', fontWeight: 700, borderRadius: '2px', cursor: 'pointer' }}>ADD TO CART</button>
                        <button
                            onClick={() => onToggleWishlist(prod, false)}
                            style={{ background: '#fff', color: '#222', border: '1px solid #222', padding: '14px 20px', fontSize: '14px', fontWeight: 700, borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <HeartSVG filled={inWishlist} />
                            {inWishlist ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
                        </button>
                    </div>

                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '15px', color: '#1a1a1a', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div><strong style={{ fontWeight: 600 }}>SKU:</strong>&nbsp; <span style={{ color: '#555' }}>{prod.sku}</span></div>
                        <div><strong style={{ fontWeight: 600 }}>Category:</strong>&nbsp; <span style={{ color: '#555' }}>{prod.categoryId?.categoryName}</span></div>
                        {prod.subcategoryId && (
                            <div><strong style={{ fontWeight: 600 }}>Subcategory:</strong>&nbsp; <span style={{ color: '#555' }}>{prod.subcategoryId.subcategoryName}</span></div>
                        )}
                        {prod.specifications && Object.entries(prod.specifications).length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <strong style={{ fontWeight: 600 }}>Specifications:</strong>
                                <ul style={{ margin: '5px 0 0 20px', padding: 0, fontSize: '14px', color: '#555', listStyleType: 'disc' }}>
                                    {Object.entries(prod.specifications).map(([key, val]) => (
                                        <li key={key} style={{ marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 600 }}>{key}:</span> {val}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

const Shop: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'list' | 'column' | 'grid'>('grid');
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(2000);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [hierarchies, setHierarchies] = useState<any[]>([]);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
    const [activeSubcategoryIds, setActiveSubcategoryIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [expandedCats, setExpandedCats] = useState<string[]>([]);

    const isAuthenticated = useSelector((state: RootState) => state.auth.user.isAuthenticated);
    // Ensure we only treat them as a "user" if they actually have a user token.
    // If an Admin is logged in, isAuthenticated is true, but they don't have a user token.
    const isUser = isAuthenticated && !!localStorage.getItem('user_accessToken');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await userApiClient.get('/user/categories/hierarchy');
                if (res.data.success) {
                    setHierarchies(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isUser) {
            const fetchWishlist = async () => {
                try {
                    const res = await userApiClient.get('/user/wishlist');
                    if (res.data.success) {
                        setWishlist(res.data.data.map((p: any) => p._id));
                    }
                } catch (err) {
                    console.error('Error fetching wishlist:', err);
                }
            };
            fetchWishlist();
        } else {
            // Load from localStorage for guests (or Admins acting as guests)
            const localWishlistStr = localStorage.getItem('offlineWishlist');
            if (localWishlistStr) {
                try {
                    const localItems = JSON.parse(localWishlistStr);
                    // the local storage will store full product objects so we map to _id
                    setWishlist(localItems.map((p: any) => p._id));
                } catch (err) {
                    console.error('Error parsing local wishlist:', err);
                }
            } else {
                setWishlist([]);
            }
        }
    }, [isUser]);

    const handleToggleWishlist = async (prod: Product, redirect: boolean = false) => {
        if (isUser) {
            try {
                const res = await userApiClient.post('/user/wishlist/toggle', { productId: prod._id });
                if (res.data.success) {
                    if (res.data.action === 'added') {
                        setWishlist(prev => [...prev, prod._id]);
                        toast.success('Added to wishlist');
                    } else {
                        setWishlist(prev => prev.filter(id => id !== prod._id));
                        toast.info('Removed from wishlist');
                    }
                    window.dispatchEvent(new Event('wishlist-updated'));
                }
            } catch (err: any) {
                toast.error('Failed to update wishlist');
                return;
            }
        } else {
            // Offline logic
            const localWishlistStr = localStorage.getItem('offlineWishlist');
            let offlineItems: Product[] = [];
            if (localWishlistStr) {
                try {
                    offlineItems = JSON.parse(localWishlistStr);
                } catch (err) {
                    offlineItems = [];
                }
            }

            const exists = offlineItems.find(p => p._id === prod._id);
            if (exists) {
                offlineItems = offlineItems.filter(p => p._id !== prod._id);
                setWishlist(prev => prev.filter(id => id !== prod._id));
                toast.info('Removed from offline wishlist');
            } else {
                offlineItems.push(prod);
                setWishlist(prev => [...prev, prod._id]);
                toast.success('Added to offline wishlist. Login to save permanently.');
            }
            localStorage.setItem('offlineWishlist', JSON.stringify(offlineItems));
            window.dispatchEvent(new Event('wishlist-updated'));
        }

        if (redirect) {
            navigate('/wishlist');
        }
    };

    const handleAddToCart = async (prod: Product, quantity: number = 1, redirect: boolean = false) => {
        if (isUser) {
            try {
                const res = await userApiClient.post('/user/cart/toggle', { productId: prod._id, quantity });
                if (res.data.success) {
                    toast.success('Added to cart');
                    window.dispatchEvent(new Event('cart-updated'));
                }
            } catch (err: any) {
                toast.error('Failed to update cart');
                return;
            }
        } else {
            // Offline logic
            const localCartStr = localStorage.getItem('offlineCart');
            let offlineItems: any[] = [];
            if (localCartStr) {
                try {
                    offlineItems = JSON.parse(localCartStr);
                } catch (err) {
                    offlineItems = [];
                }
            }

            const existsIndex = offlineItems.findIndex(p => p.product._id === prod._id);
            if (existsIndex > -1) {
                offlineItems[existsIndex].quantity += quantity;
                toast.success('Cart updated');
            } else {
                offlineItems.push({ product: prod, quantity });
                toast.success('Added to offline cart. Login to save permanently.');
            }
            localStorage.setItem('offlineCart', JSON.stringify(offlineItems));
            window.dispatchEvent(new Event('cart-updated'));
        }

        if (redirect) {
            navigate('/shop-cart');
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            const loadStart = performance.now();
            setLoading(true);
            try {
                const params: any = {
                    minPrice: priceMin,
                    maxPrice: priceMax,
                    sort: sortBy
                };
                if (activeCategoryIds.length > 0) params.categoryId = activeCategoryIds.join(',');
                if (activeSubcategoryIds.length > 0) params.subcategoryId = activeSubcategoryIds.join(',');
                if (searchQuery) params.search = searchQuery;

                const res = await userApiClient.get('/user/products', { params });
                if (res.data.success) {
                    setProducts(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                const loadMs = Math.round(performance.now() - loadStart);
                console.log("Products page load time (ms):", loadMs);
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [activeCategoryIds, activeSubcategoryIds, searchQuery, priceMin, priceMax, sortBy]);

    const handleCategoryToggle = (catId: string, subcategories: any[]) => {
        const subIds = subcategories.map(s => s._id);

        // Determine current selected state synchronously based on existing state variables
        const isCatSelected = subcategories.length > 0
            ? subIds.every(id => activeSubcategoryIds.includes(id))
            : activeCategoryIds.includes(catId);

        if (isCatSelected) {
            // Uncheck category and all its subcategories
            setActiveCategoryIds(prev => prev.filter(id => id !== catId));
            setActiveSubcategoryIds(prev => prev.filter(id => !subIds.includes(id)));
        } else {
            // Check category and all its subcategories
            setActiveCategoryIds(prev => prev.includes(catId) ? prev : [...prev, catId]);
            setActiveSubcategoryIds(prev => [...new Set([...prev, ...subIds])]);
            setExpandedCats(prev => prev.includes(catId) ? prev : [...prev, catId]);
        }
    };

    const handleSubcategoryToggle = (subId: string, parentCatId: string, allSubIds: string[]) => {
        setActiveSubcategoryIds(prev => {
            if (prev.includes(subId)) {
                // If we are unchecking, we might need to uncheck the parent category as well
                setActiveCategoryIds(catPrev => catPrev.filter(id => id !== parentCatId));
                return prev.filter(id => id !== subId);
            } else {
                // If we are checking, check if all siblings are now checked to auto-check parent
                const newPrev = [...prev, subId];
                const allSelected = allSubIds.every(id => newPrev.includes(id));
                if (allSelected) {
                    setActiveCategoryIds(catPrev => [...catPrev, parentCatId]);
                }
                return newPrev;
            }
        });
    };

    const toggleCatExpand = (catId: string) => {
        setExpandedCats(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
    };

    const handleReset = () => {
        setActiveCategoryIds([]);
        setActiveSubcategoryIds([]);
        setSearchQuery('');
        setPriceMin(0);
        setPriceMax(2000);
        setSortBy('newest');
        setExpandedCats([]);
    };

    return (
        <>
            {quickViewProduct && (
                <QuickViewModal
                    prod={quickViewProduct}
                    onClose={() => setQuickViewProduct(null)}
                    inWishlist={wishlist.includes(quickViewProduct._id)}
                    onToggleWishlist={handleToggleWishlist}
                    handleAddToCart={handleAddToCart}
                />
            )}
            <div className="dz-bnr-inr" style={{ backgroundImage: `url(${bg1})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Shop Standard</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/"> Home</Link></li>
                                <li className="breadcrumb-item">Shop</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <section className="content-inner-1 pt-3 z-index-unset bg-light">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12 col-xl-3">
                            <div className="sticky-xl-top">
                                <div className="shop-filter mt-xl-2 mt-0">
                                    <aside>
                                        <div className="d-flex align-items-center justify-content-between m-b30">
                                            <h6 className="title mb-0 fw-normal d-flex">Filters</h6>
                                        </div>

                                        <div className="widget widget_search">
                                            <div className="form-group">
                                                <div className="input-group search-bx">
                                                    <input
                                                        type="search"
                                                        className="form-control"
                                                        placeholder="Search Product"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                    <div className="input-group-btn">
                                                        <button type="submit" className="btn btn-secondary"><i className="flaticon-loupe"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="widget widget_who">
                                            <h6 className="widget-title">Quick Filters</h6>
                                            <ul>
                                                <li className="cat-item">
                                                    <div className="custom-control custom-checkbox d-flex" onClick={handleReset} style={{ cursor: 'pointer' }}>
                                                        <span style={{ fontSize: '14px', color: '#555' }}>Show All</span>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="widget widget_price">
                                            <h6 className="widget-title">Price Range</h6>
                                            <div className="price-slide">
                                                <div style={{ padding: '8px 0' }}>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={2000}
                                                        step={50}
                                                        value={priceMin}
                                                        onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                                                        style={{ width: '100%', accentColor: '#38996E' }}
                                                    />
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={2000}
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

                                        <div className="widget widget_categories">
                                            <h6 className="widget-title">Category</h6>
                                            <ul>
                                                {hierarchies.map((cat) => {
                                                    const subIds = cat.subcategories.map((s: any) => s._id);
                                                    // A category is considered selected if it has subcategories and ALL of them are selected,
                                                    // or if it has NO subcategories and its ID is in activeCategoryIds.
                                                    const isCatSelected = cat.subcategories.length > 0
                                                        ? subIds.every((id: string) => activeSubcategoryIds.includes(id))
                                                        : activeCategoryIds.includes(cat._id);

                                                    const isCatExpanded = expandedCats.includes(cat._id);
                                                    return (
                                                        <li key={cat._id} className="cat-item" style={{ marginBottom: '10px' }}>
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div className="custom-control custom-checkbox d-flex align-items-center"
                                                                    onClick={() => handleCategoryToggle(cat._id, cat.subcategories)}
                                                                    style={{ cursor: 'pointer', flex: 1 }}>
                                                                    <div className={`form-check-input square ${isCatSelected ? 'checked' : ''}`}
                                                                        style={{ width: '16px', height: '16px', border: '1px solid #ccc', marginRight: '10px', backgroundColor: isCatSelected ? '#38996E' : 'transparent' }}></div>
                                                                    <label className={`form-check-label text-start ${isCatSelected ? 'fw-bold text-primary' : ''}`} style={{ cursor: 'pointer', margin: 0 }}>{cat.categoryName}</label>
                                                                </div>
                                                                {cat.subcategories.length > 0 && (
                                                                    <button onClick={(e) => { e.stopPropagation(); toggleCatExpand(cat._id); }}
                                                                        style={{ border: 'none', background: 'none', padding: '0 5px' }}>
                                                                        <i className={`fa-solid ${isCatExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '12px' }}></i>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {isCatExpanded && cat.subcategories.length > 0 && (
                                                                <ul style={{ paddingLeft: '26px', marginTop: '8px', listStyle: 'none' }}>
                                                                    {cat.subcategories.map((sub: any) => {
                                                                        const isSubSelected = activeSubcategoryIds.includes(sub._id);
                                                                        return (
                                                                            <li key={sub._id} style={{ marginBottom: '6px' }}>
                                                                                <div className="custom-control custom-checkbox d-flex align-items-center"
                                                                                    onClick={(e) => { e.stopPropagation(); handleSubcategoryToggle(sub._id, cat._id, subIds); }}
                                                                                    style={{ cursor: 'pointer' }}>
                                                                                    <div className={`form-check-input square ${isSubSelected ? 'checked' : ''}`}
                                                                                        style={{ width: '14px', height: '14px', border: '1px solid #ccc', marginRight: '8px', borderRadius: '50%', backgroundColor: isSubSelected ? '#38996E' : 'transparent' }}></div>
                                                                                    <span style={{ fontSize: '13px', color: isSubSelected ? '#38996E' : '#666', fontWeight: isSubSelected ? 600 : 400 }}>{sub.subcategoryName}</span>
                                                                                </div>
                                                                            </li>
                                                                        )
                                                                    })}
                                                                </ul>
                                                            )}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>

                                        <button className="btn btn-lg font-14 btn-secondary btn-sharp w-100" onClick={handleReset}>RESET ALL FILTERS</button>
                                    </aside>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-xl-9">
                            <div className="filter-wrapper">
                                <div className="filter-left-area">
                                    <span>Showing 1–{products.length} Results</span>
                                </div>
                                <div className="filter-right-area">
                                    <div className="form-group border-0">
                                        <select className="form-select default-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                            <option value="newest">Newest First</option>
                                            <option value="price-low-high">Price: Low to High</option>
                                            <option value="price-high-low">Price: High to Low</option>
                                        </select>
                                    </div>
                                    <div className="form-group Category">
                                        <select className="form-select default-select"
                                            value={activeCategoryIds.length === 1 ? activeCategoryIds[0] : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveCategoryIds(val ? [val] : []);
                                                setActiveSubcategoryIds([]);
                                            }}>
                                            <option value="">All Categories</option>
                                            {hierarchies.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="shop-tab">
                                        <ul className="nav" role="tablist" id="dz-shop-tab">
                                            <li className="nav-item">
                                                <a href="javascript:void(0);" className={`nav-link${viewMode === 'list' ? ' active' : ''}`}
                                                    onClick={() => setViewMode('list')}>
                                                    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8H5V13H0V8ZM20 8H6.67V13H20V8ZM6.67 6.33H20V4.67C20 3.29 18.88 2.17 17.5 2.17H6.67V6.33ZM5 6.33V2.17H2.5C1.12 2.17 0 3.29 0 4.67V6.33H5ZM6.67 14.67V18.83H20V14.67H6.67ZM5 14.67H0V18.83H5V14.67Z" fill="currentColor" /></svg>
                                                </a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="javascript:void(0);" className={`nav-link${viewMode === 'column' ? ' active' : ''}`}
                                                    onClick={() => setViewMode('column')}>
                                                    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.33 0.5H5.83C7.67 0.5 9.17 2 9.17 3.83V6.33C9.17 8.17 7.67 9.67 5.83 9.67H3.33C1.49 9.67 0 8.17 0 6.33V3.83C0 2 1.49 0.5 3.33 0.5ZM14.17 0.5H16.67C18.51 0.5 20 2 20 3.83V6.33C20 8.17 18.51 9.67 16.67 9.67H14.17C12.33 9.67 10.83 8.17 10.83 6.33V3.83C10.83 2 12.33 0.5 14.17 0.5ZM3.33 11.33H5.83C7.67 11.33 9.17 12.83 9.17 14.67V17.17C9.17 19.01 7.67 20.5 5.83 20.5H3.33C1.49 20.5 0 19.01 0 17.17V14.67C0 12.83 1.49 11.33 3.33 11.33ZM14.17 11.33H16.67C18.51 11.33 20 12.83 20 14.67V17.17C20 19.01 18.51 20.5 16.67 20.5H14.17C12.33 20.5 10.83 19.01 10.83 17.17V14.67C10.83 12.83 12.33 11.33 14.17 11.33Z" fill="currentColor" /></svg>
                                                </a>
                                            </li>
                                            <li className="nav-item">
                                                <a href="javascript:void(0);" className={`nav-link${viewMode === 'grid' ? ' active' : ''}`}
                                                    onClick={() => setViewMode('grid')}>
                                                    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.17 0.5H0.83C0.37 0.5 0 0.87 0 1.33V4.67C0 5.13 0.37 5.5 0.83 5.5H4.17C4.63 5.5 5 5.13 5 4.67V1.33C5 0.87 4.63 0.5 4.17 0.5ZM4.17 8H0.83C0.37 8 0 8.37 0 8.83V12.17C0 12.63 0.37 13 0.83 13H4.17C4.63 13 5 12.63 5 12.17V8.83C5 8.37 4.63 8 4.17 8ZM4.17 15.5H0.83C0.37 15.5 0 15.87 0 16.33V19.67C0 20.13 0.37 20.5 0.83 20.5H4.17C4.63 20.5 5 20.13 5 19.67V16.33C5 15.87 4.63 15.5 4.17 15.5ZM11.67 0.5H8.33C7.87 0.5 7.5 0.87 7.5 1.33V4.67C7.5 5.13 7.87 5.5 8.33 5.5H11.67C12.13 5.5 12.5 5.13 12.5 4.67V1.33C12.5 0.87 12.13 0.5 11.67 0.5ZM11.67 8H8.33C7.87 8 7.5 8.37 7.5 8.83V12.17C7.5 12.63 7.87 13 8.33 13H11.67C12.13 13 12.5 12.63 12.5 12.17V8.83C12.5 8.37 12.13 8 11.67 8ZM11.67 15.5H8.33C7.87 15.5 7.5 15.87 7.5 16.33V19.67C7.5 20.13 7.87 20.5 8.33 20.5H11.67C12.13 20.5 12.5 20.13 12.5 19.67V16.33C12.5 15.87 12.13 15.5 11.67 15.5ZM19.17 0.5H15.83C15.37 0.5 15 0.87 15 1.33V4.67C15 5.13 15.37 5.5 15.83 5.5H19.17C19.63 5.5 20 5.13 20 4.67V1.33C20 0.87 19.63 0.5 19.17 0.5ZM19.17 8H15.83C15.37 8 15 8.37 15 8.83V12.17C15 12.63 15.37 13 15.83 13H19.17C19.63 13 20 12.63 20 12.17V8.83C20 8.37 19.63 8 19.17 8ZM19.17 15.5H15.83C15.37 15.5 15 15.87 15 16.33V19.67C15 20.13 15.37 20.5 15.83 20.5H19.17C19.63 20.5 20 20.13 20 19.67V16.33C20 15.87 19.63 15.5 19.17 15.5Z" fill="currentColor" /></svg>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Loading products...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center p-5">
                                    <h4>No products found</h4>
                                    <p>Try adjusting your filters or search query.</p>
                                    <button className="btn btn-secondary" onClick={handleReset}>Clear All Filters</button>
                                </div>
                            ) : (
                                <div className="row g-xl-4 g-3">
                                    {products.map((prod) => {
                                        const colClass = viewMode === 'list'
                                            ? 'col-12'
                                            : viewMode === 'column'
                                                ? 'col-12 col-xl-4 col-lg-4 col-md-6 col-sm-6'
                                                : 'col-12 col-xl-3 col-lg-4 col-md-6 col-sm-6';

                                        return (
                                            <div key={prod._id} className={colClass}>
                                                {viewMode === 'list' && (
                                                    <div className="dz-shop-card style-2">
                                                        <div className="dz-media media-overlay">
                                                            <img src={prod.images && prod.images.length > 0 ? prod.images[0] : product1} alt={prod.productName} />
                                                            {prod.featured && (
                                                                <div className="product-tag"><span className="badge badge-secondary">Featured</span></div>
                                                            )}
                                                        </div>
                                                        <div className="dz-content">
                                                            <div className="dz-header">
                                                                <div>
                                                                    <h4 className="title mb-0"><Link to={`/product/${prod._id}`}>{prod.productName}</Link></h4>
                                                                    <ul className="dz-tags"><li><a href="javascript:void(0);">{prod.categoryId?.categoryName}</a></li></ul>
                                                                </div>
                                                                <div className="review-num"><StarRating count={4} /><span> 150 Review</span></div>
                                                            </div>
                                                            <div className="dz-body">
                                                                <p className="dz-para">High quality ayurvedic product from Naturalayam.</p>
                                                                <div className="rate">
                                                                    <div className="d-flex align-items-center mb-xl-3 mb-2">
                                                                        <div className="meta-content"><span className="price">₹{prod.price.toFixed(2)}</span></div>
                                                                    </div>
                                                                    <div className="d-flex">
                                                                        <Link to="#" onClick={(e) => { e.preventDefault(); handleAddToCart(prod, 1, true); }} className="btn btn-secondary btn-md btn-icon">Add to cart</Link>
                                                                        <div className="bookmark-btn style-1" onClick={() => handleToggleWishlist(prod)}>
                                                                            <input className="form-check-input" type="checkbox" id={`fav-${prod._id}`} checked={wishlist.includes(prod._id)} readOnly />
                                                                            <label className="form-check-label" htmlFor={`fav-${prod._id}`}><HeartSVG filled={wishlist.includes(prod._id)} /></label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {viewMode !== 'list' && (
                                                    <div className="shop-card">
                                                        <div className="dz-media media-overlay">
                                                            <img src={prod.images && prod.images.length > 0 ? prod.images[0] : product1} alt={prod.productName} />
                                                            {(prod.featured || prod.isBestSeller) && (
                                                                <div className="shop-badge-wrap">
                                                                    {prod.featured && <span className="shop-featured-badge">FEATURED</span>}
                                                                    {prod.isBestSeller && <span className="shop-offer-badge">BEST SELLER</span>}
                                                                </div>
                                                            )}
                                                            <div className="shop-meta">
                                                                <button className="btn btn-secondary btn-icon" onClick={() => setQuickViewProduct(prod)}>Quick View</button>
                                                                <button
                                                                    className="btn btn-primary meta-icon"
                                                                    onClick={(e) => { e.preventDefault(); handleToggleWishlist(prod); }}
                                                                >
                                                                    <HeartSVG filled={wishlist.includes(prod._id)} />
                                                                </button>
                                                                <Link to="#" onClick={(e) => { e.preventDefault(); handleAddToCart(prod, 1, true); }} className="btn btn-primary meta-icon dz-carticon"><i className="flaticon-shopping-cart-1"></i></Link>
                                                            </div>
                                                        </div>
                                                        <div className="dz-content">
                                                            <h5 className="title"><Link to={`/product/${prod._id}`}>{prod.productName}</Link></h5>
                                                            <h6 className="price">₹{prod.price.toFixed(2)}</h6>
                                                            <div className="shop-cart-btn"><Link to="#" onClick={(e) => { e.preventDefault(); handleAddToCart(prod, 1, true); }}><CartBasketSVG /></Link></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Shop;
