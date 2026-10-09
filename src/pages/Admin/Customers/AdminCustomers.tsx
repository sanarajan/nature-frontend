import React, { useEffect, useState } from 'react';
import { Search, Mail, Phone, Filter, Download, Eye, X } from 'lucide-react';
import apiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/formatDate';
import Swal from 'sweetalert2';
import '../../../styles/admin-pages.css';
import AdminPagination from '../../../components/Admin/AdminPagination';

const AdminCustomers: React.FC = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/users');
            if (res.data.success) {
                setCustomers(res.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await apiClient.patch(`/admin/users/${id}/status`, { isActive: !currentStatus });
            if (res.data.success) {
                toast.success('Customer status updated');
                fetchCustomers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleStatusToggleConfirm = async (
        id: string,
        currentStatus: boolean,
        customerName: string
    ) => {
        const result = await Swal.fire({
            title: currentStatus ? 'Deactivate Customer?' : 'Activate Customer?',
            text: currentStatus
                ? `Are you sure you want to deactivate ${customerName}?`
                : `Are you sure you want to activate ${customerName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: currentStatus
                ? 'Yes, Deactivate'
                : 'Yes, Activate',
            cancelButtonText: 'Cancel',
            confirmButtonColor: currentStatus ? '#ef4444' : '#22c55e',
            cancelButtonColor: '#64748b',
            background: '#ffffff',
            customClass: {
                popup: 'admin-swal-popup',
                confirmButton: 'admin-swal-confirm',
                cancelButton: 'admin-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            await toggleStatus(id, currentStatus);
        }
    };

    // @ts-ignore
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Only customers with 0 orders can be deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!',
            background: '#ffffff',
            customClass: {
                popup: 'admin-swal-popup',
                confirmButton: 'admin-swal-confirm',
                cancelButton: 'admin-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                const res = await apiClient.delete(`/admin/users/${id}`);
                if (res.data.success) {
                    toast.success('Customer deleted successfully');
                    fetchCustomers();
                }
            } catch (error: any) {
                const errorMsg = error.response?.data?.message || 'Failed to delete customer';
                toast.error(errorMsg);
                
                if (errorMsg.includes('orders')) {
                    Swal.fire({
                        title: 'Action Blocked',
                        text: errorMsg,
                        icon: 'error',
                        confirmButtonColor: '#22c55e',
                    });
                }
            }
        }
    };

    const getStatusBadge = (status: boolean) => {
        return status 
            ? <span className="admin-badge badge-success">Active</span> 
            : <span className="admin-badge badge-danger">Inactive</span>;
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = (c.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.phoneNumber || '').includes(searchTerm);
        if (!matchesSearch) return false;
        if (filterStatus === 'pending') return c.influencerRequestStatus === 'PENDING';
        if (filterStatus === 'approved') return c.isInfluencer || c.influencerRequestStatus === 'APPROVED';
        if (filterStatus === 'rejected') return c.influencerRequestStatus === 'REJECTED';
        return true;
    });

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Customers</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin secondary" style={{ backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Download size={18} /> Export List
                    </button>
                    {/* <button className="btn-primary-admin">
                        <UserPlus size={18} /> Add Customer
                    </button> */}
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header d-flex justify-content-between align-items-center">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search customers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <select 
                            className="form-select form-select-sm" 
                            style={{ width: '200px', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '6px 12px', fontSize: '0.9rem' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Influencer Status</option>
                            <option value="pending">Pending Request</option>
                            <option value="approved">Approved Influencer</option>
                            <option value="rejected">Rejected Request</option>
                        </select>
                        <button className="action-btn" title="Filters">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>Joined Date</th>
                                <th>Orders</th>
                                <th>Influencer Req</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center p-4">Loading customers...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={8} className="text-center p-4">No customers found.</td></tr>
                            ) : (
                                paginatedCustomers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>
                                            <div className="product-info">
                                                {customer.imageUrl ? (
                                                    <img className="product-img" style={{ borderRadius: '50%' }} src={customer.imageUrl} alt={customer.displayName} />
                                                ) : (
                                                    <div className="product-img-placeholder" style={{ width: '48px', height: '48px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                                        <img src="/images/default-user.png" alt="Default User" style={{ width: '24px', height: '24px' }} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="product-name">{customer.displayName || 'Unnamed User'}</div>
                                                    <div className="product-category" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Mail size={12} /> {customer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Phone size={12} /> {customer.phoneNumber || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {customer.lastLocation 
                                                ? `${customer.lastLocation.city}, ${customer.lastLocation.state}` 
                                                : 'No address'
                                            }
                                        </td>
                                        <td>{formatDate(customer.createdAt)}</td>
                                        <td style={{ fontWeight: 600 }}>{customer.orderCount} orders</td>
                                        <td>
                                            {customer.influencerRequestStatus === 'PENDING' ? (
                                                <span className="admin-badge badge-warning text-dark" style={{ background: '#fef08a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Pending</span>
                                            ) : customer.isInfluencer || customer.influencerRequestStatus === 'APPROVED' ? (
                                                <span className="admin-badge badge-success" style={{ background: '#bbf7d0', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Influencer</span>
                                            ) : customer.influencerRequestStatus === 'REJECTED' ? (
                                                <span className="admin-badge badge-danger" style={{ background: '#fecaca', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Rejected</span>
                                            ) : (
                                                <span className="text-muted small">None</span>
                                            )}
                                        </td>
                                        <td onClick={() =>
                                            handleStatusToggleConfirm(
                                                customer._id,
                                                customer.isActive,
                                                customer.displayName || 'this customer'
                                            )
                                        } style={{ cursor: 'pointer' }}>
                                            {getStatusBadge(customer.isActive)}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                {/* <button className="action-btn" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="action-btn delete" title="Delete" onClick={() => handleDelete(customer._id)}>
                                                    <Trash2 size={16} />
                                                </button> */}
                                                <button className="action-btn" title="View Customer" onClick={() => setSelectedCustomer(customer)}>
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <AdminPagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage} 
                    />
                )}
            </div>

            {selectedCustomer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflowY: 'auto', padding: '16px'
                }}>
                    <div className="admin-modal" style={{ maxWidth: '500px', padding: '30px', width: '100%', margin: 'auto', backgroundColor: '#fff', borderRadius: '12px' }} tabIndex={0}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                Customer Details
                            </h3>
                            <button onClick={() => setSelectedCustomer(null)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '10px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                                {selectedCustomer.imageUrl ? (
                                    <img src={selectedCustomer.imageUrl} alt={selectedCustomer.displayName} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '64px', height: '64px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                        {/* <User size={32} color="#94a3b8" /> */}
                                        <img src="/images/default-user.png" alt="Default User" style={{ width: '32px', height: '32px' }} />
                                    </div>
                                )}
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{selectedCustomer.displayName || 'Unnamed User'}</h4>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedCustomer.email}</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Phone Number</strong>
                                    <span style={{ fontSize: '1rem' }}>{selectedCustomer.phoneNumber || 'N/A'}</span>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Joined Date</strong>
                                    <span style={{ fontSize: '1rem' }}>{formatDate(selectedCustomer.createdAt)}</span>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Location</strong>
                                    <span style={{ fontSize: '1rem', display: 'block' }}>
                                        {selectedCustomer.lastLocation 
                                            ? `${selectedCustomer.lastLocation.city}, ${selectedCustomer.lastLocation.state}` 
                                            : 'No address'
                                        }
                                    </span>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Total Orders</strong>
                                    <span style={{ fontSize: '1rem' }}>{selectedCustomer.orderCount}</span>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Account Status</strong>
                                    <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedCustomer.isActive)}</div>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Influencer Status</strong>
                                    <div style={{ marginTop: '4px' }}>
                                        {selectedCustomer.influencerRequestStatus === 'PENDING' ? (
                                            <span className="admin-badge badge-warning text-dark" style={{ background: '#fef08a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Pending</span>
                                        ) : selectedCustomer.isInfluencer || selectedCustomer.influencerRequestStatus === 'APPROVED' ? (
                                            <span className="admin-badge badge-success" style={{ background: '#bbf7d0', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Influencer</span>
                                        ) : selectedCustomer.influencerRequestStatus === 'REJECTED' ? (
                                            <span className="admin-badge badge-danger" style={{ background: '#fecaca', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Rejected</span>
                                        ) : (
                                            <span className="text-muted small">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedCustomer(null)} className="btn-primary-admin secondary" style={{ backgroundColor: '#f1f5f9', color: '#475569', boxShadow: 'none' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;
