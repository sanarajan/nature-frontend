import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { handleAddToCartGlobal, handleToggleWishlistGlobal } from '../../utils/CartHelper';

// Asset Imports
import product1 from '../../assets/images/shop/product/1.png';

const QuickViewModal: React.FC = () => {
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    const navigate = useNavigate();

    // MOCK PRODUCT FOR QUICK VIEW (Ideally should pass via props/context)
    const product: any = {
        _id: '67c191a99859f5188f98ed61',
        productName: 'Metavya',
        sku: 'PRT584E63A',
        price: 45.00,
        images: [product1],
    };

    const closeModal = () => {
        const modalEl = document.getElementById('exampleModal');
        if (modalEl) {
            modalEl.classList.remove('show');
            modalEl.style.display = 'none';
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.querySelectorAll('.modal-backdrop').forEach(el => (el as HTMLElement).remove());
    };

    const handleAddToCart = () => {
        handleAddToCartGlobal(product, 1, isUser, navigate, false);
        closeModal();
        navigate('/shop-cart');
    };

    const handleAddToWishlist = () => {
        handleToggleWishlistGlobal(product, isUser, navigate, false);
        closeModal();
    };

    return (
        <div className="modal quick-view-modal fade" id="exampleModal" tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i className="icon feather icon-x"></i>
                    </button>
                    <div className="modal-body">
                        <div className="row gx-0">
                            <div className="col-xl-6 col-md-6">
                                <div className="dz-product-detail mb-0">
                                    <div className="swiper-btn-center-lr">
                                        <div className="swiper quick-modal-swiper2">
                                            <div className="swiper-wrapper">
                                                <div className="swiper-slide">
                                                    <div className="dz-media DZoomImage">
                                                        <img src={product1} alt="image" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-6 col-md-6">
                                <div className="dz-product-detail style-2 mb-0">
                                    <div className="dz-content">
                                        <div className="dz-content-footer">
                                            <div className="dz-content-start">
                                                <span className="badge mb-2">SALE 20% Off</span>
                                                <h4 className="title mb-1">Metavya</h4>
                                                <div className="review-num">
                                                    <ul className="dz-rating me-2">
                                                        <li className="star-fill"><i className="flaticon-star-1"></i></li>
                                                        <li className="star-fill"><i className="flaticon-star-1"></i></li>
                                                        <li className="star-fill"><i className="flaticon-star-1"></i></li>
                                                        <li><i className="flaticon-star-1"></i></li>
                                                        <li><i className="flaticon-star-1"></i></li>
                                                    </ul>
                                                    <span className="text-secondary me-2">4.7 Rating</span>
                                                    <a href="javascript:void(0);">(5 customer reviews)</a>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="para-text">
                                            Experience the pure essence of nature with our Metavya range.
                                            Crafted with traditional Ayurvedic wisdom, this product ensures your skin stays hydrated and radiant.
                                        </p>
                                        <div className="meta-content m-b20 d-flex align-items-end">
                                            <div className="me-3">
                                                <span className="form-label">Price</span>
                                                <span className="price">45.00 <del>72.17</del></span>
                                            </div>
                                            <div className="btn-quantity light me-0 ms-4">
                                                <label className="form-label">Quantity</label>
                                                <input type="text" defaultValue="1" name="demo_vertical2" />
                                            </div>
                                        </div>
                                        <div className="btn-group cart-btn">
                                            <button onClick={handleAddToCart} className="btn btn-secondary text-uppercase">Add To Cart</button>
                                            <button onClick={handleAddToWishlist} className="btn btn-outline-secondary btn-icon">
                                                <svg width="19" height="17" viewBox="0 0 19 17" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M9.24805 16.9986C8.99179 16.9986 8.74474 16.9058 8.5522 16.7371C7.82504 16.1013 7.12398 15.5038 6.50545 14.9767L6.50229 14.974C4.68886 13.4286 3.12289 12.094 2.03333 10.7794C0.815353 9.30968 0.248047 7.9162 0.248047 6.39391C0.248047 4.91487 0.755203 3.55037 1.67599 2.55157C2.60777 1.54097 3.88631 0.984375 5.27649 0.984375C6.31552 0.984375 7.26707 1.31287 8.10464 1.96065C8.52734 2.28763 8.91049 2.68781 9.24805 3.15459C9.58574 2.68781 9.96875 2.28763 10.3916 1.96065C11.2292 1.31287 12.1807 0.984375 13.2197 0.984375C14.6098 0.984375 15.8885 1.54097 16.8202 2.55157C17.741 3.55037 18.248 4.91487 18.248 6.39391C18.248 7.9162 17.6809 9.30968 16.4629 10.7792C15.3733 12.094 13.8075 13.4285 11.9944 14.9737C11.3747 15.5016 10.6726 16.1001 9.94376 16.7374C9.75136 16.9058 9.50417 16.9986 9.24805 16.9986Z"
                                                        fill="black"></path>
                                                </svg>
                                                Add To Wishlist
                                            </button>
                                        </div>
                                        <div className="dz-info mb-0">
                                            <ul>
                                                <li><strong>SKU:</strong></li>
                                                <li>PRT584E63A</li>
                                            </ul>
                                            <ul>
                                                <li><strong>Category:</strong></li>
                                                <li><a href="javascript:void(0);">Skincare</a>, <a href="javascript:void(0);">Makeup</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;
