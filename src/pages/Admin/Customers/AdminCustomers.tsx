import React from 'react';
import { Search, MoreHorizontal, Mail, Phone, Filter, Download, UserPlus, Trash2, Edit2 } from 'lucide-react';
import '../../../styles/admin-pages.css';

import profile1 from '../../../assets/images/profile2.jpg';
import profile2 from '../../../assets/images/profile3.jpg';
import profile3 from '../../../assets/images/profile4.jpg';
import profile4 from '../../../assets/images/girl.png';
import profile5 from '../../../assets/images/women2.jpg';

const AdminCustomers: React.FC = () => {
    const customers = [
        { id: 1, name: 'Alice Freeman', email: 'alice@example.com', phone: '+1 234 567 8901', location: 'New York, USA', status: 'Active', joinedDate: '12-01-24', orders: 12, img: profile1 },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', phone: '+1 234 567 8902', location: 'London, UK', status: 'Active', joinedDate: '15-01-24', orders: 8, img: profile2 },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', phone: '+1 234 567 8903', location: 'Paris, France', status: 'Inactive', joinedDate: '20-01-24', orders: 0, img: profile3 },
        { id: 4, name: 'Diana Prince', email: 'diana@example.com', phone: '+1 234 567 8904', location: 'Berlin, Germany', status: 'Active', joinedDate: '22-01-24', orders: 15, img: profile4 },
        { id: 5, name: 'Edward Norton', email: 'edward@example.com', phone: '+1 234 567 8905', location: 'Madrid, Spain', status: 'Active', joinedDate: '01-02-24', orders: 5, img: profile5 },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active': return <span className="admin-badge badge-success">Active</span>;
            case 'Inactive': return <span className="admin-badge badge-danger">Inactive</span>;
            default: return <span className="admin-badge">{status}</span>;
        }
    };

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
                        <input type="text" placeholder="Search customers..." />
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
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="product-info">
                                            <img className="product-img" style={{ borderRadius: '50%' }} src={customer.img} alt={customer.name} />
                                            <div>
                                                <div className="product-name">{customer.name}</div>
                                                <div className="product-category" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Mail size={12} /> {customer.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} /> {customer.phone}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{customer.location}</td>
                                    <td>{customer.joinedDate}</td>
                                    <td style={{ fontWeight: 600 }}>{customer.orders} orders</td>
                                    <td>{getStatusBadge(customer.status)}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="action-btn delete" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="action-btn" title="More">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCustomers;
