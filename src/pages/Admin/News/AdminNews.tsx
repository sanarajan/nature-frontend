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
    Newspaper
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';
import './AdminNews.css';

export interface NewsItem {
    _id: string;
    title: string;
    summary?: string;
    content?: string;
    publishedDate: string;
    imageUrl: string;
    imagePublicId?: string;
    websiteUrl?: string;
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

const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
};

const AdminNews: React.FC = () => {
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for Add/Edit/View
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [publishedDate, setPublishedDate] = useState(getTodayDateString());
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [newImageData, setNewImageData] = useState<string>('');
    const [newImageName, setNewImageName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirmation dialog state (Delete and Status toggle)
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'delete' | 'toggle-status';
        newsItem: NewsItem | null;
        targetStatus?: 'active' | 'inactive';
        loading: boolean;
    }>({
        isOpen: false,
        type: 'delete',
        newsItem: null,
        loading: false
    });

    const fetchNews = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/admin/news');
            if (res.data.success) {
                setNewsList(res.data.data || []);
            }
        } catch (err: any) {
            console.error('Failed to fetch news:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch cosmetic news');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const resetForm = () => {
        setTitle('');
        setSummary('');
        setContent('');
        setPublishedDate(getTodayDateString());
        setWebsiteUrl('');
        setStatus('active');
        setExistingImageUrl('');
        setNewImageData('');
        setNewImageName('');
        setSelectedNews(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleOpenModal = async (mode: 'add' | 'edit' | 'view', item: NewsItem | null = null) => {
        resetForm();
        setModalMode(mode);

        if (item) {
            setSelectedNews(item);
            setTitle(item.title);
            setSummary(item.summary || '');
            setContent(item.content || '');
            if (item.publishedDate) {
                try {
                    setPublishedDate(new Date(item.publishedDate).toISOString().split('T')[0]);
                } catch {
                    setPublishedDate(getTodayDateString());
                }
            }
            setWebsiteUrl(item.websiteUrl || '');
            setStatus(item.status);
            setExistingImageUrl(item.imageUrl);

            // Fetch fresh details from backend for edit/view
            if (mode === 'edit' || mode === 'view') {
                try {
                    const res = await apiClient.get(`/admin/news/${item._id}`);
                    if (res.data.success && res.data.data) {
                        const fresh = res.data.data;
                        setSelectedNews(fresh);
                        setTitle(fresh.title);
                        setSummary(fresh.summary || '');
                        setContent(fresh.content || '');
                        if (fresh.publishedDate) {
                            try {
                                setPublishedDate(new Date(fresh.publishedDate).toISOString().split('T')[0]);
                            } catch {}
                        }
                        setWebsiteUrl(fresh.websiteUrl || '');
                        setStatus(fresh.status);
                        setExistingImageUrl(fresh.imageUrl);
                    }
                } catch (fetchErr) {
                    console.warn('Could not fetch single news details, using cached row item:', fetchErr);
                }
            }
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
        const trimmedTitle = title.trim();
        const trimmedSummary = summary.trim();
        const trimmedContent = content.trim();
        const trimmedUrl = websiteUrl.trim();

        if (!trimmedTitle) {
            toast.error('News title is required.');
            return;
        }

        if (trimmedUrl && !isValidWebsiteUrl(trimmedUrl)) {
            toast.error('Website URL must start with http:// or https:// and be a valid URL.');
            return;
        }

        if (modalMode === 'add' && !newImageData) {
            toast.error('News cover image is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                title: trimmedTitle,
                summary: trimmedSummary,
                content: trimmedContent,
                publishedDate: publishedDate ? new Date(publishedDate).toISOString() : new Date().toISOString(),
                websiteUrl: trimmedUrl,
                status
            };

            if (newImageData) {
                payload.fileData = newImageData;
            }

            let res;
            if (modalMode === 'add') {
                res = await apiClient.post('/admin/news', payload);
            } else if (modalMode === 'edit' && selectedNews) {
                res = await apiClient.put(`/admin/news/${selectedNews._id}`, payload);
            }

            if (res?.data?.success) {
                toast.success(
                    modalMode === 'add' 
                        ? 'News article created successfully.' 
                        : 'News article updated successfully.'
                );
                handleCloseModal();
                fetchNews();
            }
        } catch (err: any) {
            console.error('Failed to save news:', err);
            toast.error(err.response?.data?.message || 'Something went wrong while saving news article.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (newsItem: NewsItem) => {
        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            newsItem,
            loading: false
        });
    };

    const openToggleStatusConfirm = (newsItem: NewsItem) => {
        const targetStatus = newsItem.status === 'active' ? 'inactive' : 'active';
        setConfirmDialog({
            isOpen: true,
            type: 'toggle-status',
            newsItem,
            targetStatus,
            loading: false
        });
    };

    const closeConfirmDialog = () => {
        if (confirmDialog.loading) return;
        setConfirmDialog({
            isOpen: false,
            type: 'delete',
            newsItem: null,
            loading: false
        });
    };

    const handleConfirmAction = async () => {
        const { type, newsItem, targetStatus } = confirmDialog;
        if (!newsItem) return;

        setConfirmDialog(prev => ({ ...prev, loading: true }));
        try {
            if (type === 'delete') {
                const res = await apiClient.delete(`/admin/news/${newsItem._id}`);
                if (res.data.success) {
                    toast.success(`News item "${newsItem.title}" deleted successfully.`);
                    closeConfirmDialog();
                    fetchNews();
                }
            } else if (type === 'toggle-status') {
                const res = await apiClient.patch(`/admin/news/${newsItem._id}/toggle-status`, {
                    status: targetStatus
                });
                if (res.data.success) {
                    toast.success(
                        `News item "${newsItem.title}" status set to ${targetStatus === 'active' ? 'Active' : 'Inactive'}.`
                    );
                    closeConfirmDialog();
                    fetchNews();
                }
            }
        } catch (err: any) {
            console.error('Action failed:', err);
            toast.error(err.response?.data?.message || 'Action failed. Please try again.');
            setConfirmDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const filteredNews = newsList.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="admin-page-container" style={{ position: 'relative' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Cosmetic News</h1>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Manage beauty and cosmetic articles, news cards, published dates, and cover images.
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary-admin" onClick={() => handleOpenModal('add')}>
                        <Plus size={18} /> Add News
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search news by title or summary..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                        Total: {filteredNews.length} {filteredNews.length === 1 ? 'Article' : 'Articles'}
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Sl No.</th>
                                <th>Thumbnail</th>
                                <th>Title</th>
                                <th>Summary</th>
                                <th>Published Date</th>
                                <th>Article URL</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #cbd5e1', borderTopColor: '#1e523b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 8 }}></div>
                                        <div>Loading cosmetic news...</div>
                                    </td>
                                </tr>
                            ) : filteredNews.length > 0 ? (
                                filteredNews.map((item, index) => (
                                    <tr key={item._id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="news-thumbnail-cell">
                                                {item.imageUrl ? (
                                                    <img 
                                                        src={item.imageUrl} 
                                                        alt={item.title} 
                                                        className="news-thumbnail-img"
                                                        onError={(e: any) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="news-thumbnail-placeholder">No Image</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="news-title-cell" title={item.title}>
                                                {item.title}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="news-summary-cell" title={item.summary || 'No summary'}>
                                                {item.summary || <span style={{ color: '#cbd5e1' }}>—</span>}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                            {formatDate(item.publishedDate)}
                                        </td>
                                        <td>
                                            {item.websiteUrl ? (
                                                <a 
                                                    href={item.websiteUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="news-url-link"
                                                    title={item.websiteUrl}
                                                >
                                                    <span>{item.websiteUrl}</span>
                                                    <ExternalLink size={13} style={{ flexShrink: 0 }} />
                                                </a>
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <button 
                                                className={`status-badge-btn ${item.status}`}
                                                onClick={() => openToggleStatusConfirm(item)}
                                                title="Click to toggle status"
                                            >
                                                {item.status === 'active' ? (
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
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="action-btn" 
                                                    title="View Details" 
                                                    onClick={() => handleOpenModal('view', item)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn" 
                                                    title="Edit News" 
                                                    onClick={() => handleOpenModal('edit', item)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn" 
                                                    title={item.status === 'active' ? 'Deactivate News' : 'Activate News'}
                                                    onClick={() => openToggleStatusConfirm(item)}
                                                    style={{ color: item.status === 'active' ? '#16a34a' : '#94a3b8' }}
                                                >
                                                    <Power size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn delete" 
                                                    title="Delete News" 
                                                    onClick={() => openDeleteConfirm(item)}
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
                                        <Newspaper size={36} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>
                                            {searchTerm ? 'No matching news found.' : 'No cosmetic news added yet.'}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
                                            {searchTerm ? 'Try adjusting your search criteria.' : 'Click "+ Add News" to publish your first cosmetic news card.'}
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
                        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', margin: 'auto' }} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
                                {modalMode === 'add' ? 'Add New Cosmetic News' : 
                                 modalMode === 'edit' ? 'Edit Cosmetic News' : 'News Article Details'}
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal} style={{ position: 'static' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {modalMode === 'view' && selectedNews ? (
                            <div className="news-view-card">
                                <div className="news-view-header">
                                    {selectedNews.imageUrl ? (
                                        <img 
                                            src={selectedNews.imageUrl} 
                                            alt={selectedNews.title} 
                                            className="news-view-cover"
                                        />
                                    ) : (
                                        <div className="news-thumbnail-placeholder" style={{ width: 140, height: 95 }}>No Image</div>
                                    )}
                                    <div className="news-view-info" style={{ flex: 1, minWidth: 0 }}>
                                        <h3>{selectedNews.title}</h3>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className={`status-badge-btn ${selectedNews.status}`} style={{ cursor: 'default' }}>
                                                {selectedNews.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                Published: {formatDate(selectedNews.publishedDate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="news-detail-grid">
                                    <div className="news-detail-item">
                                        <label>Published Date</label>
                                        <span>{formatDate(selectedNews.publishedDate)}</span>
                                    </div>

                                    <div className="news-detail-item">
                                        <label>Article Link</label>
                                        {selectedNews.websiteUrl ? (
                                            <a 
                                                href={selectedNews.websiteUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="news-url-link"
                                            >
                                                {selectedNews.websiteUrl}
                                                <ExternalLink size={13} />
                                            </a>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>None provided</span>
                                        )}
                                    </div>

                                    <div className="news-detail-item">
                                        <label>Created At</label>
                                        <span>{formatDate(selectedNews.createdAt)}</span>
                                    </div>

                                    <div className="news-detail-item">
                                        <label>Last Updated</label>
                                        <span>{formatDate(selectedNews.updatedAt)}</span>
                                    </div>
                                </div>

                                {selectedNews.summary && (
                                    <div className="news-view-section">
                                        <label>Summary / Short Description</label>
                                        <p>{selectedNews.summary}</p>
                                    </div>
                                )}

                                {selectedNews.content && (
                                    <div className="news-view-section">
                                        <label>Full Content</label>
                                        <p>{selectedNews.content}</p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        type="button"
                                        className="btn-primary-admin"
                                        onClick={() => handleOpenModal('edit', selectedNews)}
                                    >
                                        <Edit2 size={16} /> Edit Article
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
                                        News Title <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="admin-input" 
                                        style={{ width: '100%' }}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Organic Skincare Trends That Are Taking Over 2026"
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Summary / Short Description
                                    </label>
                                    <textarea 
                                        className="admin-input" 
                                        style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder="Short excerpt or description shown on homepage cards..."
                                        rows={2}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Full Content (Optional)
                                    </label>
                                    <textarea 
                                        className="admin-input" 
                                        style={{ width: '100%', minHeight: '90px', resize: 'vertical' }}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Full article content or extended story..."
                                        rows={4}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                            Published Date <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            className="admin-input" 
                                            style={{ width: '100%' }}
                                            value={publishedDate}
                                            onChange={(e) => setPublishedDate(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                            Status
                                        </label>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '42px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                                <input 
                                                    type="radio" 
                                                    name="newsStatus" 
                                                    value="active"
                                                    checked={status === 'active'}
                                                    onChange={() => setStatus('active')}
                                                />
                                                Active
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                                <input 
                                                    type="radio" 
                                                    name="newsStatus" 
                                                    value="inactive"
                                                    checked={status === 'inactive'}
                                                    onChange={() => setStatus('inactive')}
                                                />
                                                Inactive
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '18px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Article URL / Destination (Optional)
                                    </label>
                                    <input 
                                        type="url" 
                                        className="admin-input" 
                                        style={{ width: '100%' }}
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        placeholder="https://example.com/cosmetic-news/article-slug"
                                    />
                                    <small style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                                        If provided, must start with <code>http://</code> or <code>https://</code>.
                                    </small>
                                </div>

                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Cover Image {modalMode === 'add' && <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>
                                    
                                    <div 
                                        className="image-upload-dropzone"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload size={24} style={{ color: '#1e523b', margin: '0 auto 8px' }} />
                                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                                            {modalMode === 'edit' ? 'Click to replace cover image' : 'Click to upload news cover image'}
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
                                                    {newImageData ? 'New image selected' : 'Existing image from server'}
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
                                            modalMode === 'add' ? 'Publish News' : 'Update News'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmation Dialog for Delete / Status Toggle */}
            {confirmDialog.isOpen && confirmDialog.newsItem && (
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
                                ? 'Delete Cosmetic News?' 
                                : `${confirmDialog.targetStatus === 'active' ? 'Activate' : 'Deactivate'} News?`}
                        </h3>

                        <p className="confirm-dialog-message">
                            {confirmDialog.type === 'delete' ? (
                                <>
                                    Are you sure you want to permanently delete <span className="confirm-dialog-target">"{confirmDialog.newsItem.title}"</span>? This action cannot be undone.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to {confirmDialog.targetStatus === 'active' ? 'activate' : 'deactivate'} <span className="confirm-dialog-target">"{confirmDialog.newsItem.title}"</span>?
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

export default AdminNews;
