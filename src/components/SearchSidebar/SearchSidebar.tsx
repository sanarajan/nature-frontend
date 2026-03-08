import React from 'react';
import { Link } from 'react-router-dom';

// Asset Imports
import cosmetic1 from '../../assets/images/cosmetic/1.png';
import cosmetic2 from '../../assets/images/cosmetic/2.png';
import cosmetic3 from '../../assets/images/cosmetic/3.png';
import cosmetic4 from '../../assets/images/cosmetic/4.png';
import cosmetic5 from '../../assets/images/cosmetic/5.png';
import cosmetic6 from '../../assets/images/cosmetic/6.png';
import cosmetic7 from '../../assets/images/cosmetic/7.png';
import cosmetic8 from '../../assets/images/cosmetic/8.png';

const SearchSidebar: React.FC = () => {
    const popularProducts = [
        { img: cosmetic1, title: 'Jewel Tone Nail Polish', price: '₹40.00' },
        { img: cosmetic2, title: 'Balancing Body Cream', price: '₹30.00' },
        { img: cosmetic3, title: 'Smoothing Body Butter', price: '₹35.00' },
        { img: cosmetic4, title: 'Repairing Body Gel', price: '₹20.00' },
        { img: cosmetic5, title: 'Skin Product', price: '₹70.00' },
        { img: cosmetic6, title: 'Skin Product', price: '₹45.00' },
        { img: cosmetic7, title: 'Skin Product', price: '₹40.00' },
        { img: cosmetic8, title: 'Calming Body Lotion', price: '₹60.00' },
    ];

    return (
        <div className="dz-search-area dz-offcanvas offcanvas offcanvas-top bg-light" tabIndex={-1} id="offcanvasTop">
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close">
                &times;
            </button>
            <div className="container">
                <form className="header-item-search">
                    <div className="input-group search-input">
                        <select className="default-select">
                            <option>All Categories</option>
                            <option>Skin Care </option>
                            <option>Hair Growth</option>
                            <option>Health Suppliments</option>
                        </select>
                        <input type="search" className="form-control" placeholder="Search Product" />
                        <button className="btn" type="button">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M9.16679 15.8333C12.8487 15.8333 15.8335 12.8486 15.8335 9.16667C15.8335 5.48477 12.8487 2.5 9.16679 2.5C5.48489 2.5 2.50012 5.48477 2.50012 9.16667C2.50012 12.8486 5.48489 15.8333 9.16679 15.8333Z"
                                    stroke="black" strokeWidth="1.5" strokeLinecap="round"
                                    strokeLinejoin="round" />
                                <path d="M17.5001 17.5L13.8751 13.875" stroke="black" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <ul className="recent-tag">
                        <li className="pe-0"><span>Quick Search :</span></li>
                        <li><Link to="/shop">Skin Product</Link></li>
                        <li><Link to="/shop">Body Products</Link></li>
                        <li><Link to="/shop">Hair Products</Link></li>
                        <li><Link to="/shop">Health Suppliments</Link></li>
                    </ul>
                </form>
                <div className="row">
                    <div className="col-xl-12">
                        <h5 className="header-title mb-3">You May Also Like</h5>
                        <div className="swiper category-swiper2">
                            <div className="swiper-wrapper">
                                {popularProducts.map((prod, idx) => (
                                    <div key={idx} className="swiper-slide">
                                        <div className="shop-card style-8">
                                            <div className="dz-media">
                                                <img src={prod.img} alt="image" />
                                            </div>
                                            <div className="dz-content">
                                                <h6 className="title"><Link to="/shop">{prod.title}</Link></h6>
                                                <h6 className="price">{prod.price}</h6>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchSidebar;
