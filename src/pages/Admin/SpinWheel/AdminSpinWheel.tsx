import React, { useState, useEffect } from 'react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { Settings, PieChart, BarChart3, Plus, Edit, Trash2, Save, MoveUp, MoveDown, Check, X } from 'lucide-react';
import './AdminSpinWheel.css';

interface SpinSettings {
    isEnabled: boolean;
    startDate: string;
    endDate: string;
    spinIntervalDays: number;
    couponValidityDays: number;
    maxCouponUsage: number | null;
    showPopupAfterLogin: boolean;
    loggedInOnly: boolean;
}

interface Segment {
    _id?: string;
    id?: string;
    segmentName: string;
    rewardType: 'Percentage Discount' | 'Fixed Amount Discount' | 'Better Luck Next Time';
    rewardValue: number;
    displayText: string;
    probability: number;
    color: string;
    isActive: boolean;
    order: number;
}

interface Stats {
    totalSpins: number;
    todaySpins: number;
    couponsGenerated: number;
    couponsRedeemed: number;
    couponsExpired: number;
    mostWonReward: string;
}

const AdminSpinWheel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'settings' | 'segments' | 'reports'>('settings');

    const [settings, setSettings] = useState<SpinSettings>({
        isEnabled: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        spinIntervalDays: 90,
        couponValidityDays: 30,
        maxCouponUsage: 1,
        showPopupAfterLogin: true,
        loggedInOnly: true
    });

    const [segments, setSegments] = useState<Segment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);

    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    // Segment Modal State
    const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
    const [segmentForm, setSegmentForm] = useState<Segment>({
        segmentName: '',
        rewardType: 'Percentage Discount',
        rewardValue: 10,
        displayText: '',
        probability: 10,
        color: '#0D775E',
        isActive: true,
        order: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [setRes, segRes, statRes] = await Promise.all([
                adminApiClient.get('/admin/marketing/spin-wheel/settings'),
                adminApiClient.get('/admin/marketing/spin-wheel/segments'),
                adminApiClient.get('/admin/marketing/spin-wheel/reports')
            ]);

            if (setRes.data.success && setRes.data.data.settings) {
                const s = setRes.data.data.settings;
                setSettings({
                    ...s,
                    startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : '',
                    endDate: s.endDate ? new Date(s.endDate).toISOString().split('T')[0] : ''
                });
            }

            if (segRes.data.success && segRes.data.data.segments) {
                setSegments(segRes.data.data.segments);
            }

            if (statRes.data.success && statRes.data.data.stats) {
                setStats(statRes.data.data.stats);
            }
        } catch (error) {
            console.error('Error loading spin wheel data:', error);
            toast.error('Failed to load Spin Wheel configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? null : Number(value)) : value)
        }));
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await adminApiClient.put('/admin/marketing/spin-wheel/settings', settings);
            if (res.data.success) {
                toast.success('Spin Wheel settings saved successfully!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleOpenSegmentModal = (segment?: Segment) => {
        if (segment) {
            setEditingSegment(segment);
            setSegmentForm({ ...segment });
        } else {
            setEditingSegment(null);
            setSegmentForm({
                segmentName: '',
                rewardType: 'Percentage Discount',
                rewardValue: 10,
                displayText: '',
                probability: 10,
                color: '#0D775E',
                isActive: true,
                order: segments.length + 1
            });
        }
        setIsSegmentModalOpen(true);
    };

    const handleSaveSegment = async () => {
        if (!segmentForm.segmentName || !segmentForm.displayText) {
            toast.error('Please enter Segment Name and Display Text');
            return;
        }

        try {
            if (editingSegment && (editingSegment._id || editingSegment.id)) {
                const id = editingSegment._id || editingSegment.id;
                const res = await adminApiClient.put(`/admin/marketing/spin-wheel/segments/${id}`, segmentForm);
                if (res.data.success) {
                    toast.success('Segment updated successfully');
                }
            } else {
                const res = await adminApiClient.post('/admin/marketing/spin-wheel/segments', segmentForm);
                if (res.data.success) {
                    toast.success('Segment created successfully');
                }
            }
            setIsSegmentModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save segment');
        }
    };

    const handleDeleteSegment = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this segment?')) return;
        try {
            const res = await adminApiClient.delete(`/admin/marketing/spin-wheel/segments/${id}`);
            if (res.data.success) {
                toast.success('Segment deleted');
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete segment');
        }
    };

    const handleToggleSegmentStatus = async (segment: Segment) => {
        const id = segment._id || segment.id;
        try {
            const res = await adminApiClient.put(`/admin/marketing/spin-wheel/segments/${id}`, {
                isActive: !segment.isActive
            });
            if (res.data.success) {
                toast.success(`Segment ${!segment.isActive ? 'enabled' : 'disabled'}`);
                setSegments(prev => prev.map(s => (s._id || s.id) === id ? { ...s, isActive: !s.isActive } : s));
            }
        } catch (error: any) {
            toast.error('Failed to update segment status');
        }
    };

    const handleMoveSegment = async (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === segments.length - 1)) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        const updated = [...segments];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        const orders = updated.map((s, idx) => ({ id: (s._id || s.id) as string, order: idx + 1 }));
        setSegments(updated);

        try {
            await adminApiClient.put('/admin/marketing/spin-wheel/segments/reorder', { orders });
        } catch (err) {
            toast.error('Failed to reorder segments');
            fetchData();
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center p-5">
                <div className="spinner-border text-success" role="status"></div>
            </div>
        );
    }

    return (
        <div className="admin-spin-container">
            <div className="admin-spin-header mb-4">
                <div>
                    <h2 className="admin-spin-title">Spin Wheel Module</h2>
                    <p className="text-muted small">Configure dynamic wheel settings, custom rewards, probabilities & track performance.</p>
                </div>
                <div className="admin-spin-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={16} className="me-2" /> General Settings
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'segments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('segments')}
                    >
                        <PieChart size={16} className="me-2" /> Dynamic Segments
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        <BarChart3 size={16} className="me-2" /> Reports & Analytics
                    </button>
                </div>
            </div>

            {activeTab === 'settings' && (
                <div className="admin-card">
                    <h4 className="card-subtitle mb-4">Campaign & Reward Configuration</h4>

                    {/* General Settings Section */}
                    <div className="mb-5">
                        <div className="settings-section-title">General Settings</div>
                        <div className="row g-3">
                            <div className="col-12">
                                <div className="setting-toggle-card">
                                    <div>
                                        <div className="setting-toggle-title">Enable Spin Wheel Module</div>
                                        <p className="setting-toggle-desc">Globally enable or disable the Spin Wheel campaign.</p>
                                    </div>
                                    <label className="custom-toggle-switch">
                                        <input
                                            type="checkbox"
                                            name="isEnabled"
                                            checked={settings.isEnabled}
                                            onChange={handleSettingsChange}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="setting-toggle-card">
                                    <div>
                                        <div className="setting-toggle-title">Show Wheel Popup After Login</div>
                                        <p className="setting-toggle-desc">Automatically display the Spin Wheel popup for eligible users after login.</p>
                                    </div>
                                    <label className="custom-toggle-switch">
                                        <input
                                            type="checkbox"
                                            name="showPopupAfterLogin"
                                            checked={settings.showPopupAfterLogin}
                                            onChange={handleSettingsChange}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Campaign Schedule Section */}
                    <div className="mb-5">
                        <div className="settings-section-title">Campaign</div>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Campaign Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="startDate"
                                    value={settings.startDate}
                                    onChange={handleSettingsChange}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">Campaign End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="endDate"
                                    value={settings.endDate}
                                    onChange={handleSettingsChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reward Configuration Section */}
                    <div className="mb-4">
                        <div className="settings-section-title">Reward Configuration</div>
                        <div className="row g-4">
                            <div className="col-md-4">
                                <label className="form-label fw-bold">Spin Interval Days</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="spinIntervalDays"
                                    value={settings.spinIntervalDays}
                                    onChange={handleSettingsChange}
                                    placeholder="e.g. 90"
                                />
                                <div className="form-text">Number of days a user must wait before spinning again (Default: 90 days).</div>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Coupon Validity Days</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="couponValidityDays"
                                    value={settings.couponValidityDays}
                                    onChange={handleSettingsChange}
                                    placeholder="e.g. 30"
                                />
                                <div className="form-text">Number of days the generated reward coupon remains valid after winning.</div>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Coupon Usage Limit</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="maxCouponUsage"
                                    value={settings.maxCouponUsage ?? ''}
                                    onChange={handleSettingsChange}
                                    placeholder="1"
                                />
                                <div className="form-text">How many times a won coupon can be used at checkout (Default: 1).</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-top text-end">
                        <button className="btn btn-success px-4" onClick={handleSaveSettings} disabled={savingSettings}>
                            <Save size={18} className="me-2" /> {savingSettings ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}


            {activeTab === 'segments' && (
                <div className="admin-card">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 className="card-subtitle mb-1">Wheel Segments</h4>
                            <p className="text-muted small mb-0">Create, edit, reorder or toggle segments. Probabilities determine weighted random outcomes.</p>
                        </div>
                        <button className="btn btn-success" onClick={() => handleOpenSegmentModal()}>
                            <Plus size={18} className="me-2" /> Add New Segment
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle custom-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Segment Name</th>
                                    <th>Display Text</th>
                                    <th>Reward Type</th>
                                    <th>Reward Value</th>
                                    <th>Probability Weight</th>
                                    <th>Slice Color</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segments.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4 text-muted">No segments configured. Click "Add New Segment" to create one.</td>
                                    </tr>
                                ) : (
                                    segments.map((seg, index) => {
                                        const id = (seg._id || seg.id) as string;
                                        return (
                                            <tr key={id}>
                                                <td>
                                                    <div className="d-flex gap-1 align-items-center">
                                                        <span className="fw-bold me-2">#{index + 1}</span>
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary p-1"
                                                            disabled={index === 0}
                                                            onClick={() => handleMoveSegment(index, 'up')}
                                                        >
                                                            <MoveUp size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary p-1"
                                                            disabled={index === segments.length - 1}
                                                            onClick={() => handleMoveSegment(index, 'down')}
                                                        >
                                                            <MoveDown size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="fw-bold">{seg.segmentName}</td>
                                                <td>{seg.displayText}</td>
                                                <td>
                                                    <span className={`badge ${seg.rewardType === 'Better Luck Next Time' ? 'bg-secondary' : 'bg-success'}`}>
                                                        {seg.rewardType}
                                                    </span>
                                                </td>
                                                <td className="fw-bold">
                                                    {seg.rewardType === 'Percentage Discount' ? `${seg.rewardValue}%` : (seg.rewardType === 'Fixed Amount Discount' ? `₹${seg.rewardValue}` : '-')}
                                                </td>
                                                <td>{seg.probability}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="color-preview" style={{ backgroundColor: seg.color }}></span>
                                                        <span className="small text-muted">{seg.color}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${seg.isActive ? 'btn-success' : 'btn-light text-muted'}`}
                                                        onClick={() => handleToggleSegmentStatus(seg)}
                                                    >
                                                        {seg.isActive ? <Check size={14} className="me-1" /> : <X size={14} className="me-1" />}
                                                        {seg.isActive ? 'Active' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="text-end">
                                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenSegmentModal(seg)}>
                                                        <Edit size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSegment(id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && stats && (
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="admin-stat-card">
                            <div className="stat-label">Total Spins Recorded</div>
                            <div className="stat-value text-primary">{stats.totalSpins}</div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="admin-stat-card">
                            <div className="stat-label">Today's Spins</div>
                            <div className="stat-value text-success">{stats.todaySpins}</div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="admin-stat-card">
                            <div className="stat-label">Coupons Generated</div>
                            <div className="stat-value text-warning">{stats.couponsGenerated}</div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="admin-stat-card">
                            <div className="stat-label">Coupons Redeemed at Checkout</div>
                            <div className="stat-value text-info">{stats.couponsRedeemed}</div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="admin-stat-card">
                            <div className="stat-label">Coupons Expired</div>
                            <div className="stat-value text-danger">{stats.couponsExpired}</div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="admin-stat-card">
                            <div className="stat-label">Most Won Reward Segment</div>
                            <div className="stat-value text-dark small">{stats.mostWonReward}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Segment Create/Edit Modal */}
            {isSegmentModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content custom-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">{editingSegment ? 'Edit Segment' : 'Create New Segment'}</h5>
                            <button className="btn-close" onClick={() => setIsSegmentModalOpen(false)}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Segment Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={segmentForm.segmentName}
                                    onChange={e => setSegmentForm(prev => ({ ...prev, segmentName: e.target.value }))}
                                    placeholder="e.g. 10% OFF"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Display Text</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={segmentForm.displayText}
                                    onChange={e => setSegmentForm(prev => ({ ...prev, displayText: e.target.value }))}
                                    placeholder="e.g. Get 10% OFF on your next order!"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Reward Type</label>
                                <select
                                    className="form-select"
                                    value={segmentForm.rewardType}
                                    onChange={e => setSegmentForm(prev => ({ ...prev, rewardType: e.target.value as any }))}
                                >
                                    <option value="Percentage Discount">Percentage Discount</option>
                                    <option value="Fixed Amount Discount">Fixed Amount Discount</option>
                                    <option value="Better Luck Next Time">Better Luck Next Time</option>
                                </select>
                            </div>

                            {segmentForm.rewardType !== 'Better Luck Next Time' && (
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        Reward Value {segmentForm.rewardType === 'Percentage Discount' ? '(%)' : '(₹)'}
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={segmentForm.rewardValue}
                                        onChange={e => setSegmentForm(prev => ({ ...prev, rewardValue: Number(e.target.value) }))}
                                        placeholder="10"
                                    />
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label fw-bold">Probability Weight</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={segmentForm.probability}
                                    onChange={e => setSegmentForm(prev => ({ ...prev, probability: Number(e.target.value) }))}
                                    placeholder="10"
                                />
                                <div className="form-text">Higher numbers increase the chance of winning this segment relative to others.</div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Slice Color</label>
                                <div className="d-flex gap-3 align-items-center">
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={segmentForm.color}
                                        onChange={e => setSegmentForm(prev => ({ ...prev, color: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={segmentForm.color}
                                        onChange={e => setSegmentForm(prev => ({ ...prev, color: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-check form-switch mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="segmentActive"
                                    checked={segmentForm.isActive}
                                    onChange={e => setSegmentForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                />
                                <label className="form-check-label fw-bold" htmlFor="segmentActive">Active Status</label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-light" onClick={() => setIsSegmentModalOpen(false)}>Cancel</button>
                            <button className="btn btn-success" onClick={handleSaveSegment}>Save Segment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSpinWheel;
