import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { Save, RefreshCcw } from 'lucide-react';

interface LoyaltySettings {
    isLoyaltyEnabled: boolean;
    isEarningEnabled: boolean;
    isRedemptionEnabled: boolean;
    purchaseRewardSpendAmount: number;
    purchaseRewardEarnPoints: number;
    minOrderAmountToEarn: number;
    maxPointsEarnedPerOrder: number;
    pointValueInRupees: number;
    maxRedeemablePerOrder: number;
    minOrderAmountToRedeem: number;
    minPointsRequiredToRedeem: number;
    pointValidityDays: number;
    isWheelEnabled: boolean;
}

const AdminLoyaltySettings: React.FC = () => {
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const isAdmin = adminData?.role?.toUpperCase() === 'ADMIN';

    const [settings, setSettings] = useState<LoyaltySettings>({
        isLoyaltyEnabled: true,
        isEarningEnabled: true,
        isRedemptionEnabled: true,
        purchaseRewardSpendAmount: 100,
        purchaseRewardEarnPoints: 1,
        minOrderAmountToEarn: 0,
        maxPointsEarnedPerOrder: 0,
        pointValueInRupees: 1,
        maxRedeemablePerOrder: 20,
        minOrderAmountToRedeem: 0,
        minPointsRequiredToRedeem: 0,
        pointValidityDays: 30,
        isWheelEnabled: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalBody, setModalBody] = useState('');
    const [pendingToggle, setPendingToggle] = useState<{ field: keyof LoyaltySettings, value: boolean } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await adminApiClient.get('/admin/loyalty-settings');
            if (response.data.success && response.data.settings) {
                setSettings(response.data.settings);
            }
        } catch (error) {
            console.error('Error fetching loyalty settings:', error);
            toast.error('Failed to fetch loyalty settings');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleClick = (field: keyof LoyaltySettings, currentValue: boolean) => {
        if (!isAdmin) return;
        const newValue = !currentValue;
        let title = '';
        let body = '';

        if (field === 'isLoyaltyEnabled') {
            if (newValue) {
                title = 'Enable Nature Points Program?';
                body = 'Customers will be able to use the Nature Points program according to the earning and redemption settings below.';
            } else {
                title = 'Disable Nature Points Program?';
                body = 'Customers will temporarily stop earning and redeeming Nature Points. Existing points and history will not be deleted.';
            }
        } else if (field === 'isEarningEnabled') {
            if (newValue) {
                title = 'Enable Point Earning?';
                body = 'Eligible customers will earn Nature Points from orders according to the current reward rules.';
            } else {
                title = 'Disable Point Earning?';
                body = 'Customers will temporarily stop earning new Nature Points. Existing balances will remain unchanged.';
            }
        } else if (field === 'isRedemptionEnabled') {
            if (newValue) {
                title = 'Enable Point Redemption?';
                body = 'Customers will be able to use their existing Nature Points during checkout according to the current redemption rules.';
            } else {
                title = 'Disable Point Redemption?';
                body = 'Customers will temporarily be unable to use Nature Points at checkout. Existing balances will remain unchanged.';
            }
        }

        setModalTitle(title);
        setModalBody(body);
        setPendingToggle({ field, value: newValue });
        setShowModal(true);
    };

    const confirmToggle = () => {
        if (pendingToggle) {
            setSettings(prev => ({ ...prev, [pendingToggle.field]: pendingToggle.value }));
        }
        setShowModal(false);
        setPendingToggle(null);
    };

    const cancelToggle = () => {
        setShowModal(false);
        setPendingToggle(null);
    };

    const renderToggle = (field: keyof LoyaltySettings, label: string, isMaster: boolean = false) => {
        const isChecked = !!settings[field];
        const isMasterOff = !isMaster && !settings.isLoyaltyEnabled;
        const opacity = isMasterOff ? 0.6 : 1;
        const cursor = (!isAdmin || isMasterOff) ? 'not-allowed' : 'pointer';

        return (
            <div className="mb-4" style={{ opacity }}>
                <label className="form-label fw-bold d-block">{label}</label>
                <label 
                    className="d-inline-flex align-items-center" 
                    style={{ cursor, userSelect: 'none' }}
                >
                    <div style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                        <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                                if (isMasterOff && !isMaster) return; // Ignore if master is off
                                e.preventDefault(); // The actual state change happens in confirmToggle
                                handleToggleClick(field, isChecked);
                            }}
                            disabled={!isAdmin || isMasterOff}
                            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: isChecked ? 'var(--admin-primary)' : '#ccc',
                            borderRadius: '26px', transition: '0.3s'
                        }}></div>
                        <div style={{
                            position: 'absolute', top: '3px', left: isChecked ? '27px' : '3px',
                            width: '20px', height: '20px', backgroundColor: 'white',
                            borderRadius: '50%', transition: '0.3s'
                        }}></div>
                    </div>
                    <span className="ms-2 fw-bold" style={{ color: isChecked ? 'var(--admin-primary)' : '#888' }}>
                        {isChecked ? 'ON / ENABLED' : 'OFF / DISABLED'}
                    </span>
                </label>
                {isMasterOff && !isMaster && (
                    <small className="d-block text-muted mt-1">
                        Currently inactive because the master Nature Points Program is OFF.
                    </small>
                )}
            </div>
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev: LoyaltySettings) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : Number(value)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await adminApiClient.put('/admin/loyalty-settings', settings);
            if (response.data.success) {
                toast.success('Loyalty settings updated successfully');
            }
        } catch (error) {
            console.error('Error updating loyalty settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Nature Points (Loyalty Rewards) Settings</h2>
            </div>

            <div className="row">
                <div className="col-12 col-xl-8">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-primary">General Configuration</h5>
                        </div>
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">Program Controls</h6>
                            {renderToggle('isLoyaltyEnabled', 'Enable Nature Points Program', true)}
                            {renderToggle('isEarningEnabled', 'Enable Point Earning')}
                            {renderToggle('isRedemptionEnabled', 'Enable Point Redemption')}

                            <hr />

                            <h6 className="fw-bold mb-3">Purchase Reward Rules</h6>
                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">For Every (₹) Spent</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="purchaseRewardSpendAmount"
                                            value={settings.purchaseRewardSpendAmount}
                                            onChange={handleChange}
                                            min="1"
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <small className="text-muted d-block mt-1">E.g., Every ₹100 spent</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Earn Nature Points</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="purchaseRewardEarnPoints"
                                        value={settings.purchaseRewardEarnPoints}
                                        onChange={handleChange}
                                        min="0"
                                        disabled={!isAdmin}
                                    />
                                    <small className="text-muted d-block mt-1">E.g., Earn 1 Point</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Minimum Order Amount To Earn Points</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="minOrderAmountToEarn"
                                            value={settings.minOrderAmountToEarn}
                                            onChange={handleChange}
                                            min="0"
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <small className="text-muted d-block mt-1">Orders below this amount will not earn Nature Points.</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Maximum Nature Points Earned Per Order</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="maxPointsEarnedPerOrder"
                                        value={settings.maxPointsEarnedPerOrder}
                                        onChange={handleChange}
                                        min="0"
                                        disabled={!isAdmin}
                                    />
                                    <small className="text-muted d-block mt-1">Maximum Nature Points a customer can earn from a single order.</small>
                                </div>
                            </div>

                            <hr />

                            <h6 className="fw-bold mb-3">Redemption Rules</h6>
                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Value of 1 Nature Point (₹)</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="pointValueInRupees"
                                            value={settings.pointValueInRupees}
                                            onChange={handleChange}
                                            min="0"
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <small className="text-muted d-block mt-1">1 Point = ₹{settings.pointValueInRupees}</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Max Points Redeemable Per Order</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="maxRedeemablePerOrder"
                                        value={settings.maxRedeemablePerOrder}
                                        onChange={handleChange}
                                        min="0"
                                        disabled={!isAdmin}
                                    />
                                    <small className="text-muted d-block mt-1">Fixed max points limit per checkout</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Minimum Order Amount To Redeem</label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="minOrderAmountToRedeem"
                                            value={settings.minOrderAmountToRedeem}
                                            onChange={handleChange}
                                            min="0"
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <small className="text-muted d-block mt-1">Orders below this amount cannot redeem Nature Points.</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Minimum Nature Points Required To Redeem</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="minPointsRequiredToRedeem"
                                        value={settings.minPointsRequiredToRedeem}
                                        onChange={handleChange}
                                        min="0"
                                        disabled={!isAdmin}
                                    />
                                    <small className="text-muted d-block mt-1">Customers must have at least this many Nature Points before redemption is allowed.</small>
                                </div>
                            </div>

                            <hr />

                            <h6 className="fw-bold mb-3">Expiry Rules</h6>
                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label text-muted small">Point Validity (Days)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="pointValidityDays"
                                        value={settings.pointValidityDays}
                                        onChange={handleChange}
                                        min="1"
                                        disabled={!isAdmin}
                                    />
                                    <small className="text-muted d-block mt-1">Each batch expires independently after {settings.pointValidityDays} days</small>
                                </div>
                            </div>

                            <hr />

                            <div className="form-check form-switch mb-4">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isWheelEnabled"
                                    name="isWheelEnabled"
                                    checked={settings.isWheelEnabled}
                                    onChange={handleChange}
                                    disabled={!isAdmin}
                                />
                                {/* <label className="form-check-label ms-2 fw-bold" htmlFor="isWheelEnabled">
                                    Enable Lucky Wheel Rewards
                                </label>
                                <small className="text-muted d-block mt-1 ms-4">Allows users to spin and win Nature Points.</small> */}
                            </div>

                            {isAdmin && (
                                <div className="d-flex justify-content-end mt-4">
                                    <button
                                        className="btn btn-primary d-flex align-items-center"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <><RefreshCcw size={16} className="me-2 animate-spin" /> Saving...</>
                                        ) : (
                                            <><Save size={16} className="me-2" /> Save Settings</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="col-12 col-xl-4">
                    <div className="card shadow-sm border-0 bg-light">
                        <div className="card-body">
                            <h6 className="fw-bold text-primary mb-3">How it works</h6>
                            <p className="small text-muted mb-3">
                                <strong>Point Batches:</strong> Every time a user earns points, a new "Batch" is created with its own expiry date.
                            </p>
                            <p className="small text-muted mb-3">
                                <strong>FIFO Redemption:</strong> When users redeem points, the system deducts from the oldest (first expiring) batch first.
                            </p>
                            <p className="small text-muted mb-0">
                                <strong>Independent Expiry:</strong> A background process will automatically expire individual batches after their validity period passes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Confirmation Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '12px',
                        padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '90%', maxWidth: '400px'
                    }}>
                        <h4 className="mb-3 text-dark fw-bold">{modalTitle}</h4>
                        <p className="text-muted mb-4" style={{ whiteSpace: 'pre-line' }}>
                            {modalBody}
                        </p>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-light border" onClick={cancelToggle}>
                                Cancel
                            </button>
                            <button className="btn btn-primary px-4" onClick={confirmToggle}>
                                {pendingToggle?.value ? 'Enable' : 'Disable'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLoyaltySettings;
