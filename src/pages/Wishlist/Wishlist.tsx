import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { handleAddToCartGlobal } from '../../utils/CartHelper';

const Wishlist: React.FC = () => {
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isAuthenticated = useSelector((state: RootState) => state.auth.user.isAuthenticated);
    const isUser = isAuthenticated && !!localStorage.getItem('user_accessToken');

    const fetchWishlist = async () => {
        if (!isUser) {
            const localWishlistStr = localStorage.getItem('offlineWishlist');
            if (localWishlistStr) {
                try {
                    const localItems = JSON.parse(localWishlistStr);
                    setWishlistItems(localItems);
                } catch (err) {
                    console.error('Error parsing local wishlist:', err);
                }
            }
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await userApiClient.get('/user/wishlist');
            if (res.data.success) {
                setWishlistItems(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, [isUser]);

    const handleRemove = async (productId: string) => {
        if (!isUser) {
            const localWishlistStr = localStorage.getItem('offlineWishlist');
            if (localWishlistStr) {
                try {
                    let localItems = JSON.parse(localWishlistStr);
                    localItems = localItems.filter((item: any) => item._id !== productId);
                    localStorage.setItem('offlineWishlist', JSON.stringify(localItems));
                    setWishlistItems(localItems);
                    toast.info('Removed from offline wishlist');
                    window.dispatchEvent(new Event('wishlist-updated'));
                } catch (err) {
                    console.error('Error updating local wishlist:', err);
                }
            }
            return;
        }

        try {
            const res = await userApiClient.post('/user/wishlist/toggle', { productId });
            if (res.data.success) {
                setWishlistItems(prev => prev.filter(item => item._id !== productId));
                toast.info('Removed from wishlist');
                window.dispatchEvent(new Event('wishlist-updated'));
            }
        } catch (err) {
            toast.error('Failed to remove item');
        }
    };

    return (
        <div className="page-content">
            {/* Banner Section */}
            <div className="dz-bnr-inr" style={{ backgroundImage: "url('/images/background/bg8.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Wish List</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Wish List</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="content-inner-1 bg-light" style={{ padding: '80px 0' }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-12">
                            {loading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Loading wishlist...</p>
                                </div>
                            ) : wishlistItems.length === 0 ? (
                                <div className="text-center p-5">
                                    <h4>Your wishlist is empty</h4>
                                    <p>Find some products you love and add them here!</p>
                                    <Link to="/shop" className="btn btn-secondary">Go to Shop</Link>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table check-tbl style-1">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Product Name</th>
                                                <th>Price</th>
                                                <th>Purchase</th>
                                                <th className="text-end">Remove</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {wishlistItems.map((item) => (
                                                <tr key={item._id}>
                                                    <td className="product-item-img">
                                                        <img src={item.images && item.images.length > 0 ? item.images[0] : '/images/shop/product/1.png'} alt="/" />
                                                    </td>
                                                    <td className="product-item-name">
                                                        <Link to={`/product/${item._id}`} style={{ color: 'inherit', fontWeight: 600 }}>{item.productName}</Link>
                                                        <ul className="product-item-list">
                                                            {item.categoryId && <li>Category: {item.categoryId.categoryName}</li>}
                                                            {item.subcategoryId && <li>Subcategory: {item.subcategoryId.subcategoryName}</li>}
                                                            {item.sku && <li>SKU: {item.sku}</li>}
                                                        </ul>
                                                    </td>
                                                    <td className="product-item-price">₹{item.price.toFixed(2)}</td>
                                                    <td className="product-item-totle">
                                                        <button
                                                            onClick={() => handleAddToCartGlobal(item, 1, isUser, navigate, true)}
                                                            className="btn btn-outline-secondary"
                                                        >
                                                            Add To Cart
                                                        </button>
                                                    </td>
                                                    <td className="product-item-close">
                                                        <a href="javascript:void(0);" onClick={() => handleRemove(item._id)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                <path d="M18 6L6 18M6 6l12 12" stroke="#DC3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Wishlist;
