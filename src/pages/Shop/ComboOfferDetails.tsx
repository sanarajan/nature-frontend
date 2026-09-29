import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronUp, CheckCircle, Package } from 'lucide-react';
import userApiClient from '../../services/userApiClient';
import type { RootState } from '../../store';

const ComboOfferDetails: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');

    const [combo, setCombo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<any[]>([]);

    const [expandedSections, setExpandedSections] = useState({
        products: true,
        routine: true,
        whySpecial: true,
        howToUse: true,
        faq: true,
        safety: true
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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

    useEffect(() => {
        const fetchCombo = async () => {
            try {
                setLoading(true);
                const res = await userApiClient.get(`/user/products/combo-offers/${slug}`);
                if (res.data.success && res.data.data) {
                    setCombo(res.data.data);
                    document.title = res.data.data.seoTitle || `${res.data.data.offerName} | Naturalayam`;
                } else {
                    toast.error('Combo not found');
                    navigate('/combo-offers');
                }
            } catch (error) {
                console.error(error);
                toast.error('Combo not found');
                navigate('/combo-offers');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchCombo();
        }
    }, [slug, navigate]);

    const getComboSetsInCart = (comboData: any) => {
        if (!comboData?.products || comboData.products.length === 0) return 0;
        let sets = Infinity;
        comboData.products.forEach((cp: any) => {
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

    const handleAddToCart = async () => {
        if (!combo || !combo.products || combo.products.length === 0) return;

        if (combo.maxUsagePerOrder && combo.maxUsagePerOrder > 0) {
            const currentSets = getComboSetsInCart(combo);
            if (currentSets >= combo.maxUsagePerOrder) {
                toast.warning(`Maximum ${combo.maxUsagePerOrder} combos per order. You’ve already reached the limit for this offer.`);
                return;
            }
        }

        const cartItemsToAdd = combo.products.map((p: any) => ({
            product: p.productId,
            quantity: p.requiredQuantity || p.quantity || 1
        }));

        if (isUser) {
            try {
                const apiItems = cartItemsToAdd.map((i: any) => ({
                    product: i.product._id,
                    quantity: i.quantity
                }));
                const res = await userApiClient.post('/user/cart/sync', { cartItems: apiItems });
                if (res.data.success) {
                    toast.success(`Bundle Added!`);
                    window.dispatchEvent(new Event('cart-updated'));
                    navigate('/shop-cart');
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
                const existsIndex = offlineItems.findIndex((p: any) => p.product?._id === newItem.product?._id);
                if (existsIndex > -1) {
                    offlineItems[existsIndex].quantity += newItem.quantity;
                } else {
                    offlineItems.push(newItem);
                }
            });

            localStorage.setItem('offlineCart', JSON.stringify(offlineItems));
            toast.success(`Bundle Added Offline!`);
            window.dispatchEvent(new Event('cart-updated'));
            navigate('/shop-cart');
        }
    };

    if (loading) {
        return (
            <div className="page-content bg-white d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 fw-bold text-primary">Loading Offer Details...</p>
                </div>
            </div>
        );
    }

    if (!combo) return null;

    const isLimitReached = (combo.maxUsagePerOrder ?? 0) > 0 && getComboSetsInCart(combo) >= combo.maxUsagePerOrder;

    return (
        <div className="page-content bg-white">

            {/* Breadcrumb */}
            <div className="bg-light py-3">
                <div className="container">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                            <li className="breadcrumb-item"><Link to="/combo-offers">Combo Offers</Link></li>
                            <li className="breadcrumb-item active text-primary" aria-current="page">{combo.offerName}</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <section className="content-inner pb-5">
                <div className="container">
                    <div className="row g-5">
                        {/* Image Section */}
                        <div className="col-lg-6 position-relative">
                            <div className="combo-image-wrapper sticky-top" style={{ top: '100px', zIndex: 1 }}>
                                <img 
                                    src={combo.imageUrl} 
                                    alt={combo.imageAltText || combo.offerName} 
                                    className="img-fluid rounded-4 shadow-sm w-100" 
                                    style={{ objectFit: 'cover' }} 
                                />
                                {combo.productBadge && (
                                    <span className="badge bg-primary position-absolute top-0 start-0 m-3 p-2 px-3 fw-bold rounded-pill shadow-sm" style={{ fontSize: '13px' }}>
                                        {combo.productBadge}
                                    </span>
                                )}
                                {combo.promotionalBadge && (
                                    <span className="badge bg-danger position-absolute top-0 end-0 m-3 p-2 px-3 fw-bold shadow-sm" style={{ fontSize: '13px', borderRadius: '8px' }}>
                                        {combo.promotionalBadge}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="col-lg-6">
                            <div className="mb-4">
                                <h1 className="fw-900 mb-2 display-6 text-dark" style={{ lineHeight: '1.2' }}>{combo.offerName}</h1>
                                {combo.subtitle && <h4 className="text-muted fw-normal mb-3">{combo.subtitle}</h4>}
                                
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="price-section">
                                        <div className="d-flex align-items-baseline gap-2">
                                            <span className="text-dark fw-900" style={{ fontSize: '32px' }}>₹{combo.comboPrice}</span>
                                            <del className="text-muted fs-5">₹{combo.totalMRP}</del>
                                        </div>
                                    </div>
                                    <div className="savings-badge bg-success text-white px-3 py-1 rounded-pill fw-bold shadow-sm" style={{ fontSize: '14px' }}>
                                        Save ₹{combo.savings} ({combo.savingsPercent}%)
                                    </div>
                                </div>

                                {combo.tagline && <div className="alert alert-primary bg-primary bg-opacity-10 border-0 fw-bold text-primary mb-4 p-3 rounded-3">{combo.tagline}</div>}
                                
                                {combo.shortDescription && <p className="lead text-secondary mb-4">{combo.shortDescription}</p>}
                                
                                {(combo.maxUsagePerOrder ?? 0) > 0 && (
                                    <p className="text-danger fw-bold small mb-3"><i className="fa-solid fa-triangle-exclamation me-1"></i> Limit {combo.maxUsagePerOrder} combos per customer order</p>
                                )}

                                <div className="d-grid gap-2 mb-4">
                                    <button 
                                        className={`btn btn-lg rounded-pill fw-bold shadow-sm ${isLimitReached ? 'btn-secondary' : 'btn-primary'}`} 
                                        onClick={handleAddToCart}
                                        disabled={isLimitReached}
                                        style={{ padding: '16px 20px', fontSize: '18px' }}
                                    >
                                        {isLimitReached ? 'Limit Reached' : (combo.ctaLabel || 'Grab This Deal')}
                                    </button>
                                    {combo.supportingCtaLabel && (
                                        <div className="text-center mt-2 small text-muted fw-bold">{combo.supportingCtaLabel}</div>
                                    )}
                                </div>
                            </div>

                            {/* Accordion Sections */}
                            <div className="accordion custom-accordion" id="comboDetailsAccordion">
                                
                                {/* What's Inside */}
                                {combo.products && combo.products.length > 0 && (
                                    <div className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden">
                                        <button className="accordion-button bg-transparent fw-bold text-dark p-4 shadow-none" onClick={() => toggleSection('products')} aria-expanded={expandedSections.products}>
                                            <Package className="me-2 text-primary" size={20} /> What's Inside
                                            <span className="ms-auto">{expandedSections.products ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                                        </button>
                                        <div className={`accordion-collapse collapse ${expandedSections.products ? 'show' : ''}`}>
                                            <div className="accordion-body pt-0 px-4 pb-4">
                                                <div className="d-flex flex-column gap-3">
                                                    {combo.products.map((p: any, idx: number) => (
                                                        <div key={idx} className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 shadow-sm border border-light">
                                                            {p.productId?.images?.[0] && (
                                                                <img src={p.productId.images[0]} alt={p.productId.productName} className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                                                            )}
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-1 fw-bold">
                                                                    <Link to={`/product/${p.productId?._id}`} className="text-dark text-decoration-none">{p.productId?.productName || 'Product'}</Link>
                                                                </h6>
                                                                <div className="small text-muted">
                                                                    {p.comboRole && <span className="badge bg-secondary me-2">{p.comboRole}</span>}
                                                                    Qty: <b>{p.quantity || p.requiredQuantity}</b>
                                                                </div>
                                                                {p.comboRoleDescription && <div className="small text-secondary mt-1">{p.comboRoleDescription}</div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Overview & Routine */}
                                {(combo.overviewTitle || combo.overviewDescription || combo.routineLabel || combo.targetConcerns?.length > 0) && (
                                    <div className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden">
                                        <button className="accordion-button bg-transparent fw-bold text-dark p-4 shadow-none" onClick={() => toggleSection('routine')} aria-expanded={expandedSections.routine}>
                                            <CheckCircle className="me-2 text-primary" size={20} /> {combo.overviewTitle || 'Overview & Routine'}
                                            <span className="ms-auto">{expandedSections.routine ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                                        </button>
                                        <div className={`accordion-collapse collapse ${expandedSections.routine ? 'show' : ''}`}>
                                            <div className="accordion-body pt-0 px-4 pb-4">
                                                {combo.overviewDescription && <p className="text-secondary">{combo.overviewDescription}</p>}
                                                {combo.routineLabel && <div className="alert alert-secondary border-0 text-center fw-bold text-uppercase mt-3 mb-3">{combo.routineLabel}</div>}
                                                {combo.targetConcerns?.length > 0 && (
                                                    <div className="mt-3">
                                                        <h6 className="fw-bold mb-2">Targets:</h6>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {combo.targetConcerns.map((tc: string, i: number) => (
                                                                <span key={i} className="badge bg-white text-dark border px-3 py-2 rounded-pill">{tc}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Why Special */}
                                {(combo.whySpecial?.length > 0 || combo.whoMayBenefit?.length > 0 || combo.resultsAndExpectations?.length > 0) && (
                                    <div className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden">
                                        <button className="accordion-button bg-transparent fw-bold text-dark p-4 shadow-none" onClick={() => toggleSection('whySpecial')} aria-expanded={expandedSections.whySpecial}>
                                            <CheckCircle className="me-2 text-primary" size={20} /> Why It's Special
                                            <span className="ms-auto">{expandedSections.whySpecial ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                                        </button>
                                        <div className={`accordion-collapse collapse ${expandedSections.whySpecial ? 'show' : ''}`}>
                                            <div className="accordion-body pt-0 px-4 pb-4">
                                                {combo.whySpecial?.length > 0 && (
                                                    <div className="mb-4">
                                                        <ul className="list-unstyled">
                                                            {combo.whySpecial.map((item: string, i: number) => (
                                                                <li key={i} className="d-flex align-items-start mb-2">
                                                                    <i className="fa-solid fa-star text-warning mt-1 me-2" style={{ fontSize: '12px' }}></i>
                                                                    <span className="text-secondary">{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                
                                                {combo.whoMayBenefit?.length > 0 && (
                                                    <div className="mb-4">
                                                        <h6 className="fw-bold mb-2">Who It's For:</h6>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {combo.whoMayBenefit.map((item: string, i: number) => (
                                                                <span key={i} className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill fw-bold">{item}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {combo.resultsAndExpectations?.length > 0 && (
                                                    <div>
                                                        <h6 className="fw-bold mb-2">What to Expect:</h6>
                                                        <ul className="list-unstyled">
                                                            {combo.resultsAndExpectations.map((item: string, i: number) => (
                                                                <li key={i} className="d-flex align-items-start mb-2">
                                                                    <i className="fa-solid fa-check text-success mt-1 me-2" style={{ fontSize: '12px' }}></i>
                                                                    <span className="text-secondary">{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* How to Use */}
                                {(combo.howToUseSteps?.length > 0 || combo.recommendedRoutine) && (
                                    <div className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden">
                                        <button className="accordion-button bg-transparent fw-bold text-dark p-4 shadow-none" onClick={() => toggleSection('howToUse')} aria-expanded={expandedSections.howToUse}>
                                            <CheckCircle className="me-2 text-primary" size={20} /> How To Use
                                            <span className="ms-auto">{expandedSections.howToUse ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                                        </button>
                                        <div className={`accordion-collapse collapse ${expandedSections.howToUse ? 'show' : ''}`}>
                                            <div className="accordion-body pt-0 px-4 pb-4">
                                                {combo.howToUseSteps?.length > 0 && (
                                                    <div className="steps-container mb-4">
                                                        {combo.howToUseSteps.map((step: any, i: number) => (
                                                            <div key={i} className="d-flex mb-3">
                                                                <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: '30px', height: '30px', fontSize: '14px' }}>
                                                                    {i + 1}
                                                                </div>
                                                                <div className="ms-3">
                                                                    <h6 className="fw-bold mb-1">{step.title}</h6>
                                                                    <p className="text-secondary small mb-0">{step.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {combo.recommendedRoutine && (
                                                    <div className="bg-white p-3 rounded-3 border">
                                                        <h6 className="fw-bold mb-2 text-primary">Pro Tip</h6>
                                                        <p className="text-secondary small mb-0">{combo.recommendedRoutine}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Safety Info */}
                                {(combo.safetyInformation?.length > 0 || combo.patchTestGuidance || combo.storageInstructions || combo.disclaimer) && (
                                    <div className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden">
                                        <button className="accordion-button bg-transparent fw-bold text-dark p-4 shadow-none" onClick={() => toggleSection('safety')} aria-expanded={expandedSections.safety}>
                                            <CheckCircle className="me-2 text-primary" size={20} /> Safety & Storage
                                            <span className="ms-auto">{expandedSections.safety ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                                        </button>
                                        <div className={`accordion-collapse collapse ${expandedSections.safety ? 'show' : ''}`}>
                                            <div className="accordion-body pt-0 px-4 pb-4">
                                                {combo.patchTestGuidance && (
                                                    <div className="mb-3">
                                                        <h6 className="fw-bold mb-1">Patch Test</h6>
                                                        <p className="text-secondary small">{combo.patchTestGuidance}</p>
                                                    </div>
                                                )}
                                                {combo.safetyInformation?.length > 0 && (
                                                    <div className="mb-3">
                                                        <h6 className="fw-bold mb-2">Safety Info</h6>
                                                        <ul className="list-unstyled">
                                                            {combo.safetyInformation.map((item: string, i: number) => (
                                                                <li key={i} className="text-secondary small mb-1">• {item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {combo.storageInstructions && (
                                                    <div className="mb-3">
                                                        <h6 className="fw-bold mb-1">Storage</h6>
                                                        <p className="text-secondary small">{combo.storageInstructions}</p>
                                                    </div>
                                                )}
                                                {combo.disclaimer && (
                                                    <div className="alert alert-secondary small py-2 mb-0 border-0">
                                                        <b>Disclaimer:</b> {combo.disclaimer}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* FAQs */}
                                {combo.faqs?.length > 0 && (
                                    <div className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden">
                                        <button className="accordion-button bg-transparent fw-bold text-dark p-4 shadow-none" onClick={() => toggleSection('faq')} aria-expanded={expandedSections.faq}>
                                            <CheckCircle className="me-2 text-primary" size={20} /> Common Questions
                                            <span className="ms-auto">{expandedSections.faq ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                                        </button>
                                        <div className={`accordion-collapse collapse ${expandedSections.faq ? 'show' : ''}`}>
                                            <div className="accordion-body pt-0 px-4 pb-4">
                                                <div className="accordion" id="innerFaqAccordion">
                                                    {combo.faqs.map((faq: any, i: number) => (
                                                        <div key={i} className="mb-3 border-bottom pb-2">
                                                            <h6 className="fw-bold mb-2">{faq.question}</h6>
                                                            <p className="text-secondary small mb-0">{faq.answer}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <style>{`
                .custom-accordion .accordion-button::after {
                    display: none;
                }
                .custom-accordion .accordion-button:focus {
                    box-shadow: none;
                }
                .combo-image-wrapper {
                    position: sticky;
                    top: 100px;
                }
            `}</style>
        </div>
    );
};

export default ComboOfferDetails;
