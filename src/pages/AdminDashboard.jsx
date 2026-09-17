import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, LineChart, ArrowDownToLine, ArrowUpFromLine, Receipt,
  Percent, Share2, FileBarChart, Settings, LogOut, Search, Menu,
  ChevronDown, ChevronRight, ChevronLeft, ZoomIn, ZoomOut,
  Maximize2, Minimize2, RotateCcw, X, UserCheck, UserX,
  Filter, Download, RefreshCw, ArrowUpDown, Network,
  DollarSign, Activity, TrendingUp, Megaphone, MessageSquare, Send, Layers, Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient, {
  getAdminUsers, getAdminStats, getAdminUserDetail, getAdminInvestments,
  getAdminTransactions, getAdminSettings, updateAdminSettings, processRoi, processRoiManual,
  getPendingDeposits, approveDeposit, rejectDeposit,
  distributeProfitShare, triggerRoiTransfer, triggerProfitShareTransfer,
  getAdminReferralStats, searchAdminReferralMembers, getAdminReferralTree,
  getAdminReferralMemberDetail, getAdminReferralMembers,
  getAdminBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncement,
  getAdminConversations, getAdminChatMessages, sendAdminMessage, updateConversationStatus,
  activateUser, deactivateUser, suspendUser, deleteUser,
  updateAdminUserCredentials, adjustAdminUserWallet, getAdminWithdrawals,
} from '../services/apiClient';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import Spinner from '../components/Spinner';
import logoHeader from '../images/favicon.png';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import useToast from '../components/useToast';

const CHART_COLORS = ['var(--chart-color-1)', 'var(--chart-color-2)', 'var(--chart-color-3)', 'var(--chart-color-4)', 'var(--chart-color-5)', 'var(--chart-color-6)'];

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtCompact = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

function ResponsiveContainerWrap({ height, children }) {
  return <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>;
}

/* ---------- Sidebar structure ---------- */
  const NAV = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/admin/overview' },
    { key: 'users', label: 'Users', icon: Users, to: '/admin/users' },
    { key: 'investments', label: 'Investments', icon: LineChart, to: '/admin/investments' },
    { key: 'deposits', label: 'Deposits', icon: ArrowDownToLine, to: '/admin/deposits?status=PENDING' },
    { key: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine, to: '/admin/withdrawals' },
    { key: 'transactions', label: 'Transactions', icon: Receipt, to: '/admin/transactions' },
    { key: 'roi', label: 'ROI Management', icon: Percent, to: '/admin/roi' },
    { key: 'referrals', label: 'Network Center', icon: Share2, to: '/admin/referrals' },
    { key: 'levels', label: 'Levels', icon: Layers, to: '/admin/levels' },
    { key: 'profit-share-levels', label: 'Profit Share Levels', icon: Percent, to: '/admin/profit-share-levels' },
    { key: 'announcements', label: 'Announcements', icon: Megaphone, to: '/admin/announcements' },
    { key: 'support', label: 'Support Chat', icon: MessageSquare, to: '/admin/support' },
    { key: 'reports', label: 'Reports', icon: FileBarChart, to: '/admin/reports' },
    { key: 'settings', label: 'Settings', icon: Settings, to: '/admin/settings' },
  ];

/* =========================================================
   SHELL
   ========================================================= */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.split('/')[2] || 'overview';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { ToastContainer, success, error: toastError } = useToast();

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><img src={logoHeader} alt="Fin Rise Global" style={{ width: 28, height: 28, borderRadius: 6 }} /></div>
          <div>
            <div className="sidebar-title">Admin Panel</div>
            <div className="sidebar-subtitle">Platform Management</div>
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
            <div className="sidebar-avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">Administrator</div>
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
              <div className="topbar-subtitle">Platform management &amp; controls</div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              transition: 'all var(--transition-base)',
            }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
        </header>

        <div className="page-content animate-slide-up">
          {page === 'overview' && <AdminOverview toastSuccess={success} toastError={toastError} />}
          {page === 'users' && <AdminUsers toastSuccess={success} toastError={toastError} />}
          {page === 'investments' && <AdminInvestments />}
          {page === 'deposits' && <AdminDeposits toastSuccess={success} toastError={toastError} />}
          {page === 'withdrawals' && <AdminWithdrawals toastSuccess={success} toastError={toastError} />}
          {page === 'transactions' && <AdminTransactions />}
          {page === 'roi' && <AdminRoi toastSuccess={success} toastError={toastError} />}
          {page === 'referrals' && <AdminReferrals />}
          {page === 'levels' && <AdminLevels toastSuccess={success} toastError={toastError} />}
          {page === 'profit-share-levels' && <AdminProfitShareLevels toastSuccess={success} toastError={toastError} />}
          {page === 'announcements' && <AdminAnnouncements toastSuccess={success} toastError={toastError} />}
          {page === 'support' && <AdminSupportChat toastSuccess={success} toastError={toastError} />}
          {page === 'reports' && <AdminReports />}
          {page === 'settings' && <AdminSettings toastSuccess={success} toastError={toastError} />}
        </div>
        </div>
    </div>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */
