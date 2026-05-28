import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
    return (
        <>
            <div className="dz-bnr-inr" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>About us</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/"> Home</Link></li>
                                <li className="breadcrumb-item">About us</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
            {/* Our Mission Section */}
            <section className="content-inner bg-light">
                <div className="container">
                    <div className="row about-style2 align-items-center">
                        <div className="col-lg-5 col-md-12 col-sm-12 m-b30">
                            <div className="about-thumb">
                                <img src="/images/women.jpg" alt="" />
                            </div>
                        </div>
                        <div className="col-lg-7 col-md-12 col-sm-12 m-b30">
                            <div className="about-content">
                                <div className="section-head mb-4">
                                    <h3 className="title">A Brand Defined by Quality, Purity & Science</h3>
                                    <p className="m-b20"><strong>Naturalayam™</strong> is an international-standard natural science brand from India, built on the foundation of purity, research, and uncompromising quality. We bring together time-tested herbal wisdom and modern scientific formulation standards to create premium products that reflect India's authentic natural heritage in its most refined form.</p>
                                    <p className="m-b20">Every Naturalayam™ product is crafted using globally recognised, clinically studied, and scientifically proven natural ingredients sourced responsibly from India and trusted regions around the world.</p>
                                    <p className="m-b0">Our formulations are designed through a meticulous blend of herbal extracts, botanical actives, essential nutrients, plant oils, and evidence-based natural compounds, ensuring high efficacy, safety, and consistency.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="content-inner-1">
                <div className="container">
                    <div className="section-head text-center mb-5">
                        <h2 className="title">Product Excellence Across Categories</h2>
                    </div>
                    <div className="row justify-content-center">
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Skin Care</h4>
                                    <p className="m-b0">Face serums, creams, moisturizers, scrubs; created with potent botanical actives backed by natural science.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Hair Care</h4>
                                    <p className="m-b0">Herbal oils, scalp serums, mild herbal cleansers with clinically supported extracts.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Herbal Supplements</h4>
                                    <p className="m-b0">Liver support, metabolic wellness, women's wellness; crafted using scientifically studied herbal actives.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Herbal Teas & Wellness Blends</h4>
                                    <p className="m-b0">Premium botanical teas created for purity, balance, and everyday wellbeing.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Categories Section End */}

            {/* Get In Touch */}
            <section className="get-in-touch">
                <div className="m-r100 m-md-r0 m-sm-r0">
                    <h3 className="dz-title mb-lg-0 mb-3">Questions ?
                        <span>Our experts will help find the gear that’s right for you</span>
                    </h3>
                </div>
                <Link to="/contact" className="btn btn-white btn-hover-1">Get In Touch</Link>
            </section>
            {/* Get In Touch End */}

            {/* Team1 Section Start */}
            <section className="content-inner overlay-white-dark overflow-hidden">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-4 mb-lg-0 order-lg-1 order-2">
                            <div className="section-head style-2 wow fadeInUp m-md-r100 m-b30" data-wow-delay="0.1s">
                                <h2 className="title">What Makes Naturalayam™ Unique?</h2>
                                
                                <h5 className="m-b10 text-primary mt-4">Global-Standard Ingredients</h5>
                                <p className="m-b20">We use internationally respected natural and botanical actives like Hyaluronic Acid, Niacinamide, Ceramides, Squalane, Bakuchiol, Rosehip Oil, Licorice Extract, Aloe Vera, Green Tea, Gotu Kola, Silymarin, Curcumin, Omega-rich oils and more, all carefully balanced with India's traditional botanicals.</p>
                                
                                <h5 className="m-b10 text-primary mt-4">Hybrid Formulation Philosophy</h5>
                                <p className="m-b10">A fusion of:</p>
                                <ul className="about-list m-b20" style={{ paddingLeft: '20px' }}>
                                    <li>Advanced natural science</li>
                                    <li>Indian herbal knowledge</li>
                                    <li>Modern cosmetic chemistry</li>
                                    <li>Nutraceutical innovation</li>
                                </ul>
                                <p className="m-b20">This unique approach allows Naturalayam™ products to deliver visible results without compromising safety or purity.</p>
                                
                                <h5 className="m-b10 text-primary mt-4">High Performance, Clean Formulas</h5>
                                <p className="m-b20">No harmful additives - only nature-focused, safety-tested functional actives for gentle and effective results.</p>
                                
                                <h5 className="m-b10 text-primary mt-4">Premium Brand, International Appeal</h5>
                                <p className="m-b0">Every detail; formulation, compliance, quality checks, packaging, reflects global luxury standards with scientific clarity and modern natural aesthetics.</p>
                            </div>

                        </div>

                        <div className="col-lg-6  order-lg-2 order-1 mb-4 mb-xl-0">
                            <div className="row g-xl-4 g-md-4 g-3 m-0">
                                <div className="col-lg-12 wow fadeInUp" data-wow-delay="0.2s">
                                    <div className="about-thumb radius-1">
                                        <img src="/images/about/pic3.jpg" alt="" />
                                    </div>
                                </div>
                                <div className="col-xl-5 col-lg-5 col-sm-5 col-5 wow fadeInUp gx-0 mt-2"
                                    data-wow-delay="0.5s">
                                    <div className="about-thumb radius-1">
                                        <img src="/images/about/pic4.jpg" alt="" />
                                    </div>
                                </div>
                                <div className="col-xl-7 col-lg-7 col-sm-7 col-7 wow fadeInUp mt-2" data-wow-delay="0.4s">
                                    <div className="about-thumb radius-1">
                                        <img src="/images/about/pic5.jpg" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default About;