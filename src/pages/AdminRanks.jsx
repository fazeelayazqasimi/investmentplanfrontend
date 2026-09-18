import { useState, useEffect } from 'react';
import {
  Trophy, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  RefreshCw,
} from 'lucide-react';
import { getRanks, createRank, updateRank, deleteRank, toggleRank, recalculateRanks } from '../services/apiClient';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import useToast from '../components/useToast';

const RANK_SYMBOLS = ['🥇', '🥈', '🥉', '🏅', '⭐', '🌟', '💫', '🏆', '👑', '💎'];
const RANK_COLORS = ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];

export default function AdminRanksContent({ toastSuccess: success, toastError }) {
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRank, setEditingRank] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  const [form, setForm] = useState({
    level: 1,
    name: '',
    symbol: '🥇',
    color: '#CD7F32',
    selfDeposit: 0,
    directBusiness: 0,
    totalTeamBusiness: 0,
    legs: 0,
    promotionType: 'AUTO',
    requiredDirectRanks: 3,
    rankDowngradeEnabled: true,
  });

  const loadRanks = async () => {
    try {
      setLoading(true);
      const res = await getRanks();
      setRanks(res.data || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load ranks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRanks(); }, []);

  const openCreate = () => {
    setEditingRank(null);
    const nextLevel = ranks.length > 0 ? Math.max(...ranks.map(r => r.level)) + 1 : 1;
    setForm({
      level: nextLevel,
      name: '',
      symbol: RANK_SYMBOLS[Math.min(nextLevel - 1, RANK_SYMBOLS.length - 1)] || '⭐',
      color: RANK_COLORS[Math.min(nextLevel - 1, RANK_COLORS.length - 1)] || '#6366f1',
      selfDeposit: 0,
      directBusiness: 0,
      totalTeamBusiness: 0,
      legs: 0,
      promotionType: 'AUTO',
      requiredDirectRanks: 3,
      rankDowngradeEnabled: true,
    });
    setShowModal(true);
  };

  const openEdit = (rank) => {
    setEditingRank(rank);
    setForm({
      level: rank.level,
      name: rank.name,
      symbol: rank.symbol || '⭐',
      color: rank.color || '#6366f1',
      selfDeposit: rank.criteria?.selfDeposit || 0,
      directBusiness: rank.criteria?.directBusiness || 0,
      totalTeamBusiness: rank.criteria?.totalTeamBusiness || 0,
      legs: rank.criteria?.legs || 0,
      promotionType: rank.promotionType || 'AUTO',
      requiredDirectRanks: rank.autoPromotionCriteria?.requiredDirectRanks || 3,
      rankDowngradeEnabled: rank.rankDowngradeEnabled !== false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        level: form.level,
        name: form.name,
        symbol: form.symbol,
        color: form.color,
        criteria: {
          selfDeposit: Number(form.selfDeposit),
          directBusiness: Number(form.directBusiness),
          totalTeamBusiness: Number(form.totalTeamBusiness),
          legs: Number(form.legs),
        },
        promotionType: form.promotionType,
        autoPromotionCriteria: { requiredDirectRanks: Number(form.requiredDirectRanks) },
        rankDowngradeEnabled: form.rankDowngradeEnabled,
      };

      if (editingRank) {
        await updateRank(editingRank._id, payload);
        success('Updated', 'Rank updated successfully');
      } else {
        await createRank(payload);
        success('Created', 'Rank created successfully');
      }
      setShowModal(false);
      await loadRanks();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to save rank'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this rank?')) return;
    try {
      await deleteRank(id);
      success('Deleted', 'Rank deleted successfully');
      await loadRanks();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleRank(id);
      await loadRanks();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to toggle'); }
  };

  const handleRecalculate = async () => {
    if (!confirm('Recalculate ranks for all users? This may take a moment.')) return;
    setRecalculating(true);
    try {
      const res = await recalculateRanks();
      success('Recalculated', res.message || 'Ranks recalculated');
      await loadRanks();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to recalculate'); }
    finally { setRecalculating(false); }
  };

  if (loading) return <Spinner label="Loading ranks..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Rank Management</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {ranks.length} rank{ranks.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw size={14} className={recalculating ? 'spin' : ''} /> Recalculate
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> Create Rank
          </button>
        </div>
      </div>

      {ranks.length === 0 ? (
        <EmptyState title="No ranks configured" subtitle="Create your first rank to get started." />
      ) : (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Rank</th>
                  <th>Criteria</th>
                  <th>Promotion</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ranks.map((rank) => (
                  <tr key={rank._id}>
                    <td><span className="badge badge-purple">Level {rank.level}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{rank.symbol || '⭐'}</span>
                        <div style={{ fontWeight: 600, color: rank.color }}>{rank.name}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        <div>Deposit: ${rank.criteria?.selfDeposit || 0}</div>
                        <div>Direct: ${rank.criteria?.directBusiness || 0}</div>
                        <div>Team: ${rank.criteria?.totalTeamBusiness || 0}</div>
                        <div>Legs: {rank.criteria?.legs || 0}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${rank.promotionType === 'AUTO' ? 'badge-green' : 'badge-blue'}`}>
                        {rank.promotionType === 'AUTO' ? `Auto (${rank.autoPromotionCriteria?.requiredDirectRanks || 3} direct)` : 'Manual'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleToggle(rank._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        {rank.isActive ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#9ca3af" />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(rank)} style={{ padding: '4px 8px' }}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rank._id)} style={{ padding: '4px 8px' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editingRank ? 'Edit Rank' : 'Create Rank'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <input className="form-input" type="number" value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} min={1} />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bronze, Silver" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Symbol</label>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {RANK_SYMBOLS.map((s) => (
                      <button key={s} onClick={() => setForm({ ...form, symbol: s })}
                        style={{ fontSize: 20, padding: 4, background: form.symbol === s ? 'var(--color-primary-soft)' : 'none', border: form.symbol === s ? '2px solid var(--color-primary)' : '2px solid transparent', borderRadius: 6, cursor: 'pointer' }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {RANK_COLORS.map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--color-text)' : '3px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 14, fontWeight: 600 }}>Criteria</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Self Deposit ($)</label>
                    <input className="form-input" type="number" value={form.selfDeposit} onChange={(e) => setForm({ ...form, selfDeposit: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Direct Business ($)</label>
                    <input className="form-input" type="number" value={form.directBusiness} onChange={(e) => setForm({ ...form, directBusiness: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Team Business ($)</label>
                    <input className="form-input" type="number" value={form.totalTeamBusiness} onChange={(e) => setForm({ ...form, totalTeamBusiness: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Legs (Direct Members)</label>
                    <input className="form-input" type="number" value={form.legs} onChange={(e) => setForm({ ...form, legs: e.target.value })} min={0} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 14, fontWeight: 600 }}>Promotion Settings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Promotion Type</label>
                    <select className="form-input" value={form.promotionType} onChange={(e) => setForm({ ...form, promotionType: e.target.value })}>
                      <option value="AUTO">Auto (3 direct members)</option>
                      <option value="MANUAL">Manual (Criteria based)</option>
                    </select>
                  </div>
                  {form.promotionType === 'AUTO' && (
                    <div className="form-group">
                      <label className="form-label">Required Direct Ranks</label>
                      <input className="form-input" type="number" value={form.requiredDirectRanks} onChange={(e) => setForm({ ...form, requiredDirectRanks: e.target.value })} min={1} />
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.rankDowngradeEnabled} onChange={(e) => setForm({ ...form, rankDowngradeEnabled: e.target.checked })} id="downgrade" />
                  <label htmlFor="downgrade" className="form-label" style={{ margin: 0 }}>Allow rank downgrade</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>{editingRank ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
