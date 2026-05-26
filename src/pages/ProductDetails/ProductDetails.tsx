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
    const [activeTab, setActiveTab] = useState('description');

    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await userApiClient.get(`/user/products/${id}`);
                if (response.data.success) {
                    setProduct(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    if (loading) {
        return <div className="page-content bg-light d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>;
    }

    if (!product) {
        return <div className="page-content bg-light text-center py-5">
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
        <div className="page-content bg-light">
            <div className="d-flex justify-content-between container-fluid py-3 bg-light">
                <nav aria-label="breadcrumb" className="breadcrumb-row style-1">
                    <ul className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><Link to="/"> Home</Link></li>
                        <li className="breadcrumb-item">{product.productName}</li>
                    </ul>
                </nav>
            </div>

            <section className="content-inner py-0 bg-light">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6">
                            <div className="dz-product-detail style-1 sticky-top">
                                <div className="swiper-btn-center-lr">
                                    <div className="swiper product-gallery-swiper2">
                                        <div className="swiper-wrapper">
                                            {product.images && product.images.length > 0 ? product.images.map((img: string, index: number) => (
                                                <div className="swiper-slide" key={index}>
                                                    <div className="dz-media DZoomImage">
                                                        <img src={img} alt={product.productName} />
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="swiper-slide">
                                                    <div className="dz-media DZoomImage">
                                                        <img src="https://via.placeholder.com/600x600?text=No+Image" alt="Placeholder" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="swiper product-gallery-swiper thumb-swiper-lg">
                                        <div className="swiper-wrapper">
                                            {product.images && product.images.length > 0 ? product.images.map((img: string, index: number) => (
                                                <div className="swiper-slide" key={index}>
                                                    <img src={img} alt={product.productName} />
                                                </div>
                                            )) : (
                                                <div className="swiper-slide">
                                                    <img src="https://via.placeholder.com/150x150?text=No+Image" alt="Placeholder Thumb" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-5 col-lg-6 col-md-6">
                            <div className="dz-product-detail style-4 pt-md-5 pt-0 bg-transparent">
                                <div className="dz-content">
                                    <div className="dz-content-footer">
                                        <div className="dz-content-start m-b5">
                                            {product.unit && <span className="badge mb-2">{product.unit.unitName || product.unit}</span>}
                                            <h4 className="title mb-0">{product.productName}</h4>
                                            <div className="review-num">
                                                <ul className="dz-rating me-2">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <li key={i}>
                                                            <svg width="14" height="13" viewBox="0 0 14 13" fill="none">
                                                                <path d="M6.74805 0.234375L8.72301 4.51608L13.4054 5.07126L9.9436 8.27267L10.8625 12.8975L6.74805 10.5944L2.63355 12.8975L3.5525 8.27267L0.090651 5.07126L4.77309 4.51608L6.74805 0.234375Z" fill="#000" />
                                                            </svg>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <span className="text-secondary me-2">5.0 Rating</span>
                                                <a href="javascript:void(0);">(10 customer reviews)</a>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="para-text m-b25">{product.description || 'No description available for this product.'}</p>
                                    <div className="meta-content m-b20 d-flex align-items-end">
                                        <div className="me-3">
                                            <span className="price-name">Price</span>
                                            <span className="price">
                                                ₹{product.offerPrice ? product.offerPrice.toFixed(2) : product.price.toFixed(2)} 
                                                {product.offerPrice && product.offerPrice < product.price && (
                                                    <del className="ms-2 text-muted">₹{product.price.toFixed(2)}</del>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="product-num">
                                        <div className="btn-quantity style-2 light d-xl-block d-sm-none d-none">
                                            <label className="form-label">Quantity</label>
                                            <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} />
                                        </div>
                                    </div>

                                    <div className="btn-group cart-btn">
                                        <button className="btn bnt-lg btn-secondary text-uppercase me-md-4" onClick={handleAddToCart}>Add To Cart</button>
                                        <button className="btn btn-outline-secondary btn-lg btn-icon" onClick={handleAddToWishlist}>
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M9 16.9986C8.74374 16.9986 8.49669 16.9058 8.30415 16.7371C7.577 16.1013 6.87593 15.5038 6.2574 14.9767L6.25424 14.974C4.44081 13.4286 2.87485 12.094 1.78528 10.7794C0.567307 9.30968 0 7.9162 0 6.39391C0 4.91487 0.507156 3.55037 1.42795 2.55157C2.35973 1.54097 3.63826 0.984375 5.02844 0.984375C6.06747 0.984375 7.01903 1.31287 7.8566 1.96065C8.2793 2.28763 8.66245 2.68781 9 3.15459C9.33769 2.68781 9.7207 2.28763 10.1435 1.96065C10.9811 1.31287 11.9327 0.984375 12.9717 0.984375C14.3617 0.984375 15.6404 1.54097 16.5722 2.55157C17.493 3.55037 18 4.91487 18 6.39391C18 7.9162 17.4328 9.30968 16.2149 10.7792C15.1253 12.094 13.5595 13.4285 11.7463 14.9737C11.1267 15.5016 10.4245 16.1001 9.69571 16.7374C9.50331 16.9058 9.25612 16.9986 9 16.9986ZM5.02844 2.03879C3.93626 2.03879 2.93294 2.47467 2.20303 3.26624C1.46228 4.06975 1.05428 5.18047 1.05428 6.39391C1.05428 7.67422 1.53012 8.81927 2.59703 10.1066C3.62823 11.3509 5.16206 12.658 6.938 14.1715L6.9413 14.1743C7.56216 14.7034 8.26598 15.3033 8.99849 15.9438C9.7354 15.302 10.4403 14.7012 11.0624 14.1713C12.8382 12.6578 14.3719 11.3509 15.4031 10.1066C16.4699 8.81927 16.9457 7.67422 16.9457 6.39391C16.9457 5.18047 16.5377 4.06975 15.797 3.26624C15.0672 2.47467 14.0637 2.03879 12.9717 2.03879C12.1716 2.03879 11.437 2.29312 10.7884 2.79465C10.2104 3.24179 9.80777 3.80704 9.5717 4.20255C9.4503 4.40593 9.23662 4.52733 9 4.52733C8.76338 4.52733 8.5497 4.40593 8.4283 4.20255C8.19237 3.80704 7.78972 3.24179 7.21156 2.79465C6.56296 2.29312 5.82838 2.03879 5.02844 2.03879Z" fill="black" />
                                            </svg>
                                            Add To Wishlist
                                        </button>
                                    </div>

                                    <div className="dz-info">
                                        <ul>
                                            <li><strong>SKU:</strong></li>
                                            <li>{product.sku || 'N/A'}</li>
                                        </ul>
                                        <ul>
                                            <li><strong>Category:</strong></li>
                                            <li>
                                                <span><Link to="/shop">{product.categoryId?.categoryName || 'Uncategorized'}</Link></span>
                                            </li>
                                        </ul>
                                        {product.tags && product.tags.length > 0 && (
                                            <ul>
                                                <li><strong>Tags:</strong></li>
                                                <li>{product.tags.map((tag: string, i: number) => (
                                                    <span key={i}><Link to="/shop">{tag}</Link>{i < product.tags.length - 1 ? ', ' : ''}</span>
                                                ))}</li>
                                            </ul>
                                        )}
                                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                                            <ul>
                                                <li><strong>Specifications:</strong></li>
                                                <li>
                                                    {Object.entries(product.specifications).map(([key, val]: any, i: number) => (
                                                        <div key={i}>{key}: {val}</div>
                                                    ))}
                                                </li>
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content-inner-3 pb-0 bg-light">
                <div className="container">
                    <div className="product-description">
                        <div className="dz-tabs">
                            <ul className="nav nav-tabs center" role="tablist">
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews (12)</button>
                                </li>
                            </ul>
                            <div className="tab-content">
                                {activeTab === 'description' ? (
                                    <div className="tab-pane fade show active">
                                        <div className="detail-bx text-center">
                                            <h5 className="title">{product.productName}</h5>
                                            <p className="para-text">{product.description || 'No detailed description available.'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="tab-pane fade show active">
                                        <div className="detail-bx text-center">
                                            <h5 className="title">Customer Reviews</h5>
                                            <p className="para-text">Reviews content goes here...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProductDetails;
