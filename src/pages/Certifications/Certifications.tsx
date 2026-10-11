import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';

interface Certification {
    _id: string;
    name: string;
    fileUrl: string;
    originalFileName?: string;
    pdfUrl?: string;
    originalPdfName?: string;
}

const Certifications: React.FC = () => {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

    const handleDownloadCertificate = async (cert: Certification, targetPdfUrl?: string) => {
        const urlToFetch = targetPdfUrl || cert.pdfUrl;
        if (!urlToFetch) {
            toast.error('Certificate document is not available for download.');
            return;
        }

        setDownloadingId(cert._id);
        try {
            const response = await fetch(urlToFetch);
            if (!response.ok) {
                throw new Error(`Download response status: ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const sanitizedName = cert.name.trim().replace(/[^a-zA-Z0-9_\- ]/g, '') || 'Certificate';
            link.download = `${sanitizedName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Error downloading certificate:', err);
            // Fallback: direct window.open in new tab
            try {
                window.open(urlToFetch, '_blank');
            } catch {
                toast.error('Failed to download certificate. Please try again.');
            }
        } finally {
            setDownloadingId(null);
        }
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
                                const downloadablePdfUrl = (cert.pdfUrl && cert.pdfUrl.trim() !== '') 
                                    ? cert.pdfUrl 
                                    : (cert.fileUrl && cert.fileUrl.toLowerCase().endsWith('.pdf') ? cert.fileUrl : null);

                                return (
                                    <div key={cert._id} className="col-lg-4 col-md-6 col-sm-12 m-b30">
                                        <div className="dz-box style-1 text-center bg-white p-4 rounded shadow-sm h-100 d-flex flex-column align-items-center justify-content-between">
                                            {/* 1. Uploaded Logo */}
                                            <div className="dz-media mb-4" style={{ height: '180px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {cert.fileUrl && !cert.fileUrl.toLowerCase().endsWith('.pdf') ? (
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

                                            {/* 2. Certification Name & 3. Download Certificate Button */}
                                            <div className="dz-info w-100">
                                                <h4 className="dz-title mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{cert.name}</h4>
                                                {downloadablePdfUrl ? (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleDownloadCertificate(cert, downloadablePdfUrl)} 
                                                        className="btn btn-primary btn-sm btn-hover-2"
                                                        disabled={downloadingId === cert._id}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                                    >
                                                        {downloadingId === cert._id ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                                Downloading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fa-solid fa-download"></i>
                                                                Download Certificate
                                                            </>
                                                        )}
                                                    </button>
                                                ) : null}
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
        </>
    );
};

export default Certifications;
