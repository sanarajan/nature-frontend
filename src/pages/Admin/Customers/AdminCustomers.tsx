import React, { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Mail, Phone, Filter, Download, UserPlus, Trash2, Edit2, User } from 'lucide-react';
import apiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/formatDate';
import Swal from 'sweetalert2';
import '../../../styles/admin-pages.css';

const AdminCustomers: React.FC = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

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

    const filteredCustomers = customers.filter(c => 
        (c.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phoneNumber || '').includes(searchTerm)
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Customers</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin secondary" style={{ backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Download size={18} /> Export List
                    </button>
                    <button className="btn-primary-admin">
                        <UserPlus size={18} /> Add Customer
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search customers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="action-btn" title="Filters">
                        <Filter size={18} />
                    </button>
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
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center p-4">Loading customers...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-4">No customers found.</td></tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>
                                            <div className="product-info">
                                                {customer.imageUrl ? (
                                                    <img className="product-img" style={{ borderRadius: '50%' }} src={customer.imageUrl} alt={customer.displayName} />
                                                ) : (
                                                    <div className="product-img-placeholder" style={{ width: '48px', height: '48px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                                        <User size={24} color="#94a3b8" />
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
                                        <td onClick={() => toggleStatus(customer._id, customer.isActive)} style={{ cursor: 'pointer' }}>
                                            {getStatusBadge(customer.isActive)}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="action-btn" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="action-btn delete" title="Delete" onClick={() => handleDelete(customer._id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="action-btn" title="More">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCustomers;
