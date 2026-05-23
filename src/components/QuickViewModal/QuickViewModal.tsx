import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { handleAddToCartGlobal, handleToggleWishlistGlobal } from '../../utils/CartHelper';

// Asset Imports
import product1 from '../../assets/images/shop/product/1.png';

interface Product {
    _id: string;
    productName: string;
    sku: string;
    price: number;
    offerPrice?: number;
    appliedOffer?: any;
    images: string[];
    categoryId?: { _id: string; categoryName: string };
    subcategoryId?: { _id: string; subcategoryName: string };
    featured?: boolean;
    isBestSeller?: boolean;
    isPopular?: boolean;
    isTrending?: boolean;
}

interface QuickViewModalProps {
    product: Product | null;
    onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    const navigate = useNavigate();
    const [qty, setQty] = useState(1);

    if (!product) return null;

    const handleAddToCart = () => {
        handleAddToCartGlobal(product, qty, isUser, navigate, false);
        onClose();
        navigate('/shop-cart');
    };

    const handleAddToWishlist = () => {
        handleToggleWishlistGlobal(product, isUser, navigate, false);
    };

    return (
        <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{ background: '#fff', width: '96vw', maxWidth: '1100px', height: '90vh', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', display: 'flex', overflow: 'hidden', borderRadius: '8px' }}>
                <button onClick={onClose} aria-label="Close"
                    style={{ position: 'absolute', top: '14px', right: '18px', background: 'none', border: 'none', fontSize: '28px', lineHeight: 1, cursor: 'pointer', color: '#222', zIndex: 20, fontWeight: 300 }}>
                    ×
                </button>

                <div style={{ flex: '0 0 45%', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
                    <img 
                        src={product.images && product.images.length > 0 ? product.images[0] : product1} 
                        alt={product.productName} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                </div>

                <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 600, color: '#1a1a1a' }}>{product.productName}</h2>
                        <div style={{ color: '#38996E', fontSize: '24px', fontWeight: 500, marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            ₹{product.offerPrice ? product.offerPrice.toFixed(2) : product.price.toFixed(2)}
                            {product.offerPrice && product.offerPrice < product.price && (
                                <del style={{ color: '#888', fontSize: '18px' }}>₹{product.price.toFixed(2)}</del>
                            )}
                        </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '15px', color: '#666', lineHeight: '1.6' }}>
                        Experience the pure essence of nature with our {product.productName} range.
                        Crafted with traditional Ayurvedic wisdom, this product ensures high quality results.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer' }}>-</button>
                            <span style={{ width: '40px', textAlign: 'center', fontSize: '16px' }}>{qty}</span>
                            <button onClick={() => setQty(q => q + 1)} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer' }}>+</button>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: 'none', height: '42px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                            ADD TO CART
                        </button>
                    </div>

                    <button 
                        onClick={handleAddToWishlist}
                        style={{ background: 'none', border: '1px solid #1a1a1a', height: '42px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.3666 3.84172C16.941 3.41589 16.4356 3.0781 15.8794 2.84763C15.3232 2.61716 14.727 2.49854 14.1249 2.49854C13.5229 2.49854 12.9267 2.61716 12.3705 2.84763C11.8143 3.0781 11.3089 3.41589 10.8833 3.84172L9.99994 4.72506L9.1166 3.84172C8.25686 2.98198 7.0908 2.49898 5.87494 2.49898C4.65907 2.49898 3.49301 2.98198 2.63327 3.84172C1.77353 4.70147 1.29053 5.86753 1.29053 7.08339C1.29053 8.29925 1.77353 9.46531 2.63327 10.3251L3.5166 11.2084L9.99994 17.6917L16.4833 11.2084L17.3666 10.3251C17.7924 9.89943 18.1302 9.39407 18.3607 8.83785C18.5912 8.28164 18.7098 7.68546 18.7098 7.08339C18.7098 6.48132 18.5912 5.88514 18.3607 5.32893C18.1302 4.77271 17.7924 4.26735 17.3666 3.84172Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        ADD TO WISHLIST
                    </button>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div><strong>SKU:</strong> {product.sku}</div>
                        <div><strong>Category:</strong> {product.categoryId?.categoryName || 'N/A'}</div>
                        {product.subcategoryId && <div><strong>Subcategory:</strong> {product.subcategoryId.subcategoryName}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;
