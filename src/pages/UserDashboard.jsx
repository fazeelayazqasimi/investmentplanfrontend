import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, Wallet as WalletIcon, Receipt, Percent, Share2, User as UserIcon,
  LogOut, Loader2, AlertCircle, TrendingUp, ArrowDownToLine, Menu, X, CheckCircle,
  BarChart3, CreditCard, Users, ArrowRightLeft, DollarSign, Copy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, {
  getMyInvestments, getMyWallet, getMyTransactions, requestDeposit,
  getMyRoiHistory, getMyProfile, updateMyProfile,
  transferRoiToMain, transferProfitShareToMain, getUserConfig, activateAccount,
  transferFundToUser, getTransferSettings, getProgressData,
  transferMainToFund, activateAccountWithSource, investForDownline, getMyDownlines,
  getBankAccounts, getActiveAnnouncements,
} from '../services/apiClient';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import useToast from '../components/useToast';
import UserReferrals from './UserReferrals';
import ChatWidget from '../components/ChatWidget';
import logoHeader from '../images/black-logo.png';

const CHART_COLORS = ['var(--chart-color-1)', 'var(--chart-color-2)', 'var(--chart-color-3)', 'var(--chart-color-4)', 'var(--chart-color-5)', 'var(--chart-color-6)'];
const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { key: 'investments', label: 'My Investments', icon: LineChart, to: '/dashboard/investments' },
  { key: 'wallet', label: 'Wallet', icon: WalletIcon, to: '/dashboard/wallet' },
  { key: 'transactions', label: 'Transactions', icon: Receipt, to: '/dashboard/transactions' },
  { key: 'income', label: 'Income', icon: DollarSign, to: '/dashboard/income' },
  { key: 'direct-income', label: 'Direct Income', icon: DollarSign, to: '/dashboard/direct-income' },
  { key: 'level-income', label: 'Level Income', icon: BarChart3, to: '/dashboard/level-income' },
  { key: 'roi', label: 'ROI', icon: Percent, to: '/dashboard/roi' },
  { key: 'referrals', label: 'Referrals', icon: Share2, to: '/dashboard/referrals' },
  { key: 'profile', label: 'Profile', icon: UserIcon, to: '/dashboard/profile' },
];

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.split('/')[2] || 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { ToastContainer, success, error: toastError } = useToast();

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const closeSidebar = () => setSidebarOpen(false);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(new Set());
  const [modalAnnouncement, setModalAnnouncement] = useState(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getActiveAnnouncements();
        const list = data.announcements || [];
        setAnnouncements(list);
        const modalItem = list.find((a) => a.showModal);
        if (modalItem && !dismissedAnnouncements.has(modalItem._id)) {
          setModalAnnouncement(modalItem);
        }
      } catch (_) {}
    })();
  }, []);

  const dismissAnnouncement = (id) => {
    setDismissedAnnouncements((prev) => new Set([...prev, id]));
  };

  if (user?.role === 'ADMIN') {
    return (
      <div className="center-spinner" style={{ height: '100vh' }}>
        <Modal title="Redirecting" onClose={() => navigate('/admin')}>Admin accounts use the admin panel.</Modal>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><img src={logoHeader} alt="Fin Rise Global" style={{ width: 28, height: 28, borderRadius: 6 }} /></div>
          <div>
            <div className="sidebar-title">My Account</div>
            <div className="sidebar-subtitle">Investment Platform</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={20} className="sidebar-item-icon" />
                <span className="sidebar-item-label">{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => { handleLogout(); closeSidebar(); }} className="sidebar-item" style={{ marginTop: 'var(--space-4)' }}>
            <LogOut size={20} className="sidebar-item-icon" />
            <span className="sidebar-item-label">Logout</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">Member</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={closeSidebar} />

      <div className="dashboard-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div>
              <div className="topbar-title">{NAV.find((n) => n.key === page)?.label || 'Dashboard'}</div>
              <div className="topbar-subtitle">Welcome back, {user?.name}</div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {announcements.filter((a) => a.showBanner && !dismissedAnnouncements.has(a._id)).length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              {announcements.filter((a) => a.showBanner && !dismissedAnnouncements.has(a._id)).map((a) => {
                const colors = { INFO: '#eef2ff', PROMOTION: '#ecfdf5', WARNING: '#fef9c3', UPDATE: '#f0f9ff', EVENT: '#fdf2f8' };
                const borders = { INFO: '#c7d2fe', PROMOTION: '#6ee7b7', WARNING: '#fde047', UPDATE: '#7dd3fc', EVENT: '#f9a8d4' };
                const icons = { INFO: 'ℹ️', PROMOTION: '🎉', WARNING: '⚠️', UPDATE: '🔄', EVENT: '📅' };
                return (
                  <div key={a._id} style={{
                    background: colors[a.type] || '#eef2ff',
                    border: `1px solid ${borders[a.type] || '#c7d2fe'}`,
                    borderRadius: 'var(--radius-xl)',
                    padding: '14px 20px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{icons[a.type] || 'ℹ️'}</span>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: 14 }}>{a.title}</strong>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>{a.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAnnouncement(a._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', flexShrink: 0, padding: 4 }}
                    ><X size={16} /></button>
                  </div>
                );
              })}
            </div>
          )}
          {page === 'dashboard' && <UserOverview toastSuccess={success} toastError={toastError} />}
          {page === 'investments' && <UserInvestments toastSuccess={success} toastError={toastError} />}
          {page === 'wallet' && <UserWallet toastSuccess={success} toastError={toastError} />}
          {page === 'transactions' && <UserTransactions />}
          {page === 'income' && <UserIncome />}
          {page === 'direct-income' && <UserDirectIncome />}
          {page === 'level-income' && <UserLevelIncome />}
          {page === 'roi' && <UserRoi />}
          {page === 'referrals' && <UserReferrals />}
          {page === 'profile' && <UserProfile toastSuccess={success} toastError={toastError} />}
        </div>
      </div>
      <ToastContainer />
      <ChatWidget />

      {modalAnnouncement && (
        <div className="modal-overlay" onClick={() => { dismissAnnouncement(modalAnnouncement._id); setModalAnnouncement(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>{modalAnnouncement.title}</h3>
              <button className="modal-close" onClick={() => { dismissAnnouncement(modalAnnouncement._id); setModalAnnouncement(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                padding: '16px 20px',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 14,
                lineHeight: 1.7,
                color: 'var(--color-text)',
              }}>
                {modalAnnouncement.message}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { dismissAnnouncement(modalAnnouncement._id); setModalAnnouncement(null); }}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */
function UserOverview({ toastSuccess, toastError }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [progress, setProgress] = useState(null);
  const [directIncome, setDirectIncome] = useState(0);
  const [levelIncome, setLevelIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = profile?.referralLink || `${window.location.origin}/register?ref=${user?.referralCode || ''}`;

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toastSuccess('Copied', 'Referral link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  useEffect(() => {
    (async () => {
      try {
        const [w, i, p, directTxn, levelTxn] = await Promise.all([getMyWallet(), getMyInvestments({ status: 'ACTIVE' }), getMyProfile(), getMyTransactions({ type: 'DIRECT_INCOME' }), getMyTransactions({ type: 'LEVEL_INCOME' })]);
        setWallet(w.wallet);
        setInvestments(i.investments || []);
        setProfile(p);
        setDirectIncome((directTxn.transactions || []).reduce((s, t) => s + (t.amount || 0), 0));
        setLevelIncome((levelTxn.transactions || []).reduce((s, t) => s + (t.amount || 0), 0));
        try { const s = await getUserConfig(); setSettings(s); } catch (_) {}
        try { const pr = await getProgressData(); setProgress(pr); } catch (_) {}
      } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleActivate = async (walletSource = 'mainBalance') => {
    setActivating(true);
    try {
      const res = await activateAccountWithSource(walletSource);
      if (res.alreadyActivated) {
        toastSuccess('Already Activated', 'Your account is already activated');
      } else {
        const walletName = res.walletSource === 'fundBalance' ? 'Fund Wallet' : 'Main Wallet';
        toastSuccess('Account Activated', `Your account has been activated using ${walletName}!`);
      }
      const p = await getMyProfile();
      setProfile(p);
      const w = await getMyWallet();
      setWallet(w.wallet);
    } catch (er) { toastError('Activation Failed', er.response?.data?.message || 'Activation failed'); }
    finally { setActivating(false); }
  };

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorBox message={error} />;

  const summary = [
    { label: 'Main Wallet', value: fmt(wallet?.mainBalance), accent: 'stat-success', icon: CreditCard },
    { label: 'E-Wallet', value: fmt(wallet?.ewalletBalance), accent: 'stat-amber', icon: WalletIcon },
    { label: 'ROI Wallet', value: fmt(wallet?.roiBalance), accent: 'stat-info', icon: TrendingUp },
    { label: 'Profit Share', value: fmt(wallet?.profitShareBalance), accent: 'stat-purple', icon: BarChart3 },
    { label: 'Fund Wallet', value: fmt(wallet?.fundBalance), accent: 'stat-teal', icon: Users },
    { label: 'Pending Commissions', value: fmt(wallet?.pendingCommissions), accent: 'stat-danger', icon: AlertCircle },
    { label: 'Total Earnings', value: fmt(wallet?.totalEarnings), accent: 'stat-orange', icon: TrendingUp },
    { label: 'Direct Income', value: fmt(directIncome), accent: 'stat-success', icon: DollarSign },
    { label: 'Level Income', value: fmt(levelIncome), accent: 'stat-info', icon: BarChart3 },
  ];

  const pie = [
    { name: 'Main', value: wallet?.mainBalance || 0 },
    { name: 'E-Wallet', value: wallet?.ewalletBalance || 0 },
    { name: 'ROI', value: wallet?.roiBalance || 0 },
    { name: 'Profit Share', value: wallet?.profitShareBalance || 0 },
    { name: 'Fund', value: wallet?.fundBalance || 0 },
    { name: 'Pending', value: wallet?.pendingCommissions || 0 },
  ].filter((p) => p.value > 0);

  return (
    <div className="animate-slide-up">
      {/* Referral Link Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
        border: '1px solid #c7d2fe',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        marginBottom: 'var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Share2 size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>Refer & Earn</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Share your link and earn income from referrals</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 280 }}>
          <input
            readOnly
            value={referralLink}
            style={{
              flex: 1, padding: '8px 12px', border: '1px solid #c7d2fe', borderRadius: 8,
              fontSize: 13, background: '#fff', color: 'var(--color-text)', fontFamily: 'monospace',
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={copyReferral} style={{ flexShrink: 0 }}>
            {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Activation Banner */}
      {profile && !profile.user?.isActivated && settings && settings.activationFee > 0 && (
        <div className="activation-banner">
          <div className="activation-banner-text">
            <AlertCircle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <div>
              <h3>Activate Your Account</h3>
              <p>Activation fee: <strong>${settings.activationFee}</strong></p>
            </div>
          </div>
          <div className="activation-banner-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleActivate('mainBalance')}
              disabled={activating || (wallet?.mainBalance || 0) < settings.activationFee}
            >
              {activating ? 'Activating...' : `Main Wallet (${fmt(wallet?.mainBalance)})`}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleActivate('fundBalance')}
              disabled={activating || (wallet?.fundBalance || 0) < settings.activationFee}
            >
              {activating ? 'Activating...' : `Fund Wallet (${fmt(wallet?.fundBalance)})`}
            </button>
          </div>
        </div>
      )}

      {/* Wallet Stats */}
      <div className="stats-grid">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div className={`stat-card ${s.accent}`} key={s.label}>
              <div className="stat-icon"><Icon size={22} /></div>
              <div className="stat-content">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bars for 2X and 3X Milestones */}
      {progress && (
        <div className="progress-section">
          <div className="progress-card">
            <div className="progress-header">
              <div className="progress-label">
                <TrendingUp size={18} />
                <span>ROI 2X Milestone</span>
              </div>
              <span className="badge badge-success">{progress.percentage2x}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill green" style={{ width: `${Math.min(progress.percentage2x, 100)}%` }} />
            </div>
            <div className="progress-details">
              <span>Earned: {fmt(progress.progress2x)}</span>
              <span>Target: {fmt(progress.milestone2x)}</span>
            </div>
            {progress.remaining2x > 0 && (
              <div className="progress-remaining">
                {fmt(progress.remaining2x)} remaining to reach 2X
              </div>
            )}
            {progress.remaining2x <= 0 && (
              <div className="progress-complete">
                2X Milestone Reached! Reinvest to continue earning.
              </div>
            )}
          </div>

          <div className="progress-card">
            <div className="progress-header">
              <div className="progress-label">
                <BarChart3 size={18} />
                <span>Total Earnings 3X Cap</span>
              </div>
              <span className="badge badge-purple">{progress.percentage3x}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill purple" style={{ width: `${Math.min(progress.percentage3x, 100)}%` }} />
            </div>
            <div className="progress-details">
              <span>Earned: {fmt(progress.progress3x)}</span>
              <span>Cap: {fmt(progress.milestone3x)}</span>
            </div>
            {progress.remaining3x > 0 && (
              <div className="progress-remaining">
                {fmt(progress.remaining3x)} remaining before 3X cap
              </div>
            )}
            {progress.remaining3x <= 0 && (
              <div className="progress-complete">
                3X Cap reached — overflow goes to pending commissions.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="charts-grid-equal">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Wallet Breakdown</h3>
          </div>
          {pie.length === 0 ? (
            <EmptyState title="No balances yet" subtitle="Your wallet balances will appear here." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {pie.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => fmt(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {pie.map((p, i) => (
                  <span key={p.name} className="pie-legend-item">
                    <span className="pie-legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {p.name}: {fmt(p.value)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Active Investments</h3>
          </div>
          {investments.length === 0 ? (
            <EmptyState title="No active investments" subtitle="Start investing to see your portfolio here." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={investments.map((iv, idx) => ({ name: `Investment ${idx + 1}`, amount: iv.originalAmount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => fmt(value)} />
                <Bar dataKey="amount" fill="var(--chart-color-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* My Investments Section */}
      <div style={{ marginTop: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>My Investments</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Track your active investments and ROI progress</p>
          </div>
          <Link to="/dashboard/investments" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        {investments.length === 0 ? (
          <div className="table-card">
            <EmptyState title="No investments yet" subtitle="Start investing to see your portfolio here." />
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>ROI %</th>
                    <th>ROI Earned</th>
                    <th>Max Return</th>
                    <th>Remaining</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.slice(0, 5).map((iv) => {
                    const maxReturn = iv.maxReturnAmount || iv.originalAmount * 2;
                    const roiEarned = iv.totalRoiEarned || 0;
                    const remaining = Math.max(0, maxReturn - (iv.totalReturned || 0));
                    const progressPct = maxReturn > 0 ? Math.min(100, ((iv.totalReturned || 0) / maxReturn) * 100) : 0;
                    return (
                      <tr key={iv._id}>
                        <td data-label="Amount" className="cell-strong">{fmt(iv.originalAmount)}</td>
                        <td data-label="ROI %">{iv.roiPercentage || '—'}%</td>
                        <td data-label="ROI Earned" className="text-success">{fmt(roiEarned)}</td>
                        <td data-label="Max Return">{fmt(maxReturn)}</td>
                        <td data-label="Remaining">{fmt(remaining)}</td>
                        <td data-label="Progress">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${progressPct}%`, height: '100%', background: progressPct >= 100 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', minWidth: 36 }}>{Math.round(progressPct)}%</span>
                          </div>
                        </td>
                        <td data-label="Status"><StatusBadge status={iv.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {investments.length > 5 && (
              <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                <Link to="/dashboard/investments" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                  View all {investments.length} investments →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INVESTMENTS
   ========================================================= */
function UserInvestments({ toastSuccess, toastError }) {
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const status = q.get('status') || '';
  const [mine, setMine] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDownlineModal, setShowDownlineModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [mainAmount, setMainAmount] = useState('');
  const [ewalletAmount, setEwalletAmount] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [downlines, setDownlines] = useState([]);
  const [downlineReceiver, setDownlineReceiver] = useState('');
  const [downlineEwallet, setDownlineEwallet] = useState('');
  const [downlineSettings, setDownlineSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, w] = await Promise.all([getMyInvestments(status ? { status } : {}), getMyWallet()]);
      setMine(m.investments || []);
      setWallet(w.wallet);
      try { const pr = await getProgressData(); setProgress(pr); } catch (_) {}
      try { const dl = await getMyDownlines(); setDownlines(dl.downlines || []); } catch (_) {}
      try { const s = await getTransferSettings(); setDownlineSettings(s); } catch (_) {}
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  // Auto-calculate wallet split: Main → E-Wallet → Fund
  const autoAllocate = (total) => {
    const amt = Number(total) || 0;
    const maxMain = Math.min(amt, wallet?.mainBalance || 0);
    const remaining = amt - maxMain;
    const maxEwallet = Math.min(remaining, wallet?.ewalletBalance || 0);
    const remaining2 = remaining - maxEwallet;
    const maxFund = Math.min(remaining2, wallet?.fundBalance || 0);
    setMainAmount(maxMain > 0 ? String(maxMain) : '');
    setEwalletAmount(maxEwallet > 0 ? String(maxEwallet) : '');
    setFundAmount(maxFund > 0 ? String(maxFund) : '');
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    const num = Number(val);
    if (num > 0 && wallet) {
      autoAllocate(num);
    } else {
      setMainAmount('');
      setEwalletAmount('');
      setFundAmount('');
    }
  };

  const handleWalletChange = (field, value) => {
    if (field === 'main') setMainAmount(value);
    else if (field === 'ewallet') setEwalletAmount(value);
    else if (field === 'fund') setFundAmount(value);
  };

  const totalWalletSplit = (Number(mainAmount) || 0) + (Number(ewalletAmount) || 0) + (Number(fundAmount) || 0);
  const investAmount = Number(amount) || 0;
  const splitDifference = investAmount - totalWalletSplit;
  const splitValid = investAmount > 0 && Math.abs(splitDifference) < 0.01;
  const splitExceeds = investAmount > 0 && splitDifference < -0.01;
  const insufficientBalance = investAmount > 0 && (
    (Number(mainAmount) || 0) > (wallet?.mainBalance || 0) ||
    (Number(ewalletAmount) || 0) > (wallet?.ewalletBalance || 0) ||
    (Number(fundAmount) || 0) > (wallet?.fundBalance || 0)
  );

  const submitInvest = async () => {
    setBusy(true);
    setFormError('');
    const amt = Number(amount);
    const mainAmt = Number(mainAmount) || 0;
    const ewalletAmt = Number(ewalletAmount) || 0;
    const fundAmt = Number(fundAmount) || 0;
    if (!amt || amt <= 0) { setFormError('Enter a valid investment amount'); setBusy(false); return; }
    const totalWallet = mainAmt + ewalletAmt + fundAmt;
    if (Math.abs(totalWallet - amt) > 0.01) { setFormError(`Wallet split (${fmt(totalWallet)}) must equal investment amount (${fmt(amt)})`); setBusy(false); return; }
    if (mainAmt > (wallet?.mainBalance || 0)) { setFormError('Main Wallet amount exceeds available balance'); setBusy(false); return; }
    if (ewalletAmt > (wallet?.ewalletBalance || 0)) { setFormError('E-Wallet amount exceeds available balance'); setBusy(false); return; }
    if (fundAmt > (wallet?.fundBalance || 0)) { setFormError('Fund Wallet amount exceeds available balance'); setBusy(false); return; }
    try {
      await apiClient.post('/investments', {
        amount: amt,
        walletBreakdown: { main: mainAmt, ewallet: ewalletAmt, fund: fundAmt },
      });
      setShowModal(false); setAmount(''); setMainAmount(''); setEwalletAmount(''); setFundAmount('');
      toastSuccess('Investment Created', `Successfully invested ${fmt(amt)}`);
      await load();
    } catch (e) { setFormError(e.response?.data?.message || 'Investment failed'); toastError('Investment Failed', e.response?.data?.message); }
    finally { setBusy(false); }
  };

  const submitDownlineInvest = async () => {
    setBusy(true);
    setFormError('');
    const amt = Number(amount);
    const ewalletAmt = Number(downlineEwallet) || 0;
    if (!amt || amt <= 0) { setFormError('Enter a valid amount'); setBusy(false); return; }
    if (!downlineReceiver) { setFormError('Select a downline member'); setBusy(false); return; }
    if (ewalletAmt < 0) { setFormError('E-Wallet amount cannot be negative'); setBusy(false); return; }
    try {
      await investForDownline({ receiverId: downlineReceiver, amount: amt, ewalletAmount: ewalletAmt });
      setShowDownlineModal(false); setAmount(''); setDownlineReceiver(''); setDownlineEwallet('');
      toastSuccess('Investment Created', `Successfully invested ${fmt(amt)} for downline`);
      await load();
    } catch (e) { setFormError(e.response?.data?.message || 'Investment failed'); toastError('Investment Failed', e.response?.data?.message); }
    finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading investments..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Investments</h1>
          <p className="subtitle">Invest any amount and track your portfolio</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setAmount(''); setMainAmount(''); setEwalletAmount(''); setFundAmount(''); setFormError(''); }}>
          <TrendingUp size={14} /> Invest Now
        </button>
        {downlines.length > 0 && downlineSettings?.ewalletDownlineOfferEnabled && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setShowDownlineModal(true); setAmount(''); setDownlineReceiver(''); setDownlineEwallet(''); }}>
            <Users size={14} /> Invest for Downline
          </button>
        )}
      </div>

      {/* Progress Bars */}
      {progress && (
        <div className="progress-section">
          <div className="progress-card progress-2x">
            <div className="progress-header">
              <div className="progress-title">
                <TrendingUp size={18} />
                <span>ROI 2X Milestone</span>
              </div>
              <span className="progress-badge green">{progress.percentage2x}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill green" style={{ width: `${Math.min(progress.percentage2x, 100)}%` }} />
            </div>
            <div className="progress-info">
              <span>Earned: {fmt(progress.progress2x)}</span>
              <span>Target: {fmt(progress.milestone2x)}</span>
            </div>
            {progress.remaining2x <= 0 && (
              <div className="progress-complete">2X Reached! Reinvest to continue.</div>
            )}
          </div>

          <div className="progress-card progress-3x">
            <div className="progress-header">
              <div className="progress-title">
                <BarChart3 size={18} />
                <span>Total Earnings 3X Cap</span>
              </div>
              <span className="progress-badge purple">{progress.percentage3x}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill purple" style={{ width: `${Math.min(progress.percentage3x, 100)}%` }} />
            </div>
            <div className="progress-info">
              <span>Earned: {fmt(progress.progress3x)}</span>
              <span>Cap: {fmt(progress.milestone3x)}</span>
            </div>
            {progress.remaining3x <= 0 && (
              <div className="progress-complete">3X Cap Reached! Reinvest to continue.</div>
            )}
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: 'var(--space-4)' }}>
        <div>
          <h2>My Investments</h2>
          <p className="subtitle">Track your active and completed investments</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>ROI %</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mine.length === 0 && <tr><td colSpan={5} className="table-empty">No investments found</td></tr>}
              {mine.map((iv) => (
                <tr key={iv._id}>
                  <td data-label="Amount" className="cell-strong">{fmt(iv.originalAmount)}</td>
                  <td data-label="ROI">{iv.roiPercentage}%</td>
                  <td data-label="Start">{fmtDate(iv.startDate)}</td>
                  <td data-label="End">{fmtDate(iv.endDate)}</td>
                  <td data-label="Status"><StatusBadge status={iv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Invest"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitInvest} disabled={busy}>
                {busy ? <><span className="spinner" /> Processing...</> : 'Confirm Investment'}
              </button>
            </>
          }
          onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">Total Investment Amount ($)</label>
            <input className="form-input" type="number" value={amount} onChange={handleAmountChange} min="1" placeholder="0.00" />
          </div>
          <div style={{ margin: 'var(--space-3) 0', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
              Pay from wallets:
            </p>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Main Wallet</span>
                <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 12 }}>Available: {fmt(wallet?.mainBalance)}</span>
              </label>
              <input className="form-input" type="number" value={mainAmount} onChange={(e) => handleWalletChange('main', e.target.value)} min="0" max={wallet?.mainBalance || 0} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>E-Wallet</span>
                <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 12 }}>Available: {fmt(wallet?.ewalletBalance)}</span>
              </label>
              <input className="form-input" type="number" value={ewalletAmount} onChange={(e) => handleWalletChange('ewallet', e.target.value)} min="0" max={wallet?.ewalletBalance || 0} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fund Wallet</span>
                <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 12 }}>Available: {fmt(wallet?.fundBalance)}</span>
              </label>
              <input className="form-input" type="number" value={fundAmount} onChange={(e) => handleWalletChange('fund', e.target.value)} min="0" max={wallet?.fundBalance || 0} placeholder="0.00" />
            </div>
            {investAmount > 0 && (
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 'var(--space-2)' }}>
                Split: {fmt(Number(mainAmount) || 0)} + {fmt(Number(ewalletAmount) || 0)} + {fmt(Number(fundAmount) || 0)} = <strong>{fmt(totalWalletSplit)}</strong>
                {splitExceeds && (
                  <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>(exceeds investment amount by {fmt(-splitDifference)})</span>
                )}
                {!splitExceeds && !splitValid && (
                  <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>(must equal {fmt(investAmount)})</span>
                )}
                {splitValid && insufficientBalance && (
                  <span style={{ color: 'var(--color-warning, #f59e0b)', marginLeft: 8 }}>(one or more wallets exceed available balance)</span>
                )}
              </div>
            )}
          </div>
          {formError && <ErrorBox message={formError} />}
        </Modal>
      )}

      {showDownlineModal && (
        <Modal title="Invest for Downline"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDownlineModal(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitDownlineInvest} disabled={busy}>
                {busy ? <><span className="spinner" /> Processing...</> : 'Confirm Investment'}
              </button>
            </>
          }
          onClose={() => setShowDownlineModal(false)}>
          <p style={{ marginBottom: 'var(--space-2)' }}>Available main balance: <strong>{fmt(wallet?.mainBalance)}</strong></p>
          <p style={{ marginBottom: 'var(--space-4)' }}>Available E-Wallet: <strong>{fmt(wallet?.ewalletBalance)}</strong></p>
          <div className="form-group">
            <label className="form-label">Select Downline Member</label>
            <select className="select" value={downlineReceiver} onChange={(e) => setDownlineReceiver(e.target.value)}>
              <option value="">Choose a member...</option>
              {downlines.map((dl) => (
                <option key={dl._id || dl.user?._id} value={dl._id || dl.user?._id}>
                  {dl.name || dl.user?.name} ({dl.email || dl.user?.email})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Total Investment Amount</label>
            <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">E-Wallet Contribution (max {downlineSettings?.ewalletMaxPercentage || 0}%)</label>
            <input className="form-input" type="number" value={downlineEwallet} onChange={(e) => setDownlineEwallet(e.target.value)} min="0" max={amount ? (Number(amount) * (downlineSettings?.ewalletMaxPercentage || 0) / 100) : 0} />
            <span className="form-hint">Remaining will be paid from Main Wallet</span>
          </div>
          {formError && <ErrorBox message={formError} />}
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   WALLET
   ========================================================= */
function UserWallet({ toastSuccess, toastError }) {
  const q = new URLSearchParams(useLocation().search);
  const tab = q.get('tab') || 'overview';
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [showFundForm, setShowFundForm] = useState(false);
  const [showMainToFundForm, setShowMainToFundForm] = useState(false);
  const [mainToFundAmount, setMainToFundAmount] = useState('');
  const [mainToFundBusy, setMainToFundBusy] = useState(false);
  const [mainToFundError, setMainToFundError] = useState('');
  const [fundReceiver, setFundReceiver] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundBusy, setFundBusy] = useState(false);
  const [fundError, setFundError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, t] = await Promise.all([getMyWallet(), getMyTransactions({ type: 'DEPOSIT' })]);
      setWallet(w.wallet);
      setTxns(t.transactions || []);
      try {
        const s = await getTransferSettings();
        setSettings(s);
      } catch (e) { /* settings fetch optional */ }
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showDepositForm && bankAccounts.length === 0) {
      setBankLoading(true);
      getBankAccounts()
        .then((d) => setBankAccounts(d.accounts || []))
        .catch(() => {})
        .finally(() => setBankLoading(false));
    }
  }, [showDepositForm]);

  const submitDeposit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    setSuccess('');
    const amt = Number(amount);
    if (!amt || amt <= 0) { setFormError('Enter a valid amount'); setBusy(false); return; }
    try {
      await requestDeposit({ amount: amt, description: desc, bankAccountId: selectedBank || undefined });
      setSuccess('Deposit request submitted. Awaiting admin approval.');
      toastSuccess('Deposit Submitted', `Deposit request for ${fmt(amt)} submitted successfully.`);
      setAmount('');
      setDesc('');
      setSelectedBank('');
      setShowDepositForm(false);
      await load();
    } catch (er) { setFormError(er.response?.data?.message || 'Deposit failed'); toastError('Deposit Failed', er.response?.data?.message); }
    finally { setBusy(false); }
  };

  const handleRoiTransfer = async () => {
    setTransferring(true);
    try {
      await transferRoiToMain();
      toastSuccess('Transfer Complete', 'ROI balance transferred to Main Wallet.');
      await load();
    } catch (er) { toastError('Transfer Failed', er.response?.data?.message || 'Transfer failed'); }
    finally { setTransferring(false); }
  };

  const handleProfitShareTransfer = async () => {
    setTransferring(true);
    try {
      await transferProfitShareToMain();
      toastSuccess('Transfer Complete', 'Profit Share balance transferred to Main Wallet.');
      await load();
    } catch (er) { toastError('Transfer Failed', er.response?.data?.message || 'Transfer failed'); }
    finally { setTransferring(false); }
  };

  const handleMainToFund = async () => {
    setMainToFundBusy(true);
    setMainToFundError('');
    const amt = Number(mainToFundAmount);
    if (!amt || amt <= 0) { setMainToFundError('Enter a valid amount'); setMainToFundBusy(false); return; }
    if (amt > (wallet?.mainBalance || 0)) { setMainToFundError('Insufficient Main Wallet balance'); setMainToFundBusy(false); return; }
    try {
      await transferMainToFund({ amount: amt });
      toastSuccess('Transfer Complete', `${fmt(amt)} transferred from Main Wallet to Fund Wallet.`);
      setMainToFundAmount('');
      setShowMainToFundForm(false);
      await load();
    } catch (er) { setMainToFundError(er.response?.data?.message || 'Transfer failed'); toastError('Transfer Failed', er.response?.data?.message); }
    finally { setMainToFundBusy(false); }
  };

  const handleFundTransfer = async () => {
    setFundBusy(true);
    setFundError('');
    const amt = Number(fundAmount);
    if (!fundReceiver || !amt || amt <= 0) { setFundError('Enter valid receiver ID and amount'); setFundBusy(false); return; }
    try {
      await transferFundToUser({ receiverId: fundReceiver, amount: amt });
      toastSuccess('Fund Transfer Complete', `${fmt(amt)} transferred successfully.`);
      setFundReceiver('');
      setFundAmount('');
      setShowFundForm(false);
      await load();
    } catch (er) { setFundError(er.response?.data?.message || 'Transfer failed'); toastError('Transfer Failed', er.response?.data?.message); }
    finally { setFundBusy(false); }
  };

  if (loading) return <Spinner label="Loading wallet..." />;
  if (error) return <ErrorBox message={error} />;

  const balances = [
    { label: 'Main Wallet', value: fmt(wallet?.mainBalance), color: 'primary', icon: CreditCard },
    { label: 'E-Wallet', value: fmt(wallet?.ewalletBalance), color: 'yellow', icon: WalletIcon },
    { label: 'ROI Wallet', value: fmt(wallet?.roiBalance), color: 'green', icon: TrendingUp },
    { label: 'Profit Share Wallet', value: fmt(wallet?.profitShareBalance), color: 'purple', icon: BarChart3 },
    { label: 'Fund Wallet', value: fmt(wallet?.fundBalance), color: 'teal', icon: Users },
    { label: 'Pending Commissions', value: fmt(wallet?.pendingCommissions), color: 'red', icon: AlertCircle },
  ];

  const roiTransferAllowed = settings?.roiTransferEnabled;
  const psTransferAllowed = settings?.profitShareTransferEnabled;
  const fundTransferAllowed = settings?.fundTransferEnabled;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Wallet</h1>
          <p className="subtitle">Manage your balances and deposits</p>
        </div>
      </div>

      <div className="wallet-summary">
        {balances.map((b) => (
          <div className={`balance-card ${b.color}`} key={b.label}>
            <div className={`balance-icon ${b.color === 'primary' ? 'blue' : b.color === 'green' ? 'green' : b.color === 'yellow' ? 'yellow' : 'purple'}`}>
              <b.icon size={22} />
            </div>
            <div>
              <div className="balance-amount">{b.value}</div>
              <div className="balance-label">{b.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="info-banner danger">
        <AlertCircle size={14} />
        Fund Wallet cannot be withdrawn. It can only be used for downline transfers and account activation.
      </div>

      {/* Transfer Sections */}
      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setShowDepositForm(!showDepositForm)}
        >
          <ArrowDownToLine size={16} /> {showDepositForm ? 'Close' : 'Request Deposit'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowMainToFundForm(!showMainToFundForm)}
          disabled={!fundTransferAllowed}
        >
          <ArrowRightLeft size={16} /> {showMainToFundForm ? 'Close' : 'Move to Fund Wallet'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowFundForm(!showFundForm)}
          disabled={!fundTransferAllowed}
        >
          <ArrowRightLeft size={16} /> {showFundForm ? 'Close' : 'Fund Transfer'}
        </button>
      </div>
      {!fundTransferAllowed && (
        <div className="info-banner danger" style={{ marginBottom: 'var(--space-3)' }}>
          Fund Wallet transfers are currently disabled by admin.
        </div>
      )}

      <div className="transfers-grid">
        <div className="panel">
          <h3>ROI Wallet Transfer</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Transfer ROI balance to Main Wallet. Max return is 2x your investment.
          </p>
          <div className="filter-group">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRoiTransfer}
              disabled={!roiTransferAllowed || transferring || (wallet?.roiBalance || 0) <= 0}
            >
              {transferring ? 'Transferring...' : 'Transfer to Main Wallet'}
            </button>
            {!settings?.roiTransferEnabled && <span className="text-muted" style={{ fontSize: 12 }}>Disabled by admin</span>}
          </div>
        </div>

        <div className="panel">
          <h3>Profit Share Transfer</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Transfer Profit Share balance to Main Wallet. Max return is 3x your investment.
          </p>
          <div className="filter-group">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleProfitShareTransfer}
              disabled={!psTransferAllowed || transferring || (wallet?.profitShareBalance || 0) <= 0}
            >
              {transferring ? 'Transferring...' : 'Transfer to Main Wallet'}
            </button>
            {!settings?.profitShareTransferEnabled && <span className="text-muted" style={{ fontSize: 12 }}>Disabled by admin</span>}
          </div>
        </div>
      </div>

      {showMainToFundForm && (
        <div className="deposit-form">
          <h3>Move to Fund Wallet</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Transfer funds from your Main Wallet to your Fund Wallet. Available: <strong>{fmt(wallet?.mainBalance)}</strong>
          </p>
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 'var(--space-3)', color: 'var(--color-danger)' }}>
            Fund Wallet cannot be withdrawn. It can only be used for downline transfers and account activation.
          </p>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input className="form-input" type="number" value={mainToFundAmount} onChange={(e) => setMainToFundAmount(e.target.value)} placeholder="0.00" min="1" />
          </div>
          {mainToFundError && <ErrorBox message={mainToFundError} />}
          <button className="btn btn-primary btn-block" onClick={handleMainToFund} disabled={mainToFundBusy || !mainToFundAmount}>
            {mainToFundBusy ? <><span className="spinner" /> Transferring...</> : 'Transfer to Fund Wallet'}
          </button>
        </div>
      )}

      {showDepositForm && (
        <div className="deposit-form">
          <h3>Request Deposit</h3>
          <form onSubmit={submitDeposit}>
            {bankLoading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}><Spinner label="Loading bank accounts..." /></div>
            ) : bankAccounts.length > 0 ? (
              <div className="form-group">
                <label className="form-label">Select Bank / Payment Method</label>
                <div className="bank-accounts-grid">
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc._id}
                      className={`bank-account-card ${selectedBank === acc._id ? 'selected' : ''}`}
                      onClick={() => setSelectedBank(acc._id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedBank(acc._id)}
                    >
                      <div className="bank-card-type">{acc.accountType === 'BANK' ? 'Bank' : acc.accountType === 'JAZZCASH' ? 'JazzCash' : acc.accountType === 'EASYPAISA' ? 'EasyPaisa' : 'Other'}</div>
                      <div className="bank-card-name">{acc.bankName}</div>
                      <div className="bank-card-holder">{acc.accountHolder}</div>
                      <div className="bank-card-number">{acc.accountNumber}</div>
                      {acc.iban && <div className="bank-card-iban">{acc.iban}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="info-banner info" style={{ marginBottom: 'var(--space-3)' }}>
                No bank accounts configured. Please contact admin for deposit details.
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Details / Reference</label>
              <input className="form-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Payment reference or transaction ID" />
            </div>
            {formError && <ErrorBox message={formError} />}
            {success && <div className="success-box" style={{ marginBottom: 'var(--space-3)' }}><CheckCircle size={18} /> {success}</div>}
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <><span className="spinner" /> Submitting...</> : 'Submit Deposit'}
            </button>
            <p className="form-hint" style={{ marginTop: 'var(--space-2)' }}>Balance updates only after admin approval.</p>
          </form>
        </div>
      )}

      {showFundForm && (
        <div className="deposit-form">
          <h3>Fund Wallet Transfer</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Transfer funds from your Fund Wallet to another user. Available balance: <strong>{fmt(wallet?.fundBalance)}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Receiver User ID</label>
            <input className="form-input" value={fundReceiver} onChange={(e) => setFundReceiver(e.target.value)} placeholder="Enter receiver's user ID" />
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input className="form-input" type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="0.00" min="0.01" />
          </div>
          {fundError && <ErrorBox message={fundError} />}
          <button className="btn btn-primary btn-block" onClick={handleFundTransfer} disabled={fundBusy || !fundReceiver || !fundAmount || !fundTransferAllowed}>
            {fundBusy ? <><span className="spinner" /> Transferring...</> : 'Transfer Funds'}
          </button>
        </div>
      )}

      {tab === 'withdraw' && (
        <EmptyState title="Withdrawals not enabled" subtitle="Withdrawal requests are not supported on this platform yet." />
      )}

      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <div>
          <h2>Recent Deposits</h2>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {txns.length === 0 && <tr><td colSpan={3} className="table-empty">No deposits yet</td></tr>}
              {txns.map((t) => (
                <tr key={t._id}>
                  <td data-label="Amount" className="cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTIONS
   ========================================================= */
function UserTransactions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try { const t = await getMyTransactions(); setRows(t.transactions || []); }
      catch (e) { setError(e.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading transactions..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="subtitle">View all your transaction history</p>
        </div>
      </div>
      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No transactions found</td></tr>}
              {rows.map((t) => (
                <tr key={t._id}>
                  <td data-label="Type" className="cell-strong">{t.type}</td>
                  <td data-label="Amount">{fmt(t.amount)}</td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INCOME — Direct & Level Income
   ========================================================= */
function UserIncome() {
  const [tab, setTab] = useState('direct');
  const [directRows, setDirectRows] = useState([]);
  const [levelRows, setLevelRows] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [directTxn, levelTxn, w] = await Promise.all([
          getMyTransactions({ type: 'DIRECT_INCOME' }),
          getMyTransactions({ type: 'LEVEL_INCOME' }),
          getMyWallet(),
        ]);
        setDirectRows(directTxn.transactions || []);
        setLevelRows(levelTxn.transactions || []);
        setWallet(w.wallet);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load income data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading income data..." />;
  if (error) return <ErrorBox message={error} />;

  const totalDirect = directRows.reduce((s, t) => s + (t.amount || 0), 0);
  const totalLevel = levelRows.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Income</h1>
          <p className="subtitle">Track your Direct and Level income earnings</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-success">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Direct Income</div>
            <div className="stat-value">{fmt(totalDirect)}</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><BarChart3 size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Level Income</div>
            <div className="stat-value">{fmt(totalLevel)}</div>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Network Income</div>
            <div className="stat-value">{fmt(totalDirect + totalLevel)}</div>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon"><WalletIcon size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Main Wallet Balance</div>
            <div className="stat-value">{fmt(wallet?.mainBalance)}</div>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 'var(--space-4)' }}>
        <button
          className={`btn ${tab === 'direct' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setTab('direct')}
        >
          <DollarSign size={14} /> Direct Income (Level 1)
        </button>
        <button
          className={`btn ${tab === 'level' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setTab('level')}
        >
          <BarChart3 size={14} /> Level Income (Level 2+)
        </button>
      </div>

      <div className="table-card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Investment Amount</th>
                <th>Income %</th>
                <th>Income Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {tab === 'direct' && directRows.length === 0 && (
                <tr><td colSpan={6} className="table-empty">No direct income earned yet</td></tr>
              )}
              {tab === 'level' && levelRows.length === 0 && (
                <tr><td colSpan={6} className="table-empty">No level income earned yet</td></tr>
              )}
              {tab === 'direct' && directRows.map((t) => (
                <tr key={t._id}>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-success cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                </tr>
              ))}
              {tab === 'level' && levelRows.map((t) => (
                <tr key={t._id}>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-blue cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DIRECT INCOME
   ========================================================= */
function UserDirectIncome() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyTransactions({ type: 'DIRECT_INCOME' });
        setRows(res.transactions || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load direct income data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading direct income..." />;
  if (error) return <ErrorBox message={error} />;

  const totalDirect = rows.reduce((s, t) => s + (t.amount || 0), 0);
  const now = new Date();
  const thisMonthRows = rows.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthDirect = thisMonthRows.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Direct Income</h1>
          <p className="subtitle">Track your direct referral income earnings</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-success">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Direct Income</div>
            <div className="stat-value">{fmt(totalDirect)}</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{rows.length}</div>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon"><Receipt size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">This Month</div>
            <div className="stat-value">{fmt(thisMonthDirect)}</div>
          </div>
        </div>
      </div>

      <div className="table-card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>Investment Amount</th>
                <th>Income %</th>
                <th>Income Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="table-empty">No direct income earned yet</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t._id}>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-success cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LEVEL INCOME
   ========================================================= */
function UserLevelIncome() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyTransactions({ type: 'LEVEL_INCOME' });
        setRows(res.transactions || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load level income data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading level income..." />;
  if (error) return <ErrorBox message={error} />;

  const totalLevel = rows.reduce((s, t) => s + (t.amount || 0), 0);
  const now = new Date();
  const thisMonthRows = rows.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthLevel = thisMonthRows.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Level Income</h1>
          <p className="subtitle">Track your level/network income earnings</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-info">
          <div className="stat-icon"><BarChart3 size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Level Income</div>
            <div className="stat-value">{fmt(totalLevel)}</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{rows.length}</div>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon"><Receipt size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">This Month</div>
            <div className="stat-value">{fmt(thisMonthLevel)}</div>
          </div>
        </div>
      </div>

      <div className="table-card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Level</th>
                <th>From</th>
                <th>Investment Amount</th>
                <th>Income %</th>
                <th>Income Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="table-empty">No level income earned yet</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t._id}>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                  <td data-label="Level" className="cell-strong">{t.metadata?.level ? `Level ${t.metadata.level}` : '—'}</td>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-blue cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ROI
   ========================================================= */
function UserRoi() {
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await getMyRoiHistory();
        setRows(r.history || []);
        try { const pr = await getProgressData(); setProgress(pr); } catch (_) {}
      } catch (e) { setError(e.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading ROI history..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>ROI History</h1>
          <p className="subtitle">Track your return on investment earnings</p>
        </div>
      </div>

      {/* Progress Bars */}
      {progress && (
        <div className="progress-section">
          <div className="progress-card progress-2x">
            <div className="progress-header">
              <div className="progress-title">
                <TrendingUp size={18} />
                <span>ROI 2X Milestone</span>
              </div>
              <span className="progress-badge green">{progress.percentage2x}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill green" style={{ width: `${Math.min(progress.percentage2x, 100)}%` }} />
            </div>
            <div className="progress-info">
              <span>Returned: {fmt(progress.progress2x)}</span>
              <span>Max Return: {fmt(progress.milestone2x)}</span>
            </div>
            {progress.remaining2x > 0 && (
              <div className="progress-remaining">
                {fmt(progress.remaining2x)} remaining to reach 2X
              </div>
            )}
            {progress.remaining2x <= 0 && (
              <div className="progress-complete">2X Milestone Reached! Reinvest to continue earning.</div>
            )}
          </div>

          <div className="progress-card progress-3x">
            <div className="progress-header">
              <div className="progress-title">
                <BarChart3 size={18} />
                <span>Total Earnings 3X Cap</span>
              </div>
              <span className="progress-badge purple">{progress.percentage3x}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill purple" style={{ width: `${Math.min(progress.percentage3x, 100)}%` }} />
            </div>
            <div className="progress-info">
              <span>Earned: {fmt(progress.progress3x)}</span>
              <span>Cap: {fmt(progress.milestone3x)}</span>
            </div>
            {progress.remaining3x > 0 && (
              <div className="progress-remaining">
                {fmt(progress.remaining3x)} remaining before 3X cap
              </div>
            )}
            {progress.remaining3x <= 0 && (
              <div className="progress-complete">3X Cap Reached! Reinvest to continue.</div>
            )}
          </div>
        </div>
      )}
      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>ROI %</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No ROI credited yet</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td data-label="ROI" className="cell-strong">{r.roiPercentage}%</td>
                  <td data-label="Amount">{fmt(r.roiAmount)}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td data-label="Date">{fmtDate(r.roiDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE
   ========================================================= */
function UserProfile({ toastSuccess, toastError }) {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await getMyProfile();
      setProfile(p);
      setName(p.user.name);
      setPhone(p.user.phone);
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await updateMyProfile({ name, phone });
      toastSuccess('Profile Updated', 'Your profile has been saved successfully.');
      setEdit(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed');
      toastError('Update Failed', e.response?.data?.message);
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner label="Loading profile..." />;
  if (error) return <ErrorBox message={error} />;

  const u = profile.user;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="subtitle">Manage your account information</p>
        </div>
      </div>

      <div className="panel max-w-md">
        {!edit ? (
          <>
            <div className="detail-grid">
              <div className="detail-item"><span className="k">Name</span><span className="v">{u.name}</span></div>
              <div className="detail-item"><span className="k">Email</span><span className="v">{u.email}</span></div>
              <div className="detail-item"><span className="k">Phone</span><span className="v">{u.phone}</span></div>
              <div className="detail-item"><span className="k">Status</span><span className="v"><StatusBadge status={u.accountStatus} /></span></div>
              <div className="detail-item"><span className="k">Referral Code</span><span className="v">{u.referralCode}</span></div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setEdit(true)}>
              Edit Profile
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="filter-group">
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEdit(false)} disabled={saving}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
