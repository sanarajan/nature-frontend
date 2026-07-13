import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import adminApiClient from '../../../services/adminApiClient';
import { Users, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import './AdminInfluencers.css';

const AdminInfluencers: React.FC = () => {
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'list' | 'withdrawals' | 'settings'>('list');
    const [settings, setSettings] = useState({ influencerDiscountPercent: 20, influencerCommissionPercent: 20, influencerEnabled: true });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [influencerRes, withdrawalRes, settingsRes] = await Promise.all([
                adminApiClient.get('/admin/influencers'),
                adminApiClient.get('/admin/influencers/withdrawals'),
                adminApiClient.get('/admin/influencers/settings')
            ]);
            
            if (influencerRes.data.success) setInfluencers(influencerRes.data.data);
            if (withdrawalRes.data.success) setWithdrawals(withdrawalRes.data.data);
            if (settingsRes.data.success && settingsRes.data.data) {
                setSettings(settingsRes.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessWithdrawal = async (id: string, status: 'Approved' | 'Rejected') => {
        if (!window.confirm(`Are you sure you want to mark this request as ${status}?`)) return;
        
        try {
            const res = await adminApiClient.put(`/admin/influencers/withdrawals/${id}`, { status, remarks: `Processed by Admin` });
            if (res.data.success) {
                toast.success(`Withdrawal ${status} successfully`);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process withdrawal');
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await adminApiClient.put('/admin/influencers/settings', settings);
            if (res.data.success) {
                toast.success('Settings updated successfully');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="admin-influencers-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Influencer Management</h2>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                        <Users size={18} className="me-2"/> Influencers
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}>
                        <DollarSign size={18} className="me-2"/> Withdrawal Requests
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <CheckCircle size={18} className="me-2"/> Configuration
                    </button>
                </li>
            </ul>

            {activeTab === 'list' && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Ref Code</th>
                                    <th>Commission %</th>
                                    <th>Wallet Balance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {influencers.map(inf => (
                                    <tr key={inf._id}>
                                        <td>{inf.displayName || inf.username}</td>
                                        <td>{inf.email}</td>
                                        <td>{inf.influencerCode}</td>
                                        <td>{inf.commissionPercentage}%</td>
                                        <td>₹{inf.influencerWalletBalance?.toFixed(2) || '0.00'}</td>
                                        <td>
                                            <span className={`badge ${inf.influencerStatus === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                                {inf.influencerStatus || 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {influencers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center">No influencers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'withdrawals' && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Influencer</th>
                                    <th>Amount</th>
                                    <th>Current Balance</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map(req => (
                                    <tr key={req._id}>
                                        <td>{new Date(req.requestedAt).toLocaleDateString()}</td>
                                        <td>{req.influencerId?.displayName || req.influencerId?.email}</td>
                                        <td>₹{req.amount.toFixed(2)}</td>
                                        <td>₹{req.influencerId?.influencerWalletBalance?.toFixed(2)}</td>
                                        <td>
                                            <span className={`badge ${req.status === 'Approved' ? 'bg-success' : req.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td>
                                            {req.status === 'Pending' && (
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-success" onClick={() => handleProcessWithdrawal(req._id, 'Approved')}>
                                                        <CheckCircle size={14}/> Approve
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleProcessWithdrawal(req._id, 'Rejected')}>
                                                        <XCircle size={14}/> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {withdrawals.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center">No withdrawal requests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="card shadow-sm" style={{ maxWidth: '600px' }}>
                    <div className="card-body">
                        <form onSubmit={handleSaveSettings}>
                            <h5 className="card-title mb-4">Global Influencer Settings</h5>
                            
                            <div className="mb-3">
                                <label className="form-label">Influencer Discount (%)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    min="0" 
                                    max="100"
                                    value={settings.influencerDiscountPercent} 
                                    onChange={(e) => setSettings({...settings, influencerDiscountPercent: Number(e.target.value)})}
                                    required
                                />
                                <div className="form-text">Discount percentage given to customers using an influencer code.</div>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">Influencer Commission (%)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    min="0" 
                                    max="100"
                                    value={settings.influencerCommissionPercent} 
                                    onChange={(e) => setSettings({...settings, influencerCommissionPercent: Number(e.target.value)})}
                                    required
                                />
                                <div className="form-text">Commission percentage awarded to the influencer based on the order's final payable amount.</div>
                            </div>

                            <div className="mb-4 form-check form-switch">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="enableInfluencer" 
                                    checked={settings.influencerEnabled}
                                    onChange={(e) => setSettings({...settings, influencerEnabled: e.target.checked})}
                                />
                                <label className="form-check-label" htmlFor="enableInfluencer">
                                    Enable Influencer Feature System-wide
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                                {savingSettings ? 'Saving...' : 'Save Settings'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInfluencers;
