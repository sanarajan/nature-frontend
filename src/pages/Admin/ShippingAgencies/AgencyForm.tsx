import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';

const AgencyForm: React.FC = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        trackingUrlTemplate: '',
        isActive: true
    });

    useEffect(() => {
        if (isEdit) {
            const fetchAgency = async () => {
                try {
                    const res = await adminApiClient.get('/admin/shipping-agencies');
                    const agency = res.data.data.find((a: any) => a._id === id);
                    if (agency) {
                        setFormData({
                            name: agency.name,
                            trackingUrlTemplate: agency.trackingUrlTemplate,
                            isActive: agency.isActive
                        });
                    }
                } catch (error) {
                    toast.error('Failed to fetch agency details');
                }
            };
            fetchAgency();
        }
    }, [id, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await adminApiClient.put(`/admin/shipping-agencies/${id}`, formData);
                toast.success('Agency updated successfully');
            } else {
                await adminApiClient.post('/admin/shipping-agencies', formData);
                toast.success('Agency added successfully');
            }
            navigate('/admin/shipping-agencies');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save agency');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-breadcrumbs">
                <button onClick={() => navigate('/admin/shipping-agencies')} className="btn btn-link p-0 text-muted d-flex align-items-center text-decoration-none">
                    <ChevronLeft size={16} className="me-1" /> Back to Agencies
                </button>
            </div>

            <div className="page-header mt-3">
                <h1 className="page-title">{isEdit ? 'Edit Shipping Agency' : 'Add New Shipping Agency'}</h1>
            </div>

            <div className="row mt-4">
                <div className="col-lg-6">
                    <div className="admin-card p-4">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label fw-bold">Agency Name</label>
                                <input
                                    type="text"
                                    className="admin-input w-100"
                                    placeholder="e.g., BlueDart, Delhivery"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">Tracking URL Template</label>
                                <p className="text-muted small mb-2">Use [TRACKING_ID] as a placeholder for the tracking number in the URL if needed, or just provide the base URL.</p>
                                <input
                                    type="text"
                                    className="admin-input w-100"
                                    placeholder="https://www.bluedart.com/tracking?id=[TRACKING_ID]"
                                    value={formData.trackingUrlTemplate}
                                    onChange={(e) => setFormData({ ...formData, trackingUrlTemplate: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mb-4 d-flex align-items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="form-check-input me-2"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="form-check-label fw-bold">Active Status</label>
                            </div>

                            <div className="d-flex gap-3 pt-3">
                                <button type="submit" className="btn-primary-admin" disabled={loading}>
                                    <Save size={18} className="me-2" /> {loading ? 'Saving...' : 'Save Agency'}
                                </button>
                                <button type="button" className="btn btn-light" onClick={() => navigate('/admin/shipping-agencies')} disabled={loading}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencyForm;
