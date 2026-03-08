import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { handleAddToCartGlobal, handleToggleWishlistGlobal } from '../../utils/CartHelper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Asset Imports - Banner & General
import lineSvg from '../../assets/images/line.svg';
import bannerMedia1 from '../../assets/images/banner/banner-media1.png';
import bannerBg1 from '../../assets/images/banner/bg1.png';
import smallPic1 from '../../assets/images/shop/small/pic1.png';
import smallPic2 from '../../assets/images/shop/small/pic2.png';
import collection1 from '../../assets/images/collection/1.png';
import collection2 from '../../assets/images/collection/2.png';
import collection3 from '../../assets/images/collection/3.png';

// Categories & About
import beauty1 from '../../assets/images/beauty/1.jpg';
import beauty2 from '../../assets/images/beauty/2.jpg';
import beauty4 from '../../assets/images/beauty/4.jpg';
import beauty6 from '../../assets/images/beauty/6.jpg';

import aboutPic from '../../assets/images/about/pic.jpg';
import aboutPic1 from '../../assets/images/about/pic1.jpg';
import aboutPic2 from '../../assets/images/about/pic2.jpg';
import about2 from '../../assets/images/banner/about2.png';
import about3 from '../../assets/images/banner/about3.png';
import about4 from '../../assets/images/banner/about4.png';
import profilePic12 from '../../assets/images/about/pic12.jpg';

// Products
import product1 from '../../assets/images/shop/product/1.png';
import product2 from '../../assets/images/shop/product/2.png';
import product4 from '../../assets/images/shop/product/4.png';
import product5 from '../../assets/images/shop/product/5.png';


// Cosmetic & Offers
import cosmeticLarge1 from '../../assets/images/cosmetic/large/1.png';
import cosmeticLarge2 from '../../assets/images/cosmetic/large/2.png';
import cosmeticLarge3 from '../../assets/images/cosmetic/large/3.png';
import cosmeticLarge4 from '../../assets/images/cosmetic/large/4.png';
import cosmeticLarge5 from '../../assets/images/cosmetic/large/5.png';
import cosmeticLarge6 from '../../assets/images/cosmetic/large/6.png';
import cosmeticLarge7 from '../../assets/images/cosmetic/large/7.png';
import cosmeticMed1 from '../../assets/images/cosmetic/medium/1.png';
import cosmeticMed2 from '../../assets/images/cosmetic/medium/2.png';
import cosmeticMed3 from '../../assets/images/cosmetic/medium/3.png';
import cosmeticMed4 from '../../assets/images/cosmetic/medium/4.png';
import cosmeticMed6 from '../../assets/images/shop/product/medium/6.png';
import cosmeticMed7 from '../../assets/images/shop/product/medium/7.png';
import cosmeticMed8 from '../../assets/images/shop/product/medium/8.png';
import cosmeticMed9 from '../../assets/images/shop/product/medium/9.png';

// Map & Companies
import map2 from '../../assets/images/map/map2.png';
import mapLine from '../../assets/images/map/map-line.png';
import company1 from '../../assets/images/companies/1.jpg';
import company2 from '../../assets/images/companies/2.jpg';
import companyLogo1 from '../../assets/images/companies/logo/logo1.png';
import companyLogo2 from '../../assets/images/companies/logo/logo2.png';
import companyLogo3 from '../../assets/images/companies/logo/logo3.png';
import companyLogo4 from '../../assets/images/companies/logo/logo4.png';

// Blog & Instagram
import blog1 from '../../assets/images/banner/blog1.png';
import blog2 from '../../assets/images/banner/blog2.png';
import blog3 from '../../assets/images/banner/blog3.png';
import blog4 from '../../assets/images/banner/blog4.png';
import blog5 from '../../assets/images/banner/blog5.png';
import insta1 from '../../assets/images/beauty-post/feature/1.png';
import insta2 from '../../assets/images/beauty-post/feature/2.png';
import insta3 from '../../assets/images/beauty-post/feature/3.png';
import insta4 from '../../assets/images/beauty-post/feature/4.png';
import insta5 from '../../assets/images/beauty-post/feature/5.png';
import insta6 from '../../assets/images/beauty-post/feature/6.png';
import insta7 from '../../assets/images/beauty-post/feature/7.png';
import insta8 from '../../assets/images/beauty-post/feature/8.png';
import insta9 from '../../assets/images/beauty-post/feature/9.png';
import insta10 from '../../assets/images/beauty-post/feature/10.png';
import insta11 from '../../assets/images/beauty-post/feature/11.png';
import insta12 from '../../assets/images/beauty-post/feature/12.png';

import shopPng from '../../assets/images/banner/shop.png';
import starPng from '../../assets/images/star.png';
import QuickViewModal from '../../components/QuickViewModal/QuickViewModal';

