import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, Upload, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';

interface Certification {
    _id: string;
    name: string;
    fileUrl: string;
    originalFileName?: string;
    pdfUrl?: string;
    originalPdfName?: string;
    createdAt: string;
}

const AdminCertifications: React.FC = () => {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [originalFileName, setOriginalFileName] = useState('');
    const [filePreview, setFilePreview] = useState<string>(''); // Base64 preview for Logo
    const fileInputRef = useRef<HTMLInputElement>(null);

    // PDF Form State
    const [pdfUrl, setPdfUrl] = useState('');
    const [originalPdfName, setOriginalPdfName] = useState('');
    const [pdfData, setPdfData] = useState<string>(''); // Base64 data for PDF
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedCertId, setSelectedCertId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    const fetchCertifications = async () => {
        try {
            const res = await apiClient.get('/admin/certifications');
            if (res.data.success) {
                setCertifications(res.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch certifications', err);
        }
    };

    useEffect(() => {
        fetchCertifications();
    }, []);

    const resetForm = () => {
        setName('');
        setFileUrl('');
        setOriginalFileName('');
        setFilePreview('');
        setPdfUrl('');
        setOriginalPdfName('');
        setPdfData('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (pdfInputRef.current) {
            pdfInputRef.current.value = '';
        }
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', cert: Certification | null = null) => {
        resetForm();
        setModalMode(mode);
        
        if (cert) {
            setSelectedCertId(cert._id);
            setName(cert.name);
            setFileUrl(cert.fileUrl);
            setOriginalFileName(cert.originalFileName || '');
            setFilePreview(cert.fileUrl);
            setPdfUrl(cert.pdfUrl || '');
            setOriginalPdfName(cert.originalPdfName || '');
            setPdfData('');
        } else {
            setSelectedCertId(null);
        }
        
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                toast.error('Only JPG, JPEG, PNG, WEBP, and GIF image files are allowed for Logo.');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            // Check size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Logo image size exceeds the 5MB limit.');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            
            setOriginalFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) {
                toast.error('Only PDF files are allowed for Certificate Upload.');
                if (pdfInputRef.current) {
                    pdfInputRef.current.value = '';
                }
                return;
            }

            // Check size (max 15MB)
            if (file.size > 15 * 1024 * 1024) {
                toast.error('Certificate PDF size exceeds the 15MB limit.');
                if (pdfInputRef.current) {
                    pdfInputRef.current.value = '';
                }
                return;
            }

            setOriginalPdfName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPdfData(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error('Certification name is required and cannot be empty or whitespace only.');
            return;
        }

        if (modalMode === 'add') {
            if (!filePreview || !filePreview.startsWith('data:')) {
                toast.error('Logo image is required.');
                return;
            }
            if (!pdfData || !pdfData.startsWith('data:application/pdf;base64,')) {
                toast.error('Certificate PDF is required.');
                return;
            }
        }

        setLoading(true);
        try {
            const payload: any = {
                name: trimmedName,
                originalFileName,
                originalPdfName
            };
            
            // Only send fileData if a new logo was selected
            if (filePreview && filePreview.startsWith('data:')) {
                payload.fileData = filePreview;
            }

            // Only send pdfData if a new PDF was selected
            if (pdfData && pdfData.startsWith('data:')) {
                payload.pdfData = pdfData;
            }

            let res;
            if (modalMode === 'add') {
                res = await apiClient.post('/admin/certifications', payload);
            } else {
                res = await apiClient.put(`/admin/certifications/${selectedCertId}`, payload);
            }

            if (res.data.success) {
                if (modalMode === 'add') {
                    toast.success('Certification added successfully.');
                } else {
                    toast.success('Certification updated successfully.');
                }
                fetchCertifications();
                handleCloseModal();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.1rem', fontWeight: 600 }}>Delete Certification?</h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666' }}>This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                try {
                                    const res = await apiClient.delete(`/admin/certifications/${id}`);
                                    if (res.data.success) {
                                        toast.success('Certification deleted successfully.');
                                        fetchCertifications();
                                    }
                                } catch (error: any) {
                                    toast.error(error.response?.data?.message || 'Failed to delete certification.');
                                }
                            }}
                            style={{ padding: '6px 12px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={closeToast as any}
                            style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
        );
    };

    const filteredCertifications = certifications.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container" style={{ position: 'relative' }}>
            <div className="page-header">
                <h1 className="page-title">Certifications</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin" onClick={() => handleOpenModal('add')}>
                        <Plus size={18} /> Add Certification
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search certifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Sl No.</th>
                                <th>Certification Name</th>
                                <th>Logo</th>
                                <th>Certificate PDF</th>
                                <th>Added On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCertifications.length > 0 ? (
                                filteredCertifications.map((cert, index) => (
                                    <tr key={cert._id}>
                                        <td>{index + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{cert.name}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {cert.fileUrl ? (
                                                    <img src={cert.fileUrl} alt={cert.name} style={{ width: 60, height: 40, objectFit: 'contain', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                                                ) : (
                                                    <div style={{ width: 60, height: 40, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: '#94a3b8', fontSize: 12 }}>No Logo</div>
                                                )}
                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {cert.originalFileName || 'logo image'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {cert.pdfUrl ? (
                                                <a 
                                                    href={cert.pdfUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#dc2626', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                                                    title="View / Download PDF"
                                                >
                                                    <FileText size={16} />
                                                    <span>{cert.originalPdfName || 'Download PDF'}</span>
                                                </a>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No PDF</span>
                                            )}
                                        </td>
                                        <td>{formatDate(cert.createdAt)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="action-btn" title="View Details" onClick={() => handleOpenModal('view', cert)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="action-btn" title="Edit Certification" onClick={() => handleOpenModal('edit', cert)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="action-btn delete" title="Delete Certification" onClick={() => handleDelete(cert._id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="empty-state">
                                        No certifications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="modal-header">
                            <h2>
                                {modalMode === 'add' ? 'Add New Certification' : 
                                 modalMode === 'edit' ? 'Edit Certification' : 'View Certification'}
                            </h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleSubmit} className="admin-form">
                                <div className="form-group">
                                    <label>Certification Name <span className="required">*</span></label>
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        placeholder="e.g., ISO 9001, FSSAI License"
                                        disabled={modalMode === 'view'}
                                        required
                                    />
                                </div>
                                
                                {/* Logo Upload Section */}
                                <div className="form-group">
                                    <label>Logo Upload {modalMode === 'add' && <span className="required">*</span>}</label>
                                    
                                    {modalMode !== 'add' && fileUrl && (
                                        <div style={{ marginBottom: '15px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>
                                                Current Logo: <br />
                                                <strong>{originalFileName || 'Existing Logo'}</strong>
                                            </div>
                                            <img src={fileUrl} alt="Current Logo Preview" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '4px' }} />
                                        </div>
                                    )}

                                    {modalMode !== 'view' && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-primary-admin"
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}
                                            >
                                                <Upload size={16} /> 
                                                {modalMode === 'edit' ? 'Upload New Logo' : 'Upload Logo'}
                                            </button>
                                            
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleLogoChange} 
                                                accept="image/jpeg, image/jpg, image/png, image/webp, image/gif" 
                                                style={{ display: 'none' }} 
                                            />
                                        </>
                                    )}
                                    
                                    {/* Show new selected logo preview */}
                                    {filePreview && (modalMode === 'add' || (modalMode === 'edit' && filePreview.startsWith('data:'))) && (
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>
                                                {modalMode === 'add' ? 'Selected Logo:' : 'Selected New Logo:'} <br />
                                                <strong>{originalFileName}</strong>
                                            </div>
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img src={filePreview} alt="New Logo Preview" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '8px', border: '1px dashed #cbd5e1', padding: '4px', background: '#f8fafc' }} />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setFilePreview('');
                                                        setOriginalFileName('');
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                                    title="Remove Selected Logo"
                                                >
                                                    <X size={14} color="#ef4444" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Certificate Upload (PDF) Section */}
                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label>Certificate Upload (PDF) {modalMode === 'add' && <span className="required">*</span>}</label>

                                    {modalMode !== 'add' && pdfUrl && (
                                        <div style={{ marginBottom: '15px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>
                                                Current Certificate PDF:
                                            </div>
                                            <a 
                                                href={pdfUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
                                            >
                                                <FileText size={18} />
                                                <span>{originalPdfName || 'Download Current Certificate PDF'}</span>
                                            </a>
                                        </div>
                                    )}

                                    {modalMode !== 'view' && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-primary-admin"
                                                onClick={() => pdfInputRef.current?.click()}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}
                                            >
                                                <Upload size={16} /> 
                                                {modalMode === 'edit' ? 'Upload New Certificate (PDF)' : 'Upload Certificate (PDF)'}
                                            </button>
                                            
                                            <input 
                                                type="file" 
                                                ref={pdfInputRef} 
                                                onChange={handlePdfChange} 
                                                accept="application/pdf,.pdf" 
                                                style={{ display: 'none' }} 
                                            />
                                        </>
                                    )}

                                    {/* Show new selected PDF info */}
                                    {pdfData && (
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>
                                                {modalMode === 'add' ? 'Selected Certificate PDF:' : 'Selected New Certificate PDF:'}
                                            </div>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                                                <FileText size={20} color="#dc2626" />
                                                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{originalPdfName}</span>
                                                {modalMode !== 'view' && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            setPdfData('');
                                                            setOriginalPdfName('');
                                                            if (pdfInputRef.current) pdfInputRef.current.value = '';
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                                        title="Remove Selected PDF"
                                                    >
                                                        <X size={16} color="#ef4444" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {modalMode !== 'view' && (
                                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                        <button 
                                            type="button" 
                                            className="cancel-btn" 
                                            onClick={handleCloseModal} 
                                            disabled={loading}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '12px',
                                                border: '1px solid #cbd5e1',
                                                background: '#fff',
                                                color: '#334155',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn-primary-admin" 
                                            disabled={loading}
                                            style={{ justifyContent: 'center' }}
                                        >
                                            {loading ? 'Saving...' : modalMode === 'add' ? 'Add Certification' : 'Update Certification'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCertifications;
