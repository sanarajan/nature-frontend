import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

interface Certification {
    _id: string;
    name: string;
    fileUrl: string;
    originalFileName?: string;
    certificateImageUrl?: string;
    originalCertificateName?: string;
    pdfUrl?: string;
    originalPdfName?: string;
    description?: string;
}

const isImageUrl = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.pdf') || url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('/pdfs/')) return false;
    return true;
};

const Certifications: React.FC = () => {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCertForImage, setSelectedCertForImage] = useState<Certification | null>(null);
    const [selectedCertForDetails, setSelectedCertForDetails] = useState<Certification | null>(null);
    const [certImageError, setCertImageError] = useState(false);
    const [detailsImageError, setDetailsImageError] = useState(false);

    useEffect(() => {
        const fetchCertifications = async () => {
            try {
                const res = await apiClient.get('/user/certifications');
                if (res.data.success) {
                    setCertifications(res.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch certifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCertifications();
    }, []);

    const openCertificateModal = (cert: Certification) => {
        setCertImageError(false);
        setSelectedCertForImage(cert);
    };

    const openDetailsModal = (cert: Certification) => {
        setDetailsImageError(false);
        setSelectedCertForDetails(cert);
    };

    return (
        <>
            <div className="dz-bnr-inr" style={{ backgroundImage: "url('/images/background/bg-shape.jpg')", backgroundColor: '#f5f5f5' }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Our Certifications</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/"> Home</Link></li>
                                <li className="breadcrumb-item">Certifications</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <section className="content-inner bg-light">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-md-12 text-center m-b50">
                            <h2 className="title">Quality You Can Trust</h2>
                            <p>We adhere to the highest standards of quality and purity. Explore our official certifications and licenses below.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : certifications.length > 0 ? (
                        <div className="row">
                            {certifications.map((cert) => {
                                return (
                                    <div key={cert._id} className="col-lg-4 col-md-6 col-sm-12 m-b30">
                                        <div className="dz-box style-1 text-center bg-white p-4 rounded shadow-sm h-100 d-flex flex-column align-items-center justify-content-between">
                                            {/* 1. Uploaded Logo */}
                                            <div className="dz-media mb-4" style={{ height: '180px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {cert.fileUrl && isImageUrl(cert.fileUrl) ? (
                                                    <img 
                                                        src={cert.fileUrl} 
                                                        alt={cert.name} 
                                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                                                    />
                                                ) : (
                                                    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8' }}>
                                                        <i className="fas fa-certificate text-primary" style={{ fontSize: '4rem' }}></i>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. Certification Name & Action Buttons */}
                                            <div className="dz-info w-100">
                                                <h4 className="dz-title mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{cert.name}</h4>
                                                <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => openCertificateModal(cert)} 
                                                        className="btn btn-primary btn-sm btn-hover-2"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <i className="fa-solid fa-award"></i>
                                                        Certificate
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => openDetailsModal(cert)} 
                                                        className="btn btn-outline-primary btn-sm btn-hover-2"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <i className="fa-solid fa-circle-info"></i>
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <h4 className="text-muted">No certifications available at the moment.</h4>
                        </div>
                    )}
                </div>
            </section>

            {/* 1. Certificate Image Lightbox / Modal */}
            {selectedCertForImage && (() => {
                const certImgUrl = (selectedCertForImage.certificateImageUrl && isImageUrl(selectedCertForImage.certificateImageUrl))
                    ? selectedCertForImage.certificateImageUrl
                    : (selectedCertForImage.pdfUrl && isImageUrl(selectedCertForImage.pdfUrl))
                        ? selectedCertForImage.pdfUrl
                        : null;
                const hasValidImage = certImgUrl && !certImageError;

                return (
                    <div 
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setSelectedCertForImage(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 99999,
                            padding: '20px'
                        }}
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#ffffff',
                                borderRadius: '16px',
                                maxWidth: '850px',
                                width: '100%',
                                maxHeight: '90vh',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                position: 'relative'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '16px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #f1f5f9',
                                background: '#fafafa'
                            }}>
                                <h5 style={{ margin: 0, fontWeight: 600, color: '#1e293b', fontSize: '1.15rem' }}>
                                    {selectedCertForImage.name}
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCertForImage(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '26px',
                                        lineHeight: 1,
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}
                                    aria-label="Close"
                                    title="Close"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Modal Body: Centered, Contained Certificate Image */}
                            <div style={{
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'auto',
                                backgroundColor: '#f8fafc',
                                minHeight: '260px'
                            }}>
                                {hasValidImage ? (
                                    <img 
                                        src={certImgUrl} 
                                        alt={`${selectedCertForImage.name} Certificate`} 
                                        onError={() => setCertImageError(true)}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '70vh',
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                        }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
                                        <i className="fas fa-award text-primary mb-3" style={{ fontSize: '3.5rem' }}></i>
                                        <h5 style={{ fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Official Certificate</h5>
                                        <p style={{ margin: 0, fontSize: '0.95rem' }}>Certificate image preview will be displayed once an image is uploaded in the admin panel.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* 2. View Details Modal */}
            {selectedCertForDetails && (() => {
                const detailsImgUrl = (selectedCertForDetails.certificateImageUrl && isImageUrl(selectedCertForDetails.certificateImageUrl))
                    ? selectedCertForDetails.certificateImageUrl
                    : (selectedCertForDetails.fileUrl && isImageUrl(selectedCertForDetails.fileUrl))
                        ? selectedCertForDetails.fileUrl
                        : null;
                const hasValidDetailsImage = detailsImgUrl && !detailsImageError;

                return (
                    <div 
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setSelectedCertForDetails(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 99999,
                            padding: '20px'
                        }}
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#ffffff',
                                borderRadius: '16px',
                                maxWidth: '620px',
                                width: '100%',
                                maxHeight: '90vh',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                position: 'relative'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '18px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #f1f5f9',
                                background: '#fafafa'
                            }}>
                                <h5 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1.2rem' }}>
                                    {selectedCertForDetails.name}
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCertForDetails(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '26px',
                                        lineHeight: 1,
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}
                                    aria-label="Close"
                                    title="Close"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{
                                padding: '24px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px'
                            }}>
                                {/* Certificate Image / Logo preview */}
                                {hasValidDetailsImage && (
                                    <div style={{
                                        textAlign: 'center',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '180px'
                                    }}>
                                        <img 
                                            src={detailsImgUrl} 
                                            alt={selectedCertForDetails.name} 
                                            onError={() => setDetailsImageError(true)}
                                            style={{
                                                maxHeight: '220px',
                                                maxWidth: '100%',
                                                objectFit: 'contain',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Description section (only rendered if description exists and is not empty) */}
                                {selectedCertForDetails.description && selectedCertForDetails.description.trim() !== '' ? (
                                    <div>
                                        <h6 style={{ fontWeight: 600, color: '#334155', marginBottom: '8px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Description
                                        </h6>
                                        <p style={{
                                            margin: 0,
                                            color: '#475569',
                                            lineHeight: 1.7,
                                            fontSize: '0.95rem',
                                            whiteSpace: 'pre-line'
                                        }}>
                                            {selectedCertForDetails.description}
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            {/* Footer with Close Button */}
                            <div style={{
                                padding: '14px 24px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                background: '#fafafa'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCertForDetails(null)}
                                    className="btn btn-primary btn-sm btn-hover-2"
                                    style={{ minWidth: '90px' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
};

export default Certifications;
