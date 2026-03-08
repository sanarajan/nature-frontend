import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const AgencyList: React.FC = () => {
    const [agencies, setAgencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgencies = async () => {
        try {
            const res = await adminApiClient.get('/admin/shipping-agencies');
            if (res.data.success) {
                setAgencies(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch agencies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgencies();
    }, []);

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await adminApiClient.delete(`/admin/shipping-agencies/${id}`);
                toast.success('Agency deleted successfully');
                fetchAgencies();
            } catch (error) {
                toast.error('Failed to delete agency');
            }
        }
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Shipping Agencies</h1>
                    <p className="page-subtitle">Manage your delivery partners and tracking URLs</p>
                </div>
                <Link to="/admin/shipping-agencies/add" className="btn-primary-admin">
                    <Plus size={18} className="me-2" /> Add Agency
                </Link>
            </div>

            <div className="admin-card mt-4 p-0 overflow-hidden">
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Agency Name</th>
                                <th>Tracking URL</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-5">Loading agencies...</td></tr>
                            ) : agencies.length === 0 ? (
                                <tr><td colSpan={4} className="text-center p-5">No agencies found. Add your first delivery partner.</td></tr>
                            ) : agencies.map((agency) => (
                                <tr key={agency._id}>
                                    <td className="fw-bold text-dark">{agency.name}</td>
                                    <td>
                                        <div className="d-flex align-items-center text-muted small">
                                            {agency.trackingUrlTemplate}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${agency.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {agency.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Link to={`/admin/shipping-agencies/edit/${agency._id}`} className="btn btn-sm btn-light-primary">
                                                <Edit size={16} />
                                            </Link>
                                            <button onClick={() => handleDelete(agency._id)} className="btn btn-sm btn-light-danger">
                                                <Trash2 size={16} />
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

export default AgencyList;
