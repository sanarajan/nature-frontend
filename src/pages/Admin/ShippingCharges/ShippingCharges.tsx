import React, { useEffect, useState } from 'react';
import {
    Trash2,
    Edit,
    Truck,
    RefreshCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import adminApiClient from '../../../services/adminApiClient';

interface ShippingCharge {
    _id: string;
    state: string;
    stateId: string;
    charge: number;
    isActive: boolean;
}

interface State {
    _id: string;
    name: string;
    code: string;
}

interface ShippingChargeFormData {
    state: string;
    stateId: string;
    charge: string | number;
    isActive: boolean;
}

const ShippingCharges: React.FC = () => {
    const [charges, setCharges] = useState<ShippingCharge[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<ShippingChargeFormData>({
        state: '',
        stateId: '',
        charge: '',
        isActive: true
    });

    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [chargesRes, statesRes] = await Promise.all([
                adminApiClient.get('/admin/shipping-charges'),
                adminApiClient.get('/admin/states')
            ]);

            if (chargesRes.data.success) {
                setCharges(chargesRes.data.data);
            }

            if (statesRes.data.success) {
                setStates(statesRes.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData((prev: ShippingChargeFormData) => {
            if (name === 'state') {
                const selectedState = states.find(s => s._id === value);
                return {
                    ...prev,
                    state: selectedState ? selectedState.name : '',
                    stateId: value
                };
            }
            return {
                ...prev,
                [name]: val
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.state) {
            toast.error('Please select a state');
            return;
        }

        setSaving(true);
        try {
            const dataToSubmit = {
                ...formData,
                charge: Number(formData.charge) || 0
            };
            const res = await adminApiClient.post('/admin/shipping-charges', dataToSubmit);
            if (res.data.success) {
                toast.success(editId ? 'Charge updated' : 'Charge added');
                fetchData();
                resetForm();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (charge: ShippingCharge) => {
        setEditId(charge._id);
        setFormData({
            state: charge.state,
            stateId: charge.stateId,
            charge: charge.charge,
            isActive: charge.isActive
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this shipping charge?')) return;

        try {
            const res = await adminApiClient.delete(`/admin/shipping-charges/${id}`);
            if (res.data.success) {
                toast.success('Charge deleted');
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const resetForm = () => {
        setEditId(null);
        setFormData({
            state: '',
            stateId: '',
            charge: '',
            isActive: true
        });
    };

    return (
        <div className="admin-page-container">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title">Shipping Charges</h1>
                    <p className="text-muted small">Manage state-wise delivery costs for your store.</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={fetchData}
                    disabled={loading}
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="row">
                {/* Form Section */}
                <div className="col-lg-4">
                    <div className="admin-card p-4">
                        <h5 className="fw-bold mb-4">{editId ? 'Edit' : 'Add New'} Shipping Charge</h5>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-uppercase">Select State *</label>
                                <select
                                    className="admin-input w-100"
                                    name="state"
                                    value={formData.stateId}
                                    onChange={handleInputChange}
                                    style={{ height: '42px' }}
                                    disabled={!!editId}
                                >
                                    <option value="">Select State</option>
                                    {states.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold text-uppercase">Delivery Charge (₹) *</label>
                                <input
                                    type="number"
                                    name="charge"
                                    className="admin-input w-100"
                                    value={formData.charge}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="e.g. 50"
                                />
                            </div>


                            <div className="mb-4 d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange as any}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <label htmlFor="isActive" className="mb-0 small fw-bold">Active</label>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-grow-1"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : (editId ? 'Update' : 'Add Charge')}
                                </button>
                                {editId && (
                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        onClick={resetForm}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="col-lg-8">
                    <div className="admin-card overflow-hidden">
                        <div className="table-responsive">
                            <table className="admin-table w-100">
                                <thead>
                                    <tr>
                                        <th>State</th>
                                        <th>Charge</th>
                                        <th>Status</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5">
                                                <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                                                Loading charges...
                                            </td>
                                        </tr>
                                    ) : charges.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5 text-muted">
                                                No shipping charges added yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        charges.map(c => (
                                            <tr key={c._id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Truck size={16} className="text-primary" />
                                                        <span className="fw-bold">{c.state}</span>
                                                    </div>
                                                </td>
                                                <td><span className="fw-bold text-dark">₹{c.charge}</span></td>
                                                <td>
                                                    <span className={`badge ${c.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                                                        {c.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-link text-primary p-1 me-2 shadow-none"
                                                        onClick={() => handleEdit(c)}
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-link text-danger p-1 shadow-none"
                                                        onClick={() => handleDelete(c._id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .admin-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .admin-table th {
                    background: #f8fafc;
                    padding: 15px 20px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: 700;
                    border-bottom: 2px solid #e2e8f0;
                }
                .admin-table td {
                    padding: 15px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 0.85rem;
                    vertical-align: middle;
                }
                .admin-input {
                    padding: 10px 15px;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    box-shadow: none !important;
                }
                .admin-input:focus {
                    outline: none;
                    border-color: var(--admin-primary);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .btn-primary {
                    background-color: var(--admin-primary);
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-primary:hover {
                    background-color: #1d4ed8;
                    transform: translateY(-1px);
                }
                .btn-light {
                    background-color: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 10px 20px;
                    font-weight: 600;
                    color: #475569;
                }
            `}</style>
        </div>
    );
};

export default ShippingCharges;
