import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../store';
import { adminLoginSuccess } from '../../../store/authSlice';
import { adminAuthService } from '../../../services/admin/adminAuthService';
import { toast } from 'react-toastify';
import { User, Mail, Shield, Camera, X, Lock } from 'lucide-react';
import noimage from '../../../assets/images/noimage.png';
import './AdminProfile.css';

const AdminProfile: React.FC = () => {
    const dispatch = useDispatch();
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const adminName = adminData?.name || adminData?.displayName || 'Admin';
    const adminEmail = adminData?.email || 'admin@naturalayam.com';
    const adminPhoto = adminData?.imageUrl || noimage;

    const [showResetModal, setShowResetModal] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setIsUploading(true);
            try {
                const res = await adminAuthService.updateProfile({ avatar: base64String });
                if (res.success) {
                    dispatch(adminLoginSuccess(res.data.user));
                    toast.success('Profile photo updated successfully!');
                } else {
                    toast.error(res.message || 'Failed to update photo');
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Error uploading photo');
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await adminAuthService.updateProfile({ password });
            if (res.success) {
                toast.success('Password updated successfully!');
                setShowResetModal(false);
                setPassword('');
                setConfirmPassword('');
            } else {
                toast.error(res.message || 'Failed to update password');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error updating password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-profile-page admin-body">
            <div className="profile-header">
                <div className="breadcrumb">
                    <span className="breadcrumb-item">🏠 Dashboard</span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-active">Profile</span>
                </div>
                <h1 className="page-title">Admin Profile</h1>
            </div>

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-photo-section">
                        <div className={`profile-avatar-wrapper ${isUploading ? 'uploading' : ''}`}>
                            <img src={adminPhoto} alt={adminName} className="profile-avatar" />
                            <label htmlFor="photo-upload" className="edit-photo-btn">
                                <Camera size={18} />
                                <input
                                    type="file"
                                    id="photo-upload"
                                    hidden
                                    onChange={handlePhotoChange}
                                    accept="image/*"
                                />
                            </label>
                            {isUploading && <div className="upload-loader"></div>}
                        </div>
                        <div className="profile-intro">
                            <h2 className="profile-name">{adminName}</h2>
                            <p className="profile-role">Naturalayam Store Owner</p>
                        </div>
                    </div>

                    <div className="profile-details-grid">
                        <div className="detail-item">
                            <div className="detail-icon"><User size={20} /></div>
                            <div className="detail-content">
                                <label>Full Name</label>
                                <span>{adminName}</span>
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-icon"><Mail size={20} /></div>
                            <div className="detail-content">
                                <label>Email Address</label>
                                <span>{adminEmail}</span>
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-icon"><Shield size={20} /></div>
                            <div className="detail-content">
                                <label>Role Access</label>
                                <span>Super Admin</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button
                            className="btn-reset-password"
                            onClick={() => setShowResetModal(true)}
                        >
                            <Lock size={18} /> Reset Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="modal-header">
                            <h3>Reset Admin Password</h3>
                            <button className="close-modal" onClick={() => setShowResetModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="modal-form">
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowResetModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-save"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProfile;
