import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, LineChart, ArrowDownToLine, ArrowUpFromLine, Receipt,
  Percent, Share2, FileBarChart, Settings, LogOut, Search, Menu,
  ChevronDown, ChevronRight, ChevronLeft, ZoomIn, ZoomOut,
  Maximize2, Minimize2, RotateCcw, X, UserCheck, UserX,
  Filter, Download, RefreshCw, ArrowUpDown, Network,
  DollarSign, Activity, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, {
  getAdminUsers, getAdminStats, getAdminUserDetail, getAdminInvestments,
  getAdminTransactions, getAdminSettings, updateAdminSettings, processRoi,
  getPendingDeposits, approveDeposit, rejectDeposit,
  distributeProfitShare, triggerRoiTransfer, triggerProfitShareTransfer,
  getAdminReferralStats, searchAdminReferralMembers, getAdminReferralTree,
  getAdminReferralMemberDetail, getAdminReferralMembers,
  getAdminBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount,
} from '../services/apiClient';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import Spinner from '../components/Spinner';
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
    { key: 'reports', label: 'Reports', icon: FileBarChart, to: '/admin/reports' },
    { key: 'settings', label: 'Settings', icon: Settings, to: '/admin/settings' },
  ];

/* =========================================================
   SHELL
   ========================================================= */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
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
          <div className="sidebar-logo"><LayoutDashboard size={20} /></div>
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
        </header>

        <div className="page-content animate-slide-up">
          {page === 'overview' && <AdminOverview toastSuccess={success} toastError={toastError} />}
          {page === 'users' && <AdminUsers toastSuccess={success} toastError={toastError} />}
          {page === 'investments' && <AdminInvestments />}
          {page === 'deposits' && <AdminDeposits toastSuccess={success} toastError={toastError} />}
          {page === 'withdrawals' && <AdminWithdrawals />}
          {page === 'transactions' && <AdminTransactions />}
          {page === 'roi' && <AdminRoi toastSuccess={success} toastError={toastError} />}
          {page === 'referrals' && <AdminReferrals />}
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
            <option value="">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option>
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
        <UserDetailModal detail={detail} loading={detailLoading} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function UserDetailModal({ detail, loading, onClose }) {
  const [tab, setTab] = useState('info');
  const d = detail;
  return (
    <Modal title={loading ? 'Loading...' : `${d.user.name} — Detail`} onClose={onClose}
      footer={<button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>}>
      {loading ? <Spinner label="Loading..." /> : (
        <div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            {['info', 'wallet', 'deposits', 'transactions', 'investments', 'roi', 'referrals'].map((t) => (
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
    try { const data = await getAdminTransactions({ type: 'DEPOSIT', status }); setRows(data.transactions || []); }
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
  return <EmptyState title="Withdrawals not enabled" subtitle="The withdrawal feature is not available on this platform yet." />;
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
  const type = q.get('type') || '';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const data = await getAdminTransactions(type ? { type } : {}); setRows(data.transactions || []); }
      catch (e) { setError(e.response?.data?.message || 'Failed to load transactions'); }
      finally { setLoading(false); }
    })();
  }, [type]);

  return (
    <div>
      {loading ? <Spinner label="Loading transactions..." /> : error ? <ErrorBox message={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="table-empty">No transactions found</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td data-label="User" className="cell-strong">{r.user?.name}</td>
                  <td data-label="Type">{r.type}</td>
                  <td data-label="Amount">{fmt(r.amount)}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td data-label="Date">{fmtDateTime(r.createdAt)}</td>
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
   ROI MANAGEMENT
   ========================================================= */
function AdminRoi({ toastSuccess, toastError }) {
  const q = new URLSearchParams(useLocation().search);
  const tab = q.get('tab') || 'overview';
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await getAdminStats(); setStats(s);
        if (tab === 'history') { const t = await getAdminTransactions({ type: 'ROI' }); setRows(t.transactions || []); }
      } catch (e) { setError(e.response?.data?.message || 'Failed to load ROI'); }
      finally { setLoading(false); }
    })();
  }, [tab]);

  if (loading) return <Spinner label="Loading ROI..." />;
  if (error) return <ErrorBox message={error} />;

  if (tab === 'history') {
    return (
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No ROI distributions yet</td></tr>}
            {rows.map((r) => (
              <tr key={r._id}>
                <td data-label="User" className="cell-strong">{r.user?.name}</td>
                <td data-label="Amount">{fmt(r.amount)}</td>
                <td data-label="Status"><StatusBadge status={r.status} /></td>
                <td data-label="Date">{fmtDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{fmt(stats.totalRoiDistributed)}</div>
          <div className="stat-label">Total ROI Distributed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeInvestments}</div>
          <div className="stat-label">Active Investments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{fmt(stats.totalInvested)}</div>
          <div className="stat-label">Total Invested</div>
        </div>
      </div>
      <div className="chart-card">
        <div className="chart-card-header"><h3>ROI Distribution (6 months)</h3></div>
        <ResponsiveContainerWrap height={240}>
          <BarChart data={stats.roiDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
            <Bar dataKey="roi" fill="var(--chart-roi)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainerWrap>
      </div>
      <p className="text-muted" style={{ marginTop: 16, fontSize: 13 }}>
        Configure ROI in <Link to="/admin/settings?tab=roi">ROI Settings</Link>. Use the "Process ROI" action there to credit ROI for today.
      </p>
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
    (async () => {
      setLoading(true);
      try {
        const s = await getAdminReferralStats();
        setStats(s);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load referral stats'); }
      finally { setLoading(false); }
    })();
  }, []);

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
        ) : (
          <ARNMOverview stats={stats} />
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
          <div className="form-group">
            <label className="form-label">ROI Mode</label>
            <select className="select" value={roiMode} onChange={(e) => setRoiMode(e.target.value)}>
              <option value="OVERALL">Overall</option><option value="DAY_WISE">Day-wise</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Overall ROI % (per cycle)</label>
            <input className="form-input" type="number" value={overallRoi} onChange={(e) => setOverallRoi(e.target.value)} />
          </div>
          <label className="form-group filter-group">
            <input type="checkbox" checked={roiEnabled} onChange={(e) => setRoiEnabled(e.target.checked)} />
            Enable ROI processing
          </label>
          {roiMode === 'DAY_WISE' && (
            <>
              <div className="form-group">
                <label className="form-label">ROI Days</label>
                <input className="form-input" type="number" value={roiDays} onChange={(e) => {
                  const val = Number(e.target.value);
                  setRoiDays(val);
                  const newSchedule = [];
                  for (let i = 0; i < val; i++) {
                    newSchedule.push(daySchedule[i] || { day: i + 1, percentage: 0 });
                  }
                  setDaySchedule(newSchedule);
                }} min="0" max="365" />
                <p className="form-hint">Number of days in the ROI cycle</p>
              </div>
              {roiDays > 0 && (
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 'var(--space-3)' }}>
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
            </>
          )}

          <div className="filter-group" style={{ marginTop: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-sm" onClick={() => save({ roiMode, overallRoiPercentage: Number(overallRoi), roiProcessingEnabled: roiEnabled, roiDays: Number(roiDays), dayWiseRoiSchedule: daySchedule })} disabled={busy}>Save ROI Settings</button>
            <div className="filter-group" style={{ marginLeft: 'var(--space-2)' }}>
              <input className="form-input" type="date" value={roiDate} onChange={(e) => setRoiDate(e.target.value)} style={{ width: 160, padding: '6px 8px', fontSize: 12 }} title="Leave empty for today" />
              <button className="btn btn-secondary btn-sm" onClick={runRoi} disabled={busy}>Process ROI</button>
            </div>
          </div>
          {proc && <div className="text-muted" style={{ marginTop: 12, fontSize: 13 }}>Processed: {proc.processed}, Skipped: {proc.skipped}</div>}
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
            Percentages are calculated on the actual investment amount (after activation fee deduction). Income is credited only when investment is approved.
          </p>
          <div className="form-group">
            <label className="form-label">Direct Income (Level 1) %</label>
            <input className="form-input" type="number" value={directIncome} onChange={(e) => setDirectIncome(Number(e.target.value))} min="0" max="100" />
            <p className="form-hint">Paid to the investor's direct upline</p>
          </div>
          <div className="form-group">
            <label className="form-label">Level Income (Level 2) %</label>
            <input className="form-input" type="number" value={levelIncome} onChange={(e) => setLevelIncome(Number(e.target.value))} min="0" max="100" />
            <p className="form-hint">Paid to the investor's Level 2 upline (upline's upline)</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => save({ directIncomePercentage: Number(directIncome), levelIncomePercentage: Number(levelIncome) })} disabled={busy}>Save Income Settings</button>
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
