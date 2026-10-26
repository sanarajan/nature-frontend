import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService, type BlogItem } from '../../services/user/blogService';
import './BlogDetails.css';

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return '';
    }
};

const BlogDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [blog, setBlog] = useState<BlogItem | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBlog = async () => {
        if (!id) {
            setError('Invalid or missing Blog ID.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await blogService.getBlogById(id);
            if (!data) {
                setError('Blog article not found.');
            } else {
                setBlog(data);
            }
        } catch (err: any) {
            console.error('Failed to load blog details:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to load this blog article.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlog();
    }, [id]);

    const formattedDate = formatDate(blog?.createdAt);
    const imageSrc = blog?.imageUrl || blog?.image;
    const richContent = blog?.content || blog?.description || '';

    return (
        <div className="blog-details-page">
            {/* Banner & Breadcrumb */}
            <div
                className="dz-bnr-inr"
                style={{
                    backgroundImage: "url('/images/background/bg-shape.jpg')",
                    backgroundColor: '#f5f5f5'
                }}
            >
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>{blog ? blog.title : 'Blog Details'}</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <Link to="/">Home</Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to="/blogs">Blog</Link>
                                </li>
                                <li className="breadcrumb-item active" aria-current="page">
                                    {blog ? (blog.title.length > 35 ? `${blog.title.slice(0, 35)}...` : blog.title) : 'Details'}
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <section className="blog-details-section bg-light">
                <div className="container">
                    <div className="blog-details-container">
                        {/* Back to Blogs Bar */}
                        <div className="blog-details-nav-bar">
                            <Link to="/blogs" className="blog-back-btn">
                                <i className="fa-solid fa-arrow-left"></i>
                                <span>Back to Blogs</span>
                            </Link>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                    <span className="visually-hidden">Loading blog...</span>
                                </div>
                                <p className="mt-3 text-muted">Loading article...</p>
                            </div>
                        )}

                        {/* Error or Not Found State */}
                        {!loading && (error || !blog) && (
                            <div className="blog-not-found-card">
                                <div className="blog-not-found-icon">
                                    <i className="fa-solid fa-file-circle-question"></i>
                                </div>
                                <h3 className="mb-2">Article Not Available</h3>
                                <p className="text-muted mb-4">
                                    {error || 'The blog article you are looking for does not exist or has been removed.'}
                                </p>
                                <div className="d-flex justify-content-center gap-3">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={fetchBlog}>
                                        <i className="fa-solid fa-rotate-right me-2"></i>Try Again
                                    </button>
                                    <Link to="/blogs" className="btn btn-primary btn-sm">
                                        Browse All Blogs
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Full Blog Article View */}
                        {!loading && blog && (
                            <article className="blog-details-card">
                                {/* Cover Image */}
                                {imageSrc && (
                                    <div className="blog-details-cover-wrapper">
                                        <img
                                            src={imageSrc}
                                            alt={blog.title}
                                            className="blog-details-cover-image"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Article Body */}
                                <div className="blog-details-body">
                                    {/* Meta Information */}
                                    <div className="blog-details-meta">
                                        {formattedDate && (
                                            <span className="blog-details-meta-item">
                                                <i className="fa-regular fa-calendar"></i>
                                                Published on {formattedDate}
                                            </span>
                                        )}
                                        <span className="blog-details-meta-item">
                                            <i className="fa-solid fa-leaf"></i>
                                            Naturalayam Living
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h1 className="blog-details-title">{blog.title}</h1>

                                    <div className="blog-details-divider"></div>

                                    {/* Rich-Text HTML Content */}
                                    <div
                                        className="blog-rich-content"
                                        dangerouslySetInnerHTML={{ __html: richContent }}
                                    />
                                </div>
                            </article>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BlogDetails;
