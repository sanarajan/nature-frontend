import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    X, 
    Eye, 
    Upload, 
    ExternalLink, 
    Power, 
    AlertTriangle, 
    CheckCircle, 
    Handshake 
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';
import './AdminSponsors.css';

export interface Sponsor {
    _id: string;
    companyName: string;
    companyType: string;
    websiteUrl: string;
    imageUrl: string;
    imagePublicId?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

const isValidWebsiteUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const AdminSponsors: React.FC = () => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for Add/Edit/View
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [companyType, setCompanyType] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [newImageData, setNewImageData] = useState<string>('');
    const [newImageName, setNewImageName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirmation dialog state (Delete and Activate/Deactivate)
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'delete' | 'toggle-status';
        sponsor: Sponsor | null;
        targetStatus?: 'active' | 'inactive';
        loading: boolean;
    }>({
        isOpen: false,
        type: 'delete',
        sponsor: null,
        loading: false
    });

    const fetchSponsors = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/admin/sponsors');
            if (res.data.success) {
                setSponsors(res.data.data || []);
            }
        } catch (err: any) {
            console.error('Failed to fetch sponsors:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch sponsors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, []);

    const resetForm = () => {
        setCompanyName('');
        setCompanyType('');
        setWebsiteUrl('');
        setStatus('active');
        setExistingImageUrl('');
        setNewImageData('');
        setNewImageName('');
        setSelectedSponsor(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', sponsor: Sponsor | null = null) => {
        resetForm();
        setModalMode(mode);
        if (sponsor) {
            setSelectedSponsor(sponsor);
            setCompanyName(sponsor.companyName);
            setCompanyType(sponsor.companyType);
            setWebsiteUrl(sponsor.websiteUrl);
            setStatus(sponsor.status);
            setExistingImageUrl(sponsor.imageUrl);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        resetForm();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPG, PNG, WEBP, GIF, SVG).');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setNewImageName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            setNewImageData(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = companyName.trim();
        const trimmedType = companyType.trim();
        let trimmedUrl = websiteUrl.trim();

        if (!trimmedName) {
            toast.error('Company Name is required.');
            return;
        }

        if (!trimmedType) {
            toast.error('Company Type is required.');
            return;
        }

        if (!trimmedUrl) {
            toast.error('Website URL is required.');
            return;
        }

        // Validate URL format and scheme
        if (!isValidWebsiteUrl(trimmedUrl)) {
            toast.error('Website URL must start with http:// or https:// and be a valid URL.');
            return;
        }

        if (modalMode === 'add' && !newImageData) {
            toast.error('Company logo or promotional image is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                companyName: trimmedName,
                companyType: trimmedType,
                websiteUrl: trimmedUrl,
                status
            };

            if (newImageData) {
                payload.fileData = newImageData;
            }

            let res;
            if (modalMode === 'add') {
                res = await apiClient.post('/admin/sponsors', payload);
            } else if (modalMode === 'edit' && selectedSponsor) {
                res = await apiClient.put(`/admin/sponsors/${selectedSponsor._id}`, payload);
            }

            if (res?.data?.success) {
                toast.success(
                    modalMode === 'add' 
                        ? 'Sponsor created successfully.' 
                        : 'Sponsor updated successfully.'
                );
                handleCloseModal();
                fetchSponsors();
            }
        } catch (err: any) {
            console.error('Failed to save sponsor:', err);
            toast.error(err.response?.data?.message || 'Something went wrong while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open confirmation dialog for delete
    const openDeleteConfirm = (sponsor: Sponsor) => {
        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            sponsor,
            loading: false
        });
    };

    // Open confirmation dialog for toggle status
    const openToggleStatusConfirm = (sponsor: Sponsor) => {
        const targetStatus = sponsor.status === 'active' ? 'inactive' : 'active';
        setConfirmDialog({
            isOpen: true,
            type: 'toggle-status',
            sponsor,
            targetStatus,
            loading: false
        });
    };

    const closeConfirmDialog = () => {
        if (confirmDialog.loading) return;
        setConfirmDialog({
            isOpen: false,
            type: 'delete',
            sponsor: null,
            loading: false
        });
    };

    const handleConfirmAction = async () => {
        const { type, sponsor, targetStatus } = confirmDialog;
        if (!sponsor) return;

        setConfirmDialog(prev => ({ ...prev, loading: true }));
        try {
            if (type === 'delete') {
                const res = await apiClient.delete(`/admin/sponsors/${sponsor._id}`);
                if (res.data.success) {
                    toast.success(`Sponsor "${sponsor.companyName}" deleted successfully.`);
                    closeConfirmDialog();
                    fetchSponsors();
                }
            } else if (type === 'toggle-status') {
                const res = await apiClient.patch(`/admin/sponsors/${sponsor._id}/toggle-status`, {
                    status: targetStatus
                });
                if (res.data.success) {
                    toast.success(
                        `Sponsor "${sponsor.companyName}" status set to ${targetStatus === 'active' ? 'Active' : 'Inactive'}.`
                    );
                    closeConfirmDialog();
                    fetchSponsors();
                }
            }
        } catch (err: any) {
            console.error('Action failed:', err);
            toast.error(err.response?.data?.message || 'Action failed. Please try again.');
            setConfirmDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const filteredSponsors = sponsors.filter(s => 
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.websiteUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container" style={{ position: 'relative' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sponsors</h1>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Manage company sponsors, partner brands, website links, and logos.
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary-admin" onClick={() => handleOpenModal('add')}>
                        <Plus size={18} /> Add Sponsor
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by company or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                        Total: {filteredSponsors.length} {filteredSponsors.length === 1 ? 'Sponsor' : 'Sponsors'}
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Sl No.</th>
                                <th>Logo / Image</th>
                                <th>Company Name</th>
                                <th>Company Type</th>
                                <th>Website URL</th>
                                <th>Status</th>
                                <th>Added On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #cbd5e1', borderTopColor: '#1e523b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 8 }}></div>
                                        <div>Loading sponsors...</div>
                                    </td>
                                </tr>
                            ) : filteredSponsors.length > 0 ? (
                                filteredSponsors.map((sponsor, index) => (
                                    <tr key={sponsor._id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="sponsor-logo-cell">
                                                {sponsor.imageUrl ? (
                                                    <img 
                                                        src={sponsor.imageUrl} 
                                                        alt={sponsor.companyName} 
                                                        className="sponsor-logo-img"
                                                        onError={(e: any) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="sponsor-logo-placeholder">No Image</div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#1e293b' }}>
                                            {sponsor.companyName}
                                        </td>
                                        <td>
                                            <span className="company-type-tag">
                                                {sponsor.companyType}
                                            </span>
                                        </td>
                                        <td>
                                            <a 
                                                href={sponsor.websiteUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="sponsor-url-link"
                                                title={sponsor.websiteUrl}
                                            >
                                                <span>{sponsor.websiteUrl}</span>
                                                <ExternalLink size={13} style={{ flexShrink: 0 }} />
                                            </a>
                                        </td>
                                        <td>
                                            <button 
                                                className={`status-badge-btn ${sponsor.status}`}
                                                onClick={() => openToggleStatusConfirm(sponsor)}
                                                title="Click to change status"
                                            >
                                                {sponsor.status === 'active' ? (
                                                    <>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {formatDate(sponsor.createdAt)}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="action-btn" 
                                                    title="View Details" 
                                                    onClick={() => handleOpenModal('view', sponsor)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn" 
                                                    title="Edit Sponsor" 
                                                    onClick={() => handleOpenModal('edit', sponsor)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn" 
                                                    title={sponsor.status === 'active' ? 'Deactivate Sponsor' : 'Activate Sponsor'}
                                                    onClick={() => openToggleStatusConfirm(sponsor)}
                                                    style={{ color: sponsor.status === 'active' ? '#16a34a' : '#94a3b8' }}
                                                >
                                                    <Power size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn delete" 
                                                    title="Delete Sponsor" 
                                                    onClick={() => openDeleteConfirm(sponsor)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <Handshake size={36} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>
                                            {searchTerm ? 'No matching sponsors found.' : 'No sponsors added yet.'}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
                                            {searchTerm ? 'Try adjusting your search criteria.' : 'Click "+ Add Sponsor" to create your first sponsor record.'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit / View Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay" onClick={handleCloseModal}>
                    <div 
                        className="admin-modal" 
                        style={{ maxWidth: '620px', padding: '32px', margin: 'auto' }} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
                                {modalMode === 'add' ? 'Add New Sponsor' : 
                                 modalMode === 'edit' ? 'Edit Sponsor' : 'Sponsor Details'}
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal} style={{ position: 'static' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {modalMode === 'view' && selectedSponsor ? (
                            <div className="sponsor-view-card">
                                <div className="sponsor-view-header">
                                    <img 
                                        src={selectedSponsor.imageUrl} 
                                        alt={selectedSponsor.companyName} 
                                        className="sponsor-view-logo"
                                    />
                                    <div className="sponsor-view-info">
                                        <h3>{selectedSponsor.companyName}</h3>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className="company-type-tag">{selectedSponsor.companyType}</span>
                                            <span className={`status-badge-btn ${selectedSponsor.status}`} style={{ cursor: 'default' }}>
                                                {selectedSponsor.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="sponsor-detail-grid">
                                    <div className="sponsor-detail-item">
                                        <label>Website URL</label>
                                        <a 
                                            href={selectedSponsor.websiteUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="sponsor-url-link"
                                        >
                                            {selectedSponsor.websiteUrl}
                                            <ExternalLink size={13} />
                                        </a>
                                    </div>

                                    <div className="sponsor-detail-item">
                                        <label>Added Date</label>
                                        <span>{formatDate(selectedSponsor.createdAt)}</span>
                                    </div>

                                    <div className="sponsor-detail-item">
                                        <label>Last Updated</label>
                                        <span>{formatDate(selectedSponsor.updatedAt)}</span>
                                    </div>

                                    <div className="sponsor-detail-item">
                                        <label>Status</label>
                                        <span style={{ textTransform: 'capitalize' }}>{selectedSponsor.status}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        type="button"
                                        className="btn-primary-admin"
                                        onClick={() => handleOpenModal('edit', selectedSponsor)}
                                    >
                                        <Edit2 size={16} /> Edit Details
                                    </button>
                                    <button 
                                        type="button"
                                        className="confirm-btn-cancel"
                                        onClick={handleCloseModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Company Name <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="admin-input" 
                                        style={{ width: '100%' }}
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g., Pure Herbals, Eco Botanics"
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Company Type / Category <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="admin-input" 
                                        style={{ width: '100%' }}
                                        value={companyType}
                                        onChange={(e) => setCompanyType(e.target.value)}
                                        placeholder="e.g., Skincare Brand, Wellness Partner, Organic Products"
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Website URL <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input 
                                        type="url" 
                                        className="admin-input" 
                                        style={{ width: '100%' }}
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        required
                                    />
                                    <small style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                                        Must start with <code>http://</code> or <code>https://</code>.
                                    </small>
                                </div>

                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Status
                                    </label>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                            <input 
                                                type="radio" 
                                                name="sponsorStatus" 
                                                value="active"
                                                checked={status === 'active'}
                                                onChange={() => setStatus('active')}
                                            />
                                            Active
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                            <input 
                                                type="radio" 
                                                name="sponsorStatus" 
                                                value="inactive"
                                                checked={status === 'inactive'}
                                                onChange={() => setStatus('inactive')}
                                            />
                                            Inactive
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Company Logo / Image {modalMode === 'add' && <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>
                                    
                                    <div 
                                        className="image-upload-dropzone"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload size={24} style={{ color: '#1e523b', margin: '0 auto 8px' }} />
                                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                                            {modalMode === 'edit' ? 'Click to replace logo image' : 'Click to upload logo image'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
                                            Supported: JPG, PNG, WEBP, GIF, SVG (Max 5MB)
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                        style={{ display: 'none' }}
                                    />

                                    {/* Preview */}
                                    {(newImageData || existingImageUrl) && (
                                        <div className="image-preview-box">
                                            <img 
                                                src={newImageData || existingImageUrl} 
                                                alt="Preview" 
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {newImageName || 'Current Image'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {newImageData ? 'New image selected' : 'Existing image in database'}
                                                </div>
                                            </div>
                                            {newImageData && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setNewImageData('');
                                                        setNewImageName('');
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                                    title="Remove newly selected image"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button 
                                        type="button" 
                                        className="confirm-btn-cancel" 
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn-primary-admin"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                                                Saving...
                                            </>
                                        ) : (
                                            modalMode === 'add' ? 'Create Sponsor' : 'Update Sponsor'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Polished Confirmation Dialog for Delete / Status Toggle */}
            {confirmDialog.isOpen && confirmDialog.sponsor && (
                <div className="confirm-dialog-overlay" onClick={closeConfirmDialog}>
                    <div className="confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
                        <div className={`confirm-dialog-icon ${confirmDialog.type === 'delete' ? 'danger' : confirmDialog.targetStatus === 'active' ? 'success' : 'warning'}`}>
                            {confirmDialog.type === 'delete' ? (
                                <AlertTriangle size={28} />
                            ) : confirmDialog.targetStatus === 'active' ? (
                                <CheckCircle size={28} />
                            ) : (
                                <Power size={28} />
                            )}
                        </div>

                        <h3 className="confirm-dialog-title">
                            {confirmDialog.type === 'delete' 
                                ? 'Delete Sponsor?' 
                                : `${confirmDialog.targetStatus === 'active' ? 'Activate' : 'Deactivate'} Sponsor?`}
                        </h3>

                        <p className="confirm-dialog-message">
                            {confirmDialog.type === 'delete' ? (
                                <>
                                    Are you sure you want to permanently delete <span className="confirm-dialog-target">{confirmDialog.sponsor.companyName}</span>? This action cannot be undone.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to {confirmDialog.targetStatus === 'active' ? 'activate' : 'deactivate'} <span className="confirm-dialog-target">{confirmDialog.sponsor.companyName}</span> ({confirmDialog.sponsor.companyType})?
                                </>
                            )}
                        </p>

                        <div className="confirm-dialog-actions">
                            <button 
                                type="button" 
                                className="confirm-btn-cancel" 
                                onClick={closeConfirmDialog}
                                disabled={confirmDialog.loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className={`confirm-btn-confirm ${confirmDialog.type === 'delete' ? 'danger' : 'success'}`}
                                onClick={handleConfirmAction}
                                disabled={confirmDialog.loading}
                            >
                                {confirmDialog.loading ? (
                                    'Processing...'
                                ) : confirmDialog.type === 'delete' ? (
                                    'Yes, Delete'
                                ) : (
                                    `Yes, ${confirmDialog.targetStatus === 'active' ? 'Activate' : 'Deactivate'}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSponsors;
