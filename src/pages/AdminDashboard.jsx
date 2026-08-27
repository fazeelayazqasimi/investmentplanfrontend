import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, LineChart, ArrowDownToLine, ArrowUpFromLine, Receipt,
  Percent, Share2, FileBarChart, Settings, LogOut, Loader2, AlertCircle,
  Search, X, Check, Eye, TrendingUp, Wallet, ArrowLeftRight, UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, {
  getAdminUsers, getAdminStats, getAdminUserDetail, getAdminInvestments,
  getAdminTransactions, getAdminSettings, updateAdminSettings, processRoi,
  getPendingDeposits, approveDeposit, rejectDeposit,
} from '../services/apiClient';

const CHART_COLORS = ['#d32f2f', '#b0b6bd', '#6b7178', '#8a9099', '#c9ced3', '#e3e6ea'];

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');

/* ---------- Shared UI helpers ---------- */
function Spinner({ label }) {
  return <div className="center-spinner"><Loader2 size={20} className="spin" /> {label}</div>;
}
function ErrorBox({ msg }) {
  return <div className="error-box"><AlertCircle size={18} /> {msg}</div>;
}
function EmptyState({ title, sub }) {
  return (
    <div className="empty-state">
      <AlertCircle size={28} />
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
    </div>
  );
}
function Modal({ title, children, footer, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          <button className="btn-ghost btn-sm" onClick={onClose} style={{ border: 'none' }}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
function statusBadge(status) {
  const map = {
    ACTIVE: 'badge-success', COMPLETED: 'badge-success', PENDING: 'badge-warning',
    REJECTED: 'badge-danger', CANCELLED: 'badge-danger', SUSPENDED: 'badge-warning',
    INACTIVE: 'badge-muted', FAILED: 'badge-danger', REVERSED: 'badge-muted',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
}

/* ---------- Sidebar structure ---------- */
const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/admin/overview' },
  {
    key: 'users', label: 'Users', icon: Users, to: '/admin/users', children: [
      { label: 'All Users', to: '/admin/users' },
      { label: 'Active Users', to: '/admin/users?status=ACTIVE' },
      { label: 'Suspended Users', to: '/admin/users?status=SUSPENDED' },
    ],
  },
  {
    key: 'investments', label: 'Investments', icon: LineChart, to: '/admin/investments', children: [
      { label: 'All Investments', to: '/admin/investments' },
      { label: 'Active', to: '/admin/investments?status=ACTIVE' },
      { label: 'Completed', to: '/admin/investments?status=COMPLETED' },
    ],
  },
  {
    key: 'deposits', label: 'Deposits', icon: ArrowDownToLine, to: '/admin/deposits?status=PENDING', children: [
      { label: 'Pending', to: '/admin/deposits?status=PENDING' },
      { label: 'Approved', to: '/admin/deposits?status=COMPLETED' },
      { label: 'Rejected', to: '/admin/deposits?status=REJECTED' },
    ],
  },
  {
    key: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine, to: '/admin/withdrawals', children: [
      { label: 'Pending', to: '/admin/withdrawals?status=PENDING' },
      { label: 'Approved', to: '/admin/withdrawals?status=COMPLETED' },
      { label: 'Rejected', to: '/admin/withdrawals?status=REJECTED' },
    ],
  },
  {
    key: 'transactions', label: 'Transactions', icon: Receipt, to: '/admin/transactions', children: [
      { label: 'All', to: '/admin/transactions' },
      { label: 'Deposits', to: '/admin/transactions?type=DEPOSIT' },
      { label: 'Investments', to: '/admin/transactions?type=INVESTMENT' },
      { label: 'ROI', to: '/admin/transactions?type=ROI' },
      { label: 'Commissions', to: '/admin/transactions?type=COMMISSION' },
    ],
  },
  {
    key: 'roi', label: 'ROI Management', icon: Percent, to: '/admin/roi', children: [
      { label: 'ROI Overview', to: '/admin/roi' },
      { label: 'ROI History', to: '/admin/roi?tab=history' },
      { label: 'ROI Settings', to: '/admin/settings?tab=roi' },
    ],
  },
  {
    key: 'referrals', label: 'Referral / MLM', icon: Share2, to: '/admin/referrals', children: [
      { label: 'Referral Overview', to: '/admin/referrals' },
      { label: 'Commissions', to: '/admin/referrals?tab=commissions' },
    ],
  },
  { key: 'reports', label: 'Reports', icon: FileBarChart, to: '/admin/reports' },
  {
    key: 'settings', label: 'Settings', icon: Settings, to: '/admin/settings?tab=general', children: [
      { label: 'General', to: '/admin/settings?tab=general' },
      { label: 'Investment Plans', to: '/admin/settings?tab=plans' },
      { label: 'ROI Settings', to: '/admin/settings?tab=roi' },
      { label: 'Platform', to: '/admin/settings?tab=platform' },
    ],
  },
];

/* =========================================================
   SHELL
   ========================================================= */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.split('/')[2] || 'overview';
  const current = `${location.pathname}${location.search}`;

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-nav">
        <div className="nav-header"><LayoutDashboard size={22} className="nav-icon" /> <span>Admin Panel</span></div>
        <ul>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <li key={item.key}>
                <Link to={item.to} className={active ? 'active' : ''}><Icon size={18} /> {item.label}</Link>
                {active && item.children && (
                  <ul style={{ margin: '2px 0 6px', paddingLeft: 30 }}>
                    {item.children.map((c) => (
                      <li key={c.to}>
                        <Link to={c.to} className={current === c.to ? 'active' : ''}
                          style={{ fontSize: 13, padding: '7px 10px' }}>{c.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          <li><button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Logout</button></li>
        </ul>
        <div className="nav-footer">
          <div className="nav-avatar">{user?.name?.charAt(0) || 'A'}</div>
          <div>
            <div className="nav-name">{user?.name}</div>
            <div className="nav-role">Administrator</div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="page-header">
          <div>
            <h1>{NAV.find((n) => n.key === page)?.label || 'Dashboard'}</h1>
            <p className="page-subtitle">Platform management &amp; controls</p>
          </div>
        </header>

        {page === 'overview' && <AdminOverview />}
        {page === 'users' && <AdminUsers />}
        {page === 'investments' && <AdminInvestments />}
        {page === 'deposits' && <AdminDeposits />}
        {page === 'withdrawals' && <AdminWithdrawals />}
        {page === 'transactions' && <AdminTransactions />}
        {page === 'roi' && <AdminRoi />}
        {page === 'referrals' && <AdminReferrals />}
        {page === 'reports' && <AdminReports />}
        {page === 'settings' && <AdminSettings />}
      </main>
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
  if (error) return <ErrorBox msg={error} />;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Pending Deposits', value: stats.pendingDeposits },
    { label: 'Total Deposited', value: fmt(stats.totalDeposited) },
    { label: 'Total Invested', value: fmt(stats.totalInvested) },
    { label: 'Active Investments', value: stats.activeInvestments },
    { label: 'Total ROI Paid', value: fmt(stats.totalRoiDistributed) },
  ];

  return (
    <div>
      <div className="stats-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Signup Trend (6 months)</h3>
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
          <h3>Users vs Admins</h3>
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
          <h3>Deposit vs Investment Trend</h3>
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
          <h3>ROI Distributed</h3>
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
                  <td className="cell-strong">{d.user?.name}</td>
                  <td>{fmt(d.amount)}</td>
                  <td>{fmtDateTime(d.createdAt)}</td>
                  <td>{statusBadge(d.status)}</td>
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

  const openDetail = async (id) => {
    setDetailLoading(true); setDetail(null);
    try { const d = await getAdminUserDetail(id); setDetail(d); }
    catch (e) { setError(e.response?.data?.message || 'Failed to load user'); }
    finally { setDetailLoading(false); }
  };

  return (
    <div>
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

      {loading ? <Spinner label="Loading users..." /> : error ? <ErrorBox msg={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Main Bal</th><th>Total Dep.</th><th>Total Inv.</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={10} className="table-empty">No users found</td></tr>}
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="cell-strong">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role === 'ADMIN' ? <span className="badge badge-info">Admin</span> : <span className="badge badge-muted">User</span>}</td>
                  <td>{statusBadge(u.accountStatus)}</td>
                  <td>{fmt(u.mainBalance)}</td>
                  <td>{fmt(u.totalDeposited)}</td>
                  <td>{fmt(u.totalInvested)}</td>
                  <td>{fmtDate(u.createdAt)}</td>
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
                <td key={c[0]}>
                  {c[0] === 'amount' || c[0] === 'roiAmount' || c[0] === 'originalAmount' ? fmt(r[c[0]])
                    : (c[0] === 'createdAt' || c[0] === 'startDate' || c[0] === 'roiDate' || c[0] === 'endDate') ? fmtDateTime(r[c[0]])
                      : (c[0] === 'status' ? statusBadge(r[c[0]]) : (r[c[0]] ?? '-'))}
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
      {loading ? <Spinner label="Loading investments..." /> : error ? <ErrorBox msg={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Plan</th><th>Amount</th><th>ROI %</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} className="table-empty">No investments found</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="cell-strong">{r.user?.name}</td>
                  <td>{r.user?.email}</td>
                  <td>{r.plan}</td>
                  <td>{fmt(r.originalAmount)}</td>
                  <td>{r.roiPercentage}%</td>
                  <td>{fmtDate(r.startDate)}</td>
                  <td>{fmtDate(r.endDate)}</td>
                  <td>{statusBadge(r.status)}</td>
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
function AdminDeposits() {
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
    } catch (e) { setError(e.response?.data?.message || 'Action failed'); }
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
      {loading ? <Spinner label="Loading deposits..." /> : error ? <ErrorBox msg={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Amount</th><th>Transaction ID</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="table-empty">No deposits found</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="cell-strong">{r.user?.name}</td>
                  <td>{r.user?.email}</td>
                  <td>{fmt(r.amount)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r._id}</td>
                  <td>{fmtDateTime(r.createdAt)}</td>
                  <td>{statusBadge(r.status)}</td>
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
        <Modal title={`Confirm Deposit ${action === 'approve' ? 'Approval' : 'Rejection'}`}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(null)} disabled={busy}>Cancel</button>
              <button className={`btn ${action === 'approve' ? 'btn-primary' : 'btn-danger'} btn-sm`} onClick={doAction} disabled={busy}>
                {busy ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </>
          } onClose={() => setConfirm(null)}>
          <p>Are you sure you want to <b>{action === 'approve' ? 'approve' : 'reject'}</b> this deposit?</p>
          <div className="modal-amount">{fmt(confirm.amount)}</div>
          <p style={{ marginTop: 8 }}>{confirm.user?.name} ({confirm.user?.email})</p>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   WITHDRAWALS (not implemented backend)
   ========================================================= */
function AdminWithdrawals() {
  return <EmptyState title="Withdrawals not enabled" sub="The withdrawal feature is not available on this platform yet." />;
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
      {loading ? <Spinner label="Loading transactions..." /> : error ? <ErrorBox msg={error} /> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="table-empty">No transactions found</td></tr>}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="cell-strong">{r.user?.name}</td>
                  <td>{r.type}</td>
                  <td>{fmt(r.amount)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{fmtDateTime(r.createdAt)}</td>
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
function AdminRoi() {
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
  if (error) return <ErrorBox msg={error} />;

  if (tab === 'history') {
    return (
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No ROI distributions yet</td></tr>}
            {rows.map((r) => (
              <tr key={r._id}><td className="cell-strong">{r.user?.name}</td><td>{fmt(r.amount)}</td><td>{statusBadge(r.status)}</td><td>{fmtDateTime(r.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total ROI Distributed</div><div className="value">{fmt(stats.totalRoiDistributed)}</div></div>
        <div className="summary-card"><div className="label">Active Investments</div><div className="value">{stats.activeInvestments}</div></div>
        <div className="summary-card"><div className="label">Total Invested</div><div className="value">{fmt(stats.totalInvested)}</div></div>
      </div>
      <div className="chart-card">
        <h3>ROI Distribution (6 months)</h3>
        <ResponsiveContainerWrap height={240}>
          <BarChart data={stats.roiDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
            <Bar dataKey="roi" fill="#6b7178" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainerWrap>
      </div>
      <p className="text-muted" style={{ marginTop: 16, fontSize: 13 }}>
        Configure ROI in <Link to="/admin/settings?tab=roi">ROI Settings</Link>. Use the “Process ROI” action there to credit ROI for today.
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
  if (error) return <ErrorBox msg={error} />;

  if (tab === 'commissions') {
    return (
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No commission transactions yet</td></tr>}
            {rows.map((r) => (
              <tr key={r._id}><td className="cell-strong">{r.user?.name}</td><td>{fmt(r.amount)}</td><td>{statusBadge(r.status)}</td><td>{fmtDateTime(r.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="summary-grid">
      <div className="summary-card"><div className="label">Total Users</div><div className="value">{stats.totalUsers}</div></div>
      <div className="summary-card"><div className="label">Total Commission Paid</div><div className="value">{fmt(stats.totalCommission)}</div></div>
      <div className="summary-card"><div className="label">Total Deposited</div><div className="value">{fmt(stats.totalDeposited)}</div></div>
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
  if (error) return <ErrorBox msg={error} />;
  const cards = [
    { label: 'User Reports', value: stats.totalUsers },
    { label: 'Investment Reports', value: stats.totalInvestments },
    { label: 'Deposit Reports', value: fmt(stats.totalDeposited) },
    { label: 'Earnings Reports', value: fmt(stats.totalRoiDistributed + stats.totalCommission) },
  ];
  return (
    <div>
      <div className="stats-grid">
        {cards.map((c) => <div className="stat-card" key={c.label}><div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div></div>)}
      </div>
      <div className="charts-grid">
        <div className="chart-card"><h3>Deposit Trend</h3>
          <ResponsiveContainerWrap height={240}><BarChart data={stats.depositTrend}><CartesianGrid strokeDasharray="3 3" stroke="#eceef1" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="deposits" fill="#d32f2f" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainerWrap>
        </div>
        <div className="chart-card"><h3>Investment Trend</h3>
          <ResponsiveContainerWrap height={240}><BarChart data={stats.investmentTrend}><CartesianGrid strokeDasharray="3 3" stroke="#eceef1" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="investments" fill="#b0b6bd" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainerWrap>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */
function AdminSettings() {
  const navigate = useNavigate();
  const q = new URLSearchParams(useLocation().search);
  const tab = q.get('tab') || 'general';
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [roiMode, setRoiMode] = useState('OVERALL');
  const [overallRoi, setOverallRoi] = useState(0);
  const [roiEnabled, setRoiEnabled] = useState(false);
  const [allowInvest, setAllowInvest] = useState(false);
  const [plans, setPlans] = useState([]);
  const [proc, setProc] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await getAdminSettings(); setSettings(d.settings);
        setRoiMode(d.settings.roiMode); setOverallRoi(d.settings.overallRoiPercentage || 0);
        setRoiEnabled(d.settings.roiProcessingEnabled); setAllowInvest(d.settings.allowUserInvestment);
        setPlans(d.settings.plans || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load settings'); }
      finally { setLoading(false); }
    })();
  }, []);

  const saveRoi = async () => {
    setBusy(true); setMsg('');
    try {
      await updateAdminSettings({ roiMode, overallRoiPercentage: Number(overallRoi), roiProcessingEnabled: roiEnabled, allowUserInvestment: allowInvest });
      setMsg('Settings saved');
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const savePlans = async () => {
    setBusy(true); setMsg('');
    try { await updateAdminSettings({ plans }); setMsg('Plans saved'); }
    catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const runRoi = async () => {
    setBusy(true);
    try { const r = await processRoi(); setProc(r); }
    catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading settings..." />;
  if (error) return <ErrorBox msg={error} />;

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        {['general', 'plans', 'roi', 'platform'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => navigate(`/admin/settings?tab=${t}`)} style={{ textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      {msg && <div className="badge badge-success" style={{ marginBottom: 12 }}>{msg}</div>}

      {tab === 'general' && (
        <div className="panel">
          <h3>General</h3>
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={allowInvest} onChange={(e) => setAllowInvest(e.target.checked)} />
            Allow user self-investment
          </label>
          <button className="btn btn-primary btn-sm" onClick={saveRoi} disabled={busy}>Save General</button>
        </div>
      )}

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
            <button className="btn btn-primary btn-sm" onClick={saveRoi} disabled={busy}>Save ROI Settings</button>
            <button className="btn btn-secondary btn-sm" onClick={runRoi} disabled={busy}>Process ROI (today)</button>
          </div>
          {proc && <div className="text-muted" style={{ marginTop: 12, fontSize: 13 }}>Processed: {proc.processed}, Skipped: {proc.skipped}</div>}
        </div>
      )}

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
            <button className="btn btn-primary btn-sm" onClick={savePlans} disabled={busy}>Save Plans</button>
          </div>
        </div>
      )}

      {tab === 'platform' && (
        <div className="panel">
          <h3>Platform</h3>
          <label className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={allowInvest} onChange={(e) => setAllowInvest(e.target.checked)} />
            Maintenance mode (disables self-investment)
          </label>
          <button className="btn btn-primary btn-sm" onClick={saveRoi} disabled={busy}>Save Platform</button>
        </div>
      )}
    </div>
  );
}

/* ---------- recharts wrapper (avoid per-file imports duplication) ---------- */
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
function ResponsiveContainerWrap({ height, children }) {
  return <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>;
}
