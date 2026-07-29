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
                            <div className="form-check form-switch mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isLoyaltyEnabled"
                                    name="isLoyaltyEnabled"
                                    checked={settings.isLoyaltyEnabled}
                                    onChange={handleChange}
                                    disabled={!isAdmin}
                                />
                                <label className="form-check-label ms-2 fw-bold" htmlFor="isLoyaltyEnabled">
                                    Enable Nature Points Program
                                </label>
                            </div>
                            <div className="form-check form-switch mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isEarningEnabled"
                                    name="isEarningEnabled"
                                    checked={settings.isEarningEnabled}
                                    onChange={handleChange}
                                    disabled={!isAdmin}
                                />
                                <label className="form-check-label ms-2 fw-bold" htmlFor="isEarningEnabled">
                                    Enable Point Earning
                                </label>
                            </div>
                            <div className="form-check form-switch mb-4">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isRedemptionEnabled"
                                    name="isRedemptionEnabled"
                                    checked={settings.isRedemptionEnabled}
                                    onChange={handleChange}
                                    disabled={!isAdmin}
                                />
                                <label className="form-check-label ms-2 fw-bold" htmlFor="isRedemptionEnabled">
                                    Enable Point Redemption
                                </label>
                            </div>

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
                                <label className="form-check-label ms-2 fw-bold" htmlFor="isWheelEnabled">
                                    Enable Lucky Wheel Rewards
                                </label>
                                <small className="text-muted d-block mt-1 ms-4">Allows users to spin and win Nature Points.</small>
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
        </div>
    );
};

export default AdminLoyaltySettings;