function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([getAdminStats(), getPendingDeposits()]);
        setStats(s);
        setPending(p.deposits || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load overview'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading overview..." />;
  if (error) return <ErrorBox message={error} />;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'blue', icon: Users },
    { label: 'Pending Deposits', value: stats.pendingDeposits, color: 'yellow', icon: ArrowDownToLine },
    { label: 'Total Deposited', value: fmt(stats.totalDeposited), color: 'green', icon: DollarSign },
    { label: 'Total Invested', value: fmt(stats.totalInvested), color: 'purple', icon: LineChart },
    { label: 'Active Investments', value: stats.activeInvestments, color: 'teal', icon: Activity },
    { label: 'Total ROI Paid', value: fmt(stats.totalRoiDistributed), color: 'red', icon: Percent },
  ];

  return (
    <div>
      <div className="stats-grid">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div className={`stat-card stat-${c.color}`} key={c.label}>
              <div className="stat-icon"><Icon size={20} /></div>
              <div className="stat-content">
                <div className="stat-label">{c.label}</div>
                <div className="stat-value">{c.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header"><h3>Signup Trend (6 months)</h3></div>
          <ResponsiveContainerWrap height={240}>
            <AreaChart data={stats.signupTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="var(--chart-deposits)" fill="var(--chart-deposits)" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainerWrap>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><h3>Users vs Admins</h3></div>
          <ResponsiveContainerWrap height={240}>
            <PieChart>
              <Pie data={stats.usersVsAdmins} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {stats.usersVsAdmins.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainerWrap>
          <div className="pie-legend">
            {stats.usersVsAdmins.map((p, i) => <span key={p.name}><i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} /> {p.name}: {p.value}</span>)}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header"><h3>Deposit vs Investment Trend</h3></div>
          <ResponsiveContainerWrap height={240}>
            <BarChart data={stats.depositTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="deposits" fill="var(--chart-deposits)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="investments" fill="var(--chart-bar-secondary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainerWrap>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><h3>ROI Distributed</h3></div>
          <ResponsiveContainerWrap height={240}>
            <BarChart data={stats.roiDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="roi" fill="var(--chart-roi)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainerWrap>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 12px' }}>Pending Deposits ({pending.length})</h3>
      {pending.length === 0 ? <EmptyState title="No pending deposits" /> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>User</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {pending.slice(0, 6).map((d) => (
                <tr key={d._id}>
                  <td data-label="User" className="cell-strong">{d.user?.name}</td>
                  <td data-label="Amount">{fmt(d.amount)}</td>
                  <td data-label="Date">{fmtDateTime(d.createdAt)}</td>
                  <td data-label="Status"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   USERS
   ========================================================= */
function AdminUsers() {
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(q.get('role') || '');
  const [status, setStatus] = useState(q.get('status') || '');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const load = async (sq = search, r = role, s = status) => {
    setLoading(true);
    try {
      const params = {};
      if (sq) params.search = sq; if (r) params.role = r; if (s) params.status = s;
      const data = await getAdminUsers(params);
      setUsers(data.users || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load users'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role, status]);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
  }, []);

  const openDetail = async (id) => {
    setDetailLoading(true); setDetail(null);
    try { const d = await getAdminUserDetail(id); setDetail(d); }
    catch (e) { setError(e.response?.data?.message || 'Failed to load user'); }
    finally { setDetailLoading(false); }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, color: 'blue' },
    { label: 'Pending Deposits', value: stats.pendingDeposits, color: 'yellow' },
    { label: 'Total Deposited', value: fmt(stats.totalDeposited), color: 'green' },
    { label: 'Total Invested', value: fmt(stats.totalInvested), color: 'purple' },
    { label: 'Active Investments', value: stats.activeInvestments, color: 'teal' },
    { label: 'Total ROI Paid', value: fmt(stats.totalRoiDistributed), color: 'red' },
  ] : [];

  return (
    <div>
      {statCards.length > 0 && (
        <div className="stats-grid">
          {statCards.map((c) => (
            <div className={`stat-card stat-icon-${c.color}`} key={c.label}>
              <div className="stat-icon" />
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="toolbar">
        <div className="filter-bar">
          <input className="search-input" placeholder="Search name, email, phone..." value={search}
            onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All Roles</option><option value="USER">User</option><option value="ADMIN">Admin</option>
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option><option value="DELETED">Deleted</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => load()}>Search</button>
        </div>
      </div>

      {loading ? <Spinner label="Loading users..." /> : error ? <ErrorBox message={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Main Bal</th><th>Total Dep.</th><th>Total Inv.</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={10} className="table-empty">No users found</td></tr>}
              {users.map((u) => (
                <tr key={u._id}>
                  <td data-label="User" className="cell-strong">{u.name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Phone">{u.phone}</td>
                  <td data-label="Role">{u.role === 'ADMIN' ? <span className="badge badge-info">Admin</span> : <span className="badge badge-muted">User</span>}</td>
                  <td data-label="Status"><StatusBadge status={u.accountStatus} /></td>
                  <td data-label="Main Bal">{fmt(u.mainBalance)}</td>
                  <td data-label="Total Dep.">{fmt(u.totalDeposited)}</td>
                  <td data-label="Total Inv.">{fmt(u.totalInvested)}</td>
                  <td data-label="Joined">{fmtDate(u.createdAt)}</td>
                  <td><button className="row-action" onClick={() => openDetail(u._id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <UserDetailModal detail={detail} loading={detailLoading} onClose={() => setDetail(null)} onAction={() => load()} />
      )}
    </div>
  );
}

function UserDetailModal({ detail, loading, onClose, onAction }) {
  const [tab, setTab] = useState('info');
  const [actionLoading, setActionLoading] = useState('');
  const [suspendDate, setSuspendDate] = useState('');
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credBusy, setCredBusy] = useState(false);
  const [credMsg, setCredMsg] = useState('');
  const [adjField, setAdjField] = useState('mainBalance');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDesc, setAdjDesc] = useState('');
  const [adjBusy, setAdjBusy] = useState(false);
  const [adjMsg, setAdjMsg] = useState('');
  const d = detail;

  const handleAction = async (action) => {
    if (!d || !d.user) return;
    if (action === 'delete' && !window.confirm('Are you sure you want to delete this account?')) return;
    if (action === 'deactivate' && !window.confirm('Deactivate this user?')) return;

    setActionLoading(action);
    try {
      if (action === 'activate') await activateUser(d.user._id);
      else if (action === 'deactivate') await deactivateUser(d.user._id);
      else if (action === 'suspend') await suspendUser(d.user._id, suspendDate || null);
      else if (action === 'delete') await deleteUser(d.user._id);
      if (onAction) onAction();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdateCredentials = async () => {
    if (!credEmail.trim() && !credPassword.trim()) { setCredMsg('Enter email or password to update'); return; }
    setCredBusy(true);
    setCredMsg('');
    try {
      const payload = {};
      if (credEmail.trim()) payload.email = credEmail.trim();
      if (credPassword.trim()) payload.password = credPassword.trim();
      const res = await updateAdminUserCredentials(d.user._id, payload);
      setCredMsg(res.message || 'Credentials updated');
      setCredEmail('');
      setCredPassword('');
      if (onAction) onAction();
    } catch (err) { setCredMsg(err.response?.data?.message || 'Update failed'); }
    finally { setCredBusy(false); }
  };

  const handleAdjustWallet = async (sign) => {
    const amt = Number(adjAmount);
    if (!amt || amt === 0) { setAdjMsg('Enter a valid amount'); return; }
    setAdjBusy(true);
    setAdjMsg('');
    try {
      const payload = { balanceField: adjField, amount: sign === 'deduct' ? -Math.abs(amt) : Math.abs(amt) };
      if (adjDesc.trim()) payload.description = adjDesc.trim();
      const res = await adjustAdminUserWallet(d.user._id, payload);
      setAdjMsg(res.message || 'Wallet adjusted');
      setAdjAmount('');
      setAdjDesc('');
      if (onAction) onAction();
    } catch (err) { setAdjMsg(err.response?.data?.message || 'Adjustment failed'); }
    finally { setAdjBusy(false); }
  };

  return (
    <Modal title={loading ? 'Loading...' : `${d.user.name} — Detail`} onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {d && d.user.accountStatus !== 'ACTIVE' && (
            <button className="btn btn-success btn-sm" onClick={() => handleAction('activate')} disabled={!!actionLoading}>
              {actionLoading === 'activate' ? 'Activating...' : 'Activate'}
            </button>
          )}
          {d && d.user.accountStatus === 'ACTIVE' && (
            <>
              <button className="btn btn-warning btn-sm" onClick={() => handleAction('deactivate')} disabled={!!actionLoading}>
                {actionLoading === 'deactivate' ? 'Deactivating...' : 'Deactivate'}
              </button>
              {!showSuspendInput && (
                <button className="btn btn-warning btn-sm" onClick={() => setShowSuspendInput(true)}>
                  Suspend
                </button>
              )}
              {showSuspendInput && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type="datetime-local" className="form-input" style={{ width: 200, fontSize: 12 }}
                    value={suspendDate} onChange={(e) => setSuspendDate(e.target.value)} />
                  <button className="btn btn-warning btn-sm" onClick={() => handleAction('suspend')} disabled={!!actionLoading}>
                    {actionLoading === 'suspend' ? 'Suspending...' : 'Confirm'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowSuspendInput(false); setSuspendDate(''); }}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
          {d && d.user.accountStatus === 'SUSPENDED' && (
            <button className="btn btn-warning btn-sm" onClick={() => handleAction('suspend')} disabled={!!actionLoading}>
              {actionLoading === 'suspend' ? 'Updating...' : 'Update Suspension'}
            </button>
          )}
          {d && d.user.accountStatus !== 'DELETED' && (
            <button className="btn btn-danger btn-sm" onClick={() => handleAction('delete')} disabled={!!actionLoading}>
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      }>
      {loading ? <Spinner label="Loading..." /> : (
        <div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            {['info', 'wallet', 'deposits', 'transactions', 'investments', 'roi', 'referrals', 'manage'].map((t) => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          {tab === 'info' && (
            <div className="detail-grid">
              <div className="detail-item"><span className="k">Name</span><span className="v">{d.user.name}</span></div>
              <div className="detail-item"><span className="k">Email</span><span className="v">{d.user.email}</span></div>
              <div className="detail-item"><span className="k">Phone</span><span className="v">{d.user.phone}</span></div>
              <div className="detail-item"><span className="k">Role</span><span className="v">{d.user.role}</span></div>
              <div className="detail-item"><span className="k">Status</span><span className="v">{d.user.accountStatus}</span></div>
              <div className="detail-item"><span className="k">Referral Code</span><span className="v">{d.user.referralCode}</span></div>
            </div>
          )}

          {tab === 'wallet' && (
            <div className="detail-grid">
              <div className="detail-item"><span className="k">Main Balance</span><span className="v">{fmt(d.financialSummary.mainBalance)}</span></div>
              <div className="detail-item"><span className="k">ROI Balance</span><span className="v">{fmt(d.financialSummary.roiBalance)}</span></div>
              <div className="detail-item"><span className="k">E-Wallet Balance</span><span className="v">{fmt(d.financialSummary.ewalletBalance)}</span></div>
              <div className="detail-item"><span className="k">Profit Share Balance</span><span className="v">{fmt(d.financialSummary.profitShareBalance)}</span></div>
              <div className="detail-item"><span className="k">Fund Wallet Balance</span><span className="v">{fmt(d.financialSummary.fundBalance)}</span></div>
              <div className="detail-item"><span className="k">Pending Commissions</span><span className="v">{fmt(d.financialSummary.pendingCommissions)}</span></div>
              <div className="detail-item"><span className="k">Commission Balance</span><span className="v">{fmt(d.financialSummary.commissionBalance)}</span></div>
              <div className="detail-item"><span className="k">Total Deposited</span><span className="v">{fmt(d.financialSummary.totalDeposited)}</span></div>
              <div className="detail-item"><span className="k">Total Invested</span><span className="v">{fmt(d.financialSummary.totalInvested)}</span></div>
              <div className="detail-item"><span className="k">Total ROI</span><span className="v">{fmt(d.financialSummary.totalRoi)}</span></div>
              <div className="detail-item"><span className="k">Total Network Income</span><span className="v">{fmt(d.financialSummary.totalNetworkIncome)}</span></div>
              <div className="detail-item"><span className="k">Network 3X Cap</span><span className="v">{fmt(d.financialSummary.network3xCap)}</span></div>
              <div className="detail-item"><span className="k">Eligible Investment Base</span><span className="v">{fmt(d.financialSummary.eligibleInvestmentBase)}</span></div>
              <div className="detail-item"><span className="k">Total Earnings</span><span className="v">{fmt(d.financialSummary.totalEarnings)}</span></div>
            </div>
          )}

          {tab === 'deposits' && <SimpleTable rows={d.deposits} cols={[['amount', 'Amount'], ['status', 'Status'], ['createdAt', 'Date']]} />}
          {tab === 'transactions' && <SimpleTable rows={d.transactions} cols={[['type', 'Type'], ['amount', 'Amount'], ['status', 'Status'], ['createdAt', 'Date']]} />}
          {tab === 'investments' && <SimpleTable rows={d.investments} cols={[['originalAmount', 'Amount'], ['status', 'Status'], ['startDate', 'Start']]} />}
          {tab === 'roi' && <SimpleTable rows={d.roiHistory} cols={[['roiPercentage', 'ROI %'], ['roiAmount', 'Amount'], ['roiDate', 'Date'], ['status', 'Status']]} />}
          {tab === 'referrals' && (
            <div>
              <div className="detail-grid" style={{ marginBottom: 16 }}>
                <div className="detail-item"><span className="k">Upline</span><span className="v">{d.referrals.upline ? d.referrals.upline.name : '—'}</span></div>
                <div className="detail-item"><span className="k">Direct Referrals</span><span className="v">{d.referrals.downlines.length}</span></div>
              </div>
               <SimpleTable rows={d.referrals.downlines} cols={[['name', 'Name'], ['email', 'Email'], ['accountStatus', 'Status'], ['createdAt', 'Joined']]} />
            </div>
          )}

          {tab === 'manage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Update Credentials */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 600 }}>Update Credentials</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
                  <input className="form-input" type="email" placeholder="New email" value={credEmail} onChange={(e) => setCredEmail(e.target.value)} />
                  <input className="form-input" type="password" placeholder="New password (min 8 chars)" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} />
                  {credMsg && <div style={{ fontSize: 12, color: credMsg.includes('fail') || credMsg.includes('Invalid') ? '#dc2626' : '#16a34a' }}>{credMsg}</div>}
                  <button className="btn btn-primary btn-sm" onClick={handleUpdateCredentials} disabled={credBusy || (!credEmail.trim() && !credPassword.trim())} style={{ alignSelf: 'flex-start' }}>
                    {credBusy ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </div>

              {/* Adjust Wallet */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 600 }}>Adjust Wallet Balance</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
                  <select className="form-input" value={adjField} onChange={(e) => setAdjField(e.target.value)}>
                    <option value="mainBalance">Main Wallet</option>
                    <option value="roiBalance">ROI Wallet</option>
                    <option value="commissionBalance">Commission Wallet</option>
                    <option value="ewalletBalance">E-Wallet</option>
                    <option value="profitShareBalance">Profit Share Wallet</option>
                    <option value="pendingCommissions">Pending Commissions</option>
                    <option value="fundBalance">Fund Wallet</option>
                  </select>
                  <input className="form-input" type="number" placeholder="Amount (positive = add, negative = deduct)" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
                  <input className="form-input" type="text" placeholder="Reason (optional)" value={adjDesc} onChange={(e) => setAdjDesc(e.target.value)} />
                  {adjMsg && <div style={{ fontSize: 12, color: adjMsg.includes('fail') || adjMsg.includes('Invalid') || adjMsg.includes('Insufficient') ? '#dc2626' : '#16a34a' }}>{adjMsg}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleAdjustWallet('add')} disabled={adjBusy || !adjAmount}>
                      {adjBusy ? 'Processing...' : 'Add Funds'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleAdjustWallet('deduct')} disabled={adjBusy || !adjAmount}>
                      {adjBusy ? 'Processing...' : 'Deduct Funds'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function SimpleTable({ rows, cols }) {
  if (!rows || rows.length === 0) return <EmptyState title="No records" />;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr>{cols.map((c) => <th key={c[0]}>{c[1]}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || i}>
              {cols.map((c) => (
                <td key={c[0]} data-label={c[1]}>
                  {c[0] === 'amount' || c[0] === 'roiAmount' || c[0] === 'originalAmount' ? fmt(r[c[0]])
                    : (c[0] === 'createdAt' || c[0] === 'startDate' || c[0] === 'roiDate' || c[0] === 'endDate') ? fmtDateTime(r[c[0]])
                      : (c[0] === 'status' ? <StatusBadge status={r[c[0]]} /> : (r[c[0]] ?? '-'))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   INVESTMENTS
   ========================================================= */
function AdminInvestments() {
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(q.get('status') || '');

  const load = async (sq = search, s = status) => {
    setLoading(true);
    try {
      const params = {}; if (sq) params.search = sq; if (s) params.status = s;
      const data = await getAdminInvestments(params);
      setRows(data.investments || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load investments'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  return (
    <div>
      <div className="toolbar">
        <div className="filter-bar">
          <input className="search-input" placeholder="Search user, email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => load()}>Search</button>
        </div>
      </div>
      {loading ? <Spinner label="Loading investments..." /> : error ? <ErrorBox message={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Amount</th><th>ROI %</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="table-empty">No investments found</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td data-label="User" className="cell-strong">{r.user?.name}</td>
                  <td data-label="Email">{r.user?.email}</td>
                  <td data-label="Amount">{fmt(r.originalAmount)}</td>
                  <td data-label="ROI %">{r.roiPercentage}%</td>
                  <td data-label="Start">{fmtDate(r.startDate)}</td>
                  <td data-label="End">{fmtDate(r.endDate)}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DEPOSITS (approval queue)
   ========================================================= */
function AdminDeposits({ toastSuccess, toastError }) {
  const navigate = useNavigate();
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const status = q.get('status') || 'PENDING';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [action, setAction] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (status === 'PENDING') {
        const data = await getPendingDeposits();
        setRows(data.deposits || []);
      } else {
        const data = await getAdminTransactions({ type: 'DEPOSIT', status });
        setRows(data.transactions || []);
      }
    }
    catch (e) { setError(e.response?.data?.message || 'Failed to load deposits'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const doAction = async () => {
    setBusy(true);
    try {
      if (action === 'approve') await approveDeposit(confirm._id);
      else await rejectDeposit(confirm._id);
      setConfirm(null); await load();
      toastSuccess('Success', `Deposit ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (e) {
      const msg = e.response?.data?.message || 'Action failed';
      setError(msg);
      toastError('Error', msg);
    }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="toolbar">
        <div className="filter-bar">
          <span className="text-muted" style={{ fontSize: 13 }}>Status:</span>
          {['PENDING', 'COMPLETED', 'REJECTED'].map((s) => (
            <button key={s} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => navigate(`/admin/deposits?status=${s}`)}>
              {s === 'COMPLETED' ? 'Approved' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      {loading ? <Spinner label="Loading deposits..." /> : error ? <ErrorBox message={error} /> : (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Email</th><th>Amount</th><th>Transaction ID</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={7} className="table-empty">No deposits found</td></tr>}
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td data-label="User" className="cell-strong">{r.user?.name}</td>
                    <td data-label="Email">{r.user?.email}</td>
                    <td data-label="Amount">{fmt(r.amount)}</td>
                    <td data-label="Transaction ID" style={{ fontFamily: 'monospace', fontSize: 12 }}>{r._id.slice(-8)}</td>
                    <td data-label="Date">{fmtDateTime(r.createdAt)}</td>
                    <td data-label="Status"><StatusBadge status={r.status} /></td>
                    <td data-label="Actions">
                      {r.status === 'PENDING' && (
                        <div className="filter-group" style={{ flexWrap: 'wrap' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => { setConfirm(r); setAction('approve'); }}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => { setConfirm(r); setAction('reject'); }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={`${action === 'approve' ? 'Approve' : 'Reject'} Deposit`}
          message={`Are you sure you want to ${action === 'approve' ? 'approve' : 'reject'} this deposit of ${fmt(confirm.amount)} from ${confirm.user?.name} (${confirm.user?.email})?`}
          confirmLabel={action === 'approve' ? 'Approve' : 'Reject'}
          variant={action === 'approve' ? 'warning' : 'danger'}
          loading={busy}
          onConfirm={doAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   WITHDRAWALS (not implemented backend)
   ========================================================= */
function AdminWithdrawals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminWithdrawals({ limit: 100 });
      setRows(data.data?.transactions || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this withdrawal?')) return;
    try {
      await apiClient.post(`/admin/users/${id}/withdraw`);
      toast('Withdrawal approved', 'success');
      load();
    } catch (e) { toast(e.response?.data?.message || 'Failed', 'error'); }
  };

  if (loading) return <Spinner label="Loading withdrawals..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div>
      <div className="page-header">
        <div><h2>Withdrawal Requests</h2></div>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User</th><th>Amount</th><th>Wallet</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="table-empty">No withdrawal requests</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td data-label="User" className="cell-strong">{r.user?.name}</td>
                  <td data-label="Amount">{fmt(Math.abs(r.amount))}</td>
                  <td data-label="Wallet">{r.description?.includes('mainBalance') ? 'Main' : r.description?.includes('roiBalance') ? 'ROI' : r.description?.includes('ewalletBalance') ? 'E-Wallet' : 'Other'}</td>
                  <td data-label="Date">{fmtDate(r.createdAt)}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
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
function AdminTransactions() {
  const location = useLocation();
  const q = new URLSearchParams(location.search);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [search, setSearch] = useState(q.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(q.get('type') || '');
  const [statusFilter, setStatusFilter] = useState(q.get('status') || '');
  const [dateFrom, setDateFrom] = useState(q.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(q.get('dateTo') || '');
  const [page, setPage] = useState(1);

  const TX_TYPES = [
    'DEPOSIT', 'INVESTMENT', 'ROI', 'COMMISSION', 'DIRECT_INCOME', 'LEVEL_INCOME',
    'PROFIT_SHARE', 'SIGNUP_BONUS', 'UPLINE_SIGNUP_BONUS', 'WITHDRAWAL', 'ADJUSTMENT',
    'E_WALLET_DOWNLINE_INVESTMENT', 'ROI_TRANSFER', 'PROFIT_SHARE_TRANSFER',
    'FUND_TRANSFER_SENT', 'FUND_TRANSFER_RECEIVED', 'MAIN_TO_FUND_TRANSFER',
    'PENDING_ROI', 'PENDING_NETWORK_COMMISSION',
  ];

  const fetchTransactions = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const data = await getAdminTransactions(params);
      setRows(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 0);
      setTotal(data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load transactions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(1); setPage(1); }, [typeFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => { fetchTransactions(1); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

  const hasFilters = search || typeFilter || statusFilter || dateFrom || dateTo;

  const getTypeBadgeClass = (type) => {
    if (['DIRECT_INCOME', 'LEVEL_INCOME', 'PROFIT_SHARE', 'SIGNUP_BONUS', 'UPLINE_SIGNUP_BONUS'].includes(type)) return 'income';
    if (['ROI'].includes(type)) return 'roi';
    if (['PENDING_ROI', 'PENDING_NETWORK_COMMISSION', 'PENDING_PROFIT_SHARE', 'PENDING_RELEASE'].includes(type)) return 'pending';
    if (['INVESTMENT', 'ACTIVATION_FEE', 'FUND_ACTIVATION', 'WITHDRAWAL', 'E_WALLET_USAGE'].includes(type)) return 'debit';
    return 'neutral';
  };

  const getIncomeCategory = (type) => {
    if (type === 'DIRECT_INCOME') return 'Direct Income';
    if (type === 'LEVEL_INCOME') return 'Indirect Income';
    if (type === 'PROFIT_SHARE') return 'Profit Share';
    if (type === 'ROI') return 'ROI Earning';
    if (type === 'PENDING_ROI') return 'Pending ROI';
    if (type === 'PENDING_NETWORK_COMMISSION') return 'Pending Commission';
    if (type === 'PENDING_PROFIT_SHARE') return 'Pending Profit Share';
    return null;
  };

  const getWalletLabel = (type) => {
    if (['DIRECT_INCOME', 'LEVEL_INCOME', 'INVESTMENT', 'ACTIVATION_FEE', 'FUND_ACTIVATION', 'FUND_TRANSFER_SENT', 'FUND_TRANSFER_RECEIVED', 'MAIN_TO_FUND_TRANSFER'].includes(type)) return 'Main Wallet';
    if (['ROI', 'ROI_TRANSFER'].includes(type)) return 'ROI Wallet';
    if (['PROFIT_SHARE', 'PROFIT_SHARE_TRANSFER'].includes(type)) return 'Profit Share Wallet';
    if (['SIGNUP_BONUS', 'UPLINE_SIGNUP_BONUS', 'E_WALLET_USAGE', 'E_WALLET_DOWNLINE_INVESTMENT'].includes(type)) return 'E-Wallet';
    if (['PENDING_ROI', 'PENDING_NETWORK_COMMISSION', 'PENDING_PROFIT_SHARE', 'PENDING_RELEASE'].includes(type)) return 'Pending Holdings';
    return '—';
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>Search User</label>
            <input
              className="form-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email..."
              style={{ fontSize: 13 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 140px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>Type</label>
            <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ fontSize: 13 }}>
              <option value="">All Types</option>
              {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 120px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>Status</label>
            <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: 13 }}>
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 140px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>From Date</label>
            <input
              className="form-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 140px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>To Date</label>
            <input
              className="form-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>
          {hasFilters && (
            <button className="btn btn-secondary btn-sm" onClick={resetFilters} style={{ marginBottom: 0 }}>
              Reset
            </button>
          )}
        </div>
        {total > 0 && (
          <div className="text-muted" style={{ fontSize: 12, marginTop: 'var(--space-2)' }}>
            {total} transaction{total !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Spinner label="Loading transactions..." />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="table-empty">No transactions found</td></tr>
                )}
                {rows.map((r) => (
                  <>
                    <tr key={r._id} className="txn-row-clickable" onClick={() => toggle(r._id)}>
                      <td data-label="">
                        <span className={`txn-expand-icon ${expandedId === r._id ? 'open' : ''}`}>
                          <ChevronDown size={16} />
                        </span>
                      </td>
                      <td data-label="User" className="cell-strong">{r.user?.name}</td>
                      <td data-label="Type">
                        <span className={`txn-type-badge ${getTypeBadgeClass(r.type)}`}>{r.type.replace(/_/g, ' ')}</span>
                      </td>
                      <td data-label="Amount">{fmt(r.amount)}</td>
                      <td data-label="Status"><StatusBadge status={r.status} /></td>
                      <td data-label="Date">{fmtDateTime(r.createdAt)}</td>
                    </tr>
                    {expandedId === r._id && (
                      <tr className="txn-detail-row" key={`${r._id}-detail`}>
                        <td colSpan={6}>
                          <div className="txn-detail-panel">
                            <div className="txn-detail-grid">
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Transaction Type</span>
                                <span className="txn-detail-value">{getIncomeCategory(r.type) || r.type.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">User</span>
                                <span className="txn-detail-value">{r.user?.name} ({r.user?.email})</span>
                              </div>
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Amount</span>
                                <span className="txn-detail-value">{fmt(r.amount)}</span>
                              </div>
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Status</span>
                                <span className="txn-detail-value"><StatusBadge status={r.status} /></span>
                              </div>
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Wallet</span>
                                <span className="txn-detail-value">{getWalletLabel(r.type)}</span>
                              </div>
                              {r.metadata?.investmentAmount != null && (
                                <div className="txn-detail-item">
                                  <span className="txn-detail-label">Downline Investment Amount</span>
                                  <span className="txn-detail-value">{fmt(r.metadata.investmentAmount)}</span>
                                </div>
                              )}
                              {r.metadata?.percentage != null && (
                                <div className="txn-detail-item">
                                  <span className="txn-detail-label">Income Percentage</span>
                                  <span className="txn-detail-value">{r.metadata.percentage}%</span>
                                </div>
                              )}
                              {r.metadata?.level != null && (
                                <div className="txn-detail-item">
                                  <span className="txn-detail-label">Level</span>
                                  <span className="txn-detail-value">Level {r.metadata.level}</span>
                                </div>
                              )}
                              {r.investmentUser && (
                                <div className="txn-detail-item">
                                  <span className="txn-detail-label">Downline Member</span>
                                  <span className="txn-detail-value">{r.investmentUser.name} ({r.investmentUser.email})</span>
                                </div>
                              )}
                              {r.investment?.originalAmount != null && (
                                <div className="txn-detail-item">
                                  <span className="txn-detail-label">Investment Amount</span>
                                  <span className="txn-detail-value">{fmt(r.investment.originalAmount)}</span>
                                </div>
                              )}
                              {r.description && (
                                <div className="txn-detail-item" style={{ gridColumn: '1 / -1' }}>
                                  <span className="txn-detail-label">Description</span>
                                  <span className="txn-detail-value">{r.description}</span>
                                </div>
                              )}
                              {r.reference && (
                                <div className="txn-detail-item">
                                  <span className="txn-detail-label">Reference ID</span>
                                  <span className="txn-detail-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.reference}</span>
                                </div>
                              )}
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Created</span>
                                <span className="txn-detail-value">{fmtDateTime(r.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchTransactions(p); }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13 }}>Page {page} of {totalPages}</span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); fetchTransactions(p); }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   ROI MANAGEMENT — Compact Card + Modals + History
   ========================================================= */
function AdminRoi({ toastSuccess, toastError }) {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // AUTO config modal
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [roiDays, setRoiDays] = useState(0);
  const [daySchedule, setDaySchedule] = useState([]);

  // Trigger AUTO modal
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [triggerBusy, setTriggerBusy] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);

  // MANUAL modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualPercentage, setManualPercentage] = useState('');
  const [manualBusy, setManualBusy] = useState(false);
  const [manualResult, setManualResult] = useState(null);
  const [manualConfirmStep, setManualConfirmStep] = useState(false);

  // History
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, st] = await Promise.all([getAdminStats(), getAdminSettings()]);
      setStats(s);
      setSettings(st.settings);
      setRoiDays(st.settings.roiDays || 0);
      setDaySchedule(st.settings.dayWiseRoiSchedule || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load ROI data'); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const t = await getAdminTransactions({ type: 'ROI' });
      setHistoryRows(t.transactions || []);
    } catch (_) { /* ignore */ }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { fetchData(); fetchHistory(); }, []);

  const toggleRoiProcessing = async (enabled) => {
    setBusy(true);
    try {
      await updateAdminSettings({ roiProcessingEnabled: enabled });
      setSettings(prev => ({ ...prev, roiProcessingEnabled: enabled }));
      toastSuccess('Success', `ROI processing ${enabled ? 'enabled' : 'disabled'}`);
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to toggle ROI'); }
    finally { setBusy(false); }
  };

  const saveAutoSchedule = async () => {
    setBusy(true);
    try {
      const schedule = [];
      for (let i = 0; i < roiDays; i++) {
        schedule.push({ day: i + 1, percentage: daySchedule[i]?.percentage || 0 });
      }
      await updateAdminSettings({ roiDays: Number(roiDays), dayWiseRoiSchedule: schedule });
      setDaySchedule(schedule);
      setAutoModalOpen(false);
      toastSuccess('Success', 'AUTO ROI schedule saved');
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to save schedule'); }
    finally { setBusy(false); }
  };

  const runAutoTrigger = async () => {
    setTriggerBusy(true);
    try {
      const result = await processRoi({});
      setTriggerResult(result);
    } catch (e) { toastError('Error', e.response?.data?.message || 'AUTO trigger failed'); }
    finally { setTriggerBusy(false); }
  };

  const openTriggerModal = () => {
    setTriggerResult(null);
    setTriggerModalOpen(true);
  };

  const runManualRoi = async () => {
    const pct = Number(manualPercentage);
    if (!pct || pct <= 0) { toastError('Error', 'Enter a valid percentage'); return; }
    setManualBusy(true);
    try {
      const result = await processRoiManual({ percentage: pct });
      setManualResult(result);
      setManualConfirmStep(false);
      fetchHistory();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Manual ROI failed'); }
    finally { setManualBusy(false); }
  };

  const openManualModal = () => {
    setManualPercentage('');
    setManualResult(null);
    setManualConfirmStep(false);
    setManualModalOpen(true);
  };

  const updateDaySchedule = (index, value) => {
    const newSchedule = [...daySchedule];
    while (newSchedule.length <= index) {
      newSchedule.push({ day: newSchedule.length + 1, percentage: 0 });
    }
    newSchedule[index] = { day: index + 1, percentage: Number(value) || 0 };
    setDaySchedule(newSchedule);
  };

  if (loading) return <Spinner label="Loading ROI..." />;
  if (error) return <ErrorBox message={error} />;

  const roiEnabled = settings?.roiProcessingEnabled || false;

  return (
    <div>
      {/* Main ROI Card */}
      <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ margin: 0 }}>ROI Processing</h3>
              <label className="filter-group" style={{ margin: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={roiEnabled}
                  onChange={(e) => toggleRoiProcessing(e.target.checked)}
                  disabled={busy}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{roiEnabled ? 'ON' : 'OFF'}</span>
              </label>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Status: <strong>{roiEnabled ? 'Active' : 'Disabled'}</strong>
              {' \u00b7 '}
              Mode: <strong>AUTO</strong>
            </div>
          </div>
          <div className="stats-grid" style={{ flex: 1, minWidth: 300 }}>
            <div className="stat-card">
              <div className="stat-value">{fmt(stats?.totalRoiDistributed)}</div>
              <div className="stat-label">Total Distributed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.activeInvestments || 0}</div>
              <div className="stat-label">Active Investments</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={openTriggerModal} disabled={busy || !roiEnabled}>
            Trigger AUTO ROI
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setAutoModalOpen(true)} disabled={busy}>
            Configure AUTO
          </button>
          <button className="btn btn-secondary btn-sm" onClick={openManualModal} disabled={busy || !roiEnabled}>
            Process Manual
          </button>
        </div>
      </div>

      {/* Trigger AUTO Modal */}
      {triggerModalOpen && (
        <Modal title="Trigger AUTO ROI" onClose={() => setTriggerModalOpen(false)}>
          {!triggerResult ? (
            <>
              <p style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
                Process ROI for <strong>all active investments today</strong> using the configured AUTO schedule?
              </p>
              <p className="text-muted" style={{ fontSize: 12, marginBottom: 'var(--space-3)' }}>
                You can trigger this as many times as you want per day.
                Investments that already received ROI today will be skipped automatically — no duplicate credits.
              </p>
              <div className="modal-footer" style={{ padding: 0, paddingTop: 'var(--space-3)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setTriggerModalOpen(false)} disabled={triggerBusy}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={runAutoTrigger} disabled={triggerBusy}>
                  {triggerBusy ? 'Processing...' : 'Trigger AUTO ROI'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 13 }}>
                  <div>Processed: <strong>{triggerResult.processed}</strong></div>
                  <div>Skipped: <strong>{triggerResult.skipped}</strong></div>
                  <div>Errors: <strong>{triggerResult.errors?.length || 0}</strong></div>
                  {triggerResult.message && (
                    <div style={{ gridColumn: '1 / -1' }} className="text-muted">{triggerResult.message}</div>
                  )}
                </div>
                {triggerResult.skipped > 0 && triggerResult.processed === 0 && (
                  <p className="text-muted" style={{ fontSize: 12, marginTop: 'var(--space-2)', marginBottom: 0 }}>
                    Skipped = investments that already received ROI today. This is normal — no action needed.
                  </p>
                )}
                {triggerResult.skipped > 0 && triggerResult.processed > 0 && (
                  <p className="text-muted" style={{ fontSize: 12, marginTop: 'var(--space-2)', marginBottom: 0 }}>
                    {triggerResult.skipped} investments were skipped because they already received ROI today.
                  </p>
                )}
              </div>
              <div className="modal-footer" style={{ padding: 0, paddingTop: 'var(--space-3)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => { setTriggerModalOpen(false); fetchHistory(); }}>Done</button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* AUTO Config Modal */}
      {autoModalOpen && (
        <Modal title="Configure AUTO ROI Schedule" onClose={() => setAutoModalOpen(false)}>
          <div className="form-group">
            <label className="form-label">ROI Days</label>
            <input
              className="form-input"
              type="number"
              value={roiDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRoiDays(val);
                const newSchedule = [];
                for (let i = 0; i < val; i++) {
                  newSchedule.push(daySchedule[i] || { day: i + 1, percentage: 0 });
                }
                setDaySchedule(newSchedule);
              }}
              min="1"
              max="365"
            />
            <p className="form-hint">Number of days in the ROI cycle</p>
          </div>
          {roiDays > 0 && (
            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              {Array.from({ length: roiDays }, (_, i) => (
                <div key={i} className="filter-group" style={{ marginBottom: 8 }}>
                  <label style={{ minWidth: 60, fontSize: 13, fontWeight: 500 }}>Day {i + 1}:</label>
                  <input
                    className="form-input"
                    type="number"
                    value={daySchedule[i]?.percentage || 0}
                    onChange={(e) => updateDaySchedule(i, e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    style={{ width: 100 }}
                  />
                  <span style={{ fontSize: 13 }}>%</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 'var(--space-3)' }}>
            Schedule repeats from Day 1 after Day {roiDays} until the investment reaches its 2X ROI cap.
          </p>
          <div className="modal-footer" style={{ padding: 0, paddingTop: 'var(--space-3)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setAutoModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveAutoSchedule} disabled={busy}>
              {busy ? 'Saving...' : 'Save AUTO Schedule'}
            </button>
          </div>
        </Modal>
      )}

      {/* MANUAL Modal */}
      {manualModalOpen && (
        <Modal title="Manual ROI Processing" onClose={() => setManualModalOpen(false)}>
          {!manualResult ? (
            <>
              <div className="form-group">
                <label className="form-label">Today's ROI %</label>
                <input
                  className="form-input"
                  type="number"
                  value={manualPercentage}
                  onChange={(e) => { setManualPercentage(e.target.value); setManualConfirmStep(false); }}
                  min="0.01"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 1.5"
                  disabled={manualBusy}
                />
                <p className="form-hint">This percentage will be applied to all eligible active investments.</p>
              </div>
              {manualPercentage && Number(manualPercentage) > 0 && !manualConfirmStep && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setManualConfirmStep(true)}
                  disabled={manualBusy}
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  Review &amp; Confirm
                </button>
              )}
              {manualConfirmStep && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    Process <strong>{manualPercentage}%</strong> ROI for all active investments today?
                  </p>
                  <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    This is a one-time action. The AUTO schedule is not affected.
                  </p>
                </div>
              )}
              <div className="modal-footer" style={{ padding: 0, paddingTop: 'var(--space-3)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setManualModalOpen(false)} disabled={manualBusy}>Cancel</button>
                {manualConfirmStep && (
                  <button className="btn btn-primary btn-sm" onClick={runManualRoi} disabled={manualBusy || !manualPercentage}>
                    {manualBusy ? 'Processing...' : 'Process Today\'s ROI'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 13 }}>
                  <div>Processed: <strong>{manualResult.processed}</strong></div>
                  <div>Skipped: <strong>{manualResult.skipped}</strong></div>
                  <div>Failed: <strong>{manualResult.failed}</strong></div>
                  <div>Total Credited: <strong>{fmt(manualResult.totalCredited)}</strong></div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: 0, paddingTop: 'var(--space-3)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => { setManualModalOpen(false); fetchHistory(); }}>Done</button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ROI History — always visible */}
      <div className="panel">
        <h3 style={{ marginBottom: 'var(--space-3)' }}>ROI History</h3>
        {historyLoading ? (
          <Spinner label="Loading history..." />
        ) : historyRows.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>No ROI distributions yet.</p>
        ) : (
          <div className="table-card" style={{ border: 'none', padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((r) => (
                  <tr key={r._id}>
                    <td data-label="Date">{fmtDateTime(r.createdAt)}</td>
                    <td data-label="User" className="cell-strong">{r.user?.name}</td>
                    <td data-label="Amount">{fmt(r.amount)}</td>
                    <td data-label="Status"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REFERRALS — NETWORK MANAGEMENT CENTER
   ========================================================= */
function AdminReferrals() {
  const q = new URLSearchParams(useLocation().search);
  const tab = q.get('tab') || 'overview';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (tab !== 'overview') return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const s = await getAdminReferralStats();
        setStats(s);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load referral stats. Please try again.'); }
      finally { setLoading(false); }
    })();
  }, [tab]);

  useEffect(() => {
    if (tab === 'overview' && !stats && !loading) {
      setLoading(true);
      setError('');
      (async () => {
        try {
          const s = await getAdminReferralStats();
          setStats(s);
        } catch (e) { setError(e.response?.data?.message || 'Failed to load referral stats.'); }
        finally { setLoading(false); }
      })();
    }
  }, [tab, stats, loading]);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'explorer', label: 'Network Explorer', icon: Network },
    { key: 'members', label: 'All Members', icon: Users },
  ];

  return (
    <div className="arnm-page">
      <div className="arnm-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`arnm-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => navigate(`/admin/referrals?tab=${t.key}`)}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        loading ? (
          <Spinner label="Loading referral network..." />
        ) : error ? (
          <ErrorBox message={error} />
        ) : stats ? (
          <ARNMOverview stats={stats} />
        ) : (
          <EmptyState title="No data available" subtitle="Could not load referral network stats." />
        )
      )}
      {tab === 'explorer' && <ARNMExplorer />}
      {tab === 'members' && <ARNMMembers />}
    </div>
  );
}

/* =========================================================
   OVERVIEW — Network Stats
   ========================================================= */
function ARNMOverview({ stats }) {
  const statCards = [
    { label: 'Total Members', value: stats.totalMembers || 0, color: 'blue', icon: Users },
    { label: 'Active Members', value: stats.activeMembers || 0, color: 'green', icon: UserCheck },
    { label: 'Inactive Members', value: stats.inactiveMembers || 0, color: 'red', icon: UserX },
    { label: 'Direct Relationships', value: stats.totalDirectRelationships || 0, color: 'purple', icon: Share2 },
    { label: 'Indirect Relationships', value: stats.totalIndirectRelationships || 0, color: 'violet', icon: Network },
    { label: 'Total Team Investment', value: fmt(stats.totalTeamInvestment), color: 'indigo', icon: LineChart },
    { label: 'Network Income Generated', value: fmt(stats.totalNetworkIncome), color: 'teal', icon: Receipt },
    { label: 'Pending Commissions', value: fmt(stats.pendingCommissions), color: 'orange', icon: Percent },
    { label: 'Average Team Size', value: stats.averageTeamSize || 0, color: 'cyan', icon: Users },
  ];

  return (
    <div>
      <div className="arnm-overview-header">
        <div>
          <h2 className="arnm-overview-title">Referral Network Overview</h2>
          <p className="arnm-overview-subtitle">Platform-wide referral and MLM network statistics</p>
        </div>
        <Link to="/admin/referrals?tab=explorer" className="btn btn-primary btn-sm">
          <Network size={16} /> Explore Network
        </Link>
      </div>
      <div className="arnm-stats-grid">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`arnm-stat-card arnm-stat-${c.color}`}>
              <div className="arnm-stat-icon"><Icon size={20} /></div>
              <div className="arnm-stat-value">{c.value}</div>
              <div className="arnm-stat-label">{c.label}</div>
            </div>
          );
        })}
      </div>
      <div className="arnm-overview-summary">
        <div className="arnm-summary-card">
          <h3>Income Breakdown</h3>
          <div className="arnm-summary-row">
            <span>Direct Income</span>
            <strong className="text-blue">{fmt(stats.totalDirectIncome)}</strong>
          </div>
          <div className="arnm-summary-row">
            <span>Level Income</span>
            <strong className="text-purple">{fmt(stats.totalLevelIncome)}</strong>
          </div>
          <div className="arnm-summary-row total">
            <span>Total Network Income</span>
            <strong className="text-teal">{fmt(stats.totalNetworkIncome)}</strong>
          </div>
        </div>
        <div className="arnm-summary-card">
          <h3>Network Health</h3>
          <div className="arnm-summary-row">
            <span>Activation Rate</span>
            <strong className="text-green">{stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}%</strong>
          </div>
          <div className="arnm-summary-row">
            <span>Avg. Team Size</span>
            <strong>{stats.averageTeamSize}</strong>
          </div>
          <div className="arnm-summary-row">
            <span>Pending Payouts</span>
            <strong className="text-orange">{fmt(stats.pendingCommissions)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EXPLORER — Interactive Network Tree
   ========================================================= */
function ARNMExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [memberDetail, setMemberDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value || value.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchAdminReferralMembers(value.trim());
        setSearchResults(res.users || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const selectMember = async (user) => {
    setSelectedMember(user);
    setSearchResults([]);
    setSearchQuery(user.name || user.referralCode);
    setLoadingTree(true);
    try {
      const res = await getAdminReferralTree(user._id, 8);
      setTreeData(res.tree);
    } catch { setTreeData(null); }
    finally { setLoadingTree(false); }
  };

  const openMemberDetail = async (node) => {
    try {
      const res = await getAdminReferralMemberDetail(node._id);
      setMemberDetail(res);
      setShowDetail(true);
    } catch { /* ignore */ }
  };

  return (
    <div className="arnm-explorer">
      <div className="arnm-explorer-header">
        <div>
          <h2 className="arnm-overview-title">Referral Network Explorer</h2>
          <p className="arnm-overview-subtitle">Search any member and explore their complete referral hierarchy</p>
        </div>
      </div>

      <div className="arnm-search-box">
        <Search size={18} className="arnm-search-icon" />
        <input
          type="text"
          className="arnm-search-input"
          placeholder="Search by name, email, referral code, or user ID..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searching && <span className="arnm-search-loading">Searching...</span>}
        {searchResults.length > 0 && (
          <div className="arnm-search-dropdown">
            {searchResults.map((u) => (
              <div key={u._id} className="arnm-search-item" onClick={() => selectMember(u)}>
                <div className="arnm-search-item-avatar">{u.name?.charAt(0)?.toUpperCase()}</div>
                <div className="arnm-search-item-info">
                  <div className="arnm-search-item-name">{u.name}</div>
                  <div className="arnm-search-item-meta">
                    {u.referralCode} &middot; {u.directChildCount} direct &middot; {fmt(u.totalInvestment)}
                  </div>
                </div>
                <span className={`arnm-search-item-status ${u.accountStatus === 'ACTIVE' && u.isActivated ? 'active' : 'inactive'}`}>
                  {u.accountStatus === 'ACTIVE' && u.isActivated ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loadingTree && <Spinner label="Loading referral tree..." />}

      {!loadingTree && selectedMember && treeData && (
        <div className="arnm-tree-section">
          <div className="arnm-tree-root-label">
            <span className="arnm-root-badge">ROOT</span>
            <strong>{selectedMember.name}</strong>
            <span className="arnm-root-code">{selectedMember.referralCode}</span>
            <span className={`arnm-root-status ${selectedMember.accountStatus === 'ACTIVE' && selectedMember.isActivated ? 'active' : 'inactive'}`}>
              {selectedMember.accountStatus === 'ACTIVE' && selectedMember.isActivated ? 'Active' : 'Inactive'}
            </span>
          </div>
          <AdminMemberTreeView treeData={treeData} onNodeClick={openMemberDetail} />
        </div>
      )}

      {!loadingTree && selectedMember && !treeData && (
        <EmptyState title="No referral tree found" subtitle="This member does not have any referrals yet." />
      )}

      {!selectedMember && !loadingTree && (
        <EmptyState
          title="Select a member to explore"
          subtitle="Search for a member above to view their complete referral network hierarchy."
          icon={<Network size={48} />}
        />
      )}

      {showDetail && memberDetail && (
        <AdminMemberDetailPanel detail={memberDetail} onClose={() => { setShowDetail(false); setMemberDetail(null); }} onSelectMember={selectMember} />
      )}
    </div>
  );
}

/* =========================================================
   ADMIN MEMBER TREE VIEW
   ========================================================= */
function AdminMemberTreeView({ treeData, onNodeClick }) {
  const [zoom, setZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const treeRef = useRef(null);

  useEffect(() => {
    if (treeData) {
      const autoExpand = new Set();
      const helper = (node, depth) => {
        if (depth < 2 && node.children && node.children.length > 0) {
          autoExpand.add(node._id);
          node.children.forEach((c) => helper(c, depth + 1));
        }
      };
      helper(treeData, 0);
      setExpandedNodes(autoExpand);
    }
  }, [treeData]);

  const toggleNode = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set();
    const collect = (n) => { if (n.children) { all.add(n._id); n.children.forEach(collect); } };
    if (treeData) collect(treeData);
    setExpandedNodes(all);
  };

  const collapseAll = () => setExpandedNodes(new Set());

  return (
    <div className="arnm-tree-viewer">
      <div className="arnm-tree-controls">
        <button className="arnm-tree-ctrl" onClick={() => setZoom((z) => Math.min(z + 0.15, 2))} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <span className="arnm-tree-zoom">{Math.round(zoom * 100)}%</span>
        <button className="arnm-tree-ctrl" onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <div className="arnm-tree-ctrl-divider" />
        <button className="arnm-tree-ctrl" onClick={expandAll} title="Expand All">
          <Maximize2 size={16} />
        </button>
        <button className="arnm-tree-ctrl" onClick={collapseAll} title="Collapse All">
          <Minimize2 size={16} />
        </button>
        <button className="arnm-tree-ctrl" onClick={() => { setZoom(1); }} title="Reset View">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="arnm-tree-canvas-wrapper" ref={treeRef}>
        <div className="arnm-tree-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
          <AdminTreeNode
            node={treeData}
            isRoot={true}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            onNodeClick={onNodeClick}
            depth={0}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN TREE NODE
   ========================================================= */
function AdminTreeNode({ node, isRoot, expandedNodes, toggleNode, onNodeClick, depth }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node._id);
  const isActive = node.isActivated && node.accountStatus === 'ACTIVE';

  return (
    <div className={`arnm-node-wrapper ${isRoot ? 'root' : ''} depth-${Math.min(depth, 4)}`}>
      <div className="arnm-node-connector">
        {!isRoot && <div className="arnm-connector-line" />}
      </div>

      <div
        className={`arnm-node ${isActive ? 'active' : 'inactive'} ${isRoot ? 'root-node' : ''}`}
        onClick={() => onNodeClick(node)}
      >
        <div className={`arnm-node-avatar ${isActive ? 'active' : 'inactive'}`}>
          {node.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="arnm-node-info">
          <div className="arnm-node-name">{node.name}</div>
          <div className="arnm-node-meta">
            <span className="arnm-node-code">{node.referralCode || '—'}</span>
            <span className="arnm-node-date">{fmtDate(node.createdAt)}</span>
          </div>
        </div>
        <div className="arnm-node-stats">
          <div className="arnm-node-stat">
            <span className="arnm-node-stat-label">Invested</span>
            <span className="arnm-node-stat-value indigo">{fmtCompact(node.totalInvestment)}</span>
          </div>
          <div className="arnm-node-stat">
            <span className="arnm-node-stat-label">ROI</span>
            <span className="arnm-node-stat-value green">{fmtCompact(node.totalRoiEarned)}</span>
          </div>
          <div className="arnm-node-stat">
            <span className="arnm-node-stat-label">Income</span>
            <span className="arnm-node-stat-value teal">{fmtCompact((node.directIncome || 0) + (node.levelIncome || 0))}</span>
          </div>
        </div>
        <div className="arnm-node-right">
          <div className={`arnm-node-status ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </div>
          <div className="arnm-node-team">
            <Users size={12} /> {node.totalTeamCount || node.children?.length || 0}
          </div>
        </div>
        {hasChildren && (
          <button
            className="arnm-node-toggle"
            onClick={(e) => { e.stopPropagation(); toggleNode(node._id); }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="arnm-child-count">{node.children.length}</span>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="arnm-children">
          {node.children.map((child) => (
            <AdminTreeNode
              key={child._id}
              node={child}
              isRoot={false}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onNodeClick={onNodeClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ADMIN MEMBER DETAIL PANEL
   ========================================================= */
function AdminMemberDetailPanel({ detail, onClose, onSelectMember }) {
  const { user, wallet, uplinePath, directDownlines, totalDownlineCount, directDownlineCount, financial } = detail;
  const isActive = user.isActivated && user.accountStatus === 'ACTIVE';

  return (
    <div className="arnm-detail-overlay" onClick={onClose}>
      <div className="arnm-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="arnm-detail-header">
          <h3>Member Network Details</h3>
          <button className="arnm-detail-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="arnm-detail-body">
          {/* Upline Path */}
          {uplinePath && uplinePath.length > 0 && (
            <div className="arnm-upline-section">
              <h4 className="arnm-detail-section-title">Upline Path</h4>
              <div className="arnm-upline-path">
                {uplinePath.map((u, i) => (
                  <span key={u._id} className="arnm-upline-chip">
                    <span className="arnm-upline-avatar">{u.name?.charAt(0)?.toUpperCase()}</span>
                    <span>{u.name}</span>
                    {i < uplinePath.length - 1 && <ChevronRight size={14} className="arnm-upline-arrow" />}
                  </span>
                ))}
                <span className="arnm-upline-arrow-separator">&rarr;</span>
                <span className="arnm-upline-chip current">
                  <span className="arnm-upline-avatar">{user.name?.charAt(0)?.toUpperCase()}</span>
                  <span>{user.name}</span>
                </span>
              </div>
            </div>
          )}
          {(!uplinePath || uplinePath.length === 0) && (
            <div className="arnm-upline-section">
              <h4 className="arnm-detail-section-title">Upline Path</h4>
              <div className="arnm-upline-path">
                <span className="arnm-upline-chip current">
                  <span className="arnm-upline-avatar">{user.name?.charAt(0)?.toUpperCase()}</span>
                  <span>{user.name}</span>
                </span>
                <span className="arnm-no-upline">(Top of network — no upline)</span>
              </div>
            </div>
          )}

          {/* Member Info */}
          <div className="arnm-detail-member-section">
            <div className={`arnm-detail-avatar ${isActive ? 'active' : 'inactive'}`}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="arnm-detail-member-name">{user.name}</div>
            <div className={`arnm-detail-member-status ${isActive ? 'active' : 'inactive'}`}>
              {isActive ? <><UserCheck size={14} /> Active</> : <><UserX size={14} /> Inactive</>}
            </div>
          </div>

          <div className="arnm-detail-grid">
            <div className="arnm-detail-item">
              <span>Email</span><span>{user.email}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Referral Code</span><span className="arnm-code">{user.referralCode}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Joined</span><span>{fmtDate(user.createdAt)}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Total Investment</span><span className="text-indigo">{fmt(financial.totalInvestment)}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Total ROI Earned</span><span className="text-green">{fmt(financial.totalRoiEarned)}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Direct Income</span><span className="text-blue">{fmt(financial.directIncome)}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Level Income</span><span className="text-purple">{fmt(financial.levelIncome)}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Direct Members</span><span>{directDownlineCount}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Total Team</span><span>{totalDownlineCount}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Pending</span><span className="text-orange">{fmt(financial.pendingCommissions)}</span>
            </div>
            <div className="arnm-detail-item">
              <span>Total Earnings</span><span className="text-teal">{fmt(financial.totalEarnings)}</span>
            </div>
          </div>

          {/* Direct Downlines */}
          {directDownlines && directDownlines.length > 0 && (
            <div className="arnm-downline-section">
              <h4 className="arnm-detail-section-title">Direct Downlines ({directDownlines.length})</h4>
              <div className="arnm-downline-list">
                {directDownlines.map((d) => (
                  <div key={d._id} className="arnm-downline-item" onClick={() => { onSelectMember(d); onClose(); }}>
                    <div className={`arnm-downline-avatar ${d.isActivated && d.accountStatus === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {d.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="arnm-downline-info">
                      <div className="arnm-downline-name">{d.name}</div>
                      <div className="arnm-downline-code">{d.referralCode}</div>
                    </div>
                    <span className={`arnm-downline-status ${d.isActivated && d.accountStatus === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {d.isActivated && d.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet */}
          {wallet && (
            <div className="arnm-wallet-section">
              <h4 className="arnm-detail-section-title">Wallet Summary</h4>
              <div className="arnm-wallet-grid">
                <div className="arnm-wallet-item blue"><span>Main</span><strong>{fmt(wallet.mainBalance)}</strong></div>
                <div className="arnm-wallet-item green"><span>ROI</span><strong>{fmt(wallet.roiBalance)}</strong></div>
                <div className="arnm-wallet-item yellow"><span>E-Wallet</span><strong>{fmt(wallet.ewalletBalance)}</strong></div>
                <div className="arnm-wallet-item purple"><span>Profit Share</span><strong>{fmt(wallet.profitShareBalance)}</strong></div>
                <div className="arnm-wallet-item red"><span>Pending</span><strong>{fmt(wallet.pendingCommissions)}</strong></div>
                <div className="arnm-wallet-item teal"><span>Total Earnings</span><strong>{fmt(wallet.totalEarnings)}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBERS — Full Member List
   ========================================================= */
function ARNMMembers() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activatedFilter, setActivatedFilter] = useState('');
  const [hasInvestment, setHasInvestment] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const searchTimeoutRef = useRef(null);
  const filtersRef = useRef({ page: 1, sort: 'createdAt', order: 'desc', search: '', status: '', activated: '', hasInvestment: '' });

  const fetchMembers = async (overrides = {}) => {
    const f = { ...filtersRef.current, ...overrides };
    setLoading(true);
    try {
      const params = { page: f.page, limit: 20, sort: f.sort, order: f.order };
      if (f.search) params.search = f.search;
      if (f.status) params.status = f.status;
      if (f.activated) params.activated = f.activated;
      if (f.hasInvestment) params.hasInvestment = f.hasInvestment;
      const res = await getAdminReferralMembers(params);
      setMembers(res.members || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch { setMembers([]); }
    finally { setLoading(false); }
  };

  const syncAndFetch = (updates = {}) => {
    const f = { ...filtersRef.current, ...updates };
    filtersRef.current = f;
    if (updates.page !== undefined) setPage(updates.page);
    if (updates.sort !== undefined) setSort(updates.sort);
    if (updates.order !== undefined) setOrder(updates.order);
    if (updates.search !== undefined) setSearch(updates.search);
    if (updates.status !== undefined) setStatusFilter(updates.status);
    if (updates.activated !== undefined) setActivatedFilter(updates.activated);
    if (updates.hasInvestment !== undefined) setHasInvestment(updates.hasInvestment);
    fetchMembers(f);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleSearch = (val) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      syncAndFetch({ search: val, page: 1 });
    }, 400);
    setSearch(val);
  };

  const toggleSort = (field) => {
    const newOrder = sort === field ? (order === 'asc' ? 'desc' : 'asc') : 'desc';
    syncAndFetch({ sort: field, order: newOrder, page: 1 });
  };

  const openDetail = async (m) => {
    try {
      const res = await getAdminReferralMemberDetail(m._id);
      setDetailData(res);
      setShowDetail(true);
    } catch { /* ignore */ }
  };

  const columns = [
    { key: 'name', label: 'Member', sortable: true },
    { key: 'referralCode', label: 'Referral Code', sortable: false },
    { key: 'sponsorName', label: 'Sponsor', sortable: false },
    { key: 'accountStatus', label: 'Status', sortable: true },
    { key: 'isActivated', label: 'Activation', sortable: true },
    { key: 'totalInvestment', label: 'Investment', sortable: true },
    { key: 'totalRoiEarned', label: 'ROI Earned', sortable: true },
    { key: 'directIncome', label: 'Direct Income', sortable: true },
    { key: 'indirectIncome', label: 'Indirect Income', sortable: true },
    { key: 'totalEarnings', label: 'Total Earnings', sortable: true },
    { key: 'createdAt', label: 'Join Date', sortable: true },
  ];

  return (
    <div>
      <div className="arnm-overview-header">
        <div>
          <h2 className="arnm-overview-title">All Members</h2>
          <p className="arnm-overview-subtitle">{total} total members in the network</p>
        </div>
      </div>

      <div className="arnm-filters-bar">
        <div className="arnm-search-box compact">
          <Search size={16} className="arnm-search-icon" />
          <input
            type="text"
            className="arnm-search-input"
            placeholder="Search members..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <select className="arnm-filter-select" value={statusFilter} onChange={(e) => syncAndFetch({ status: e.target.value, page: 1 })}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select className="arnm-filter-select" value={activatedFilter} onChange={(e) => syncAndFetch({ activated: e.target.value, page: 1 })}>
          <option value="">All Activation</option>
          <option value="true">Activated</option>
          <option value="false">Not Activated</option>
        </select>
        <select className="arnm-filter-select" value={hasInvestment} onChange={(e) => syncAndFetch({ hasInvestment: e.target.value, page: 1 })}>
          <option value="">All Investment</option>
          <option value="true">Has Investment</option>
          <option value="false">No Investment</option>
        </select>
      </div>

      {loading ? (
        <Spinner label="Loading members..." />
      ) : (
        <>
          <div className="arnm-table-wrap">
            <table className="arnm-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    >
                      <span className="arnm-th-content">
                        {col.label}
                        {col.sortable && (
                          <ArrowUpDown size={12} className={`arnm-sort-icon ${sort === col.key ? 'active' : ''}`} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr><td colSpan={columns.length} className="arnm-table-empty">No members found</td></tr>
                )}
                {members.map((m) => {
                  const isActive = m.accountStatus === 'ACTIVE' && m.isActivated;
                  return (
                    <tr key={m._id} className="arnm-table-row" onClick={() => openDetail(m)}>
                      <td>
                        <div className="arnm-member-cell">
                          <div className={`arnm-member-avatar-sm ${isActive ? 'active' : 'inactive'}`}>
                            {m.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="arnm-member-name-sm">{m.name}</div>
                            <div className="arnm-member-email-sm">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="arnm-code">{m.referralCode}</span></td>
                      <td>{m.sponsorName || '—'}</td>
                      <td><span className={`arnm-status-badge ${m.accountStatus?.toLowerCase()}`}>{m.accountStatus}</span></td>
                      <td><span className={`arnm-activation-badge ${m.isActivated ? 'yes' : 'no'}`}>{m.isActivated ? 'Activated' : 'Pending'}</span></td>
                      <td className="text-indigo">{fmt(m.totalInvestment)}</td>
                      <td className="text-green">{fmt(m.totalRoiEarned)}</td>
                      <td className="text-blue">{fmt(m.directIncome)}</td>
                      <td className="text-purple">{fmt(m.indirectIncome)}</td>
                      <td className="text-teal">{fmt(m.totalEarnings)}</td>
                      <td>{fmtDate(m.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="arnm-pagination">
              <span className="arnm-pagination-info">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
              </span>
              <div className="arnm-pagination-controls">
                <button className="arnm-page-btn" onClick={() => syncAndFetch({ page: page - 1 })} disabled={page <= 1}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (page <= 4) pageNum = i + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = page - 3 + i;
                  return (
                    <button
                      key={pageNum}
                      className={`arnm-page-btn ${page === pageNum ? 'active' : ''}`}
                      onClick={() => syncAndFetch({ page: pageNum })}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button className="arnm-page-btn" onClick={() => syncAndFetch({ page: page + 1 })} disabled={page >= totalPages}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showDetail && detailData && (
        <AdminMemberDetailPanel
          detail={detailData}
          onClose={() => { setShowDetail(false); setDetailData(null); }}
          onSelectMember={(m) => { setShowDetail(false); setDetailData(null); openDetail(m); }}
        />
      )}
    </div>
  );
}

/* =========================================================
   REPORTS
   ========================================================= */
function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => { try { setStats(await getAdminStats()); } catch (e) { setError(e.response?.data?.message || 'Failed'); } finally { setLoading(false); } })();
  }, []);
  if (loading) return <Spinner label="Loading reports..." />;
  if (error) return <ErrorBox message={error} />;
  const cards = [
    { label: 'User Reports', value: stats.totalUsers, color: 'blue' },
    { label: 'Investment Reports', value: stats.totalInvestments, color: 'purple' },
    { label: 'Deposit Reports', value: fmt(stats.totalDeposited), color: 'green' },
    { label: 'Earnings Reports', value: fmt(stats.totalRoiDistributed + stats.totalCommission), color: 'yellow' },
  ];
  return (
    <div>
      <div className="stats-grid">
        {cards.map((c) => (
          <div className={`stat-card stat-icon-${c.color}`} key={c.label}>
            <div className="stat-icon" />
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header"><h3>Deposit Trend</h3></div>
          <ResponsiveContainerWrap height={240}>
            <BarChart data={stats.depositTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="deposits" fill="var(--chart-deposits)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainerWrap>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><h3>Investment Trend</h3></div>
          <ResponsiveContainerWrap height={240}>
            <BarChart data={stats.investmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="investments" fill="var(--chart-bar-secondary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainerWrap>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LEVELS MANAGEMENT
   ========================================================= */
function AdminLevels({ toastSuccess, toastError }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [txnsLoading, setTxnsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await getAdminSettings();
        setLevels(d.settings.levels || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [directRes, levelRes] = await Promise.all([
          getAdminTransactions({ type: 'DIRECT_INCOME', limit: 500 }),
          getAdminTransactions({ type: 'LEVEL_INCOME', limit: 500 }),
        ]);
        const allTxns = [...(directRes.transactions || []), ...(levelRes.transactions || [])];
        setTransactions(allTxns);
      } catch (e) { /* silent */ }
      finally { setTxnsLoading(false); }
    })();
  }, []);

  const grouped = (() => {
    const map = {};
    const lvlConfig = {};
    levels.forEach(l => { lvlConfig[l.level] = l.percentage; });

    transactions.forEach(txn => {
      const lvl = txn.metadata?.level || (txn.type === 'DIRECT_INCOME' ? 1 : null);
      if (!lvl) return;
      if (!map[lvl]) map[lvl] = { level: lvl, percentage: lvlConfig[lvl] || 0, txns: [], total: 0 };
      map[lvl].txns.push(txn);
      map[lvl].total += txn.amount || 0;
    });

    return Object.values(map).sort((a, b) => a.level - b.level);
  })();

  const toggleLevel = (lvl) => setExpandedLevel(expandedLevel === lvl ? null : lvl);

  const addLevel = () => {
    const nextNum = levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1;
    setLevels([...levels, { level: nextNum, percentage: 0 }]);
  };

  const removeLevel = (idx) => {
    const updated = levels.filter((_, i) => i !== idx).map((l, i) => ({ ...l, level: i + 1 }));
    setLevels(updated);
  };

  const updatePercentage = (idx, value) => {
    const updated = [...levels];
    updated[idx] = { ...updated[idx], percentage: Number(value) || 0 };
    setLevels(updated);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateAdminSettings({ levels });
      toastSuccess('Success', 'Level income settings saved');
    } catch (e) {
      const msg = e.response?.data?.message || 'Save failed';
      setError(msg);
      toastError('Error', msg);
    } finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading levels..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div>
      <div className="panel">
        <h3>Level Income Configuration</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
          Configure income percentages for each level. Level 1 = direct upline, Level 2 = upline's upline, etc.
          Percentages are applied to the actual investment amount. Income is credited only when investment is approved.
        </p>
        {levels.length === 0 ? (
          <EmptyState message="No levels configured. Add a level to get started." />
        ) : (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            {levels.map((lvl, idx) => (
              <div key={idx} className="filter-group" style={{ marginBottom: 8, alignItems: 'center' }}>
                <span style={{ minWidth: 90, fontWeight: 600, fontSize: 14 }}>Level {lvl.level}</span>
                <input
                  className="form-input"
                  type="number"
                  value={lvl.percentage}
                  onChange={(e) => updatePercentage(idx, e.target.value)}
                  min="0"
                  max="100"
                  style={{ width: 100 }}
                />
                <span className="text-muted" style={{ fontSize: 13 }}>%</span>
                <button className="btn btn-sm" onClick={() => removeLevel(idx)} style={{ color: 'var(--color-danger)', padding: '4px 8px' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="filter-group">
          <button className="btn btn-secondary btn-sm" onClick={addLevel}>
            + Add Level
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving...' : 'Save Levels'}
          </button>
        </div>
      </div>

      {/* Level Income Records */}
      <div className="panel" style={{ marginTop: 'var(--space-4)' }}>
        <h3>Level Income Records</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
          Detailed view of all level income transactions. Click a level to see who received income, at what percentage, and from which investment.
        </p>
        {txnsLoading ? (
          <Spinner label="Loading records..." />
        ) : grouped.length === 0 ? (
          <EmptyState message="No level income records found." />
        ) : (
          grouped.map(group => (
            <div key={group.level}>
              <div className="level-group-header" onClick={() => toggleLevel(group.level)}>
                <span className={`txn-expand-icon ${expandedLevel === group.level ? 'open' : ''}`}>
                  <ChevronDown size={16} />
                </span>
                <span className="level-group-name">Level {group.level}</span>
                <span className="level-group-pct">{group.percentage}%</span>
                <span className="level-group-stats">
                  <span>{group.txns.length} transaction{group.txns.length !== 1 ? 's' : ''}</span>
                  <span className="stat-total">{fmt(group.total)}</span>
                </span>
              </div>
              {expandedLevel === group.level && (
                <div className="level-group-children">
                  {group.txns.map(txn => (
                    <div className="level-group-child" key={txn._id}>
                      <div className="level-group-child-grid">
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Received By</span>
                          <span className="level-group-child-value">{txn.user?.name} ({txn.user?.email})</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">From Member</span>
                          <span className="level-group-child-value">{txn.investmentUser?.name || '—'}</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Investment Amount</span>
                          <span className="level-group-child-value">{fmt(txn.metadata?.investmentAmount)}</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Percentage</span>
                          <span className="level-group-child-value">{txn.metadata?.percentage || group.percentage}%</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Income Amount</span>
                          <span className="level-group-child-value">{fmt(txn.amount)}</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Status</span>
                          <span className="level-group-child-value"><StatusBadge status={txn.status} /></span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Date</span>
                          <span className="level-group-child-value">{fmtDate(txn.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PROFIT SHARE LEVELS MANAGEMENT
   ========================================================= */
function AdminProfitShareLevels({ toastSuccess, toastError }) {
  const [psLevels, setPsLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [txnsLoading, setTxnsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await getAdminSettings();
        setPsLevels(d.settings.profitShareLevels || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminTransactions({ type: 'PROFIT_SHARE', limit: 500 });
        setTransactions(res.transactions || []);
      } catch (e) { /* silent */ }
      finally { setTxnsLoading(false); }
    })();
  }, []);

  const grouped = (() => {
    const map = {};
    const lvlConfig = {};
    psLevels.forEach(l => { lvlConfig[l.level] = l.percentage; });

    transactions.forEach(txn => {
      const lvl = txn.metadata?.level || 1;
      if (!map[lvl]) map[lvl] = { level: lvl, percentage: lvlConfig[lvl] || 0, txns: [], total: 0 };
      map[lvl].txns.push(txn);
      map[lvl].total += txn.amount || 0;
    });

    return Object.values(map).sort((a, b) => a.level - b.level);
  })();

  const toggleLevel = (lvl) => setExpandedLevel(expandedLevel === lvl ? null : lvl);

  const addLevel = () => {
    const nextNum = psLevels.length > 0 ? Math.max(...psLevels.map(l => l.level)) + 1 : 1;
    setPsLevels([...psLevels, { level: nextNum, percentage: 0 }]);
  };

  const removeLevel = (idx) => {
    const updated = psLevels.filter((_, i) => i !== idx).map((l, i) => ({ ...l, level: i + 1 }));
    setPsLevels(updated);
  };

  const updatePercentage = (idx, value) => {
    const updated = [...psLevels];
    updated[idx] = { ...updated[idx], percentage: Number(value) || 0 };
    setPsLevels(updated);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateAdminSettings({ profitShareLevels: psLevels });
      toastSuccess('Success', 'Profit Share level settings saved');
    } catch (e) {
      const msg = e.response?.data?.message || 'Save failed';
      setError(msg);
      toastError('Error', msg);
    } finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading profit share levels..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div>
      <div className="panel">
        <h3>Profit Share Levels Configuration</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
          Configure upline-based profit share percentages. When profit share is distributed,
          each investor's upline chain receives the configured percentage at each level.
        </p>
        {psLevels.length === 0 ? (
          <EmptyState message="No profit share levels configured. Add a level to get started." />
        ) : (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            {psLevels.map((lvl, idx) => (
              <div key={idx} className="filter-group" style={{ marginBottom: 8, alignItems: 'center' }}>
                <span style={{ minWidth: 90, fontWeight: 600, fontSize: 14 }}>Level {lvl.level}</span>
                <input
                  className="form-input"
                  type="number"
                  value={lvl.percentage}
                  onChange={(e) => updatePercentage(idx, e.target.value)}
                  min="0"
                  max="100"
                  style={{ width: 100 }}
                />
                <span className="text-muted" style={{ fontSize: 13 }}>%</span>
                <button className="btn btn-sm" onClick={() => removeLevel(idx)} style={{ color: 'var(--color-danger)', padding: '4px 8px' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="filter-group">
          <button className="btn btn-secondary btn-sm" onClick={addLevel}>
            + Add Profit Share Level
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving...' : 'Save Profit Share Levels'}
          </button>
        </div>
      </div>

      {/* Profit Share Records */}
      <div className="panel" style={{ marginTop: 'var(--space-4)' }}>
        <h3>Profit Share Records</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
          Detailed view of all profit share transactions. Click a level to see who received income, at what percentage, and from which investment.
        </p>
        {txnsLoading ? (
          <Spinner label="Loading records..." />
        ) : grouped.length === 0 ? (
          <EmptyState message="No profit share records found." />
        ) : (
          grouped.map(group => (
            <div key={group.level}>
              <div className="level-group-header" onClick={() => toggleLevel(group.level)}>
                <span className={`txn-expand-icon ${expandedLevel === group.level ? 'open' : ''}`}>
                  <ChevronDown size={16} />
                </span>
                <span className="level-group-name">Level {group.level}</span>
                <span className="level-group-pct">{group.percentage}%</span>
                <span className="level-group-stats">
                  <span>{group.txns.length} transaction{group.txns.length !== 1 ? 's' : ''}</span>
                  <span className="stat-total">{fmt(group.total)}</span>
                </span>
              </div>
              {expandedLevel === group.level && (
                <div className="level-group-children">
                  {group.txns.map(txn => (
                    <div className="level-group-child" key={txn._id}>
                      <div className="level-group-child-grid">
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Received By</span>
                          <span className="level-group-child-value">{txn.user?.name} ({txn.user?.email})</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">From Member</span>
                          <span className="level-group-child-value">{txn.investmentUser?.name || '—'}</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Investment Amount</span>
                          <span className="level-group-child-value">{fmt(txn.metadata?.investmentAmount)}</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Percentage</span>
                          <span className="level-group-child-value">{txn.metadata?.percentage || group.percentage}%</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Income Amount</span>
                          <span className="level-group-child-value">{fmt(txn.amount)}</span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Status</span>
                          <span className="level-group-child-value"><StatusBadge status={txn.status} /></span>
                        </div>
                        <div className="level-group-child-field">
                          <span className="level-group-child-label">Date</span>
                          <span className="level-group-child-value">{fmtDate(txn.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */
function AdminSettings({ toastSuccess, toastError }) {
  const navigate = useNavigate();
  const q = new URLSearchParams(useLocation().search);
  const tab = q.get('tab') || 'general';
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // General
  const [allowInvest, setAllowInvest] = useState(false);
  // ROI
  const [roiMode, setRoiMode] = useState('OVERALL');
  const [overallRoi, setOverallRoi] = useState(0);
  const [roiEnabled, setRoiEnabled] = useState(false);
  const [proc, setProc] = useState(null);
  const [roiDate, setRoiDate] = useState('');
  // E-Wallet
  const [ewalletEnabled, setEwalletEnabled] = useState(false);
  const [ewalletUsageEnabled, setEwalletUsageEnabled] = useState(false);
  const [signupBonus, setSignupBonus] = useState(0);
  const [uplineBonus, setUplineBonus] = useState(0);
  // E-Wallet Downline Offer
  const [ewalletDownlineOfferEnabled, setEwalletDownlineOfferEnabled] = useState(false);
  const [ewalletMaxPercentage, setEwalletMaxPercentage] = useState(0);
  // Activation
  const [activationFee, setActivationFee] = useState(0);
  // Income
  const [directIncome, setDirectIncome] = useState(0);
  const [levelIncome, setLevelIncome] = useState(0);
  // ROI Transfer
  const [roiTransferEnabled, setRoiTransferEnabled] = useState(false);
  // Profit Share
  const [psTransferEnabled, setPsTransferEnabled] = useState(false);
  const [psMethod, setPsMethod] = useState('EQUAL');
  const [distAmount, setDistAmount] = useState('');
  const [distBusy, setDistBusy] = useState(false);
  // Fund Wallet
  const [fundTransferEnabled, setFundTransferEnabled] = useState(false);
  // Day-wise ROI
  const [roiDays, setRoiDays] = useState(0);
  const [daySchedule, setDaySchedule] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const d = await getAdminSettings();
        const s = d.settings;
        setSettings(s);
        setRoiMode(s.roiMode);
        setOverallRoi(s.overallRoiPercentage || 0);
        setRoiEnabled(s.roiProcessingEnabled);
        setAllowInvest(s.allowUserInvestment);
        setEwalletEnabled(s.ewalletEnabled || false);
        setEwalletUsageEnabled(s.ewalletUsageEnabled || false);
        setSignupBonus(s.signupBonusAmount || 0);
        setUplineBonus(s.uplineSignupBonusAmount || 0);
        setActivationFee(s.activationFee || 0);
        setDirectIncome(s.directIncomePercentage || 0);
        setLevelIncome(s.levelIncomePercentage || 0);
        setRoiTransferEnabled(s.roiTransferEnabled || false);
        setPsTransferEnabled(s.profitShareTransferEnabled || false);
        setPsMethod(s.profitShareDistributionMethod || 'EQUAL');
        setFundTransferEnabled(s.fundTransferEnabled || false);
        setEwalletDownlineOfferEnabled(s.ewalletDownlineOfferEnabled || false);
        setEwalletMaxPercentage(s.ewalletMaxPercentage || 0);
        setRoiDays(s.roiDays || 0);
        setDaySchedule(s.dayWiseRoiSchedule || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load settings'); }
      finally { setLoading(false); }
    })();
  }, []);

  const updateDaySchedule = (index, value) => {
    const newSchedule = [...daySchedule];
    while (newSchedule.length <= index) {
      newSchedule.push({ day: newSchedule.length + 1, percentage: 0 });
    }
    newSchedule[index] = { day: index + 1, percentage: Number(value) || 0 };
    setDaySchedule(newSchedule);
  };

  const save = async (fields) => {
    setBusy(true);
    try {
      await updateAdminSettings(fields);
      toastSuccess('Success', 'Settings saved successfully');
    } catch (e) {
      const msg = e.response?.data?.message || 'Save failed';
      setError(msg);
      toastError('Error', msg);
    }
    finally { setBusy(false); }
  };

  const runRoi = async () => {
    setBusy(true);
    try {
      const payload = roiDate ? { date: roiDate } : {};
      const r = await processRoi(payload); setProc(r);
      toastSuccess('Success', `ROI processed: ${r.processed} credited, ${r.skipped} skipped`);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed';
      setError(msg);
      toastError('Error', msg);
    }
    finally { setBusy(false); }
  };

  const handleDistribute = async () => {
    const amt = Number(distAmount);
    if (!amt || amt <= 0) { toastError('Error', 'Enter a valid amount'); return; }
    setDistBusy(true);
    try {
      const result = await distributeProfitShare({ amount: amt, method: psMethod });
      toastSuccess('Success', `Distributed ${fmt(amt)} to ${result.distributedTo} users`);
      setDistAmount('');
    } catch (e) { toastError('Error', e.response?.data?.message || 'Distribution failed'); }
    finally { setDistBusy(false); }
  };

  const handleRoiTransfer = async () => {
    setBusy(true);
    try {
      const r = await triggerRoiTransfer();
      toastSuccess('Success', `ROI transferred: ${r.transferred} users`);
    } catch (e) { toastError('Error', e.response?.data?.message || 'Transfer failed'); }
    finally { setBusy(false); }
  };

  const handlePsTransfer = async () => {
    setBusy(true);
    try {
      const r = await triggerProfitShareTransfer();
      toastSuccess('Success', `Profit Share transferred: ${r.transferred} users`);
    } catch (e) { toastError('Error', e.response?.data?.message || 'Transfer failed'); }
    finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading settings..." />;
  if (error) return <ErrorBox message={error} />;

  const TABS = ['general', 'roi', 'platform', 'ewallet', 'activation', 'income', 'roi-transfer', 'profit-share', 'fund-transfer', 'bank-accounts'];

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => navigate(`/admin/settings?tab=${t}`)}
            style={{ textTransform: 'capitalize', fontSize: 12 }}>
            {t === 'ewallet' ? 'E-Wallet' : t === 'roi-transfer' ? 'ROI Transfer' : t === 'profit-share' ? 'Profit Share' : t === 'fund-transfer' ? 'Fund Transfer' : t === 'bank-accounts' ? 'Bank Accounts' : t}
          </button>
        ))}
      </div>

      {/* GENERAL */}
      {tab === 'general' && (
        <div className="panel">
          <h3>General</h3>
          <label className="form-group filter-group">
            <input type="checkbox" checked={allowInvest} onChange={(e) => setAllowInvest(e.target.checked)} />
            Allow user self-investment
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => save({ allowUserInvestment: allowInvest })} disabled={busy}>Save General</button>
        </div>
      )}

      {/* ROI */}
      {tab === 'roi' && (
        <div className="panel">
          <h3>ROI Settings</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            ROI configuration has been moved to the dedicated <Link to="/admin/roi">ROI Management</Link> page.
          </p>
          <Link to="/admin/roi" className="btn btn-primary btn-sm">Go to ROI Management</Link>
        </div>
      )}

      {/* PLATFORM */}
      {tab === 'platform' && (
        <div className="panel">
          <h3>Platform</h3>
          <label className="form-group filter-group">
            <input type="checkbox" checked={!allowInvest} onChange={(e) => setAllowInvest(!e.target.checked)} />
            Maintenance mode (disables self-investment)
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => save({ allowUserInvestment: allowInvest })} disabled={busy}>Save Platform</button>
        </div>
      )}

      {/* E-WALLET */}
      {tab === 'ewallet' && (
        <div className="panel">
          <h3>E-Wallet Settings</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            E-Wallet is a bonus wallet credited on registration. Disabling it does NOT reset existing balances.
          </p>
          <label className="form-group filter-group">
            <input type="checkbox" checked={ewalletEnabled} onChange={(e) => setEwalletEnabled(e.target.checked)} />
            E-Wallet enabled
          </label>
          <label className="form-group filter-group">
            <input type="checkbox" checked={ewalletUsageEnabled} onChange={(e) => setEwalletUsageEnabled(e.target.checked)} />
            Allow users to use E-Wallet (withdraw/transfer)
          </label>
          <div className="form-group">
            <label className="form-label">Signup Bonus Amount ($)</label>
            <input className="form-input" type="number" value={signupBonus} onChange={(e) => setSignupBonus(Number(e.target.value))} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Upline Signup Bonus Amount ($)</label>
            <input className="form-input" type="number" value={uplineBonus} onChange={(e) => setUplineBonus(Number(e.target.value))} min="0" />
          </div>

          <h4 style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>Downline Investment Offer</h4>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Allow users to use their E-Wallet balance toward a downline member's investment. This does NOT allow using E-Wallet for own investment.
          </p>
          <label className="form-group filter-group">
            <input type="checkbox" checked={ewalletDownlineOfferEnabled} onChange={(e) => setEwalletDownlineOfferEnabled(e.target.checked)} />
            Allow E-Wallet for downline investment
          </label>
          <div className="form-group">
            <label className="form-label">Maximum E-Wallet Percentage (%)</label>
            <input className="form-input" type="number" value={ewalletMaxPercentage} onChange={(e) => setEwalletMaxPercentage(Number(e.target.value))} min="0" max="100" />
            <p className="form-hint">Maximum percentage of downline investment that can be paid from E-Wallet</p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => save({ ewalletEnabled, ewalletUsageEnabled, signupBonusAmount: Number(signupBonus), uplineSignupBonusAmount: Number(uplineBonus), ewalletDownlineOfferEnabled, ewalletMaxPercentage: Number(ewalletMaxPercentage) })} disabled={busy}>Save E-Wallet Settings</button>
        </div>
      )}

      {/* ACTIVATION */}
      {tab === 'activation' && (
        <div className="panel">
          <h3>Account Activation</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            One-time fee charged on the user's first investment. The fee is deducted from the investment amount.
          </p>
          <div className="form-group">
            <label className="form-label">Activation Fee ($)</label>
            <input className="form-input" type="number" value={activationFee} onChange={(e) => setActivationFee(Number(e.target.value))} min="0" />
            <p className="form-hint">Set to 0 to disable activation fee</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => save({ activationFee: Number(activationFee) })} disabled={busy}>Save Activation Fee</button>
        </div>
      )}

      {/* INCOME */}
      {tab === 'income' && (
        <div className="panel">
          <h3>Income Settings</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Income percentages are now managed in the dedicated <Link to="/admin/levels">Levels</Link> page.
            Configure Level 1 (direct), Level 2 (indirect), and any additional levels there.
          </p>
          <Link to="/admin/levels" className="btn btn-primary btn-sm">Go to Levels Management</Link>
        </div>
      )}

      {/* ROI TRANSFER */}
      {tab === 'roi-transfer' && (
        <div className="panel">
          <h3>ROI Transfer Settings</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Allow users to transfer ROI balance to their Main Wallet anytime. ROI max is 2x investment.
          </p>
          <label className="form-group filter-group">
            <input type="checkbox" checked={roiTransferEnabled} onChange={(e) => setRoiTransferEnabled(e.target.checked)} />
            Enable ROI Transfer
          </label>
          <div className="filter-group">
            <button className="btn btn-primary btn-sm" onClick={() => save({ roiTransferEnabled })} disabled={busy}>Save ROI Transfer Settings</button>
            <button className="btn btn-secondary btn-sm" onClick={handleRoiTransfer} disabled={busy}>Trigger ROI Transfer Now</button>
          </div>
        </div>
      )}

      {/* PROFIT SHARE */}
      {tab === 'profit-share' && (
        <div className="panel">
          <h3>Profit Share Settings</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Platform revenue distributed to users manually by admin. Goes to Profit Share Wallet. Users can transfer anytime. Max is 3x investment.
          </p>
          <div className="form-group">
            <label className="form-label">Distribution Method</label>
            <select className="select" value={psMethod} onChange={(e) => setPsMethod(e.target.value)}>
              <option value="EQUAL">Equal (split equally among all users)</option>
              <option value="PROPORTIONAL">Proportional (based on investment amount)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Distribution Amount ($)</label>
            <div className="filter-group">
              <input className="form-input" type="number" value={distAmount} onChange={(e) => setDistAmount(e.target.value)} min="0" placeholder="0.00" />
              <button className="btn btn-primary btn-sm" onClick={handleDistribute} disabled={distBusy}>
                {distBusy ? 'Distributing...' : 'Distribute Now'}
              </button>
            </div>
          </div>
          <hr style={{ margin: 'var(--space-3) 0' }} />
          <h4 style={{ marginBottom: 'var(--space-2)' }}>User Transfer Settings</h4>
          <label className="form-group filter-group">
            <input type="checkbox" checked={psTransferEnabled} onChange={(e) => setPsTransferEnabled(e.target.checked)} />
            Enable Profit Share Transfer
          </label>
          <div className="filter-group">
            <button className="btn btn-primary btn-sm" onClick={() => save({ profitShareDistributionMethod: psMethod, profitShareTransferEnabled: psTransferEnabled })} disabled={busy}>Save Profit Share Settings</button>
            <button className="btn btn-secondary btn-sm" onClick={handlePsTransfer} disabled={busy}>Trigger Transfer Now</button>
          </div>
        </div>
      )}

      {/* FUND TRANSFER */}
      {tab === 'fund-transfer' && (
        <div className="panel">
          <h3>Fund Wallet Transfer Settings</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Enable or disable user-to-user Fund Wallet transfers. When disabled, existing Fund Wallet balances are preserved.
          </p>
          <label className="form-group filter-group">
            <input type="checkbox" checked={fundTransferEnabled} onChange={(e) => setFundTransferEnabled(e.target.checked)} />
            Enable Fund Wallet Transfers
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => save({ fundTransferEnabled })} disabled={busy}>Save Fund Transfer Settings</button>
        </div>
      )}

      {/* BANK ACCOUNTS */}
      {tab === 'bank-accounts' && <AdminBankAccounts toastSuccess={toastSuccess} toastError={toastError} />}
    </div>
  );
}

/* =========================================================
   BANK ACCOUNTS MANAGEMENT
   ========================================================= */
function AdminBankAccounts({ toastSuccess, toastError }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountType, setAccountType] = useState('BANK');
  const [displayOrder, setDisplayOrder] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getAdminBankAccounts();
      setAccounts(d.accounts || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setBankName(''); setAccountHolder(''); setAccountNumber('');
    setIban(''); setAccountType('BANK'); setDisplayOrder(0);
    setEditId(null); setShowForm(false);
  };

  const startEdit = (acc) => {
    setBankName(acc.bankName); setAccountHolder(acc.accountHolder);
    setAccountNumber(acc.accountNumber); setIban(acc.iban || '');
    setAccountType(acc.accountType); setDisplayOrder(acc.displayOrder || 0);
    setEditId(acc._id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!bankName || !accountHolder || !accountNumber) {
      toastError('Error', 'Bank name, account holder, and account number are required');
      return;
    }
    setBusy(true);
    try {
      const payload = { bankName, accountHolder, accountNumber, iban, accountType, displayOrder: Number(displayOrder) };
      if (editId) {
        await updateBankAccount(editId, payload);
        toastSuccess('Success', 'Bank account updated');
      } else {
        await createBankAccount(payload);
        toastSuccess('Success', 'Bank account added');
      }
      resetForm();
      await load();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Operation failed'); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteBankAccount(confirm._id);
      toastSuccess('Success', 'Bank account deleted');
      setConfirm(null);
      await load();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Delete failed'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Bank Accounts</h3>
          <p className="text-muted" style={{ fontSize: 13 }}>Manage bank/payment accounts shown to users during deposit</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
          <h4>{editId ? 'Edit Bank Account' : 'Add Bank Account'}</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input className="form-input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HBL, Meezan Bank" />
            </div>
            <div className="form-group">
              <label className="form-label">Account Holder</label>
              <input className="form-input" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Account holder name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input className="form-input" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number" />
            </div>
            <div className="form-group">
              <label className="form-label">IBAN (optional)</label>
              <input className="form-input" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select className="select" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="BANK">Bank</option>
                <option value="JAZZCASH">JazzCash</option>
                <option value="EASYPAISA">EasyPaisa</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Display Order</label>
              <input className="form-input" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} min="0" />
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Saving...' : editId ? 'Update Account' : 'Add Account'}
          </button>
        </div>
      )}

      {loading ? <Spinner label="Loading accounts..." /> : error ? <ErrorBox message={error} /> : (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th><th>Bank Name</th><th>Account Holder</th><th>Account Number</th><th>IBAN</th><th>Order</th><th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 && <tr><td colSpan={7} className="table-empty">No bank accounts configured</td></tr>}
                {accounts.map((acc) => (
                  <tr key={acc._id}>
                    <td data-label="Type"><span className="badge badge-primary">{acc.accountType}</span></td>
                    <td data-label="Bank Name" className="cell-strong">{acc.bankName}</td>
                    <td data-label="Account Holder">{acc.accountHolder}</td>
                    <td data-label="Account Number" style={{ fontFamily: 'monospace' }}>{acc.accountNumber}</td>
                    <td data-label="IBAN" style={{ fontFamily: 'monospace', fontSize: 12 }}>{acc.iban || '—'}</td>
                    <td data-label="Order">{acc.displayOrder}</td>
                    <td>
                      <div className="filter-group">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(acc)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(acc)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete Bank Account"
          message={`Are you sure you want to delete ${confirm.bankName} (${confirm.accountNumber})?`}
          confirmLabel="Delete"
          variant="danger"
          loading={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   ANNOUNCEMENTS
   ========================================================= */
function AdminAnnouncements({ toastSuccess, toastError }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'INFO', priority: 'MEDIUM', showBanner: true, showModal: false });
  const [confirm, setConfirm] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [removedExisting, setRemovedExisting] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024;

  const addFiles = (files) => {
    const valid = [];
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) { toastError('Invalid file', f.name + ' is not an image'); continue; }
      if (f.size > MAX_SIZE) { toastError('Too large', f.name + ' exceeds 5MB'); continue; }
      valid.push(f);
    }
    if (valid.length === 0) return;
    setNewFiles((prev) => [...prev, ...valid]);
    const newPreviewUrls = valid.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeNewFile = (idx) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (publicId) => {
    setRemovedExisting((prev) => [...prev, publicId]);
  };

  const resetForm = () => {
    newPreviews.forEach((u) => URL.revokeObjectURL(u));
    setNewFiles([]);
    setNewPreviews([]);
    setRemovedExisting([]);
    setForm({ title: '', message: '', type: 'INFO', priority: 'MEDIUM', showBanner: true, showModal: false });
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements({ limit: 100 });
      setAnnouncements(data.announcements || []);
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setEditItem(null);
    resetForm();
    setShowForm(true);
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, message: item.message, type: item.type, priority: item.priority, showBanner: item.showBanner, showModal: item.showModal });
    setNewFiles([]);
    setNewPreviews([]);
    setRemovedExisting([]);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.message) { toastError('Error', 'Title and message required'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('message', form.message);
      fd.append('type', form.type);
      fd.append('priority', form.priority);
      fd.append('showBanner', form.showBanner);
      fd.append('showModal', form.showModal);
      for (const f of newFiles) fd.append('images', f);
      if (removedExisting.length > 0) fd.append('removedImages', JSON.stringify(removedExisting));

      if (editItem) {
        await updateAnnouncement(editItem._id, fd);
        toastSuccess('Updated', 'Announcement updated');
      } else {
        await createAnnouncement(fd);
        toastSuccess('Created', 'Announcement created');
      }
      setShowForm(false);
      await load();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAnnouncement(id);
      await load();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Toggle failed'); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteAnnouncement(confirm._id);
      toastSuccess('Deleted', 'Announcement deleted');
      setConfirm(null);
      await load();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Delete failed'); }
    finally { setBusy(false); }
  };

  const TYPE_COLORS = { INFO: 'blue', PROMOTION: 'green', WARNING: 'yellow', UPDATE: 'purple', EVENT: 'red' };
  const PRIORITY_COLORS = { LOW: 'gray', MEDIUM: 'blue', HIGH: 'orange', URGENT: 'red' };

  if (loading) return <Spinner label="Loading announcements..." />;

  const existingImages = editItem?.images || [];
  const visibleExisting = existingImages.filter((img) => !removedExisting.includes(img.publicId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Announcements & Promotions</h2>
          <p className="page-subtitle">Create and manage announcements for all users</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate}>+ New Announcement</button>
      </div>

      {announcements.length === 0 ? (
        <div className="table-card"><EmptyState title="No announcements" subtitle="Create your first announcement to get started." /></div>
      ) : (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Images</th>
                  <th>Banner</th>
                  <th>Modal</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a._id}>
                    <td data-label="Title" className="cell-strong">{a.title}</td>
                    <td data-label="Type"><span className={`badge badge-${TYPE_COLORS[a.type] || 'blue'}`}>{a.type}</span></td>
                    <td data-label="Priority"><span className={`badge badge-${PRIORITY_COLORS[a.priority] || 'gray'}`}>{a.priority}</span></td>
                    <td data-label="Images">
                      {a.images && a.images.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {a.images.slice(0, 3).map((img, i) => (
                            <img key={i} src={img.url} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                          ))}
                          {a.images.length > 3 && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>+{a.images.length - 3}</span>}
                        </div>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td data-label="Banner">{a.showBanner ? '✓' : '—'}</td>
                    <td data-label="Modal">{a.showModal ? '✓' : '—'}</td>
                    <td data-label="Status">
                      <button
                        className={`btn btn-sm ${a.active ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => handleToggle(a._id)}
                      >
                        {a.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td data-label="Created">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="filter-group">
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(a)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(a)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { resetForm(); setShowForm(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button className="modal-close" onClick={() => { resetForm(); setShowForm(false); }}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-input" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Announcement message" />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="INFO">Info</option>
                    <option value="PROMOTION">Promotion</option>
                    <option value="WARNING">Warning</option>
                    <option value="UPDATE">Update</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.showBanner} onChange={(e) => setForm({ ...form, showBanner: e.target.checked })} />
                  Show Banner
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.showModal} onChange={(e) => setForm({ ...form, showModal: e.target.checked })} />
                  Show Modal Popup
                </label>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Images (optional, max 5MB each)</label>
                <div
                  className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? 'var(--color-primary-soft)' : 'var(--color-bg-alt)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Upload size={28} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    Click or drag images here
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    JPG, PNG, GIF, WebP — Max 5MB each
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                  />
                </div>

                {(visibleExisting.length > 0 || newPreviews.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {visibleExisting.map((img) => (
                      <div key={img.publicId} style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => removeExistingImage(img.publicId)}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                        ><X size={12} /></button>
                      </div>
                    ))}
                    {newPreviews.map((url, idx) => (
                      <div key={`new-${idx}`} style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => removeNewFile(idx)}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                        ><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
                {busy ? 'Saving...' : editItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete Announcement"
          message={`Are you sure you want to delete "${confirm.title}"?`}
          confirmLabel="Delete"
          variant="danger"
          loading={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   SUPPORT CHAT
   ========================================================= */
function AdminSupportChat({ toastSuccess, toastError }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const messagesEnd = useRef(null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await getAdminConversations(params);
      setConversations(data.conversations || []);
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadConversations(); }, [statusFilter]);

  const loadMessages = async (id) => {
    try {
      setLoading(true);
      const data = await getAdminChatMessages(id);
      setMessages(data.messages || []);
      setActiveConvo(data.conversation);
    } catch (e) { toastError('Error', e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeConvo) return;
    setSending(true);
    try {
      const data = await sendAdminMessage(activeConvo._id, input);
      setMessages((prev) => [...prev, data.message]);
      setInput('');
      await loadConversations();
    } catch (e) { toastError('Error', e.response?.data?.message || 'Send failed'); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateConversationStatus(id, status);
      if (activeConvo?._id === id) setActiveConvo((prev) => ({ ...prev, status }));
      await loadConversations();
      toastSuccess('Updated', `Status changed to ${status}`);
    } catch (e) { toastError('Error', e.response?.data?.message || 'Update failed'); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const STATUS_COLORS = { OPEN: 'blue', IN_PROGRESS: 'orange', RESOLVED: 'green', CLOSED: 'gray' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Support Chat</h2>
          <p className="page-subtitle">Manage user conversations and support requests</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 200px)', minHeight: 500 }}>
        {/* Conversations List */}
        <div style={{
          width: 340, flexShrink: 0, background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--color-border)' }}>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: 13 }}
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && conversations.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading...</div>
            )}
            {!loading && conversations.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 13 }}>No conversations</div>
            )}
            {conversations.map((c) => (
              <div
                key={c._id}
                onClick={() => loadMessages(c._id)}
                style={{
                  padding: '12px 14px', cursor: 'pointer',
                  background: activeConvo?._id === c._id ? 'var(--color-bg-secondary, #E6E8E8)' : 'transparent',
                  borderBottom: '1px solid var(--color-border, #E6E8E8)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E6E8E8'}
                onMouseLeave={(e) => e.currentTarget.style.background = activeConvo?._id === c._id ? '#E6E8E8' : 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.user?.name || 'User'}</span>
                  <span className={`badge badge-${STATUS_COLORS[c.status] || 'gray'}`} style={{ fontSize: 10 }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{c.subject}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                  {c.unreadByAdmin > 0 && (
                    <span style={{
                      background: '#e04848', color: '#fff', padding: '1px 6px',
                      borderRadius: 8, fontSize: 10,
                    }}>{c.unreadByAdmin}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1, background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {!activeConvo ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              <div style={{ textAlign: 'center' }}>
                <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div>Select a conversation to view messages</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '12px 20px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{activeConvo.user?.name || 'User'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{activeConvo.subject}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                    <button
                      key={s}
                      className={`btn btn-sm ${activeConvo.status === s ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(activeConvo._id, s)}
                      style={{ fontSize: 11 }}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                {loading && <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Loading...</div>}
                {messages.map((m) => {
                  const isAdmin = m.senderRole === 'ADMIN';
                  return (
                    <div key={m._id} style={{
                      display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                      marginBottom: 10,
                    }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px', borderRadius: 12,
                        background: isAdmin ? 'var(--color-primary, #008C3A)' : '#E6E8E8',
                        color: isAdmin ? '#fff' : 'var(--color-text, #25333B)',
                        fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2, opacity: 0.8 }}>
                          {m.sender?.name || (isAdmin ? 'Admin' : 'User')}
                        </div>
                        <div>{m.message}</div>
                        <div style={{
                          fontSize: 10, marginTop: 4,
                          color: isAdmin ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                        }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 20px', borderTop: '1px solid var(--color-border)',
                display: 'flex', gap: 8,
              }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply..."
                  className="form-input"
                  style={{ flex: 1, fontSize: 13 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
