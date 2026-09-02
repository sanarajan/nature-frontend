import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';

const Contact: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [preference, setPreference] = useState('');
    const [message, setMessage] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        else if (name.trim().length < 2 || name.trim().length > 100) newErrors.name = 'Name must be between 2 and 100 characters';
        
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address';
        
        if (!preference.trim()) newErrors.preference = 'Please tell us what you prefer';
        
        if (!message.trim()) newErrors.message = 'Message is required';
        else if (message.trim().length < 5 || message.trim().length > 5000) newErrors.message = 'Message must be between 5 and 5000 characters';
        
        if (!captchaToken) newErrors.captcha = 'Please complete the security verification.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            toast.error('Please check the highlighted fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await axios.post(`${apiUrl}/contact/submit`, {
                name,
                email,
                preference,
                message,
                captchaToken
            });
            
            toast.success('Thank you. Your message has been sent successfully.');
            
            // Reset form
            setName('');
            setEmail('');
            setPreference('');
            setMessage('');
            setCaptchaToken(null);
            setErrors({});
            recaptchaRef.current?.reset();
        } catch (error: any) {
            const errMessage = error.response?.data?.message || 'Unable to send your message right now. Please try again later.';
            toast.error(errMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <>
            <div className="dz-bnr-inr" style={{ backgroundImage: "url('/images/background/bg5.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Contact us</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/"> Home</Link></li>
                                <li className="breadcrumb-item">Contact us</li>
                            </ul>
                        </nav>
                    </div>
                </div>  
            </div>
        
            <section className="content-inner bg-light contact-page">
                <style>
                    {`
                    .contact-page-container {
                        width: min(92%, 1280px);
                        margin: 0 auto;
                    }
                    .contact-form-field {
                        border: 1px solid #d0dcd5 !important;
                        border-radius: 10px !important;
                        height: 52px;
                        padding: 0 16px;
                        background-color: #fbfdfc !important;
                        transition: all 0.3s ease;
                        box-shadow: none !important;
                    }
                    .contact-form-field:focus {
                        border-color: var(--bs-primary, #66A589) !important;
                        box-shadow: 0 0 0 3px rgba(102, 165, 137, 0.15) !important;
                        background-color: #fff !important;
                        outline: none;
                    }
                    textarea.contact-form-field {
                        height: 150px;
                        padding: 16px;
                        resize: vertical;
                    }
                    .contact-form-label {
                        font-weight: 600;
                        margin-bottom: 10px;
                        color: #2c3e35;
                        font-size: 0.95rem;
                    }
                    .contact-form-group {
                        margin-bottom: 28px;
                    }
                    `}
                </style>
                <div className="contact-page-container">
                    <div className="row mb-5">
                        <div className="col-12">
                            <div className="section-head style-2 text-start mb-4">
                                <h2 className="title wow flipInX w-100" data-wow-delay="0.4s" style={{ visibility: 'visible', animationDelay: '0.4s', animationName: 'flipInX' }}>Let’s Talk</h2>
                                <p>Contact Us For a Quote. Help Or Join The Team!</p>
                            </div>
                            
                            <div className="contact-area3 wow fadeInUp" data-wow-delay="0.4s" >
                                <form className="dz-form dzForm row" onSubmit={handleSubmit}>
                                    <div className="col-md-6 contact-form-group">
                                        <label className="form-label contact-form-label">Your Name</label>
                                        <div className="input-group">
                                            <input required type="text" className="form-control contact-form-field" name="dzName" value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>
                                        {errors.name && <small className="text-danger mt-1 d-block">{errors.name}</small>}
                                    </div>
                                    <div className="col-md-6 contact-form-group">
                                        <label className="form-label contact-form-label">Email Address</label>
                                        <div className="input-group">
                                            <input required type="email" className="form-control contact-form-field" name="dzEmail" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                        {errors.email && <small className="text-danger mt-1 d-block">{errors.email}</small>}
                                    </div>
                                    <div className="col-12 contact-form-group">
                                        <label className="form-label contact-form-label">What You Prefer</label>
                                        <div className="input-group">
                                            <input required type="text" className="form-control contact-form-field" name="dzPhoneNumber" value={preference} onChange={(e) => setPreference(e.target.value)} />
                                        </div>
                                        {errors.preference && <small className="text-danger mt-1 d-block">{errors.preference}</small>}
                                    </div>
                                    <div className="col-12 contact-form-group">
                                        <label className="form-label contact-form-label">Message</label>
                                        <div className="input-group">
                                            <textarea name="dzMessage" rows={4} required className="form-control contact-form-field" value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                                        </div>
                                        {errors.message && <small className="text-danger mt-1 d-block">{errors.message}</small>}
                                    </div>
                                    <div className="col-12 form-group wow fadeInUp mb-4" data-wow-delay="0.8s" >
                                        <div className="custom-control custom-checkbox d-flex align-items-center">
                                            <input type="checkbox" className="form-check-input me-2" id="basic_checkbox_3" style={{ width: '18px', height: '18px', marginTop: 0 }} />
                                            <label className="form-check-label text-muted" htmlFor="basic_checkbox_3" style={{ fontSize: '0.95rem' }}>Save My Name, Email, This Browser for The Next Time i Message. </label>
                                        </div>
                                    </div>
                                    <div className="col-12 input-recaptcha m-b30">
                                        <ReCAPTCHA
                                            ref={recaptchaRef}
                                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LefsVUUAAAAADBPsLZzsNnETChealv6PYGzv3ZN"}
                                            onChange={(token) => { setCaptchaToken(token); setErrors({...errors, captcha: ''}) }}
                                        />
                                        {errors.captcha && <small className="text-danger mt-1 d-block">{errors.captcha}</small>}
                                    </div>
                                    <div className="col-12 mt-2">
                                        <button name="submit" type="submit" value="submit" className="btn btn-outline-secondary btn-lg btnhover px-5" disabled={isSubmitting}>
                                            {isSubmitting ? 'Sending...' : 'SUBMIT'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* New Contact Cards Section */}
                    <div className="row mt-5 pt-3">
                        {/* Card 1 */}
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="card shadow-sm h-100 border-0 contact-info-card" style={{ borderRadius: '15px' }}>
                                <div className="card-body p-4 text-start d-flex flex-column justify-content-center">
                                    <h5 className="card-title fw-bold text-dark mb-4 d-flex align-items-start" style={{ fontSize: '1.15rem', lineHeight: '1.4' }}>
                                        <i className="fas fa-map-marker-alt text-primary me-2 mt-1"></i>
                                        NATURALAYAM™ – HEAD OFFICE
                                    </h5>
                                    
                                    <div className="d-flex mb-3">
                                        <i className="fas fa-map-pin text-primary me-3 mt-1"></i>
                                        <div>
                                            <p className="card-text text-muted mb-1" style={{ lineHeight: '1.6', fontSize: '1rem' }}>
                                                Door No. 63/700, D Space, 6th Floor,<br/>
                                                Sky Tower, Mavoor Road Junction,<br/>
                                                Bank Road, Kozhikode - 673001
                                            </p>
                                            <small className="text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>Mavoor Road, Kozhikode</small>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="fas fa-envelope text-primary me-3"></i>
                                        <a href="mailto:info@naturalayam.com" className="text-muted fw-medium text-decoration-none" style={{ fontSize: '1rem' }}>info@naturalayam.com</a>
                                    </div>
                                    
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-phone-alt text-primary me-3"></i>
                                        <a href="tel:8009993008" className="text-muted fw-medium text-decoration-none" style={{ fontSize: '1rem' }}>
                                            +91 <span className="text-primary fw-bolder">800</span> 9993 008
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Card 2 */}
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="card shadow-sm h-100 border-0 contact-info-card" style={{ borderRadius: '15px' }}>
                                <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                    <i className="fas fa-truck text-primary mb-3" style={{ fontSize: '1.75rem' }}></i>
                                    
                                    <h5 className="card-title fw-bold text-dark mb-4" style={{ fontSize: '1.15rem', lineHeight: '1.4' }}>
                                        NATURALAYAM™<br/>DISTRIBUTION & FULFILMENT CENTRE
                                    </h5>
                                    
                                    <div className="mb-4">
                                        <p className="card-text text-muted mb-2" style={{ fontSize: '1rem' }}>
                                            Payyoli, Kozhikode
                                        </p>
                                        <span className="badge bg-light text-secondary border" style={{ fontSize: '0.85rem', fontWeight: '500', padding: '0.4rem 0.8rem', letterSpacing: '0.5px' }}>LOGISTICS / STORE</span>
                                    </div>
                                    
                                    <div className="d-flex align-items-center justify-content-center">
                                        <i className="fas fa-phone-alt text-primary me-2"></i>
                                        <a href="tel:+914962601096" className="text-muted fw-medium text-decoration-none" style={{ fontSize: '1rem' }}>+91 496 2601096</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="card shadow-sm h-100 border-0 contact-info-card" style={{ borderRadius: '15px' }}>
                                <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                    <i className="fas fa-handshake text-primary mb-3" style={{ fontSize: '1.75rem' }}></i>
                                    
                                    <h5 className="card-title fw-bold text-dark mb-4" style={{ fontSize: '1.15rem', lineHeight: '1.4' }}>
                                        MARKETING & SUPER STOCKIST PARTNER
                                    </h5>
                                    
                                    <div className="mb-4">
                                        <p className="card-text text-muted mb-0 fw-medium" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                                            A M HEALTHCARE GLOBAL DISTRIBUTORS
                                        </p>
                                    </div>
                                    
                                    <div className="d-flex align-items-center justify-content-center">
                                        <i className="fas fa-phone-alt text-primary me-2"></i>
                                        <a href="tel:+917902601096" className="text-muted fw-medium text-decoration-none" style={{ fontSize: '1rem' }}>+91 790 2601096</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* New Map Section */}
                    <div className="row mt-4 mb-5">
                        <div className="col-12 mb-3">
                            <h3 className="title fw-bold">Our Locations</h3>
                        </div>
                        <div className="col-12">
                            <div className="card shadow-sm border-0 overflow-hidden contact-locations-map bg-white" style={{ borderRadius: '15px' }}>
                                <div className="map-area style-3 w-100 position-relative p-0 m-0">
                                    <img src="/images/map/map4.png" alt="Map" className="w-100 h-auto d-block" />
                                    
                                    {/* Marker 1: Head Office */}
                                    <div className="wow updown-2 position-absolute" data-wow-delay="0.2s" style={{ top: '40%', left: '30%', transform: 'translate(-50%, -100%)', visibility: 'visible', animationDelay: '0.2s', animationName: 'updown-2' }}>
                                        <div className="p-2 bg-white shadow-sm text-center mb-1" style={{ borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            HEAD OFFICE<br/><span className="text-muted fw-normal">Kozhikode</span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="85" viewBox="0 0 56 85" fill="none" style={{ height: '40px', width: 'auto', margin: '0 auto', display: 'block' }}>
                                            <path d="M27.7396 4.50488C15.1409 4.50488 4.92627 14.7228 4.92627 27.3215C4.92627 39.9235 15.1409 50.1382 27.7429 50.1382C40.3449 50.1382 50.5596 39.9235 50.5596 27.3215C50.5596 14.7228 40.3416 4.50488 27.7396 4.50488ZM27.7396 46.4106C17.199 46.4106 8.65386 37.8655 8.65386 27.3248C8.65386 16.7842 17.199 8.23576 27.7396 8.23576C38.2803 8.23576 46.8254 16.7809 46.8254 27.3215C46.8254 37.8622 38.2803 46.4106 27.7396 46.4106Z" fill="#66A589"/>
                                            <path d="M27.7396 0C12.4176 0 0 12.4209 0 27.7396C0 28.4409 0.0329295 29.1555 0.095495 29.8898C1.85721 50.7373 27.7396 84.6675 27.7396 84.6675C27.7396 84.6675 51.4881 53.5363 55.0379 32.5933C55.3243 30.9008 55.4824 29.2773 55.4824 27.7396C55.4824 12.4209 43.0615 0 27.7396 0ZM27.7396 47.9317C18.9343 47.9317 11.4166 42.4128 8.45951 34.6448C7.59018 32.3628 7.116 29.8898 7.116 27.3082C7.116 15.918 16.3493 6.68133 27.7396 6.68133C39.1298 6.68133 48.3664 15.9147 48.3664 27.3082C48.3664 30.5155 47.6321 33.5549 46.3248 36.2649C42.9924 43.1669 35.9225 47.9317 27.7396 47.9317Z" fill="#41705B"/>
                                        </svg>
                                    </div>

                                    {/* Marker 2: Distribution Centre */}
                                    <div className="wow updown-2 position-absolute" data-wow-delay="0.4s" style={{ top: '35%', left: '60%', transform: 'translate(-50%, -100%)', visibility: 'visible', animationDelay: '0.4s', animationName: 'updown-2' }}>
                                        <div className="p-2 bg-white shadow-sm text-center mb-1" style={{ borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            DISTRIBUTION<br/><span className="text-muted fw-normal">Payyoli</span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="47" viewBox="0 0 34 47" fill="none" style={{ height: '35px', width: 'auto', margin: '0 auto', display: 'block' }}>
                                            <path d="M16.9593 5.10059C10.41 5.10059 5.10303 10.4115 5.10303 16.9568C5.10303 23.5061 10.4139 28.8131 16.9593 28.8131C23.5086 28.8131 28.8155 23.5061 28.8155 16.9568C28.8155 10.4075 23.5086 5.10059 16.9593 5.10059ZM16.9593 26.8761C11.4817 26.8761 7.04004 22.4344 7.04004 16.9568C7.04004 11.4792 11.4777 7.0376 16.9593 7.0376C22.4369 7.0376 26.8785 11.4792 26.8785 16.9568C26.8785 22.4344 22.4369 26.8761 16.9593 26.8761Z" fill="#66A589"/>
                                            <path d="M16.9594 2.75879C8.99702 2.75879 2.54297 9.21284 2.54297 17.1752C2.54297 17.5404 2.55884 17.9135 2.5906 18.2946C3.50353 29.1267 16.9554 46.7583 16.9554 46.7583C16.9554 46.7583 29.2959 30.5795 31.1416 19.6957C31.2925 18.8185 31.3719 17.973 31.3719 17.1713C31.3758 9.21284 24.9218 2.75879 16.9594 2.75879ZM16.9594 27.666C12.3828 27.666 8.47705 24.7962 6.94094 20.7595C6.48844 19.5727 6.24234 18.2906 6.24234 16.945C6.24234 11.0268 11.0412 6.22794 16.9594 6.22794C22.8776 6.22794 27.6765 11.0268 27.6765 16.945C27.6765 18.6121 27.2954 20.1919 26.6167 21.601C24.886 25.1932 21.2105 27.666 16.9594 27.666Z" fill="#41705B"/>
                                        </svg>
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

export default Contact;
