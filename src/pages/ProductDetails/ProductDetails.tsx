import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { handleAddToCartGlobal, handleToggleWishlistGlobal } from '../../utils/CartHelper';
import userApiClient from '../../services/userApiClient';

const ProductDetails: React.FC = () => {
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string>('');

    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await userApiClient.get(`/user/products/${id}`);
                if (response.data.success) {
                    setProduct(response.data.data);
                    if (response.data.data.images && response.data.data.images.length > 0) {
                        setSelectedImage(response.data.data.images[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
            window.scrollTo(0, 0);
        }
    }, [id]);

    useEffect(() => {
        if (product) {
            document.title = product.metaTitle || `${product.productName} | Naturalayam`;
            const desc = product.metaDescription || product.shortDescription;
            if (desc) {
                let metaDescription = document.querySelector('meta[name="description"]');
                if (!metaDescription) {
                    metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('name', 'description');
                    document.head.appendChild(metaDescription);
                }
                metaDescription.setAttribute('content', desc);
            }
        }
    }, [product]);

    if (loading) {
        return <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>;
    }

    if (!product) {
        return <div className="page-content text-center py-5">
            <h2>Product Not Found</h2>
            <Link to="/shop" className="btn btn-primary mt-3">Back to Shop</Link>
        </div>;
    }

    const handleAddToCart = () => {
        handleAddToCartGlobal(product, quantity, isUser, navigate, true);
    };

    const handleAddToWishlist = () => {
        handleToggleWishlistGlobal(product, isUser, navigate, false);
    };

    return (
        <div className="page-content" style={{ backgroundColor: '#f8fafc', padding: '40px 0' }}>
            <style>{`
                .custom-breadcrumb {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    text-align: left !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    gap: 0 !important;
                }
                .custom-breadcrumb .breadcrumb-item {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    line-height: normal !important;
                }
                .custom-breadcrumb .breadcrumb-item,
                .custom-breadcrumb .breadcrumb-item a,
                .custom-breadcrumb .breadcrumb-item span {
                    color: #4B5563 !important;
                    text-decoration: none;
                }
                .custom-breadcrumb .breadcrumb-item.active {
                    color: #1F2937 !important;
                    font-weight: 600 !important;
                }
                .custom-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
                    content: "|" !important;
                    color: #9CA3AF !important;

                    display: inline !important;
                    position: static !important;

                    height: auto !important;
                    min-height: 0 !important;

                    line-height: inherit !important;
                    vertical-align: baseline !important;

                    top: auto !important;
                    bottom: auto !important;

                    transform: none !important;
                    rotate: none !important;

                    float: none !important;

                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-style: normal !important;
                    font-weight: 400 !important;

                    padding: 0 7px !important;
                    margin: 0 !important;
                }
                .premium-product-card {
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    padding: 32px;
                }
                .product-image-container {
                    background-color: #f1f5f9;
                    border-radius: 12px;
                    height: 460px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    position: relative;
                }
                .product-main-image {
                    transition: transform 0.3s ease;
                }
                @media (min-width: 992px) {
                    .product-image-container:hover .product-main-image {
                        transform: scale(1.12);
                    }
                }
                .product-thumbnail {
                    width: 70px;
                    height: 70px;
                    border-radius: 8px;
                    border: 2px solid transparent;
                    cursor: pointer;
                    overflow: hidden;
                    background-color: #f1f5f9;
                    transition: all 0.2s;
                }
                .product-thumbnail:hover {
                    border-color: #94a3b8;
                }
                .product-thumbnail.active {
                    border-color: #166534;
                }
                .product-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 8px;
                }
                .product-short-desc {
                    font-size: 1.1rem;
                    color: #475569;
                    margin-bottom: 24px;
                    line-height: 1.5;
                }
                .price-container {
                    margin-bottom: 32px;
                }
                .price-main {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #166534;
                }
                .price-mrp {
                    font-size: 1.1rem;
                    color: #94a3b8;
                    text-decoration: line-through;
                    margin: 0 12px;
                }
                .price-discount {
                    background-color: #dcfce7;
                    color: #166534;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    font-weight: 600;
                }
                .action-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                    margin-bottom: 40px;
                }
                .qty-control {
                    display: flex;
                    align-items: center;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    height: 52px;
                    overflow: hidden;
                }
                .qty-btn {
                    background: none;
                    border: none;
                    width: 44px;
                    height: 100%;
                    font-size: 1.2rem;
                    color: #475569;
                    transition: background 0.2s;
                }
                .qty-btn:hover {
                    background-color: #f1f5f9;
                }
                .qty-input {
                    width: 50px;
                    text-align: center;
                    border: none;
                    font-weight: 600;
                    font-size: 1.1rem;
                }
                .qty-input:focus {
                    outline: none;
                }
                .btn-add-to-cart {
                    height: 52px;
                    padding: 0 40px;
                    background-color: #166534;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    transition: all 0.2s;
                }
                .btn-add-to-cart:hover {
                    background-color: #14532d;
                }
                .btn-wishlist {
                    width: 52px;
                    height: 52px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                    transition: all 0.2s;
                }
                .btn-wishlist:hover {
                    border-color: #166534;
                    color: #166534;
                }
                /* Accordion Styling */
                .custom-accordion .accordion-item {
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    margin-bottom: 12px;
                    background-color: #ffffff;
                    overflow: hidden;
                }
                .custom-accordion .accordion-button {
                    background-color: #ffffff;
                    color: #1e293b;
                    font-weight: 600;
                    font-size: 1.05rem;
                    padding: 16px 20px;
                    border: none;
                    box-shadow: none;
                }
                .custom-accordion .accordion-button:not(.collapsed) {
                    color: #166534;
                    background-color: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }
                .custom-accordion .accordion-body {
                    padding: 20px;
                    color: #475569;
                    line-height: 1.6;
                }
                .breadcrumb-subtle a {
                    color: #64748b;
                    text-decoration: none;
                }
                .breadcrumb-subtle a:hover {
                    color: #166534;
                }
                .breadcrumb-subtle .active {
                    color: #1e293b;
                }
                .content-card {
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }
                .section-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #166534;
                }
                /* Custom Table Styles */
                .ingredient-table {
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .ingredient-table thead th {
                    background-color: #166534;
                    color: #ffffff;
                    font-weight: 600;
                    border-bottom: none;
                    padding: 14px 16px;
                    vertical-align: middle;
                }
                .ingredient-table tbody td {
                    padding: 16px;
                    vertical-align: middle;
                    border-bottom: 1px solid #f1f5f9;
                }
                .ingredient-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .ingredient-table tbody tr:hover td {
                    background-color: #f8fafc;
                }
                .ing-name {
                    font-weight: 700;
                    color: #14532d;
                }
                .ing-botanical {
                    color: #64748b;
                    font-style: italic;
                    font-size: 0.95rem;
                }
                .ing-percentage-badge {
                    background-color: #ecfdf5;
                    color: #065f46;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    display: inline-block;
                    border: 1px solid #a7f3d0;
                }
                .ing-role {
                    background-color: #f0fdf4;
                    border-left: 3px solid #34d399;
                    padding: 8px 12px;
                    border-radius: 4px;
                    color: #1e293b;
                    font-size: 0.95rem;
                }
                .inline-ing-summary {
                    color: #166534;
                    font-weight: 600;
                    font-size: 0.95rem;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    margin-top: 12px;
                }
                .inline-ing-summary span.pct {
                    color: #65a30d;
                }
                .inline-ing-summary span.separator {
                    color: #cbd5e1;
                    font-weight: 400;
                }
                @media (max-width: 991px) {
                    .premium-product-card {
                        padding: 20px;
                        border-radius: 12px;
                    }
                    .product-image-container {
                        height: 380px;
                    }
                }
                @media (max-width: 767px) {
                    .product-title {
                        font-size: 1.5rem;
                    }
                    .action-row {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .btn-wishlist {
                        width: 100%;
                    }
                }
            `}</style>

            <div className="container">
                <div className="premium-product-card">
                    {/* Breadcrumb Row */}
                    <div className="row g-5" style={{ justifyContent: 'flex-start' }}>
                        <div className="col-12" style={{ textAlign: 'left', display: 'flex' }}>
                            <nav aria-label="breadcrumb" className="mb-3" style={{ textAlign: 'left', width: '100%' }}>
                                <ol className="breadcrumb custom-breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to="/">Home</Link>
                                    </li>
                                    {product.categoryId && product.categoryId.categoryName && (
                                        <li className="breadcrumb-item">
                                            <span>{product.categoryId.categoryName}</span>
                                        </li>
                                    )}
                                    {product.subcategoryId && product.subcategoryId.subcategoryName && (
                                        <li className="breadcrumb-item">
                                            <span>{product.subcategoryId.subcategoryName}</span>
                                        </li>
                                    )}
                                    <li className="breadcrumb-item active">
                                        {product.productName}
                                        {product.quantity && product.unitId ? ` ${product.quantity} ${product.unitId.unitName || product.unitId}` : ''}
                                    </li>
                                </ol>
                            </nav>
                        </div>
                    </div>

                    {/* Top 2-Column Area */}
                    <div className="row g-5">
                        {/* LEFT: Image */}
                        <div className="col-lg-5">
                            <div className="product-image-container">
                                {/* Highlights Overlay */}
                                {(product.featured || product.isBestSeller || product.isPopular || product.isTrending) && (
                                    <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {product.featured && <span style={{ display: 'inline-block', background: '#FFC107', color: '#000', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>FEATURED</span>}
                                        {product.isBestSeller && <span style={{ display: 'inline-block', background: '#38996E', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>BEST SELLER</span>}
                                        {product.isPopular && <span style={{ display: 'inline-block', background: '#0D6EFD', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>POPULAR</span>}
                                        {product.isTrending && <span style={{ display: 'inline-block', background: '#DC3545', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>TRENDING</span>}
                                    </div>
                                )}
                                <img 
                                    src={selectedImage || (product.images && product.images[0]) || 'https://via.placeholder.com/600x600?text=No+Image'} 
                                    alt={product.imageAltText || product.productName} 
                                    className="product-main-image"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '20px' }} 
                                />
                            </div>
                            {/* Thumbnails */}
                            {product.images && product.images.length > 1 && (
                                <div className="d-flex gap-2 mt-3 overflow-auto pb-2">
                                    {product.images.map((img: string, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className={`product-thumbnail ${selectedImage === img ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(img)}
                                        >
                                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} alt="thumb" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Info */}
                        <div className="col-lg-7 d-flex flex-column">
                            <div>
                                <h1 className="product-title">
                                    {product.productName}
                                    {product.quantity && product.unitId ? ` ${product.quantity} ${product.unitId.unitName || product.unitId}` : ''}
                                </h1>
                                 {/* Quick Key Ingredients */}
                                {product.keyIngredients && product.keyIngredients.length > 0 && (
                                    <div className="inline-ing-summary mb-4">
                                        {product.keyIngredients.slice(0, 5).map((ing: any, idx: number, arr: any[]) => (
                                            <React.Fragment key={idx}>
                                                <span>
                                                    {ing.name} 
                                                    {/* {ing.percentage && <span className="pct"> {ing.percentage}</span>} */}
                                                </span>
                                                {idx < arr.length - 1 && <span className="separator">|</span>}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                                {product.shortDescription && <p className="product-short-desc">{product.shortDescription}</p>}



                                <div className="mb-3">
                                    {product.stock > 10 ? (
                                        <div style={{ color: '#166534', fontWeight: 600, fontSize: '0.95rem' }}>
                                            <span style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: '4px' }}>&bull;</span> 
                                            In Stock &middot; {product.stock} available
                                        </div>
                                    ) : product.stock > 0 && product.stock <= 10 ? (
                                        <div style={{ color: '#d97706', fontWeight: 600, fontSize: '0.95rem' }}>
                                            <span style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: '4px' }}>&bull;</span> 
                                            Low Stock &middot; Only {product.stock} left
                                        </div>
                                    ) : (
                                        <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.95rem' }}>
                                            <span style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: '4px' }}>&bull;</span> 
                                            Out of Stock
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-3">
                                <div className="price-container">
                                <span className="price-main">₹{product.offerPrice ? product.offerPrice.toFixed(2) : product.price.toFixed(2)}</span>
                                {product.offerPrice && product.offerPrice < product.price && (
                                    <>
                                        <span className="price-mrp">MRP ₹{product.price.toFixed(2)}</span>
                                        <span className="price-discount">{Math.round(((product.price - product.offerPrice) / product.price) * 100)}% OFF</span>
                                    </>
                                )}
                                <div className="mt-1" style={{ fontSize: '0.85rem', color: '#64748b' }}>Inclusive of all taxes</div>
                            </div>

                            <div className="action-row">
                                <div className="qty-control">
                                    <button type="button" className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={product.stock <= 0}>-</button>
                                    <input type="number" className="qty-input" value={quantity} readOnly />
                                    <button type="button" className="qty-btn" onClick={() => setQuantity(quantity + 1)} disabled={product.stock <= 0 || quantity >= product.stock}>+</button>
                                </div>
                                <button 
                                    className="btn-add-to-cart flex-grow-1" 
                                    onClick={product.stock > 0 ? handleAddToCart : undefined}
                                    disabled={product.stock <= 0}
                                    style={product.stock <= 0 ? { backgroundColor: '#94a3b8', cursor: 'not-allowed' } : {}}
                                >
                                    {product.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
                                </button>
                                <button className="btn-wishlist" onClick={handleAddToWishlist}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </button>
                            </div>
                            </div>
                        </div>
                    </div>

                    {/* PRODUCT INFORMATION - FULL WIDTH */}
                    <div className="mt-5">
                        
                        {/* 1. Product Overview */}
                        {product.description && (
                            <div className="content-card mb-4">
                                <h4 className="section-title text-success mb-3">Product Overview</h4>
                                <div style={{ whiteSpace: 'pre-line', color: '#475569', lineHeight: 1.7 }}>
                                    {product.description}
                                </div>
                            </div>
                        )}

                        {/* 2 & 4. Key Benefits & Specifications */}
                        <div className="row g-4 mb-4">
                            {product.keyBenefits && product.keyBenefits.length > 0 && (
                                <div className="col-md-6">
                                    <div className="content-card h-100">
                                        <h4 className="section-title mb-3">Key Benefits</h4>
                                        <ul className="mb-0 ps-0 list-unstyled">
                                            {product.keyBenefits.map((ben: string, i: number) => (
                                                <li key={i} className="mb-3 d-flex align-items-start">
                                                    <span style={{ color: '#166534', marginRight: '10px', fontWeight: 'bold' }}>✓</span> 
                                                    <span style={{ color: '#475569', lineHeight: 1.5 }}>{ben}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {product.specifications && Object.keys(product.specifications).length > 0 && (
                                <div className="col-md-6">
                                    <div className="content-card h-100">
                                        <h4 className="section-title mb-3">Specifications</h4>
                                        <table className="table table-borderless table-sm mb-0">
                                            <tbody>
                                                {Object.entries(product.specifications).map(([key, val]: any, i: number) => (
                                                    <tr key={i} className="border-bottom">
                                                        <td className="ps-0 fw-bold text-dark py-2" style={{ width: '40%' }}>{key}</td>
                                                        <td className="py-2 text-muted">{val}</td>
                                                    </tr>
                                                ))}
                                                {product.sku && (
                                                    <tr>
                                                        <td className="ps-0 fw-bold text-dark py-2">SKU</td>
                                                        <td className="py-2 text-muted">{product.sku}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 5 & 7. How To Use & Suitable For */}
                        <div className="row g-4 mb-4">
                            {product.howToUse && (
                                <div className="col-md-6">
                                    <div className="content-card h-100">
                                        <h4 className="section-title mb-3">How To Use</h4>
                                        <div style={{ whiteSpace: 'pre-line', color: '#475569', lineHeight: 1.6 }}>
                                            {product.howToUse}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {product.suitableFor && (
                                <div className="col-md-6">
                                    <div className="content-card h-100">
                                        <h4 className="section-title mb-3">Who It Is Suitable For</h4>
                                        <div style={{ whiteSpace: 'pre-line', color: '#475569', lineHeight: 1.6 }}>
                                            {product.suitableFor}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Full Key Ingredients */}
                        {product.keyIngredients && product.keyIngredients.length > 0 && (
                            <div className="content-card mb-4">
                                <h4 className="section-title mb-3">Key Ingredients</h4>
                                <div className="table-responsive d-none d-md-block">
                                    <table className="table ingredient-table w-100 mb-0">
                                        <thead>
                                            <tr>
                                                <th>Ingredient Name</th>
                                                <th>Botanical / Technical Name</th>
                                                <th>Percentage</th>
                                                <th>Part / Type</th>
                                                <th>Website Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {product.keyIngredients.map((ing: any, i: number) => {
                                                const hasPercent = ing.percentage && ing.percentage.trim() !== '' && ing.percentage !== '-';
                                                let displayPercent = ing.percentage;
                                                if (hasPercent && !String(displayPercent).includes('%')) {
                                                    displayPercent = `${displayPercent}%`;
                                                }
                                                return (
                                                    <tr key={i}>
                                                        <td className="ing-name">{ing.name}</td>
                                                        <td className="ing-botanical">{ing.botanicalName || '-'}</td>
                                                        <td>
                                                            {hasPercent ? <span className="ing-percentage-badge">{displayPercent}</span> : '-'}
                                                        </td>
                                                        <td className="text-muted">{ing.partType || '-'}</td>
                                                        <td>
                                                            {ing.websiteRole && ing.websiteRole !== '-' ? (
                                                                <div className="ing-role">{ing.websiteRole}</div>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="d-block d-md-none">
                                    {product.keyIngredients.map((ing: any, i: number) => {
                                        const hasPercent = ing.percentage && ing.percentage.trim() !== '' && ing.percentage !== '-';
                                        let displayPercent = ing.percentage;
                                        if (hasPercent && !String(displayPercent).includes('%')) {
                                            displayPercent = `${displayPercent}%`;
                                        }
                                        return (
                                            <div key={i} className="card mb-3 shadow-sm border border-light">
                                                <div className="card-body">
                                                    <h5 className="card-title ing-name mb-1">{ing.name}</h5>
                                                    {ing.botanicalName && ing.botanicalName !== '-' && <div className="ing-botanical mb-2">{ing.botanicalName}</div>}
                                                    {hasPercent && <div className="mb-2"><span className="ing-percentage-badge">{displayPercent}</span></div>}
                                                    {ing.partType && ing.partType !== '-' && <div className="mb-2"><small className="text-muted fw-bold">Part/Type:</small> {ing.partType}</div>}
                                                    {ing.websiteRole && ing.websiteRole !== '-' && <div className="ing-role mt-2">{ing.websiteRole}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 6. Other Ingredients */}
                        {product.otherIngredients && product.otherIngredients.trim() !== '' && (
                            <div className="content-card mb-4">
                                <h4 className="section-title mb-3">Other Ingredients</h4>
                                <div style={{ whiteSpace: 'pre-line', color: '#475569', lineHeight: 1.6 }}>
                                    {product.otherIngredients}
                                </div>
                            </div>
                        )}

                        {/* Label Control */}
                        {product.labelControl && product.labelControl.trim() !== '' && (
                            <div className="mb-4 px-3 py-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                                <span style={{ color: '#166534', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                    <strong style={{ textTransform: 'uppercase', marginRight: '6px' }}>LABEL CONTROL</strong> 
                                    <span style={{ color: '#334155', whiteSpace: 'pre-line' }}>
                                        {(() => {
                                            let val = product.labelControl.trim();
                                            if (val.toUpperCase().startsWith('LABEL CONTROL')) {
                                                val = val.substring(13).replace(/^[:\s-]+/, '').trim();
                                            }
                                            return val;
                                        })()}
                                    </span>
                                </span>
                            </div>
                        )}

                        {/* Secondary Info Accordions */}
                        <div className="accordion custom-accordion mb-4" id="secondaryContentAccordion">
                                
                                {/* 8. Safety / Side Effects / Allergy Information */}
                                {/* 8. Safety / Side Effects / Allergy Information */}
                                {product.safetyInformation && (
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id="headingSafety">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSafety" aria-expanded="false" aria-controls="collapseSafety">
                                                Safety, Possible Side Effects & Allergy Information
                                            </button>
                                        </h2>
                                        <div id="collapseSafety" className="accordion-collapse collapse" aria-labelledby="headingSafety" data-bs-parent="#secondaryContentAccordion">
                                            <div className="accordion-body bg-light rounded m-3" style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                                                {product.safetyInformation}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 9. Patch-Test Guidance */}
                                {product.patchTestGuidance && (
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id="headingPatchTest">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePatchTest" aria-expanded="false" aria-controls="collapsePatchTest">
                                                Patch-Test Guidance
                                            </button>
                                        </h2>
                                        <div id="collapsePatchTest" className="accordion-collapse collapse" aria-labelledby="headingPatchTest" data-bs-parent="#secondaryContentAccordion">
                                            <div className="accordion-body" style={{ whiteSpace: 'pre-line' }}>
                                                {product.patchTestGuidance}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 10. Storage & Product Care */}
                                {product.storageInstructions && (
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id="headingStorage">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseStorage" aria-expanded="false" aria-controls="collapseStorage">
                                                Storage & Product Care
                                            </button>
                                        </h2>
                                        <div id="collapseStorage" className="accordion-collapse collapse" aria-labelledby="headingStorage" data-bs-parent="#secondaryContentAccordion">
                                            <div className="accordion-body" style={{ whiteSpace: 'pre-line' }}>
                                                {product.storageInstructions}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 11. FAQs */}
                                {product.faqs && product.faqs.length > 0 && (
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id="headingFaqs">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFaqs" aria-expanded="false" aria-controls="collapseFaqs">
                                                FAQs
                                            </button>
                                        </h2>
                                        <div id="collapseFaqs" className="accordion-collapse collapse" aria-labelledby="headingFaqs" data-bs-parent="#secondaryContentAccordion">
                                            <div className="accordion-body">
                                                <div className="accordion" id="innerFaqAccordion">
                                                    {product.faqs.map((faq: any, i: number) => (
                                                        <div className="accordion-item border-0 border-bottom mb-0 rounded-0" key={i} style={{ boxShadow: 'none' }}>
                                                            <h2 className="accordion-header" id={`innerFaqHeading${i}`}>
                                                                <button className="accordion-button collapsed bg-transparent shadow-none py-3 px-1 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target={`#innerFaqCollapse${i}`} aria-expanded="false" aria-controls={`innerFaqCollapse${i}`} style={{ fontSize: '1rem', borderBottom: 'none' }}>
                                                                    Q: {faq.question}
                                                                </button>
                                                            </h2>
                                                            <div id={`innerFaqCollapse${i}`} className="accordion-collapse collapse" aria-labelledby={`innerFaqHeading${i}`} data-bs-parent="#innerFaqAccordion">
                                                                <div className="accordion-body text-muted py-2 px-1" style={{ whiteSpace: 'pre-line', padding: '0 4px 16px 4px' }}>
                                                                    {faq.answer}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Special Publishing & Claims Note */}
                            {product.specialPublishingClaimsNote && product.specialPublishingClaimsNote.trim() !== '' && (
                                <div className="mb-4">
                                    <h4 className="section-title mb-3">Special Publishing & Claims Note</h4>
                                    <div className="px-3 py-2" style={{ backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '6px' }}>
                                        <span style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                                            <strong style={{ color: '#b91c1c', textTransform: 'uppercase', marginRight: '6px' }}>REVIEW BEFORE PUBLISHING</strong> 
                                            <span style={{ color: '#334155', whiteSpace: 'pre-line' }}>
                                                {(() => {
                                                    let val = product.specialPublishingClaimsNote.trim();
                                                    if (val.toUpperCase().startsWith('REVIEW BEFORE PUBLISHING')) {
                                                        val = val.substring(24).replace(/^[:\s-]+/, '').trim();
                                                    }
                                                    return val;
                                                })()}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* 12. Standard Website Disclaimer */}
                            {product.disclaimer && product.disclaimer.trim() !== '' && (
                                <div className="disclaimer-panel p-3 rounded mb-4" style={{ backgroundColor: '#f4fbf7', border: '1px solid #d1e8da', fontSize: '0.9rem', color: '#334155' }}>
                                    <div className="fw-bold mb-2" style={{ color: '#166534', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                                        <i className="bi bi-info-circle me-2"></i> Standard Website Disclaimer
                                    </div>
                                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{product.disclaimer}</div>
                                </div>
                            )}

                            {/* Bottom Nature Callout - Inside Card */}
                            <div className="mt-5 p-4 rounded text-center" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                <h3 className="fw-bold mb-2" style={{ color: '#166534', fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.4rem' }}>Experience the Purity of Nature</h3>
                                <p className="mb-0" style={{ color: '#14532d', fontSize: '0.95rem' }}>Carefully crafted with authentic botanical ingredients. Gentle on your body, safe for your family, and kind to the earth.</p>
                            </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