const Home: React.FC = () => {
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    const navigate = useNavigate();
    const [categories, setCategories] = useState<any[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, prodRes] = await Promise.all([
                    userApiClient.get('/user/categories'),
                    userApiClient.get('/user/products/featured')
                ]);

                if (catRes.data.success) {
                    setCategories(catRes.data.data);
                }
                if (prodRes.data.success) {
                    setFeaturedProducts(prodRes.data.data);
                }
            } catch (err) {
                console.error('Error fetching home data:', err);
            }
        };
        fetchData();
    }, []);

    const categoryImages: Record<string, string> = {
        'skincare': beauty1,
        'healthcare': beauty2,
        'haircare': beauty4,
        'facecare': beauty6
    };

    const getCategoryImage = (name: string) => {
        const key = name.toLowerCase().replace(/\s+/g, '');
        return categoryImages[key] || beauty1;
    };

    const getProductBadges = (prod: any) => {
        const badges: string[] = [];
        if (prod.featured) badges.push('FEATURED');
        if (prod.isBestSeller) badges.push('BEST SELLER');
        if (prod.isPopular) badges.push('POPULAR');
        if (prod.isTrending) badges.push('TRENDING');
        return badges;
    };

    return (
        <>
            {/* Swiper Banner Start */}
            <div className="main-slider style-1">
                <div className="bg-blur-1"></div>
                <div className="bg-blur-2"></div>
                <div className="banner-bg-line">
                    <img src={lineSvg} alt="" />
                </div>
                <div className="container">
                    <div className="banner-content">
                        <div className="row gx-0">
                            <div className="col-md-12 col-lg-8 align-self-center">
                                <div className="inner-content">
                                    <div className="content-info">
                                        <h1 className="title wow flipInX animated" data-wow-delay="0.5s">
                                            Experience the timeless wisdom of nature
                                        </h1>
                                        <p className="text mb-0">
                                            No code need. Plus free shipping on <span className="cntr-text">₹599+</span> orders!
                                        </p>
                                        <div className="content-btn m-b30 wow fadeInUp" data-wow-delay="0.8s">
                                            <Link className="btn btn-secondary btn-lg me-xl-3 btnhover20" to="/shop">Shop Now</Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="row gx-0">
                                    <div className="col-sm-12 col-md-6 col-lg-5 mb-3 wow fadeInUp" data-wow-delay="0.1s">
                                        <div className="product-card">
                                            <div className="dz-media">
                                                <img src={smallPic1} alt="/" />
                                            </div>
                                            <div className="dz-content">
                                                <Link to="/shop">
                                                    <h5 className="dz-title">Metavya</h5>
                                                </Link>
                                                <span className="price">
                                                    ₹18 <del>₹27</del>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-sm-12 col-md-6 col-lg-5 wow fadeInUp" data-wow-delay="0.1s">
                                        <div className="product-card">
                                            <div className="dz-media">
                                                <img src={smallPic2} alt="/" />
                                            </div>
                                            <div className="dz-content">
                                                <Link to="/shop">
                                                    <h5 className="dz-title">Femroot</h5>
                                                </Link>
                                                <span className="price">
                                                    ₹18 <del>₹27</del>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-12 col-lg-4">
                                <div className="banner-media">
                                    <div className="img-preview wow slideInRight" data-wow-delay="0.1s" data-wow-duration="1.5s">
                                        <img src={bannerMedia1} alt="banner-media" />
                                    </div>
                                    <a className="animation-btn popup-youtube" href="https://www.youtube.com/watch?v=GNRj16pfsFY">
                                        <div className="text-row word-rotate-box c-black bg-blur">
                                            {"EXPLORE MORE COLLECTION ".split('').map((char, i, arr) => (
                                                <span
                                                    key={i}
                                                    className="text__char"
                                                    style={{ '--char-rotate': `${(i * 360) / arr.length}deg` } as React.CSSProperties}
                                                >
                                                    {char}
                                                </span>
                                            ))}
                                            {/* Play Icon SVG */}
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="badge__emoji" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 5V19L19 12L8 5Z" fill="#0D775E" />
                                            </svg>
                                        </div>
                                    </a>
                                    <div className="star">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                                            <path d="M32 0L36.1182 27.8818L64 32L36.1182 36.1182L32 64L27.8818 36.1182L0 32L27.8818 27.8818L32 0Z" fill="black" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="banner-social-media">
                    <ul>
                        <li><a target="_blank" rel="noreferrer" href="https://www.instagram.com/">Instagram</a></li>
                        <li><a target="_blank" rel="noreferrer" href="javascript:void(0);">Facebook</a></li>
                        <li><a target="_blank" rel="noreferrer" href="https://twitter.com/">twitter</a></li>
                    </ul>
                </div>
                <div className="left-text-bar justify-content-center">
                    <Link to="/contact" className="service-btn btn-dark">Let's talk</Link>
                </div>
                <div className="collection1"><img src={collection1} alt="" /></div>
                <div className="collection2"><img src={collection2} alt="" /></div>
                <div className="collection3"><img src={collection3} alt="" /></div>
            </div>

            {/* Product Categories Start */}
            <section className="content-inner bg-light">
                <div className="container">
                    <div className="section-head style-1 wow fadeInUp text-start" data-wow-delay="0.1s">
                        <div className="max-w900">
                            <h2 className="title">Nature's Finest Offerings</h2>
                        </div>
                    </div>
                    <div className="row product-style1">
                        {categories.slice(0, 4).map((cat, idx) => (
                            <div key={cat._id} className="col-4 col-sm-4 col-md-4 col-lg-3 mb-3">
                                <Link to="/shop">
                                    <div className="image-box style-1">
                                        <div className="dz-media wow flipInX animated" data-wow-delay={`${0.8 + idx * 0.2}s`} data-wow-duration="2s">
                                            <img src={getCategoryImage(cat.categoryName)} alt="" />
                                            <div className="item">{cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}</div>
                                        </div>
                                        <h3 className="title wow flipInX animated" data-wow-delay={`${1.2 + idx * 0.2}s`} data-wow-duration="1s">
                                            {cat.categoryName}
                                        </h3>
                                    </div>
                                </Link>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="col-12 text-center py-5">
                                <p>Loading offerings...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Explore More Collection Banner */}
            <div className="content-inner-1 banner-bg-media bg-parallax"
                style={{ background: `url(${bannerBg1}), lightgray 50%`, backgroundPosition: 'center', backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
                <a className="animation-btn popup-youtube" href="https://www.youtube.com/watch?v=GNRj16pfsFY">
                    <div className="text-row word-rotate-box c-black bg-blur">
                        {"EXPLORE MORE COLLECTION ".split('').map((char, i, arr) => (
                            <span
                                key={i}
                                className="text__char"
                                style={{ '--char-rotate': `${(i * 360) / arr.length}deg` } as React.CSSProperties}
                            >
                                {char}
                            </span>
                        ))}
                        {/* Play Icon SVG */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="badge__emoji" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5V19L19 12L8 5Z" fill="#0D775E" />
                        </svg>
                    </div>
                </a>
                <div className="dz-features-wrapper overflow-hidden bg-light-1">
                    <ul className="dz-features text-wrapper">
                        {['Accessories', 'Haircare', 'nailcare', 'Beautycare', 'Bodycare', 'Skincare'].map((feature, idx) => (
                            <React.Fragment key={idx}>
                                <li className="item">
                                    <h2 className="text-title">{feature}</h2>
                                </li>
                                <li className="item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="31" height="30" viewBox="0 0 31 30" fill="none">
                                        <path d="M15.5918 0L17.7131 12.8787L30.5918 15L17.7131 17.1213L15.5918 30L13.4705 17.1213L0.591797 15L13.4705 12.8787L15.5918 0Z" fill="black" />
                                    </svg>
                                </li>
                            </React.Fragment>
                        ))}
                    </ul>
                </div>
            </div>

            {/* More Collections Section */}
            <section className="content-inner overlay-white-middle overflow-hidden">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-4 col-md-12 m-b30">
                            <div className="about-media">
                                <img src={aboutPic} alt="" className="dz-tilt" />
                            </div>
                        </div>
                        <div className="col-lg-8 col-md-12 m-b30">
                            <div className="about-wraper">
                                <div className="section-head style-1 mb-2 fadeInUp" data-wow-delay="0.1s">
                                    <h2 className="title">More Collections</h2>
                                    <Link to="/shop" className="arrow-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" fill="none">
                                            <path d="M12.8335 31.1667L31.1668 12.8333" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M12.8335 12.8333H31.1668V31.1667" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </Link>
                                </div>
                                <Swiper
                                    className="testimonial-swiper about-swiper"
                                    modules={[Navigation, Pagination, Autoplay]}
                                    spaceBetween={30}
                                    slidesPerView={1}
                                    loop={true}
                                    autoplay={{
                                        delay: 3000,
                                        disableOnInteraction: false,
                                    }}
                                    navigation={{
                                        prevEl: ".testimonial-button-prev",
                                        nextEl: ".testimonial-button-next",
                                    }}
                                    pagination={{
                                        clickable: true,
                                        el: ".swiper-pagination",
                                        renderBullet: function (index: number, className: string) {
                                            return '<span class="' + className + '">0' + (index + 1) + '</span>';
                                        },
                                    }}
                                    breakpoints={{
                                        575: {
                                            slidesPerView: 2,
                                        },
                                        991: {
                                            slidesPerView: 2,
                                        },
                                        1199: {
                                            slidesPerView: 3,
                                        },
                                    }}
                                >
                                    <SwiperSlide>
                                        <div className="about-box">
                                            <div className="about-img">
                                                <img src={about2} alt="" />
                                            </div>
                                            <div className="about-btn">
                                                <Link to="/shop" className="btn btn-light btn-md">Essential Items</Link>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <div className="about-box">
                                            <div className="about-img">
                                                <img src={about3} alt="" />
                                            </div>
                                            <div className="about-btn">
                                                <Link to="/shop" className="btn btn-light btn-md">Repair Serum</Link>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <div className="about-box">
                                            <div className="about-img">
                                                <img src={about4} alt="" />
                                            </div>
                                            <div className="about-btn">
                                                <Link to="/shop" className="btn btn-light btn-md">Anti Aging Cream</Link>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <div className="about-box">
                                            <div className="about-img">
                                                <img src={about4} alt="" />
                                            </div>
                                            <div className="about-btn">
                                                <Link to="/shop" className="btn btn-light btn-md">Anti Aging Cream</Link>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                </Swiper>
                                <div className="testimonial-pagination d-flex justify-content-between align-items-center">
                                    <div className="d-flex gap-3">
                                        <div className="testimonial-button-prev">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
                                                <path d="M36.8751 19.372H4.6659L12.288 11.9623C12.8705 11.3965 12.0066 10.4958 11.4164 11.0663C11.4164 11.0663 2.68932 19.5502 2.68932 19.5502C2.43467 19.7821 2.45495 20.2007 2.68935 20.4462C2.68932 20.4462 11.4164 28.9337 11.4164 28.9337C12.0038 29.4974 12.8725 28.6135 12.288 28.0377C12.288 28.0377 4.66308 20.622 4.66308 20.622H36.8751C37.6738 20.6144 37.7149 19.3872 36.8751 19.372Z" fill="black" />
                                            </svg>
                                        </div>
                                        <div className="testimonial-button-next">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
                                                <path d="M3.12489 19.372H35.3341L27.712 11.9623C27.1295 11.3965 27.9934 10.4958 28.5836 11.0663L37.3107 19.5502C37.5653 19.7821 37.5451 20.2007 37.3107 20.4462L28.5836 28.9337C27.9962 29.4973 27.1275 28.6135 27.712 28.0377L35.3369 20.622H3.12489C2.32618 20.6144 2.28506 19.3872 3.12489 19.372Z" fill="black" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="swiper-pagination style-1 text-end" />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Highly Recommended Section */}
            <section className="content-inner-1 bg-light position-relative overflow-hidden">
                <div className="collection1 style-1 up-down"><img src={collection2} alt="" /></div>
                <div className="collection3 style-1 up-down"><img src={collection3} alt="" /></div>
                <div className="bg-line">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1920 494" fill="none">
                        <g filter="url(#filter0_d_0_5)">
                            <path d="M1925 246.001C960.6 77.6005 945 78.5 -4.5 246.001V493.5H1925V246.001Z" fill="#0cffc603" />
                        </g>
                        <defs>
                            <filter id="filter0_d_0_5" x="-64.5" y="0.0375977" width="2049.5" height="493.462" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                <feOffset dy="-60" />
                                <feGaussianBlur stdDeviation="30" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0.00451389 0 0 0 0 0.270833 0 0 0 0 0.154319 0 0 0 0.1 0" />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_5" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_5" result="shape" />
                            </filter>
                        </defs>
                    </svg>
                </div>
                <div className="container">
                    <div className="section-head style-1 wow fadeInUp text-center overflow-hidden" data-wow-delay="0.1s">
                        <div className="max-w800 mx-auto">
                            <h2 className="title">
                                Highly Recommended <span className="shop-media"><img src={shopPng} alt="" /></span> Essentials
                            </h2>
                        </div>
                    </div>
                    <div className="clearfix">
                        <ul id="masonry" className="row g-xl-4 g-3">
                            {featuredProducts.map((prod, idx) => (
                                <li key={prod._id}
                                    className={`card-container col-xl-3 col-lg-3 col-md-4 col-sm-6 wow fadeInUp${idx % 2 === 1 ? ' mt-xl-5' : ''}`}
                                    style={idx % 2 === 1 ? { marginTop: '40px' } : {}}
                                    data-wow-delay={`${0.1 * (idx + 1)}s`}>
                                    <div className="shop-card">
                                        <div className="dz-media media-overlay">
                                            <img src={prod.images && prod.images.length > 0 ? prod.images[0] : product1} alt="image" />
                                            <div className="shop-meta">
                                                <Link to={`/product/${prod._id}`} className="btn btn-secondary btn-icon">
                                                    <i className="fa-solid fa-eye d-md-none d-block"></i>
                                                    <span className="d-md-block d-none">Quick View</span>
                                                </Link>
                                                <div className="btn btn-primary meta-icon dz-carticon">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M20.531 5.47097L17.531 2.47097C17.238 2.17797 16.763 2.17797 16.47 2.47097C16.177 2.76397 16.177 3.23897 16.47 3.53197L18.19 5.25197H6.00098C4.48398 5.25197 3.25098 6.48497 3.25098 8.00197V11.001C3.25098 11.415 3.58698 11.751 4.00098 11.751C4.41498 11.751 4.75098 11.415 4.75098 11.001V8.00197C4.75098 7.31297 5.31198 6.75197 6.00098 6.75197H18.19L16.47 8.47197C16.177 8.76497 16.177 9.23997 16.47 9.53297C16.616 9.67897 16.808 9.75297 17 9.75297C17.192 9.75297 17.384 9.67997 17.53 9.53297L20.53 6.53297C20.823 6.23997 20.823 5.76497 20.53 5.47197L20.531 5.47097Z" fill="black" />
                                                        <path d="M18.9998 12.25C18.5858 12.25 18.2498 12.586 18.2498 13V15.999C18.2498 16.688 17.6888 17.249 16.9998 17.249H5.81075L7.53075 15.529C7.82375 15.236 7.82375 14.761 7.53075 14.468C7.23775 14.175 6.76275 14.175 6.46975 14.468L3.46975 17.468C3.17675 17.761 3.17675 18.236 3.46975 18.529L6.46975 21.529C6.61575 21.675 6.80775 21.749 6.99975 21.749C7.19175 21.749 7.38375 21.676 7.52975 21.529C7.82275 21.236 7.82275 20.761 7.52975 20.468L5.80975 18.748H16.9988C18.5158 18.748 19.7488 17.515 19.7488 15.998V12.999C19.7488 12.585 19.4128 12.249 18.9988 12.249L18.9998 12.25Z" fill="black" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="product-tag">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {getProductBadges(prod).map((badge, bi) => (
                                                        <span key={bi} className="badge badge-secondary"
                                                            style={{
                                                                background: (badge === 'FEATURED' || badge === 'BEST SELLER') ? '#2D2E2F' : '#fff',
                                                                color: (badge === 'FEATURED' || badge === 'BEST SELLER') ? '#fff' : '#2D2E2F',
                                                                border: (badge === 'FEATURED' || badge === 'BEST SELLER') ? 'none' : '1px solid #2D2E2F',
                                                                borderRadius: '30px',
                                                                padding: '5px 12px',
                                                                fontSize: '11px',
                                                                fontWeight: 600,
                                                                letterSpacing: '0.5px',
                                                                whiteSpace: 'nowrap',
                                                                display: 'inline-block',
                                                                width: 'fit-content'
                                                            }}>
                                                            {badge}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="badge-heart" onClick={() => handleToggleWishlistGlobal(prod, isUser, navigate, false)} style={{ cursor: 'pointer' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <path d="M17.3666 3.84172C16.941 3.41589 16.4356 3.0781 15.8794 2.84763C15.3232 2.61716 14.727 2.49854 14.1249 2.49854C13.5229 2.49854 12.9267 2.61716 12.3705 2.84763C11.8143 3.0781 11.3089 3.41589 10.8833 3.84172L9.99994 4.72506L9.1166 3.84172C8.25686 2.98198 7.0908 2.49898 5.87494 2.49898C4.65907 2.49898 3.49301 2.98198 2.63327 3.84172C1.77353 4.70147 1.29053 5.86753 1.29053 7.08339C1.29053 8.29925 1.77353 9.46531 2.63327 10.3251L3.5166 11.2084L9.99994 17.6917L16.4833 11.2084L17.3666 10.3251C17.7924 9.89943 18.1302 9.39407 18.3607 8.83785C18.5912 8.28164 18.7098 7.68546 18.7098 7.08339C18.7098 6.48132 18.5912 5.88514 18.3607 5.32893C18.1302 4.77271 17.7924 4.26735 17.3666 3.84172Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="dz-content">
                                            <h5 className="title"><Link to={`/product/${prod._id}`}>{prod.productName}</Link></h5>
                                            <h6 className="price">₹{prod.price.toFixed(2)}</h6>
                                            <div className="shop-cart-btn">
                                                <Link to="#" onClick={(e) => { e.preventDefault(); handleAddToCartGlobal(prod, 1, isUser, navigate, true); }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M21 9.24995H18.401L14.624 3.58395C14.394 3.23895 13.927 3.14495 13.584 3.37595C13.239 3.60595 13.146 4.07095 13.376 4.41595L16.599 9.24995H7.401L10.624 4.41595C10.854 4.07095 10.761 3.60595 10.416 3.37595C10.071 3.14595 9.606 3.23895 9.376 3.58395L5.599 9.24995H3C2.586 9.24995 2.25 9.58595 2.25 9.99995C2.25 10.4139 2.586 10.7499 3 10.7499H3.385L4.943 18.5389C5.199 19.8199 6.333 20.7499 7.64 20.7499H16.361C17.668 20.7499 18.801 19.8199 19.058 18.5389L20.616 10.7499H21.001C21.415 10.7499 21.751 10.4139 21.751 9.99995C21.751 9.58595 21.414 9.24995 21 9.24995ZM17.586 18.245C17.469 18.827 16.954 19.2499 16.36 19.2499H7.64C7.046 19.2499 6.531 18.827 6.414 18.245L4.915 10.7499H19.085L17.586 18.245Z" fill="white" />
                                                        <path d="M14.75 14V16C14.75 16.414 14.414 16.75 14 16.75C13.586 16.75 13.25 16.414 13.25 16V14C13.25 13.586 13.586 13.25 14 13.25C14.414 13.25 14.75 13.586 14.75 14ZM10 13.25C9.586 13.25 9.25 13.586 9.25 14V16C9.25 16.414 9.586 16.75 10 16.75C10.414 16.75 10.75 16.414 10.75 16V14C10.75 13.586 10.414 13.25 10 13.25Z" fill="white" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {featuredProducts.length === 0 && (
                                <div className="col-12 text-center py-5">
                                    <p>Loading essential products...</p>
                                </div>
                            )}
                        </ul>
                    </div>
                    <div className="d-flex justify-content-center m-t35">
                        <Link className="animation-btn style-1" to="/shop">
                            <div className="text-row word-rotate-box c-black border-white">
                                {"All PRODUCTS - All PRODUCTS -".split('').map((char, i, arr) => (
                                    <span
                                        key={i}
                                        className="text__char"
                                        style={{ '--char-rotate': `${(i * 360) / arr.length}deg` } as React.CSSProperties}
                                    >
                                        {char}
                                    </span>
                                ))}
                                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="badge__emoji" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M31.3071 0.724407L39.5891 9.00636C39.8522 9.27011 40 9.62746 40 10C40 10.3726 39.8522 10.73 39.5891 10.9937L31.3071 19.2757C31.1235 19.4587 30.8748 19.5613 30.6155 19.5611C30.3563 19.5609 30.1077 19.4578 29.9244 19.2745C29.7411 19.0912 29.638 18.8426 29.6378 18.5834C29.6376 18.3242 29.7403 18.0754 29.9233 17.8918L36.8367 10.9785L0.978424 10.9785C0.718906 10.9785 0.470016 10.8755 0.286509 10.6919C0.103002 10.5084 -9.16698e-05 10.2596 -9.16667e-05 10C-9.16637e-05 9.74051 0.103002 9.49162 0.286509 9.30812C0.470016 9.12461 0.718906 9.02152 0.978424 9.02152L36.8367 9.02152L29.9233 2.10824C29.7403 1.92462 29.6376 1.67589 29.6378 1.41666C29.638 1.15743 29.7411 0.908873 29.9244 0.725566C30.1077 0.54226 30.3563 0.439183 30.6155 0.438966C30.8748 0.438748 31.1235 0.541408 31.3071 0.724407Z" fill="black" />
                                </svg>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Similar Profiles Section */}
            <section className="content-inner-2 overflow-hidden bg-light">
                <div className="container">
                    <div className="row align-items-xl-center align-items-start">
                        <div className="col-lg-5 col-md-12 m-b30 align-self-center">
                            <div className="dz-media style-1 img-ho1 wow fadeInUp" data-wow-delay="0.2s">
                                <img src={profilePic12} alt="image" />
                            </div>
                        </div>
                        <div className="col-lg-7 col-md-12 col-sm-12 align-self-end">
                            <div className="row justify-content-between align-items-end">
                                <div className="col-lg-8 col-md-8 col-sm-12">
                                    <div className="section-head style-1 mb-3 wow fadeInUp" data-wow-delay="0.4s">
                                        <div className="left-content">
                                            <h2 className="title">Similar Profiles</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-3 col-sm-12 text-md-end wow fadeInUp" data-wow-delay="0.6s">
                                    <Link to="/shop" className="animation-btn style-2 d-md-block d-none ms-md-auto p-0 mb-3">
                                        <div className="text-row word-rotate-box c-black">
                                            {"all products - all products - ".split('').map((char, i, arr) => (
                                                <span
                                                    key={i}
                                                    className="text__char"
                                                    style={{ '--char-rotate': `${(i * 360) / arr.length}deg` } as React.CSSProperties}
                                                >
                                                    {char}
                                                </span>
                                            ))}
                                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="badge__emoji" xmlns="http://www.w3.org/2000/svg">
                                                <g clipPath="url(#clip0_836_18017)">
                                                    <path d="M31.3071 10.7244L39.5891 19.0064C39.8522 19.2701 40 19.6275 40 20C40 20.3726 39.8522 20.73 39.5891 20.9937L31.3071 29.2757C31.1235 29.4587 30.8748 29.5613 30.6155 29.5611C30.3563 29.5609 30.1077 29.4578 29.9244 29.2745C29.7411 29.0912 29.6381 28.8426 29.6378 28.5834C29.6376 28.3242 29.7403 28.0754 29.9233 27.8918L36.8367 20.9785L0.978439 20.9785C0.718921 20.9785 0.470031 20.8755 0.286524 20.6919C0.103017 20.5084 -7.64111e-05 20.2596 -7.6408e-05 20C-7.64049e-05 19.7405 0.103017 19.4916 0.286524 19.3081C0.470031 19.1246 0.718921 19.0215 0.978439 19.0215L36.8367 19.0215L29.9233 12.1082C29.7403 11.9246 29.6376 11.6759 29.6378 11.4167C29.6381 11.1574 29.7411 10.9089 29.9244 10.7256C30.1077 10.5423 30.3563 10.4392 30.6155 10.439C30.8748 10.4387 31.1235 10.5414 31.3071 10.7244Z" fill="black" />
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_836_18017">
                                                        <rect width="40" height="40" fill="white" transform="matrix(-1.19249e-08 1 1 1.19249e-08 0 0)" />
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            <div className="row">
                                {[
                                    { img: cosmeticMed1, title: 'Moisturizing Body Lotion', price: '₹80', oldPrice: '₹95', sale: 'Up to 40% Off' },
                                    { img: cosmeticMed2, title: 'Rejuvenating Body Oil', price: '₹80', oldPrice: '₹95', sale: 'Up to 40% Off' },
                                    { img: cosmeticMed3, title: 'Cleansing Body Wash', price: '₹80', oldPrice: '₹95', sale: 'Up to 40% Off' }
                                ].map((prod, idx) => (
                                    <div key={idx} className="col-lg-4 col-md-4 col-sm-6 m-b30">
                                        <div className="shop-card style-2 wow fadeInUp" data-wow-delay={`${1.2 + idx * 0.2}s`}>
                                            <div className="dz-media">
                                                <img src={prod.img} alt="image" />
                                            </div>
                                            <div className="dz-content">
                                                <div>
                                                    <span className="sale-title">{prod.sale}</span>
                                                    <h6 className="title"><Link to="/shop">{prod.title}</Link></h6>
                                                </div>
                                                <h6 className="price">{prod.price} <del>{prod.oldPrice}</del></h6>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section >



            {/* Saving Section */}
            < section className="content-inner-1 bg-light" >
                <div className="container">
                    <div className="row ">
                        <div className="col-lg-6 col-md-12 align-self-center">
                            <div className="row">
                                {[
                                    { img: product4, title: 'Vayura Hair Shampoo', price: '₹30', sale: 'Up to 40% Off' },
                                    { img: product5, title: 'DarkLeaf Hair Oil', price: '₹60', sale: 'Up to 40% Off', badge: true },
                                    { img: product1, title: 'Metavya', price: '₹50', sale: 'Up to 40% Off' },
                                    { img: product2, title: 'Femroot', price: '₹40', sale: 'Up to 40% Off' }
                                ].map((prod, idx) => (
                                    <div key={idx} className="col-lg-6 col-md-6 col-sm-6">
                                        <div className="shop-card style-3 wow fadeInUp" data-wow-delay={`${0.2 + idx * 0.1}s`}>
                                            <div className="dz-media">
                                                <img src={prod.img} alt="image" />
                                            </div>
                                            <div className="dz-content">
                                                <div>
                                                    <span className="sale-title">{prod.sale}</span>
                                                    <h6 className="title"><Link to="/shop">{prod.title}</Link></h6>
                                                </div>
                                                <h6 className="price">{prod.price} <del>₹95</del></h6>
                                            </div>
                                            {prod.badge && <span className="sale-badge">50%<br />Sale <img src={starPng} alt="" /></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 m-b30">
                            <div className="about-box style-1 clearfix h-100 right">
                                <div className="dz-media h-100">
                                    <img src={aboutPic1} alt="" />
                                    <div className="media-contant">
                                        <h2 className="title">Great saving on everyday essentials</h2>
                                        <h5 className="sub-title">Up to 60% off + up to ₹107 cashback</h5>
                                        <Link to="/shop" className="btn btn-white btn-hover-1">See All</Link>
                                    </div>
                                    <svg className="title animation-text" viewBox="0 0 1320 300">
                                        <text x="0" y="">Great saving</text>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* Map-Section Start */}
            < section className="content-inner bg-light overflow-hidden" id="Maping" >
                <div className="container-fluid px-0 custom-padding">
                    <div className="row align-items-end">
                        <div className="col-xl-7 col-lg-12 col-md-12">
                            <div className="map-area">
                                <img src={map2} alt="image" />
                                <div className="map-line" id="map-line"><img src={mapLine} alt="image" /></div>
                                <div className="loction-b wow" data-wow-delay="0.2s">
                                    <svg width="34" height="47" viewBox="0 0 34 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16.9593 5.09961C10.41 5.09961 5.10303 10.4105 5.10303 16.9559C5.10303 23.5052 10.4139 28.8121 16.9593 28.8121C23.5086 28.8121 28.8155 23.5052 28.8155 16.9559C28.8155 10.4065 23.5086 5.09961 16.9593 5.09961ZM16.9593 26.8751C11.4817 26.8751 7.04004 22.4335 7.04004 16.9559C7.04004 11.4782 11.4777 7.03662 16.9593 7.03662C22.4369 7.03662 26.8785 11.4782 26.8785 16.9559C26.8785 22.4335 22.4369 26.8751 16.9593 26.8751Z" fill="#66A589" />
                                        <path d="M16.9593 2.75781C8.99696 2.75781 2.54291 9.21186 2.54291 17.1742C2.54291 17.5394 2.55878 17.9125 2.59054 18.2936C3.50347 29.1257 16.9554 46.7573 16.9554 46.7573C16.9554 46.7573 29.2959 30.5785 31.1416 19.6947C31.2924 18.8175 31.3718 17.9721 31.3718 17.1703C31.3758 9.21187 24.9217 2.75781 16.9593 2.75781ZM16.9593 27.6651C12.3828 27.6651 8.47699 24.7953 6.94088 20.7585C6.48838 19.5717 6.24228 18.2896 6.24228 16.944C6.24228 11.0258 11.0411 6.22696 16.9593 6.22696C22.8775 6.22696 27.6764 11.0258 27.6764 16.944C27.6764 18.6111 27.2953 20.1909 26.6166 21.6C24.886 25.1922 21.2104 27.6651 16.9593 27.6651Z" fill="#41705B" />
                                        <path d="M16.9594 2.75781V6.23093C22.8775 6.23093 27.6764 11.0298 27.6764 16.948C27.6764 18.6151 27.2954 20.1949 26.6166 21.604C24.886 25.1922 21.2105 27.669 16.9594 27.669V46.7613C16.9594 46.7613 29.2998 30.5825 31.1456 19.6987C31.2964 18.8215 31.3758 17.976 31.3758 17.1742C31.3758 9.21186 24.9217 2.75781 16.9594 2.75781Z" fill="#66A589" />
                                        <path d="M25.437 25.436C30.1199 20.7532 30.1199 13.1609 25.437 8.47806C20.7542 3.79525 13.1619 3.79525 8.47909 8.47806C3.79629 13.1609 3.79629 20.7532 8.4791 25.436C13.1619 30.1188 20.7542 30.1188 25.437 25.436Z" stroke="white" strokeWidth="0.5007" strokeMiterlimit="10" />
                                        <path opacity="0.39" d="M31.3758 17.1742C31.3758 17.9721 31.2964 18.8175 31.1455 19.6987C29.788 20.4568 28.2678 21.0999 26.6166 21.604C27.2953 20.1949 27.6764 18.6151 27.6764 16.948C27.6764 11.0298 22.8775 6.23093 16.9593 6.23093C11.0411 6.23093 6.24227 11.0298 6.24227 16.948C6.24227 18.2896 6.48837 19.5757 6.94087 20.7625C5.30553 20.0798 3.84086 19.2422 2.5945 18.2936C2.56275 17.9125 2.54688 17.5394 2.54688 17.1742C2.54688 9.21186 9.00093 2.75781 16.9633 2.75781C24.9217 2.75781 31.3758 9.21186 31.3758 17.1742Z" fill="#A3FFD6" />
                                        <path d="M17.0663 23.1079H13.2161V10.9182C14.8554 10.8468 16.0383 10.811 16.7647 10.811C18.0983 10.811 19.1303 11.069 19.8607 11.589C20.591 12.109 20.9562 12.8512 20.9562 13.8158C20.9562 14.3834 20.722 14.8994 20.2576 15.3638C19.7893 15.8282 19.2732 16.1219 18.7096 16.237C19.7773 16.4712 20.5553 16.8563 21.0435 17.3921C21.5318 17.9319 21.7779 18.6623 21.7779 19.5871C21.7779 20.6588 21.3452 21.5122 20.4759 22.1513C19.6027 22.7903 18.4675 23.1079 17.0663 23.1079ZM15.0579 12.2479V15.7528C15.4429 15.7845 15.9232 15.8044 16.4947 15.8044C18.2373 15.8044 19.1105 15.1653 19.1105 13.8833C19.1105 12.756 18.3087 12.1923 16.7051 12.1923C16.0938 12.1884 15.5461 12.2082 15.0579 12.2479ZM15.0579 17.0428V21.6948C15.689 21.7504 16.1772 21.7782 16.5146 21.7782C17.6697 21.7782 18.5111 21.5837 19.043 21.1907C19.5749 20.7977 19.8409 20.1785 19.8409 19.3212C19.8409 18.5273 19.5868 17.9438 19.0827 17.5668C18.5747 17.1897 17.7292 16.9991 16.5463 16.9991L15.0579 17.0428Z" fill="#41705B" />
                                        <path d="M17.4555 23.1079H13.6053V10.9182C15.2446 10.8468 16.4274 10.811 17.1538 10.811C18.4875 10.811 19.5195 11.069 20.2499 11.589C20.9802 12.109 21.3454 12.8512 21.3454 13.8158C21.3454 14.3834 21.1112 14.8994 20.6468 15.3638C20.1784 15.8282 19.6624 16.1219 19.0988 16.237C20.1665 16.4712 20.9445 16.8563 21.4327 17.3921C21.9209 17.9319 22.167 18.6623 22.167 19.5871C22.167 20.6588 21.7344 21.5122 20.8651 22.1513C19.9879 22.7903 18.8527 23.1079 17.4555 23.1079ZM15.447 12.2479V15.7528C15.8321 15.7845 16.3123 15.8044 16.8839 15.8044C18.6264 15.8044 19.4997 15.1653 19.4997 13.8833C19.4997 12.756 18.6979 12.1923 17.0943 12.1923C16.479 12.1884 15.9313 12.2082 15.447 12.2479ZM15.447 17.0428V21.6948C16.0782 21.7504 16.5664 21.7782 16.9038 21.7782C18.0588 21.7782 18.9003 21.5837 19.4322 21.1907C19.9641 20.7977 20.23 20.1785 20.23 19.3212C20.23 18.5273 19.976 17.9438 19.4719 17.5668C18.9638 17.1897 18.1184 16.9991 16.9355 16.9991L15.447 17.0428Z" fill="#66A589" />
                                    </svg>
                                </div>
                                <div className="loction-center wow fadeInUp" data-wow-delay="1.0s">
                                    <svg width="61" height="36" viewBox="0 0 61 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0.589722 0.330078V17.3205H27.0771L30.7949 29.3602L34.4935 17.3205H61.0001V0.330078H0.589722Z" fill="#71AB91" />
                                        <path d="M40.6589 31.8303C40.6589 33.9647 36.2376 35.6875 30.7949 35.6875C25.3522 35.6875 20.9309 33.9647 20.9309 31.8303C20.9309 29.6959 25.3522 27.9731 30.7949 27.9731C36.2376 27.9731 40.6589 29.6959 40.6589 31.8303Z" fill="#71AB91" stroke="white" strokeWidth="0.6087" strokeMiterlimit="10" />
                                        <path d="M59.8635 1.29346H1.784V16.2805H59.8635V1.29346Z" stroke="white" strokeWidth="0.3472" strokeMiterlimit="10" />
                                        <path d="M11.1653 12.1393L11.8588 11.2147C12.3404 11.6384 12.9376 11.8504 13.6696 11.8504C15.018 11.8504 15.6923 11.311 15.6923 10.2322C15.6923 9.73137 15.4997 9.34611 15.0951 9.03789C14.7099 8.72967 14.1705 8.57556 13.5348 8.57556H13.4191V7.61238H13.4769C14.7098 7.61238 15.3263 7.16931 15.3263 6.28319C15.3263 5.35854 14.7484 4.89621 13.5733 4.89621C12.9376 4.89621 12.4367 5.06959 12.0707 5.41634L11.4158 4.60727C11.8781 4.12568 12.6294 3.89453 13.6889 3.89453C14.6135 3.89453 15.3841 4.10641 15.9812 4.51095C16.5784 4.91548 16.8673 5.43559 16.8673 6.07129C16.8673 6.55288 16.6939 6.99594 16.3665 7.36194C16.039 7.72795 15.6538 7.97838 15.2107 8.11322C15.8271 8.26733 16.3087 8.5563 16.6747 8.94157C17.0407 9.32684 17.2141 9.80841 17.2141 10.3671C17.2141 11.1761 16.9059 11.8118 16.2702 12.2549C15.6345 12.698 14.7676 12.9099 13.6311 12.9099C13.1495 12.9099 12.6871 12.8328 12.2248 12.698C11.7818 12.5246 11.435 12.3512 11.1653 12.1393Z" fill="white" />
                                        <path d="M19.8918 8.49813L19.3909 8.20916V3.97119H24.7077V4.99216H20.7779V7.11116C21.1439 6.89926 21.587 6.78368 22.1456 6.78368C23.1473 6.78368 23.8986 7.03409 24.4188 7.51567C24.9389 7.99726 25.2086 8.69076 25.2086 9.57689C25.2086 11.7729 24.0142 12.8709 21.6255 12.8709C20.6238 12.8709 19.7955 12.6398 19.1405 12.1967L19.6992 11.195C20.3541 11.6381 20.9898 11.85 21.6062 11.85C22.9739 11.85 23.6674 11.1565 23.6674 9.75025C23.6674 8.44033 22.9932 7.78536 21.6448 7.78536C21.0091 7.82389 20.4119 8.03581 19.8918 8.49813Z" fill="white" />
                                        <path d="M28.6181 11.0991C28.9263 11.0991 29.1767 11.1954 29.3886 11.3688C29.6005 11.5422 29.7162 11.7541 29.7162 12.0045C29.7162 12.2549 29.6005 12.4668 29.3886 12.6402C29.1767 12.8136 28.9263 12.9099 28.6181 12.9099C28.3099 12.9099 28.0595 12.8136 27.8476 12.6402C27.6357 12.4668 27.5201 12.2549 27.5201 12.0045C27.5201 11.7541 27.6357 11.5422 27.8476 11.3688C28.0595 11.1762 28.3099 11.0991 28.6181 11.0991Z" fill="white" />
                                        <path d="M37.961 10.3862V12.7749H36.574V10.3862H31.7003V9.71199L37.4408 3.99072H37.961V9.46159H39.0397V10.3862H37.961ZM36.574 6.37941L33.434 9.48084H36.574V6.37941Z" fill="white" />
                                        <path d="M42.9309 12.7747L41.467 10.8676L40.7542 11.4648V12.7554H39.9258V7.41943H40.7542V10.7328L42.5264 8.96052H43.4896L42.0063 10.4053L43.8171 12.7554H42.9309V12.7747Z" fill="white" />
                                        <path d="M49.7889 12.7746V10.3666C49.7889 9.76947 49.4807 9.48053 48.845 9.48053C48.6524 9.48053 48.4597 9.53833 48.2864 9.63465C48.113 9.73096 47.9974 9.84653 47.9396 9.98138V12.7939H47.1113V10.097C47.1113 9.90432 47.0343 9.76948 46.8609 9.6539C46.6875 9.53832 46.4563 9.49979 46.1866 9.49979C46.0133 9.49979 45.8399 9.55758 45.6665 9.6539C45.4739 9.75022 45.339 9.86581 45.262 10.0007V12.7939H44.4337V8.99895H44.973L45.2427 9.442C45.551 9.09526 45.9555 8.94116 46.4371 8.94116C47.092 8.94116 47.5736 9.11452 47.8241 9.442C47.9204 9.30715 48.0937 9.1723 48.3441 9.07599C48.5946 8.97967 48.845 8.92188 49.1147 8.92188C49.5963 8.92188 49.9623 9.03747 50.232 9.26863C50.5017 9.4998 50.6173 9.82727 50.6173 10.2511V12.7939H49.7889V12.7746Z" fill="white" />
                                    </svg>
                                </div>
                                <div className="loction-a wow " data-wow-delay="1.2s">
                                    <svg width="56" height="85" viewBox="0 0 56 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M27.7396 4.50391C15.1409 4.50391 4.92627 14.7218 4.92627 27.3206C4.92627 39.9226 15.1409 50.1372 27.7429 50.1372C40.3449 50.1372 50.5596 39.9226 50.5596 27.3206C50.5596 14.7218 40.3416 4.50391 27.7396 4.50391ZM27.7396 46.4096C17.199 46.4096 8.65386 37.8645 8.65386 27.3238C8.65386 16.7832 17.199 8.23478 27.7396 8.23478C38.2803 8.23478 46.8254 16.7799 46.8254 27.3206C46.8254 37.8612 38.2803 46.4096 27.7396 46.4096Z" fill="#66A589" />
                                        <path d="M27.7397 -0.000976562C12.4177 -0.000976562 0.00012207 12.4199 0.00012207 27.7386C0.00012207 28.44 0.0330516 29.1545 0.095617 29.8889C1.85733 50.7363 27.7397 84.6666 27.7397 84.6666C27.7397 84.6666 51.4882 53.5353 55.038 32.5923C55.3245 30.8998 55.4825 29.2764 55.4825 27.7386C55.4825 12.4199 43.0616 -0.000976562 27.7397 -0.000976562ZM27.7397 47.9308C18.9344 47.9308 11.4167 42.4118 8.45963 34.6438C7.5903 32.3618 7.11612 29.8889 7.11612 27.3072C7.11612 15.917 16.3495 6.68036 27.7397 6.68036C39.1299 6.68036 48.3665 15.9137 48.3665 27.3072C48.3665 30.5145 47.6322 33.5539 46.3249 36.2639C42.9925 43.1659 35.9226 47.9308 27.7397 47.9308Z" fill="#41705B" />
                                        <path d="M27.7397 -0.000976562V6.68036C39.13 6.68036 48.3666 15.9137 48.3666 27.3072C48.3666 30.5145 47.6323 33.5539 46.325 36.2639C42.9926 43.1692 35.9227 47.9308 27.7397 47.9308V84.6666C27.7397 84.6666 51.4883 53.5353 55.0381 32.5923C55.3245 30.8998 55.4826 29.2764 55.4826 27.7386C55.4826 12.4199 43.0617 -0.000976562 27.7397 -0.000976562Z" fill="#66A589" />
                                        <path d="M27.7396 50.394C40.4828 50.394 50.8131 40.0637 50.8131 27.3206C50.8131 14.5774 40.4828 4.24707 27.7396 4.24707C14.9965 4.24707 4.66614 14.5774 4.66614 27.3206C4.66614 40.0637 14.9965 50.394 27.7396 50.394Z" stroke="white" strokeWidth="1.1614" strokeMiterlimit="10" />
                                        <path d="M33.8818 38.291L32.3304 33.5696H23.9566L22.2969 38.291H18.8562L27.9975 15.5996H28.8109L37.293 38.291H33.8818ZM28.2566 21.4686L24.77 31.3234H31.4546L28.2566 21.4686Z" fill="#CC0D39" />
                                    </svg>
                                </div>
                                <div className="area-box1 wow " data-wow-delay="1.4s">
                                    <div className="shop-card style-4">
                                        <div className="dz-media">
                                            <img src={cosmeticMed4} alt="image" />
                                        </div>
                                        <div className="dz-content">
                                            <h5 className="title"><Link to="/shop">Cozy Knit Cardigan Sweater</Link></h5>
                                            <span className="sale-title">up to 79% off</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="area-box2 wow " data-wow-delay="1.6s">
                                    <div className="shop-card style-4">
                                        <div className="dz-media">
                                            <img src={cosmeticMed4} alt="image" />
                                        </div>
                                        <div className="dz-content">
                                            <h5 className="title"><Link to="/shop">Sophisticated Swagger Suit</Link></h5>
                                            <span className="sale-title">up to 79% off</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="area-box3 wow " data-wow-delay="1.6s">
                                    <div className="shop-card style-4">
                                        <div className="dz-media">
                                            <img src={cosmeticMed4} alt="image" />
                                        </div>
                                        <div className="dz-content">
                                            <h5 className="title"><Link to="/shop">Sophisticated Swagger Suit</Link></h5>
                                            <span className="sale-title">up to 79% off</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-5 col-lg-12 col-md-12 custom-width">
                            <div className="map-content">
                                <div className="row">
                                    <div className="col-xl-8 col-lg-12 col-md-12 custom-width">
                                        <div className="section-head style-1 mb-3 fadeInUp" data-wow-delay="0.1s">
                                            <div className="left-content">
                                                <h2 className="title mb-3">Hot Spots</h2>
                                                <p>Up To 60% Off + Up To ₹107 Cashback</p>
                                            </div>
                                            <Link to="/shop" className="btn btn-outline-secondary align-self-end mb-4 text-nowrap">View All</Link>
                                        </div>
                                    </div>
                                </div>
                                <Swiper
                                    className="swiper swiper-shop2"
                                    modules={[Autoplay]}
                                    spaceBetween={30}
                                    slidesPerView={1.5}
                                    loop={true}
                                    autoplay={{
                                        delay: 3000,
                                        disableOnInteraction: false,
                                    }}
                                    breakpoints={{
                                        575: {
                                            slidesPerView: 2,
                                        },
                                        991: {
                                            slidesPerView: 3,
                                        },
                                        1200: {
                                            slidesPerView: 4,
                                        },
                                    }}
                                >
                                    {[
                                        { img: cosmeticMed6, title: 'Glow Serum' },
                                        { img: cosmeticMed7, title: 'Radiant Serum' },
                                        { img: cosmeticMed8, title: 'Hydration Serum' },
                                        { img: cosmeticMed9, title: 'Brightening Cream' },
                                        { img: cosmeticMed6, title: 'Glow Serum' },
                                        { img: cosmeticMed7, title: 'Radiant Serum' }
                                    ].map((item, idx) => (
                                        <SwiperSlide key={idx} className="wow fadeInUp" data-wow-delay="0.2s">
                                            <div className="shop-card style-4">
                                                <div className="dz-media">
                                                    <img src={item.img} alt="image" />
                                                </div>
                                                <div className="dz-content">
                                                    <h5 className="title"><Link to="/shop">{item.title}</Link></h5>
                                                    <span className="sale-title">Up To 50% Off</span>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* Deals-Section Start */}
            < section className="content-inner-2 bg-light overflow-hidden" >
                <div className="container">
                    <div className="section-head style-1 fadeInUp" data-wow-delay="0.2s">
                        <div className="left-content">
                            <h2 className="title">Blockbuster deals</h2>
                        </div>
                        <Link to="/shop" className="btn btn-outline-secondary">View All Deals</Link>
                    </div>
                    <Swiper
                        className="swiper swiper-four"
                        modules={[Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1.5}
                        loop={true}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            575: {
                                slidesPerView: 2,
                            },
                            991: {
                                slidesPerView: 3,
                            },
                            1200: {
                                slidesPerView: 4,
                            },
                        }}
                    >
                        {[
                            { img: cosmeticLarge1, title: 'Dewy Glow Foundation', price: '₹80', old: '₹95' },
                            { img: cosmeticLarge2, title: 'Illuminating Body Oil', price: '₹80', old: '₹95' },
                            { img: cosmeticLarge3, title: 'Cleansing Body Wash', price: '₹80', old: '₹95' },
                            { img: cosmeticLarge4, title: 'Calming Body Lotion', price: '₹80', old: '₹95' },
                            { img: cosmeticLarge1, title: 'Dewy Glow Foundation', price: '₹80', old: '₹95' }
                        ].map((item, idx) => (
                            <SwiperSlide key={idx}>
                                <div className="shop-card style-6 wow fadeInUp" data-wow-delay={`${0.4 + idx * 0.2}s`}>
                                    <div className="dz-media">
                                        <img src={item.img} alt="image" />
                                    </div>
                                    <div className="dz-content">
                                        <div>
                                            <span className="sale-title">up to 79% off</span>
                                            <h5 className="title"><Link to="/shop">{item.title}</Link></h5>
                                        </div>
                                        <h6 className="price">{item.price} <del>{item.old}</del></h6>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section >
            {/* Deals-Section End */}

            {/* Featured-Section Start */}
            <section className="content-inner-2 bg-light">
                <div className="container">
                    <div className="section-head style-1 mb-2 wow fadeInUp" data-wow-delay="0.2s">
                        <div className="left-content">
                            <h2 className="title">Featured offer for you</h2>
                        </div>
                        <Link to="/shop" className="btn btn-outline-secondary">View All</Link>
                    </div>
                </div>
                <div className="container-fluid p-3">
                    <Swiper
                        className="swiper swiper-product"
                        modules={[Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1.2}
                        loop={true}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            575: {
                                slidesPerView: 2,
                            },
                            1200: {
                                slidesPerView: 3,
                            },
                        }}
                    >
                        {[
                            { img: cosmeticLarge5, offer: '20% Off', title: 'Unique Deals', btn: 'Collect Now', style: 'style-1' },
                            { img: cosmeticLarge6, offer: 'Sale Up to 50% Off', subtitle: 'Summer', year: '2024', btn: 'Collect Now', style: 'style-1' },
                            { img: cosmeticLarge7, offer: '20% Off', subtitle2: 'Unbeatable', bgTitle: 'Sale', btn: 'Collect Now', style: 'style-1' },
                            { img: cosmeticLarge5, offer: '20% Off', title: 'Unique Deals', btn: 'Collect Now', style: 'style-1' }
                        ].map((item, idx) => (
                            <SwiperSlide key={idx}>
                                <div className="product-box style-1 wow fadeInUp" data-wow-delay={`${0.4 + idx * 0.2}s`}>
                                    <div className="product-media" style={{ backgroundImage: `url(${item.img})` }}></div>
                                    <div className="product-content">
                                        <div className="main-content">
                                            <span className="offer">{item.offer}</span>
                                            {item.title && <h2 className="product-name">{item.title}</h2>}
                                            {item.subtitle && <h4 className="sub-title1">{item.subtitle}</h4>}
                                            {item.year && <span className="year">{item.year}</span>}
                                            {item.subtitle2 && <h4 className="sub-title2">{item.subtitle2}</h4>}
                                            {item.bgTitle && <span className="bg-title">{item.bgTitle}</span>}
                                            <Link to="/shop" className="btn btn-outline-secondary btn-rounded btn-lg">{item.btn}</Link>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>
            {/* Featured-Section End */}

            {/* Featured2-Section Start */}
            <section className="content-inner-2 bg-light">
                <div className="container">
                    <div className="section-head style-1 mb-3 fadeInUp" data-wow-delay="0.2s">
                        <div className="left-content">
                            <h2 className="title">Featured now</h2>
                        </div>
                        <Link to="/shop" className="btn btn-outline-secondary">View All</Link>
                    </div>
                    <Swiper
                        className="swiper swiper-product-2"
                        modules={[Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        loop={true}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            1200: {
                                slidesPerView: 2,
                            },
                        }}
                    >
                        {[
                            { img: cosmeticMed1, title: 'Clear Complexion Cleansing Foam' },
                            { img: cosmeticMed2, title: 'Floral Burst Fragrance Mist' },
                            { img: cosmeticMed3, title: 'Aqua-Fresh Moisturizing Gel' },
                            { img: cosmeticMed4, title: 'Divine Essence Perfume Elixir' }
                        ].map((item, idx) => (
                            <SwiperSlide key={idx}>
                                <div className="shop-card style-5 wow fadeInUp" data-wow-delay={`${0.4 + idx * 0.2}s`}>
                                    <div className="dz-media">
                                        <img src={item.img} alt="image" />
                                    </div>
                                    <div className="dz-content">
                                        <div>
                                            <h6 className="title"><Link to="/shop">{item.title}</Link></h6>
                                            <span className="sale-title">Up to 40% Off</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <h6 className="price">₹80<del>₹95</del></h6>
                                            <span className="review"><i className="fa-solid fa-star"></i>(2k Review)</span>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>
            {/* Featured2-Section End */}

            {/* Saving-Secthion Start */}
            <section className="content-inner-2 overflow-hidden bg-light">
                <div className="container">
                    <div className="row ">
                        <div className="col-lg-6 col-md-12 m-b30">
                            <div className="about-box style-1 clearfix h-100">
                                <div className="dz-media h-100">
                                    <img src={aboutPic2} alt="" />
                                    <div className="media-contant">
                                        <h2 className="title">Recent Additions to Your Shortlist</h2>
                                        <Link to="/shop" className="btn btn-white btn-hover-1">See All</Link>
                                    </div>
                                    <svg className="title animation-text" viewBox="0 0 1320 300">
                                        <text x="0" y="">ShortList</text>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 align-self-center">
                            <div className="row">
                                {[
                                    { img: product4, title: 'Vayura Hair Shampoo', price: '₹30', sale: 'Up to 40% Off' },
                                    { img: product5, title: 'DarkLeaf Hair Oil', price: '₹60', sale: 'Up to 40% Off', badge: true },
                                    { img: product1, title: 'Metavya', price: '₹50', sale: 'Up to 40% Off' },
                                    { img: product2, title: 'Femroot', price: '₹40', sale: 'Up to 40% Off' }
                                ].map((prod, idx) => (
                                    <div key={idx} className="col-lg-6 col-md-6 col-sm-6">
                                        <div className="shop-card style-3 wow fadeInUp" data-wow-delay={`${0.2 + idx * 0.1}s`}>
                                            <div className="dz-media">
                                                <img src={prod.img} alt="image" />
                                            </div>
                                            <div className="dz-content">
                                                <div>
                                                    <span className="sale-title">{prod.sale}</span>
                                                    <h6 className="title"><Link to="/shop">{prod.title}</Link></h6>
                                                </div>
                                                <h6 className="price">{prod.price} <del>₹95</del></h6>
                                            </div>
                                            {prod.badge && <span className="sale-badge">50%<br />Sale <img src={starPng} alt="" /></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sponsored / Company Swiper */}
            <section className="content-inner-2 bg-light">
                <div className="container">
                    <div className="section-head style-1 mb-3 fadeInUp text-start" data-wow-delay="0.2s">
                        <h2 className="title">Sponsored</h2>
                        <Link to="/shop" className="btn btn-outline-secondary">View All</Link>
                    </div>
                    <Swiper
                        className="swiper swiper-company"
                        modules={[Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        loop={true}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            575: {
                                slidesPerView: 2,
                            },
                            991: {
                                slidesPerView: 3,
                            },
                            1200: {
                                slidesPerView: 4,
                            },
                        }}
                    >
                        {[
                            { img: company2, logo: companyLogo2, title: 'Best Cloths', sale: 'Up To 20% Off', badge: 'In Store' },
                            { img: company1, logo: companyLogo3, title: 'Balancing Body Toner', sale: 'Up To 30% Off' },
                            { img: company1, logo: companyLogo4, title: 'Brightening Serum', sale: 'Min. 30% Off', badge: 'In Store' },
                            { img: company1, logo: companyLogo1, title: 'Calming Body Lotion', sale: 'Min. 30% Off' },
                        ].map((cmp, idx) => (
                            <SwiperSlide key={idx}>
                                <div className="company-box style-1 wow fadeInUp" data-wow-delay={`${0.2 * (idx + 1)}s`}>
                                    <div className="dz-media">
                                        <img src={cmp.img} alt="image" className="company-img" />
                                        <img src={cmp.logo} alt="image" className="logo" />
                                        {cmp.badge && <span className="sale-badge">{cmp.badge}</span>}
                                    </div>
                                    <div className="dz-content">
                                        <h6 className="title">{cmp.title}</h6>
                                        <span className="sale-title">{cmp.sale}</span>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Blog / Latest Cosmetic News */}
            <section className="content-inner-1 bg-light">
                <div className="container">
                    <div className="section-head style-1 mb-4 fadeInUp text-start" data-wow-delay="0.1s">
                        <h2 className="title">Latest Cosmetic News</h2>
                        <Link to="/shop" className="btn btn-outline-secondary">View All</Link>
                    </div>
                </div>
                <Swiper
                    className="swiper blogSwiper"
                    modules={[Autoplay]}
                    spaceBetween={30}
                    slidesPerView={1}
                    loop={true}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                    }}
                    breakpoints={{
                        575: {
                            slidesPerView: 2,
                        },
                        1200: {
                            slidesPerView: 3,
                        },
                    }}
                >
                    {[
                        { img: blog1, title: 'Illuminate Your Beauty With Potent Anti-Wrinkle.', date: '22 October 2022' },
                        { img: blog2, title: 'Pamper Skin, Indulge Senses, Relax, Unwind.', date: '03 November 2022' },
                        { img: blog3, title: 'Customize Regimen, Address Needs, Achieve Results.', date: '13 August 2022' },
                        { img: blog4, title: 'Combat Aging, Restore Elasticity, Firm And Lift.', date: '12 July 2022' },
                        { img: blog5, title: 'Hydrate Deeply For A Plump, Youthful Appearance.', date: '02 October 2022' }
                    ].map((post, idx) => (
                        <SwiperSlide key={idx}>
                            <div className="blog-card wow fadeInUp" data-wow-delay={`${0.1 + idx * 0.2}s`}>
                                <div className="blog-media">
                                    <img src={post.img} alt="" />
                                    <div className="post-date">{post.date}</div>
                                </div>
                                <div className="blog-info">
                                    <h4 className="blog-title mb-0">
                                        <Link to="/shop" className="title-link multi-hvr">{post.title}</Link>
                                    </h4>
                                    <ul className="blog-share">
                                        <li>
                                            <a className="share-btn" href="javascript:void(0);">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path d="M7 17L17 7" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                                    <path d="M7 7H17V17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                                </svg>
                                            </a>
                                            <ul className="blog-social-icon">
                                                <li><a href="javascript:void(0);" target="_blank"><i className="fab fa-facebook-f"></i></a></li>
                                                <li><a href="javascript:void(0);"><i className="fa-brands fa-x-twitter"></i></a></li>
                                                <li><a href="javascript:void(0);"><i className="fab fa-instagram"></i></a></li>
                                                <li><a href="javascript:void(0);"><i className="fa-brands fa-linkedin-in"></i></a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>

            {/* Newsletter Subscription */}
            <section className="content-inner overlay-white-dark overflow-hidden position-relative">
                <div className="collection1 style-2 up-down"><img src={collection2} alt="" /></div>
                <div className="collection3 style-2 up-down"><img src={collection3} alt="" /></div>
                <div className="container">
                    <div className="section-head style-1 d-block wow fadeInUp text-center" data-wow-delay="0.1s">
                        <div className="max-w900 mx-auto">
                            <h2 className="title mb-4">Subscribe Newsletter & Get Cosmetic News</h2>
                        </div>
                        <form className="dzSubscribe style-2">
                            <div className="form-group">
                                <div className="input-group mb-0">
                                    <input name="dzEmail" required={true} type="email" className="form-control h-70" placeholder="Your Email Address" />
                                    <div className="sub-btn">
                                        <button name="submit" value="Submit" type="submit" className="btn btn-secondary">Subscribe Now</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Instagram Feed */}
            <div className="content-inner py-0 overlay-white-middle">
                <div className="container-fluid px-0">
                    <a href="https://www.instagram.com/" className="instagram-link">
                        <div className="follow-link bg-white wow bounceIn" data-wow-delay="0.1s">
                            <div className="follow-link-content">
                                <h4 className="title">On the Instagram</h4>
                                <p className="text">Follow @Naturalayam</p>
                            </div>
                        </div>
                    </a>
                    <div className="row gx-0">
                        {[insta1, insta2, insta3, insta4, insta5, insta6, insta7, insta8, insta9, insta10, insta11, insta12].map((img, idx) => (
                            <div key={idx} className="col-xl-2 col-lg-2 col-md-3 col-sm-2 col-3 wow fadeIn" data-wow-delay={`${0.1 * (idx % 6 + 1)}s`}>
                                <div className="insta-post dz-media dz-img-effect">
                                    <a href="javascript:void(0);">
                                        <img src={img} alt="" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick View Modal Container */}
            <QuickViewModal />
        </>
    );
};

export default Home;
