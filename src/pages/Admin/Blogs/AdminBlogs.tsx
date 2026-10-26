import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Eye,
    Upload,
    AlertTriangle,
    BookOpen,
    Clock,
    Check
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminBlogService } from '../../../services/admin/adminBlogService';
import type { BlogItem } from '../../../services/admin/adminBlogService';
import { RichTextEditor, isRichTextEmpty } from '../../../components/Admin/RichTextEditor/RichTextEditor';
import { formatDate } from '../../../utils/formatDate';
import '../../../styles/admin-pages.css';
import './AdminBlogs.css';

// Helper to strip HTML tags for clean table preview text
const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

const AdminBlogs: React.FC = () => {
    const [blogs, setBlogs] = useState<BlogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for Add / Edit / View
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [newImageData, setNewImageData] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirmation dialog state for Delete
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        blogItem: BlogItem | null;
        loading: boolean;
    }>({
        isOpen: false,
        blogItem: null,
        loading: false
    });

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const data = await adminBlogService.getBlogs();
            setBlogs(data);
        } catch (err: any) {
            console.error('Failed to fetch blogs:', err);
            toast.error(err.response?.data?.message || 'Failed to load blogs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setStatus('active');
        setExistingImageUrl('');
        setNewImageData('');
        setSelectedBlog(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', item: BlogItem | null = null) => {
        resetForm();
        setModalMode(mode);

        if (item) {
            setSelectedBlog(item);
            setTitle(item.title);
            setDescription(item.description || '');
            setStatus(item.status);
            setExistingImageUrl(item.imageUrl);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        resetForm();
    };

    // Image Upload & Validation
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

        const reader = new FileReader();
        reader.onload = () => {
            setNewImageData(reader.result as string);
        };
        reader.onerror = () => {
            toast.error('Failed to read image file.');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveSelectedImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNewImageData('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Form Submission (Add & Edit)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            toast.error('Blog title is required and cannot be empty.');
            return;
        }

        if (modalMode === 'add' && !newImageData) {
            toast.error('Blog cover image is required.');
            return;
        }

        if (isRichTextEmpty(description)) {
            toast.error('Blog description/content is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode === 'add') {
                await adminBlogService.createBlog({
                    title: trimmedTitle,
                    description,
                    imageUrl: existingImageUrl,
                    fileData: newImageData,
                    status
                });
                toast.success('Blog created successfully!');
            } else if (modalMode === 'edit' && selectedBlog) {
                await adminBlogService.updateBlog(selectedBlog._id, {
                    title: trimmedTitle,
                    description,
                    imageUrl: existingImageUrl,
                    fileData: newImageData || undefined,
                    status
                });
                toast.success('Blog updated successfully!');
            }

            handleCloseModal();
            fetchBlogs();
        } catch (err: any) {
            console.error('Failed to save blog:', err);
            toast.error(err.response?.data?.message || err.message || 'Something went wrong while saving the blog.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle Status
    const handleToggleStatus = async (item: BlogItem) => {
        try {
            const updated = await adminBlogService.toggleStatus(item._id);
            setBlogs(prev => prev.map(b => b._id === updated._id ? updated : b));
            toast.success(`Blog is now ${updated.status}.`);
        } catch (err: any) {
            console.error('Failed to toggle blog status:', err);
            toast.error(err.response?.data?.message || 'Failed to update blog status.');
        }
    };

    // Delete Blog Handlers
    const openDeleteConfirm = (item: BlogItem) => {
        setDeleteDialog({
            isOpen: true,
            blogItem: item,
            loading: false
        });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.blogItem) return;
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        try {
            await adminBlogService.deleteBlog(deleteDialog.blogItem._id);
            toast.success('Blog deleted successfully.');
            setDeleteDialog({ isOpen: false, blogItem: null, loading: false });
            fetchBlogs();
        } catch (err: any) {
            console.error('Failed to delete blog:', err);
            toast.error(err.response?.data?.message || 'Failed to delete blog.');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    // Search Filtering
    const filteredBlogs = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return blogs;
        return blogs.filter(b => 
            b.title.toLowerCase().includes(query) ||
            stripHtml(b.description).toLowerCase().includes(query)
        );
    }, [blogs, searchTerm]);

    return (
        <div className="admin-page-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={28} style={{ color: '#1e523b' }} />
                        Blog Management
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Publish, edit, and curate rich articles and educational guides for Naturalayam.
                    </p>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn-primary-admin"
                        onClick={() => handleOpenModal('add')}
                    >
                        <Plus size={18} />
                        Add Blog
                    </button>
                </div>
            </div>

            {/* Admin Table Card */}
            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search blogs by title or content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                        Total: {filteredBlogs.length} {filteredBlogs.length === 1 ? 'Blog' : 'Blogs'}
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Sl No.</th>
                                <th style={{ width: '100px' }}>Thumbnail</th>
                                <th>Blog Title</th>
                                <th>Content Preview</th>
                                <th style={{ width: '130px' }}>Created Date</th>
                                <th style={{ width: '110px' }}>Status</th>
                                <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #cbd5e1', borderTopColor: '#1e523b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 8 }} />
                                        <div>Loading blogs...</div>
                                    </td>
                                </tr>
                            ) : filteredBlogs.length > 0 ? (
                                filteredBlogs.map((item, index) => {
                                    const plainPreview = stripHtml(item.description);
                                    return (
                                        <tr key={item._id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="blog-thumbnail-cell">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.title}
                                                            className="blog-thumbnail-img"
                                                            onError={(e: any) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="blog-thumbnail-placeholder">No Image</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="blog-title-cell" title={item.title}>
                                                    {item.title}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="blog-desc-preview-cell" title={plainPreview}>
                                                    {plainPreview || <span style={{ color: '#cbd5e1' }}>—</span>}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>
                                                {formatDate(item.createdAt)}
                                            </td>
                                            <td>
                                                <button
                                                    className={`status-badge-btn ${item.status}`}
                                                    onClick={() => handleToggleStatus(item)}
                                                    title="Click to toggle status"
                                                >
                                                    {item.status === 'active' ? (
                                                        <>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="table-actions" style={{ justifyContent: 'center' }}>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleOpenModal('view', item)}
                                                        title="View Blog Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleOpenModal('edit', item)}
                                                        title="Edit Blog"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => openDeleteConfirm(item)}
                                                        title="Delete Blog"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <BookOpen size={36} style={{ color: '#cbd5e1', marginBottom: 10 }} />
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>
                                            {searchTerm ? 'No blogs match your search query.' : 'No blogs found.'}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
                                            {searchTerm ? 'Try adjusting your search terms.' : 'Click "+ Add Blog" above to create your first article.'}
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
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '820px', width: '92%' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                                    {modalMode === 'add' && 'Add New Blog'}
                                    {modalMode === 'edit' && 'Edit Blog'}
                                    {modalMode === 'view' && 'Blog Details'}
                                </h3>
                                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                    {modalMode === 'add' && 'Create and publish an informative blog post.'}
                                    {modalMode === 'edit' && 'Modify the blog title, image, or formatted content.'}
                                    {modalMode === 'view' && 'Preview how the blog article looks.'}
                                </p>
                            </div>
                            <button
                                className="action-btn"
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto', padding: '24px' }}>
                            {modalMode === 'view' && selectedBlog ? (
                                <div className="blog-view-details">
                                    {selectedBlog.imageUrl && (
                                        <img
                                            src={selectedBlog.imageUrl}
                                            alt={selectedBlog.title}
                                            className="blog-view-cover-img"
                                        />
                                    )}
                                    <h2 className="blog-view-title">{selectedBlog.title}</h2>
                                    <div className="blog-view-meta">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={15} />
                                            {formatDate(selectedBlog.createdAt)}
                                        </span>
                                        <span className={`status-badge-btn ${selectedBlog.status}`} style={{ pointerEvents: 'none' }}>
                                            {selectedBlog.status}
                                        </span>
                                    </div>
                                    <div
                                        className="blog-view-content"
                                        dangerouslySetInnerHTML={{ __html: selectedBlog.description }}
                                    />
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                        <button
                                            type="button"
                                            className="btn-primary-admin"
                                            onClick={() => handleOpenModal('edit', selectedBlog)}
                                        >
                                            <Edit2 size={16} /> Edit Blog
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
                                    {/* 1. Blog Image Field */}
                                    <div className="form-group" style={{ marginBottom: '22px' }}>
                                        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                                            Blog Cover Image {modalMode === 'add' && <span style={{ color: '#ef4444' }}>*</span>}
                                        </label>

                                        <div
                                            className="image-upload-dropzone"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload size={26} style={{ color: '#1e523b', margin: '0 auto 8px' }} />
                                            <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                                                {modalMode === 'edit' ? 'Click to replace cover image' : 'Click to upload blog cover image'}
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

                                        {/* Image Preview */}
                                        {(newImageData || existingImageUrl) && (
                                            <div className="image-preview-box">
                                                <img
                                                    src={newImageData || existingImageUrl}
                                                    alt="Blog Preview"
                                                />
                                                {newImageData && (
                                                    <button
                                                        type="button"
                                                        className="image-preview-remove-btn"
                                                        onClick={handleRemoveSelectedImage}
                                                        title="Remove new image"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {modalMode === 'edit' && !newImageData && existingImageUrl && (
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                                                Current image will be preserved if no new image is uploaded.
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Blog Title Field */}
                                    <div className="form-group" style={{ marginBottom: '22px' }}>
                                        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                                            Blog Title <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            style={{ width: '100%' }}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., The Healing Power of Cold-Pressed Botanical Oils"
                                            required
                                        />
                                    </div>

                                    {/* 3. Blog Description / Content (WYSIWYG Rich Text Editor) */}
                                    <div className="form-group" style={{ marginBottom: '22px' }}>
                                        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                                            Blog Description / Content <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <RichTextEditor
                                            value={description}
                                            onChange={(html) => setDescription(html)}
                                            placeholder="Write your article here... Format with headings, bold, bullet points, colors, quotes, and links."
                                            minHeight="240px"
                                        />
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                                            Use the toolbar above to style your content with headings, lists, bold text, links, and text colors.
                                        </div>
                                    </div>

                                    {/* 4. Blog Status */}
                                    <div className="form-group" style={{ marginBottom: '24px' }}>
                                        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                                            Publication Status
                                        </label>
                                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                                <input
                                                    type="radio"
                                                    name="blogStatus"
                                                    value="active"
                                                    checked={status === 'active'}
                                                    onChange={() => setStatus('active')}
                                                />
                                                <span style={{ fontWeight: 500, color: '#16a34a' }}>Active (Published)</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                                <input
                                                    type="radio"
                                                    name="blogStatus"
                                                    value="inactive"
                                                    checked={status === 'inactive'}
                                                    onChange={() => setStatus('inactive')}
                                                />
                                                <span style={{ fontWeight: 500, color: '#64748b' }}>Inactive (Draft)</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Form Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
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
                                                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                    {modalMode === 'add' ? 'Saving...' : 'Updating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={16} />
                                                    {modalMode === 'add' ? 'Save Blog' : 'Update Blog'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteDialog.isOpen && deleteDialog.blogItem && (
                <div className="confirm-dialog-backdrop">
                    <div className="confirm-dialog-box">
                        <div className="confirm-dialog-content">
                            <div className="confirm-dialog-icon danger">
                                <AlertTriangle size={28} />
                            </div>
                            <h3 className="confirm-dialog-title">Delete Blog</h3>
                            <p className="confirm-dialog-text">
                                Are you sure you want to delete <strong>"{deleteDialog.blogItem.title}"</strong>?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="confirm-dialog-actions">
                            <button
                                type="button"
                                className="confirm-btn-cancel"
                                onClick={() => setDeleteDialog({ isOpen: false, blogItem: null, loading: false })}
                                disabled={deleteDialog.loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="confirm-btn-danger"
                                onClick={confirmDelete}
                                disabled={deleteDialog.loading}
                            >
                                {deleteDialog.loading ? 'Deleting...' : 'Delete Blog'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlogs;
