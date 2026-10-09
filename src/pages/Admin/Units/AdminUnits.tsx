import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, X, Eye, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/adminApiClient';
import '../../../styles/admin-pages.css';
import AdminPagination from '../../../components/Admin/AdminPagination';

interface Unit {
    _id: string;
    unitName: string;
    isUsed?: boolean;
}

const AdminUnits: React.FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Form State
    const [unitName, setUnitName] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await apiClient.get('/admin/units');
            if (res.data.success) {
                setUnits(res.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch data', err);
            toast.error('Failed to load units');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setUnitName('');
    };

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', unit?: Unit) => {
        setModalMode(mode);
        if (unit) {
            setSelectedUnitId(unit._id);
            setUnitName(unit.unitName);
        } else {
            resetForm();
            setSelectedUnitId(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (modalMode === 'view') {
            handleCloseModal();
            return;
        }

        const trimmedName = unitName.trim();
        if (!trimmedName) {
            toast.error('Unit Name is required.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                unitName: trimmedName
            };

            if (modalMode === 'edit' && selectedUnitId) {
                const res = await apiClient.put(`/admin/units/${selectedUnitId}`, payload);
                if (res.data.success) {
                    toast.success('Unit updated successfully!');
                    fetchData();
                    handleCloseModal();
                }
            } else {
                const res = await apiClient.post('/admin/units', payload);
                if (res.data.success) {
                    toast.success('Unit successfully added!');
                    fetchData();
                    handleCloseModal();
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save unit.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (unit: Unit) => {
        if (window.confirm('Are you sure you want to delete this unit?')) {
            try {
                const res = await apiClient.delete(`/admin/units/${unit._id}`);
                if (res.data.success) {
                    toast.success('Unit deleted successfully!');
                    fetchData();
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to delete unit.');
            }
        }
    };

    const filteredUnits = units.filter(u => 
        u.unitName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
    const paginatedUnits = filteredUnits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Units</h1>
                <div className="header-actions">
                    <button className="btn-primary-admin" onClick={() => handleOpenModal('add')}>
                        <Plus size={18} /> Add Unit
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search units..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Unit Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUnits.map((unit, index) => (
                                <tr key={unit._id}>
                                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{unit.unitName}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn" title="View" onClick={() => handleOpenModal('view', unit)}>
                                                <Eye size={16} />
                                            </button>
                                            <button className="action-btn" title="Edit" onClick={() => handleOpenModal('edit', unit)}>
                                                <Edit2 size={16} />
                                            </button>
                                            {!unit.isUsed && (
                                                <button className="action-btn delete" title="Delete" onClick={() => handleDelete(unit)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {units.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '30px' }}>
                                        No units found. Click "Add Unit" to create one.
                                    </td>
                                </tr>
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

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflowY: 'auto', padding: '16px'
                }}>
                    <div className="admin-modal" style={{ maxWidth: '500px', padding: '30px', width: '100%', margin: 'auto' }} tabIndex={0}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                {modalMode === 'add' ? 'Add Unit' : modalMode === 'edit' ? 'Edit Unit' : 'Unit Details'}
                            </h3>
                            <button onClick={handleCloseModal} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '10px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label className="form-label">Unit Name *</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                    value={unitName}
                                    onChange={(e) => setUnitName(e.target.value)}
                                    placeholder="e.g. ml, kg, L"
                                    disabled={modalMode === 'view'}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                                <button type="button" onClick={handleCloseModal} className="btn-primary-admin secondary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#475569', boxShadow: 'none' }}>
                                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                                </button>
                                {modalMode !== 'view' && (
                                    <button type="submit" disabled={loading} className="btn-primary-admin" style={{ flex: 1, justifyContent: 'center' }}>
                                        {loading ? 'Saving...' : 'Save Unit'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUnits;
