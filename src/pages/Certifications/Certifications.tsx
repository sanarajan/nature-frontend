import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

interface Certification {
    _id: string;
    name: string;
    fileUrl: string;
}

const Certifications: React.FC = () => {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);

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
                            {certifications.map((cert) => (
                                <div key={cert._id} className="col-lg-4 col-md-6 col-sm-12 m-b30">
                                    <div className="dz-box style-1 text-center bg-white p-4 rounded shadow-sm h-100 d-flex flex-column align-items-center justify-content-between">
                                        <div className="dz-media mb-4" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {cert.fileUrl.endsWith('.pdf') ? (
                                                <i className="fas fa-file-pdf text-danger" style={{ fontSize: '5rem' }}></i>
                                            ) : (
                                                <img src={cert.fileUrl} alt={cert.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                            )}
                                        </div>
                                        <div className="dz-info w-100">
                                            <h4 className="dz-title mb-3">{cert.name}</h4>
                                            <a 
                                                href={cert.fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="btn btn-primary btn-sm btn-hover-2"
                                            >
                                                View Document
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
