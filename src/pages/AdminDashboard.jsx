import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, LineChart, ArrowDownToLine, ArrowUpFromLine, Receipt,
  Percent, Share2, FileBarChart, Settings, LogOut, Search, Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, {
  getAdminUsers, getAdminStats, getAdminUserDetail, getAdminInvestments,
  getAdminTransactions, getAdminSettings, updateAdminSettings, processRoi,
  getPendingDeposits, approveDeposit, rejectDeposit,
  distributeProfitShare, triggerRoiTransfer, triggerProfitShareTransfer,
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

const CHART_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  { key: 'referrals', label: 'Referral / MLM', icon: Share2, to: '/admin/referrals' },
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

        <div className="page-content slide-up">
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
      <ToastContainer />
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
    { label: 'Total Users', value: stats.totalUsers, color: 'blue' },
    { label: 'Pending Deposits', value: stats.pendingDeposits, color: 'yellow' },
    { label: 'Total Deposited', value: fmt(stats.totalDeposited), color: 'green' },
    { label: 'Total Invested', value: fmt(stats.totalInvested), color: 'purple' },
    { label: 'Active Investments', value: stats.activeInvestments, color: 'teal' },
    { label: 'Total ROI Paid', value: fmt(stats.totalRoiDistributed), color: 'red' },
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
          <div className="chart-card-header"><h3>Signup Trend (6 months)</h3></div>
          <ResponsiveContainerWrap height={240}>
            <AreaChart data={stats.signupTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#d32f2f" fill="#d32f2f" fillOpacity={0.12} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="deposits" fill="#d32f2f" radius={[3, 3, 0, 0]} />
              <Bar dataKey="investments" fill="#b0b6bd" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainerWrap>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><h3>ROI Distributed</h3></div>
          <ResponsiveContainerWrap height={240}>
            <BarChart data={stats.roiDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="roi" fill="#6b7178" radius={[3, 3, 0, 0]} />
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
              <div className="detail-item"><span className="k">Commission Balance</span><span className="v">{fmt(d.financialSummary.commissionBalance)}</span></div>
              <div className="detail-item"><span className="k">Total Deposited</span><span className="v">{fmt(d.financialSummary.totalDeposited)}</span></div>
              <div className="detail-item"><span className="k">Total Invested</span><span className="v">{fmt(d.financialSummary.totalInvested)}</span></div>
              <div className="detail-item"><span className="k">Total ROI</span><span className="v">{fmt(d.financialSummary.totalRoi)}</span></div>
              <div className="detail-item"><span className="k">Total Commission</span><span className="v">{fmt(d.financialSummary.totalCommission)}</span></div>
            </div>
          )}

          {tab === 'deposits' && <SimpleTable rows={d.deposits} cols={[['amount', 'Amount'], ['status', 'Status'], ['createdAt', 'Date']]} />}
          {tab === 'transactions' && <SimpleTable rows={d.transactions} cols={[['type', 'Type'], ['amount', 'Amount'], ['status', 'Status'], ['createdAt', 'Date']]} />}
          {tab === 'investments' && <SimpleTable rows={d.investments} cols={[['plan', 'Plan'], ['originalAmount', 'Amount'], ['status', 'Status'], ['startDate', 'Start']]} />}
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
          <input className="search-input" placeholder="Search user, email, plan..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => load()}>Search</button>
        </div>
      </div>
      {loading ? <Spinner label="Loading investments..." /> : error ? <ErrorBox message={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Plan</th><th>Amount</th><th>ROI %</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} className="table-empty">No investments found</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td data-label="User" className="cell-strong">{r.user?.name}</td>
                  <td data-label="Email">{r.user?.email}</td>
                  <td data-label="Plan">{r.plan}</td>
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
          <table className="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Amount</th><th>Transaction ID</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="table-empty">No deposits found</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td data-label="User" className="cell-strong">{r.user?.name}</td>
                  <td data-label="Email">{r.user?.email}</td>
                  <td data-label="Amount">{fmt(r.amount)}</td>
                  <td data-label="Transaction ID" style={{ fontFamily: 'monospace', fontSize: 12 }}>{r._id}</td>
                  <td data-label="Date">{fmtDateTime(r.createdAt)}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
            <Bar dataKey="roi" fill="#6b7178" radius={[3, 3, 0, 0]} />
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
   REFERRALS
   ========================================================= */
function AdminReferrals() {
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
        if (tab === 'commissions') { const t = await getAdminTransactions({ type: 'COMMISSION' }); setRows(t.transactions || []); }
      } catch (e) { setError(e.response?.data?.message || 'Failed to load referrals'); }
      finally { setLoading(false); }
    })();
  }, [tab]);

  if (loading) return <Spinner label="Loading..." />;
  if (error) return <ErrorBox message={error} />;

  if (tab === 'commissions') {
    return (
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No commission transactions yet</td></tr>}
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
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{stats.totalUsers}</div>
        <div className="stat-label">Total Users</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{fmt(stats.totalCommission)}</div>
        <div className="stat-label">Total Commission Paid</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{fmt(stats.totalDeposited)}</div>
        <div className="stat-label">Total Deposited</div>
      </div>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="deposits" fill="#d32f2f" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainerWrap>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><h3>Investment Trend</h3></div>
          <ResponsiveContainerWrap height={240}>
            <BarChart data={stats.investmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="investments" fill="#b0b6bd" radius={[3, 3, 0, 0]} />
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
  // Plans
  const [plans, setPlans] = useState([]);
  // E-Wallet
  const [ewalletEnabled, setEwalletEnabled] = useState(false);
  const [ewalletUsageEnabled, setEwalletUsageEnabled] = useState(false);
  const [signupBonus, setSignupBonus] = useState(0);
  const [uplineBonus, setUplineBonus] = useState(0);
  // Activation
  const [activationFee, setActivationFee] = useState(0);
  // Income
  const [directIncome, setDirectIncome] = useState(0);
  const [levelIncome, setLevelIncome] = useState(0);
  // ROI Transfer
  const [roiTransferEnabled, setRoiTransferEnabled] = useState(false);
  const [roiTransferDay, setRoiTransferDay] = useState(1);
  // Profit Share
  const [psTransferEnabled, setPsTransferEnabled] = useState(false);
  const [psTransferDay, setPsTransferDay] = useState(15);
  const [psMethod, setPsMethod] = useState('EQUAL');
  const [distAmount, setDistAmount] = useState('');
  const [distBusy, setDistBusy] = useState(false);

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
        setPlans(s.plans || []);
        setEwalletEnabled(s.ewalletEnabled || false);
        setEwalletUsageEnabled(s.ewalletUsageEnabled || false);
        setSignupBonus(s.signupBonusAmount || 0);
        setUplineBonus(s.uplineSignupBonusAmount || 0);
        setActivationFee(s.activationFee || 0);
        setDirectIncome(s.directIncomePercentage || 0);
        setLevelIncome(s.levelIncomePercentage || 0);
        setRoiTransferEnabled(s.roiTransferEnabled || false);
        setRoiTransferDay(s.roiTransferDay || 1);
        setPsTransferEnabled(s.profitShareTransferEnabled || false);
        setPsTransferDay(s.profitShareTransferDay || 15);
        setPsMethod(s.profitShareDistributionMethod || 'EQUAL');
      } catch (e) { setError(e.response?.data?.message || 'Failed to load settings'); }
      finally { setLoading(false); }
    })();
  }, []);

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
      const r = await processRoi(); setProc(r);
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

  const TABS = ['general', 'plans', 'roi', 'platform', 'ewallet', 'activation', 'income', 'roi-transfer', 'profit-share'];

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => navigate(`/admin/settings?tab=${t}`)}
            style={{ textTransform: 'capitalize', fontSize: 12 }}>
            {t === 'ewallet' ? 'E-Wallet' : t === 'roi-transfer' ? 'ROI Transfer' : t === 'profit-share' ? 'Profit Share' : t}
          </button>
        ))}
      </div>

      {/* GENERAL */}
      {tab === 'general' && (
        <div className="panel">
          <h3>General</h3>
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={allowInvest} onChange={(e) => setAllowInvest(e.target.checked)} />
            Allow user self-investment
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => save({ allowUserInvestment: allowInvest })} disabled={busy}>Save General</button>
        </div>
      )}

      {/* PLANS */}
      {tab === 'plans' && (
        <div className="panel">
          <h3>Investment Plans</h3>
          {plans.map((p, i) => (
            <div key={p._id || i} className="detail-grid" style={{ marginBottom: 12 }}>
              <input className="form-input" value={p.name} onChange={(e) => { const n = [...plans]; n[i].name = e.target.value; setPlans(n); }} placeholder="Name" />
              <input className="form-input" type="number" value={p.roiPercentage} onChange={(e) => { const n = [...plans]; n[i].roiPercentage = Number(e.target.value); setPlans(n); }} placeholder="ROI %" />
              <input className="form-input" type="number" value={p.durationDays} onChange={(e) => { const n = [...plans]; n[i].durationDays = Number(e.target.value); setPlans(n); }} placeholder="Duration (days)" />
              <input className="form-input" type="number" value={p.minAmount} onChange={(e) => { const n = [...plans]; n[i].minAmount = Number(e.target.value); setPlans(n); }} placeholder="Min" />
              <input className="form-input" type="number" value={p.maxAmount} onChange={(e) => { const n = [...plans]; n[i].maxAmount = Number(e.target.value); setPlans(n); }} placeholder="Max" />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPlans([...plans, { name: '', roiPercentage: 1, durationDays: 30, minAmount: 100, maxAmount: 100000, active: true }])}>Add Plan</button>
            <button className="btn btn-primary btn-sm" onClick={() => save({ plans })} disabled={busy}>Save Plans</button>
          </div>
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
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={roiEnabled} onChange={(e) => setRoiEnabled(e.target.checked)} />
            Enable ROI processing
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => save({ roiMode, overallRoiPercentage: Number(overallRoi), roiProcessingEnabled: roiEnabled })} disabled={busy}>Save ROI Settings</button>
            <button className="btn btn-secondary btn-sm" onClick={runRoi} disabled={busy}>Process ROI (today)</button>
          </div>
          {proc && <div className="text-muted" style={{ marginTop: 12, fontSize: 13 }}>Processed: {proc.processed}, Skipped: {proc.skipped}</div>}
        </div>
      )}

      {/* PLATFORM */}
      {tab === 'platform' && (
        <div className="panel">
          <h3>Platform</h3>
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={ewalletEnabled} onChange={(e) => setEwalletEnabled(e.target.checked)} />
            E-Wallet enabled
          </label>
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
          <button className="btn btn-primary btn-sm" onClick={() => save({ ewalletEnabled, ewalletUsageEnabled, signupBonusAmount: Number(signupBonus), uplineSignupBonusAmount: Number(uplineBonus) })} disabled={busy}>Save E-Wallet Settings</button>
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
            Configure when users can transfer ROI balance to their Main Wallet. Users can only transfer on the configured day of each month.
          </p>
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={roiTransferEnabled} onChange={(e) => setRoiTransferEnabled(e.target.checked)} />
            Enable ROI Transfer
          </label>
          <div className="form-group">
            <label className="form-label">Transfer Day (1-31)</label>
            <input className="form-input" type="number" value={roiTransferDay} onChange={(e) => setRoiTransferDay(Number(e.target.value))} min="1" max="31" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => save({ roiTransferEnabled, roiTransferDay: Number(roiTransferDay) })} disabled={busy}>Save ROI Transfer Settings</button>
            <button className="btn btn-secondary btn-sm" onClick={handleRoiTransfer} disabled={busy}>Trigger ROI Transfer Now</button>
          </div>
        </div>
      )}

      {/* PROFIT SHARE */}
      {tab === 'profit-share' && (
        <div className="panel">
          <h3>Profit Share Settings</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Platform revenue distributed to users manually by admin. Goes to Profit Share Wallet. Users can transfer to Main Wallet on the configured day.
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
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="form-input" type="number" value={distAmount} onChange={(e) => setDistAmount(e.target.value)} min="0" placeholder="0.00" />
              <button className="btn btn-primary btn-sm" onClick={handleDistribute} disabled={distBusy}>
                {distBusy ? 'Distributing...' : 'Distribute Now'}
              </button>
            </div>
          </div>
          <hr style={{ margin: 'var(--space-3) 0' }} />
          <h4 style={{ marginBottom: 'var(--space-2)' }}>User Transfer Settings</h4>
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={psTransferEnabled} onChange={(e) => setPsTransferEnabled(e.target.checked)} />
            Enable Profit Share Transfer
          </label>
          <div className="form-group">
            <label className="form-label">Transfer Day (1-31)</label>
            <input className="form-input" type="number" value={psTransferDay} onChange={(e) => setPsTransferDay(Number(e.target.value))} min="1" max="31" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => save({ profitShareDistributionMethod: psMethod, profitShareTransferEnabled: psTransferEnabled, profitShareTransferDay: Number(psTransferDay) })} disabled={busy}>Save Profit Share Settings</button>
            <button className="btn btn-secondary btn-sm" onClick={handlePsTransfer} disabled={busy}>Trigger Transfer Now</button>
          </div>
        </div>
      )}
    </div>
  );
}
