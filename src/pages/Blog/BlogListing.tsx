import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { blogService, type BlogItem } from '../../services/user/blogService';
import './BlogListing.css';

const PAGE_SIZE = 6;

/**
 * Extracts plain text from HTML content for excerpt display.
 * Purely cosmetic; does not alter stored data.
 */
const stripHtmlToPlainText = (html?: string): string => {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return '';
    }
};

const BlogListing: React.FC = () => {
    const [blogs, setBlogs] = useState<BlogItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const listTopRef = useRef<HTMLDivElement>(null);

    const fetchBlogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await blogService.getActiveBlogs();
            // Sort by latest createdAt descending
            const sorted = [...data].sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });
            setBlogs(sorted);
        } catch (err: any) {
            console.error('Failed to load blogs:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to load blogs. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    // Total pages calculation
    const totalPages = useMemo(() => {
        return Math.ceil(blogs.length / PAGE_SIZE);
    }, [blogs.length]);

    // Ensure currentPage remains valid when list changes
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    // Paginated slice
    const currentBlogs = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        return blogs.slice(startIndex, startIndex + PAGE_SIZE);
    }, [blogs, currentPage]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        setCurrentPage(page);
        if (listTopRef.current) {
            listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }
    };

    // Generate page numbers with ellipsis
    const paginationItems = useMemo(() => {
        const items: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) items.push(i);
        } else {
            items.push(1);
            if (currentPage > 3) items.push('ellipsis-start');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                items.push(i);
            }

            if (currentPage < totalPages - 2) items.push('ellipsis-end');
            items.push(totalPages);
        }
        return items;
    }, [totalPages, currentPage]);

    return (
        <div className="blog-listing-page">
            {/* Page Banner & Breadcrumb */}
            <div
                className="dz-bnr-inr"
                style={{
                    backgroundImage: "url('/images/background/bg-shape.jpg')",
                    backgroundColor: '#f5f5f5'
                }}
            >
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Our Blogs</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <Link to="/">Home</Link>
                                </li>
                                <li className="breadcrumb-item active" aria-current="page">
                                    Blog
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <section className="blog-listing-section bg-light" ref={listTopRef}>
                <div className="container">
                    <div className="blog-listing-header">
                        <h2 className="title">Articles & Wellness Insights</h2>
                        <p className="subtitle">
                            Discover stories, nutritious guides, and wellness tips inspired by natural living.
                        </p>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading blogs...</span>
                            </div>
                            <p className="mt-3 text-muted">Fetching our latest articles...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className="alert alert-warning text-center mx-auto my-4 p-4" style={{ maxWidth: '640px', borderRadius: '12px' }}>
                            <i className="fa-solid fa-triangle-exclamation mb-2 text-warning" style={{ fontSize: '2rem' }}></i>
                            <h5 className="mt-2">Unable to load blogs</h5>
                            <p className="text-muted mb-3">{error}</p>
                            <button className="btn btn-primary btn-sm" onClick={fetchBlogs}>
                                <i className="fa-solid fa-rotate-right me-2"></i>Retry
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && blogs.length === 0 && (
                        <div className="blog-empty-state">
                            <div className="blog-empty-icon">
                                <i className="fa-solid fa-newspaper"></i>
                            </div>
                            <h3 className="blog-empty-title">No Blogs Published Yet</h3>
                            <p className="blog-empty-desc">
                                We're preparing exciting articles and wellness tips. Please check back soon!
                            </p>
                        </div>
                    )}

                    {/* Blog Cards Grid */}
                    {!loading && !error && blogs.length > 0 && (
                        <>
                            <div className="row g-4">
                                {currentBlogs.map((blog) => {
                                    const imageSrc = blog.imageUrl || blog.image;
                                    const excerptText = stripHtmlToPlainText(blog.content || blog.description);
                                    const formattedDate = formatDate(blog.createdAt);

                                    return (
                                        <div key={blog._id} className="col-lg-4 col-md-6 col-sm-12">
                                            <article className="blog-card">
                                                {/* Media */}
                                                <div className="blog-card-media">
                                                    {imageSrc ? (
                                                        <img
                                                            src={imageSrc}
                                                            alt={blog.title}
                                                            className="blog-card-image"
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                // Fallback to placeholder if image link fails
                                                                (e.target as HTMLElement).style.display = 'none';
                                                                const parent = (e.target as HTMLElement).parentElement;
                                                                if (parent && !parent.querySelector('.blog-card-placeholder')) {
                                                                    const placeholder = document.createElement('div');
                                                                    placeholder.className = 'blog-card-placeholder';
                                                                    placeholder.innerHTML = '<i class="fa-solid fa-image" style="font-size: 2.5rem;"></i>';
                                                                    parent.appendChild(placeholder);
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="blog-card-placeholder">
                                                            <i className="fa-solid fa-feather-pointed" style={{ fontSize: '2.5rem' }}></i>
                                                        </div>
                                                    )}
                                                    {formattedDate && (
                                                        <span className="blog-card-date-badge">
                                                            <i className="fa-regular fa-calendar me-1"></i>
                                                            {formattedDate}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Content Body */}
                                                <div className="blog-card-body">
                                                    <h3 className="blog-card-title">
                                                        <Link to={`/blog/${blog._id}`}>
                                                            {blog.title}
                                                        </Link>
                                                    </h3>

                                                    {/* Short description visually clamped to 2 lines via CSS */}
                                                    <p className="blog-card-excerpt" title={excerptText}>
                                                        {excerptText || 'Read the full story to explore natural health and wellness insights.'}
                                                    </p>

                                                    {/* Footer with View More button */}
                                                    <div className="blog-card-footer">
                                                        <Link
                                                            to={`/blog/${blog._id}`}
                                                            className="blog-view-more-btn"
                                                            aria-label={`View more details about ${blog.title}`}
                                                        >
                                                            <span>View More</span>
                                                            <i className="fa-solid fa-arrow-right"></i>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </article>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination UI - only rendered if totalPages > 1 */}
                            {totalPages > 1 && (
                                <nav className="blog-pagination-wrapper" aria-label="Blog pagination">
                                    <div className="blog-pagination-info">
                                        Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({blogs.length} articles)
                                    </div>
                                    <ul className="blog-pagination-list">
                                        {/* Previous Button */}
                                        <li>
                                            <button
                                                type="button"
                                                className="blog-page-btn"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                aria-label="Previous page"
                                            >
                                                <i className="fa-solid fa-chevron-left me-1"></i> Prev
                                            </button>
                                        </li>

                                        {/* Page Numbers */}
                                        {paginationItems.map((item, idx) => {
                                            if (typeof item === 'string') {
                                                return (
                                                    <li key={`ellipsis-${idx}`} className="blog-page-ellipsis">
                                                        ...
                                                    </li>
                                                );
                                            }
                                            const isActive = item === currentPage;
                                            return (
                                                <li key={item}>
                                                    <button
                                                        type="button"
                                                        className={`blog-page-btn ${isActive ? 'active' : ''}`}
                                                        onClick={() => handlePageChange(item)}
                                                        aria-current={isActive ? 'page' : undefined}
                                                        aria-label={`Page ${item}`}
                                                    >
                                                        {item}
                                                    </button>
                                                </li>
                                            );
                                        })}

                                        {/* Next Button */}
                                        <li>
                                            <button
                                                type="button"
                                                className="blog-page-btn"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                aria-label="Next page"
                                            >
                                                Next <i className="fa-solid fa-chevron-right ms-1"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default BlogListing;
