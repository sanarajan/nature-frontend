import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE_URL } from '../../constants/apiConstants';


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
            const apiUrl = API_BASE_URL ;
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
                    
{/* Interactive Google Maps Section */}
<div className="row mt-4 mb-5">
    <div className="col-12 mb-3">
        <h3 className="title fw-bold">Our Locations</h3>
    </div>

    <div className="col-12">
        <div
            className="card shadow-sm border-0 overflow-hidden bg-white"
            style={{ borderRadius: '15px' }}
        >
            <div className="row g-0">
                {/* Head Office */}
                <div className="col-lg-6">
                    <div className="p-3 p-md-4">
                        <h5 className="fw-bold mb-2">
                            NATURALAYAM™ – HEAD OFFICE
                        </h5>
                        <p className="text-muted mb-3">
                            Door No. 63/700, D Space, 6th Floor,
                            Sky Tower, Mavoor Road Junction,
                            Bank Road, Kozhikode - 673001
                        </p>

                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '350px',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}
                        >
                            <iframe
                                title="Naturalayam Head Office - Kozhikode"
                                src="https://maps.google.com/maps?q=Door%20No.%2063%2F700%2C%20D%20Space%2C%20Sky%20Tower%2C%20Mavoor%20Road%2C%20Kozhikode%2C%20Kerala%20673001&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        <a
                            href="https://www.google.com/maps/search/?api=1&query=Door+No+63%2F700+D+Space+Sky+Tower+Mavoor+Road+Kozhikode+Kerala+673001"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-secondary mt-3"
                        >
                            <i className="fas fa-map-marker-alt me-2"></i>
                            Open in Google Maps
                        </a>
                    </div>
                </div>

                {/* Distribution Centre */}
                <div className="col-lg-6">
                    <div className="p-3 p-md-4">
                        <h5 className="fw-bold mb-2">
                            NATURALAYAM™ – DISTRIBUTION & FULFILMENT CENTRE
                        </h5>
                        <p className="text-muted mb-3">
                            Payyoli, Kozhikode, Kerala
                        </p>

                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '350px',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}
                        >
                            <iframe
                                title="Naturalayam Distribution Centre - Payyoli"
                                src="https://maps.google.com/maps?q=Payyoli%2C%20Kozhikode%2C%20Kerala%2C%20India&t=&z=14&ie=UTF8&iwloc=&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        <a
                            href="https://www.google.com/maps/search/?api=1&query=Payyoli%2C+Kozhikode%2C+Kerala%2C+India"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-secondary mt-3"
                        >
                            <i className="fas fa-map-marker-alt me-2"></i>
                            Open in Google Maps
                        </a>
                    </div>
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
