import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, X, Eye, Lock, Unlock, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import { formatDate } from '../../../utils/formatDate';
import './AdminStaff.css';
import '../../../styles/admin-pages.css';

interface Staff {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profilePhoto?: string | null;
    status: 'ACTIVE' | 'BLOCKED';
    isBlocked: boolean;
    createdAt: string;
}

const AdminStaff: React.FC = () => {
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [status, setStatus] = useState<'ACTIVE' | 'BLOCKED'>('ACTIVE');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Validation Errors
    const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; profilePhoto?: string }>({});

    const imageInputRef = useRef<HTMLInputElement>(null);

    const fetchStaffs = async () => {
        try {
            const res = await apiClient.get('/admin/staff');
            if (res.data.success) {
                setStaffs(res.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch staff list', err);
            toast.error('Failed to fetch staff list');
        }
    };

    useEffect(() => {
        fetchStaffs();
    }, []);

    const validateField = (fieldName: string, value: string) => {
        let errorMsg = '';
        if (fieldName === 'name') {
            if (!value.trim()) {
                errorMsg = 'Name is required';
            }
        } else if (fieldName === 'email') {
            if (!value.trim()) {
                errorMsg = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errorMsg = 'Please enter a valid email address';
            }
        } else if (fieldName === 'phone') {
            if (!value.trim()) {
                errorMsg = 'Phone number is required';
            } else if (!/^[0-9+\s-]{10,15}$/.test(value.trim())) {
                errorMsg = 'Please enter a valid phone number';
            }
        }
        setErrors(prev => ({ ...prev, [fieldName]: errorMsg }));
        return errorMsg;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            const errorMsg = 'Only JPG, JPEG, PNG and WEBP images are allowed';
            setErrors(prev => ({ ...prev, profilePhoto: errorMsg }));
            toast.error(errorMsg);
            if (e.target) e.target.value = '';
            setImagePreview('');
            setProfilePhoto(null);
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            const errorMsg = 'Image size must be less than 2MB';
            setErrors(prev => ({ ...prev, profilePhoto: errorMsg }));
            toast.error(errorMsg);
            if (e.target) e.target.value = '';
            setImagePreview('');
            setProfilePhoto(null);
            return;
        }

        // Valid file chosen, clear error
        setErrors(prev => ({ ...prev, profilePhoto: '' }));

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setImagePreview(result);
            setProfilePhoto(result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImagePreview('');
        setProfilePhoto(null);
        setErrors(prev => ({ ...prev, profilePhoto: '' }));
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setProfilePhoto(null);
        setImagePreview('');
        setPassword('');
        setStatus('ACTIVE');
        setSelectedStaffId(null);
        setErrors({});
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', staff?: Staff) => {
        setModalMode(mode);
        if (staff) {
            setSelectedStaffId(staff._id);
            setName(staff.name);
            setEmail(staff.email);
            setPhone(staff.phone || '');
            setProfilePhoto(staff.profilePhoto || null);
            setImagePreview(staff.profilePhoto || '');
            setStatus(staff.status);
            setPassword('');
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (modalMode === 'view') {
            handleCloseModal();
            return;
        }

        // Validate all fields
        const nameErr = validateField('name', name);
        const emailErr = validateField('email', email);
        const phoneErr = validateField('phone', phone);
        
        if (nameErr || emailErr || phoneErr || errors.profilePhoto) {
            toast.error('Please correct the errors in the form.');
            return;
        }

        setLoading(true);
        try {
            if (modalMode === 'add') {
                const res = await apiClient.post('/admin/staff', {
                    name,
                    email,
                    phone,
                    profilePhoto: profilePhoto || undefined
                });
                if (res.data.success) {
                    toast.success('Staff added successfully!');
                    fetchStaffs();
                    handleCloseModal();
                }
            } else if (modalMode === 'edit' && selectedStaffId) {
                const res = await apiClient.put(`/admin/staff/${selectedStaffId}`, {
                    name,
                    email,
                    phone,
                    status,
                    profilePhoto: profilePhoto || undefined,
                    password: password.trim() ? password : undefined
                });
                if (res.data.success) {
                    toast.success('Staff details updated successfully!');
                    fetchStaffs();
                    handleCloseModal();
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (staff: Staff) => {
        const isBlockedStatus = staff.status === 'BLOCKED';
        const action = isBlockedStatus ? 'unblock' : 'block';
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.1rem', fontWeight: 600 }}>
                        {isBlockedStatus ? 'Unblock Staff?' : 'Block Staff?'}
                    </h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666' }}>
                        {isBlockedStatus 
                            ? 'They will regain access to log in.' 
                            : 'They will be immediately logged out and forbidden from logging in.'}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                try {
                                    const res = await apiClient.put(`/admin/staff/${staff._id}/${action}`);
                                    if (res.data.success) {
                                        toast.success(`Staff ${isBlockedStatus ? 'unblocked' : 'blocked'} successfully!`);
                                        fetchStaffs();
                                    }
                                } catch (error: any) {
                                    toast.error(error.response?.data?.message || `Failed to ${action} staff.`);
                                }
                            }}
                            style={{ padding: '6px 12px', background: isBlockedStatus ? '#2e7d32' : '#d32f2f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Confirm
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

    const filteredStaff = staffs.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-content admin-body">
            <div className="container-fluid">
                <div className="admin-page-header d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h1 className="admin-page-title">Staff Management</h1>
                        <p className="admin-page-subtitle">Manage internal system staff accounts, status, and permissions</p>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenModal('add')} style={{ backgroundColor: 'var(--admin-primary-dark)', borderRadius: '8px' }}>
                        <Plus size={18} />
                        <span>Add Staff</span>
                    </button>
                </div>

                <div className="admin-card mb-4" style={{ borderRadius: '12px', border: '1px solid var(--admin-card-border)', background: '#fff', padding: '20px' }}>
                    <div className="search-bar-wrapper mb-4">
                        <div className="search-input-container position-relative" style={{ maxWidth: '400px' }}>
                            <Search className="search-icon position-absolute" size={18} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name, email or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px', borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table admin-table align-middle">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.length > 0 ? (
                                    filteredStaff.map((staff) => (
                                        <tr key={staff._id}>
                                            <td>
                                                <div className="staff-avatar-wrapper">
                                                    {staff.profilePhoto ? (
                                                        <img src={staff.profilePhoto} alt={staff.name} className="staff-avatar" />
                                                    ) : (
                                                        <div className="staff-avatar-placeholder">
                                                            {staff.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="fw-semibold text-dark">{staff.name}</td>
                                            <td className="text-secondary">{staff.email}</td>
                                            <td className="text-secondary">{staff.phone}</td>
                                            <td>
                                                <span className={`badge ${staff.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                                                    {staff.status}
                                                </span>
                                            </td>
                                            <td>{formatDate(staff.createdAt)}</td>
                                            <td className="text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" onClick={() => handleOpenModal('view', staff)} title="View Details">
                                                        <Eye size={14} />
                                                        <span>View</span>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1" onClick={() => handleOpenModal('edit', staff)} title="Edit Staff">
                                                        <Edit2 size={14} />
                                                        <span>Edit</span>
                                                    </button>
                                                    {staff.status === 'ACTIVE' ? (
                                                        <button className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" onClick={() => handleToggleBlock(staff)} title="Block Staff">
                                                            <Lock size={14} />
                                                            <span>Block</span>
                                                        </button>
                                                    ) : (
                                                        <button className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1" onClick={() => handleToggleBlock(staff)} title="Unblock Staff">
                                                            <Unlock size={14} />
                                                            <span>Unblock</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">No staff members found matching criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal for Add / Edit / View Staff */}
            {isModalOpen && (
                <div className="admin-modal-overlay d-flex align-items-center justify-content-center">
                    <div className="admin-modal-container" style={{ maxWidth: '500px', width: '100%', padding: '30px', borderRadius: '12px', background: '#fff', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <button className="position-absolute btn-close-modal" onClick={handleCloseModal} style={{ right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                        
                        <h3 className="modal-title mb-4">
                            {modalMode === 'add' && 'Add New Staff'}
                            {modalMode === 'edit' && 'Edit Staff Member'}
                            {modalMode === 'view' && 'Staff Member Details'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            {/* Profile Photo field */}
                            <div className="form-group mb-3">
                                <label className="form-label fw-semibold">Profile Photo (Optional)</label>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="avatar-preview-container">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="avatar-preview" />
                                        ) : (
                                            <div className="avatar-preview-placeholder">No Photo</div>
                                        )}
                                    </div>
                                    {modalMode !== 'view' && (
                                        <div className="d-flex flex-column gap-2">
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={handleImageChange}
                                                ref={imageInputRef}
                                                style={{ display: 'none' }}
                                                id="staff-avatar-input"
                                            />
                                            <label htmlFor="staff-avatar-input" className={`btn btn-sm btn-outline-secondary mb-0 cursor-pointer ${errors.profilePhoto ? 'border-danger text-danger' : ''}`}>
                                                <Upload size={14} className="me-1" /> Choose File
                                            </label>
                                            {imagePreview && (
                                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleRemoveImage}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.profilePhoto && <div className="text-danger small mt-1">{errors.profilePhoto}</div>}
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label fw-semibold">Name</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        validateField('name', e.target.value);
                                    }}
                                    onBlur={(e) => validateField('name', e.target.value)}
                                    disabled={modalMode === 'view'}
                                    required
                                    style={{ borderRadius: '8px' }}
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label fw-semibold">Email Address</label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        validateField('email', e.target.value);
                                    }}
                                    onBlur={(e) => validateField('email', e.target.value)}
                                    disabled={modalMode === 'view'}
                                    required
                                    style={{ borderRadius: '8px' }}
                                />
                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label fw-semibold">Phone Number</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                    value={phone}
                                    placeholder="e.g. +919876543210"
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        validateField('phone', e.target.value);
                                    }}
                                    onBlur={(e) => validateField('phone', e.target.value)}
                                    disabled={modalMode === 'view'}
                                    required
                                    style={{ borderRadius: '8px' }}
                                />
                                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                            </div>

                            {modalMode === 'edit' && (
                                <div className="form-group mb-3">
                                    <label className="form-label fw-semibold">
                                        Update Password <span className="text-muted fw-normal">(Optional, leave blank to keep unchanged)</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}
                                    />
                                </div>
                            )}

                            {modalMode === 'edit' && (
                                <div className="form-group mb-3">
                                    <label className="form-label fw-semibold">Status</label>
                                    <select
                                        className="form-select"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'BLOCKED')}
                                        style={{ borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="BLOCKED">BLOCKED</option>
                                    </select>
                                </div>
                            )}

                            {modalMode === 'view' && (
                                <div className="staff-details-view p-3 bg-light rounded-3 mb-4">
                                    <div className="mb-2"><strong>Status:</strong> {status}</div>
                                    <div>
                                        <strong>Member Since:</strong> {selectedStaffId && formatDate(filteredStaff.find(s => s._id === selectedStaffId)?.createdAt || '')}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} style={{ borderRadius: '8px' }}>
                                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                                </button>
                                {modalMode !== 'view' && (
                                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ backgroundColor: 'var(--admin-primary-dark)', borderRadius: '8px' }}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStaff;
