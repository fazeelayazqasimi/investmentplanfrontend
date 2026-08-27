import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, Wallet as WalletIcon, Receipt, Percent, Share2, User as UserIcon,
  LogOut, Loader2, AlertCircle, TrendingUp, ArrowDownToLine, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, {
  getMyInvestments, getMyWallet, getMyTransactions, requestDeposit, getPlans,
  getMyRoiHistory, getMyDownlines, getMyProfile, updateMyProfile,
} from '../services/apiClient';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';

const CHART_COLORS = ['#d32f2f', '#b0b6bd', '#6b7178', '#8a9099', '#c9ced3', '#e3e6ea'];
const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');

function Spinner({ label }) { return <div className="center-spinner"><Loader2 size={20} className="spin" /> {label}</div>; }
function ErrorBox({ msg }) { return <div className="error-box"><AlertCircle size={18} /> {msg}</div>; }
function EmptyState({ title, sub }) { return <div className="empty-state"><AlertCircle size={28} /><h3>{title}</h3>{sub && <p>{sub}</p>}</div>; }
function Modal({ title, children, footer, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          <button className="btn-ghost btn-sm" onClick={onClose} style={{ border: 'none' }}><AlertCircle size={0} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
function statusBadge(status) {
  const map = { ACTIVE: 'badge-success', COMPLETED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger', CANCELLED: 'badge-danger', SUSPENDED: 'badge-warning', INACTIVE: 'badge-muted', FAILED: 'badge-danger' };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
}

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    key: 'investments', label: 'My Investments', icon: LineChart, to: '/dashboard/investments', children: [
      { label: 'Active', to: '/dashboard/investments?status=ACTIVE' },
      { label: 'History', to: '/dashboard/investments?status=COMPLETED' },
    ],
  },
  {
    key: 'wallet', label: 'Wallet', icon: WalletIcon, to: '/dashboard/wallet', children: [
      { label: 'Overview', to: '/dashboard/wallet' },
      { label: 'Deposit', to: '/dashboard/wallet?tab=deposit' },
      { label: 'Withdraw', to: '/dashboard/wallet?tab=withdraw' },
    ],
  },
  { key: 'transactions', label: 'Transactions', icon: Receipt, to: '/dashboard/transactions' },
  { key: 'roi', label: 'ROI', icon: Percent, to: '/dashboard/roi' },
  {
    key: 'referrals', label: 'Referrals', icon: Share2, to: '/dashboard/referrals', children: [
      { label: 'My Referrals', to: '/dashboard/referrals' },
      { label: 'Commissions', to: '/dashboard/referrals?tab=commissions' },
    ],
  },
  { key: 'profile', label: 'Profile', icon: UserIcon, to: '/dashboard/profile' },
];

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname.split('/')[2] || 'dashboard';
  const current = `${location.pathname}${location.search}`;

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  // Admins should never be here
  if (user?.role === 'ADMIN') return <Modal title="Redirecting" onClose={() => {}}>Admin accounts use the admin panel.</Modal>;

  return (
    <div className="dashboard-container">
      <aside className="dashboard-nav">
        <div className="nav-header"><WalletIcon size={22} className="nav-icon" /> <span>My Account</span></div>
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
                      <li key={c.to}><Link to={c.to} className={current === c.to ? 'active' : ''} style={{ fontSize: 13, padding: '7px 10px' }}>{c.label}</Link></li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          <li><button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Logout</button></li>
        </ul>
        <div className="nav-footer">
          <div className="nav-avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <div className="nav-name">{user?.name}</div>
            <div className="nav-role">Member</div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="page-header">
          <div>
            <h1>{NAV.find((n) => n.key === page)?.label || 'Dashboard'}</h1>
            <p className="page-subtitle">Welcome back, {user?.name}</p>
          </div>
        </header>

        {page === 'dashboard' && <UserOverview />}
        {page === 'investments' && <UserInvestments />}
        {page === 'wallet' && <UserWallet />}
        {page === 'transactions' && <UserTransactions />}
        {page === 'roi' && <UserRoi />}
        {page === 'referrals' && <UserReferrals />}
        {page === 'profile' && <UserProfile />}
      </main>
    </div>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */
function UserOverview() {
  const [wallet, setWallet] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const [w, i] = await Promise.all([getMyWallet(), getMyInvestments({ status: 'ACTIVE' })]);
        setWallet(w.wallet); setInvestments(i.investments || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <Spinner label="Loading..." />;
  if (error) return <ErrorBox msg={error} />;

  const summary = [
    { label: 'Main Balance', value: fmt(wallet?.mainBalance) },
    { label: 'ROI Balance', value: fmt(wallet?.roiBalance) },
    { label: 'Commission', value: fmt(wallet?.commissionBalance) },
    { label: 'Total Earnings', value: fmt(wallet?.totalEarnings) },
  ];
  const pie = [
    { name: 'Main', value: wallet?.mainBalance || 0 },
    { name: 'ROI', value: wallet?.roiBalance || 0 },
    { name: 'Commission', value: wallet?.commissionBalance || 0 },
  ];

  return (
    <div>
      <div className="summary-grid">
        {summary.map((s) => <div className="summary-card" key={s.label}><div className="label">{s.label}</div><div className="value">{s.value}</div></div>)}
      </div>
      <div className="user-charts">
        <div className="chart-card">
          <h3>Wallet Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {pie.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">{pie.map((p, i) => <span key={p.name}><i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} /> {p.name}: {fmt(p.value)}</span>)}</div>
        </div>
        <div className="chart-card">
          <h3>Active Investments</h3>
          {investments.length === 0 ? <EmptyState title="No active investments" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={investments.map((iv) => ({ name: iv.plan, amount: iv.originalAmount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                <Bar dataKey="amount" fill="#d32f2f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INVESTMENTS (plan selection + my investments)
   ========================================================= */
function UserInvestments() {
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const status = q.get('status') || '';
  const [plans, setPlans] = useState([]);
  const [mine, setMine] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invest, setInvest] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, m, w] = await Promise.all([getPlans(), getMyInvestments(status ? { status } : {}), getMyWallet()]);
      setPlans(p.plans || []); setMine(m.investments || []); setWallet(w.wallet);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const submitInvest = async () => {
    setBusy(true); setFormError('');
    const amt = Number(amount);
    if (!invest || !amt || amt <= 0) { setFormError('Enter a valid amount'); setBusy(false); return; }
    if (amt < invest.minAmount || amt > invest.maxAmount) { setFormError(`Amount must be between ${fmt(invest.minAmount)} and ${fmt(invest.maxAmount)}`); setBusy(false); return; }
    if (amt > (wallet?.mainBalance || 0)) { setFormError('Insufficient main balance'); setBusy(false); return; }
    try {
      await apiClient.post('/investments', { amount: amt, planId: invest._id, plan: invest.name });
      setInvest(null); setAmount(''); await load();
    } catch (e) { setFormError(e.response?.data?.message || 'Investment failed'); }
    finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading investments..." />;
  if (error) return <ErrorBox msg={error} />;

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Available Plans</h3>
      {plans.length === 0 ? <EmptyState title="No plans available" sub="Admin has not published any investment plans yet." /> : (
        <div className="investments-list">
          {plans.map((p) => (
            <div className="investment-card" key={p._id}>
              <div className="investment-header"><h3>{p.name}</h3><span className="badge badge-info">{p.roiPercentage}% ROI</span></div>
              <div className="investment-details">
                <div className="detail-row">
                  <span>Duration: {p.durationDays} days</span>
                  <span>Range: {fmt(p.minAmount)} – {fmt(p.maxAmount)}</span>
                </div>
                <span>{p.description}</span>
              </div>
              <div className="investment-actions">
                <button className="btn btn-primary btn-sm" onClick={() => { setInvest(p); setAmount(p.minAmount); }}>Invest</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ margin: '24px 0 12px' }}>My Investments</h3>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Plan</th><th>Amount</th><th>ROI %</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
          <tbody>
            {mine.length === 0 && <tr><td colSpan={6} className="table-empty">No investments found</td></tr>}
            {mine.map((iv) => (
              <tr key={iv._id}>
                <td className="cell-strong">{iv.plan}</td>
                <td>{fmt(iv.originalAmount)}</td>
                <td>{iv.roiPercentage}%</td>
                <td>{fmtDate(iv.startDate)}</td>
                <td>{fmtDate(iv.endDate)}</td>
                <td>{statusBadge(iv.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invest && (
        <Modal title={`Invest — ${invest.name}`}
          footer={<>
            <button className="btn btn-secondary btn-sm" onClick={() => setInvest(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={submitInvest} disabled={busy}>Confirm Investment</button>
          </>}
          onClose={() => setInvest(null)}>
          <p>Available main balance: <b>{fmt(wallet?.mainBalance)}</b></p>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Investment Amount</label>
            <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <span className="text-muted" style={{ fontSize: 12 }}>Allowed: {fmt(invest.minAmount)} – {fmt(invest.maxAmount)}</span>
          </div>
          {formError && <div className="auth-error">{formError}</div>}
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   WALLET
   ========================================================= */
function UserWallet() {
  const q = new URLSearchParams(useLocation().search);
  const tab = q.get('tab') || 'overview';
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try { const [w, t] = await Promise.all([getMyWallet(), getMyTransactions({ type: 'DEPOSIT' })]); setWallet(w.wallet); setTxns(t.transactions || []); }
    catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const submitDeposit = async (e) => {
    e.preventDefault(); setBusy(true); setFormError(''); setSuccess('');
    const amt = Number(amount);
    if (!amt || amt <= 0) { setFormError('Enter a valid amount'); setBusy(false); return; }
    try { await requestDeposit(amt, desc); setSuccess('Deposit request submitted. Awaiting admin approval.'); setAmount(''); setDesc(''); await load(); }
    catch (er) { setFormError(er.response?.data?.message || 'Deposit failed'); }
    finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading wallet..." />;
  if (error) return <ErrorBox msg={error} />;

  return (
    <div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Main Balance</div><div className="value">{fmt(wallet?.mainBalance)}</div></div>
        <div className="summary-card"><div className="label">ROI Balance</div><div className="value">{fmt(wallet?.roiBalance)}</div></div>
        <div className="summary-card"><div className="label">Commission Balance</div><div className="value">{fmt(wallet?.commissionBalance)}</div></div>
      </div>

      {tab === 'deposit' && (
        <div className="deposit-form">
          <h3>Request Deposit</h3>
          <form onSubmit={submitDeposit}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Details / Reference</label>
              <input className="form-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            {success && <div className="badge badge-success" style={{ marginBottom: 8 }}>{success}</div>}
            <button className="btn btn-primary btn-block" disabled={busy}>Submit Deposit</button>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>Balance updates only after admin approval.</p>
          </form>
        </div>
      )}

      {tab === 'withdraw' && <EmptyState title="Withdrawals not enabled" sub="Withdrawal requests are not supported on this platform yet." />}

      <h3 style={{ margin: '24px 0 12px' }}>Recent Deposits</h3>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {txns.length === 0 && <tr><td colSpan={3} className="table-empty">No deposits yet</td></tr>}
            {txns.map((t) => (
              <tr key={t._id}><td>{fmt(t.amount)}</td><td>{statusBadge(t.status)}</td><td>{fmtDateTime(t.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
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
    (async () => { try { const t = await getMyTransactions(); setRows(t.transactions || []); } catch (e) { setError(e.response?.data?.message || 'Failed'); } finally { setLoading(false); } })();
  }, []);
  if (loading) return <Spinner label="Loading transactions..." />;
  if (error) return <ErrorBox msg={error} />;
  return (
    <div className="table-card">
      <table className="data-table">
        <thead><tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No transactions found</td></tr>}
          {rows.map((t) => (
            <tr key={t._id}><td>{t.type}</td><td>{fmt(t.amount)}</td><td>{statusBadge(t.status)}</td><td>{fmtDateTime(t.createdAt)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   ROI
   ========================================================= */
function UserRoi() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => { try { const r = await getMyRoiHistory(); setRows(r.history || []); } catch (e) { setError(e.response?.data?.message || 'Failed'); } finally { setLoading(false); } })();
  }, []);
  if (loading) return <Spinner label="Loading ROI history..." />;
  if (error) return <ErrorBox msg={error} />;
  return (
    <div className="table-card">
      <table className="data-table">
        <thead><tr><th>ROI %</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="table-empty">No ROI credited yet</td></tr>}
          {rows.map((r) => (
            <tr key={r._id}><td>{r.roiPercentage}%</td><td>{fmt(r.roiAmount)}</td><td>{statusBadge(r.status)}</td><td>{fmtDate(r.roiDate)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   REFERRALS
   ========================================================= */
function UserReferrals() {
  const q = new URLSearchParams(useLocation().search);
  const tab = q.get('tab') || 'overview';
  const [downlines, setDownlines] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const [d, p] = await Promise.all([getMyDownlines(), getMyProfile()]);
        setDownlines(d.downlines || []);
        setProfile(p);
        if (tab === 'commissions') { const c = await getMyTransactions({ type: 'COMMISSION' }); setCommissions(c.transactions || []); }
      } catch (e) { setError(e.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, [tab]);
  if (loading) return <Spinner label="Loading referrals..." />;
  if (error) return <ErrorBox msg={error} />;

  if (tab === 'commissions') {
    return (
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {commissions.length === 0 && <tr><td colSpan={3} className="table-empty">No commission earnings yet</td></tr>}
            {commissions.map((c) => <tr key={c._id}><td>{fmt(c.amount)}</td><td>{statusBadge(c.status)}</td><td>{fmtDateTime(c.createdAt)}</td></tr>)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="panel">
        <h3>Your Referral Link</h3>
        <div className="form-group">
          <input className="form-input" readOnly value={profile?.referralLink || ''} onFocus={(e) => e.target.select()} />
        </div>
        <div className="detail-item"><span className="k">Your Referral Code</span><span className="v">{profile?.user?.referralCode}</span></div>
      </div>
      <h3 style={{ margin: '24px 0 12px' }}>My Referrals ({downlines.length})</h3>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            {downlines.length === 0 && <tr><td colSpan={4} className="table-empty">No referrals yet</td></tr>}
            {downlines.map((d) => (
              <tr key={d._id}><td className="cell-strong">{d.name}</td><td>{d.email}</td><td>{statusBadge(d.accountStatus)}</td><td>{fmtDate(d.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE
   ========================================================= */
function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try { const p = await getMyProfile(); setProfile(p); setName(p.user.name); setPhone(p.user.phone); }
    catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    try { await updateMyProfile({ name, phone }); setMsg('Profile updated'); setEdit(false); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed'); }
  };

  if (loading) return <Spinner label="Loading profile..." />;
  if (error) return <ErrorBox msg={error} />;
  const u = profile.user;

  return (
    <div className="panel" style={{ maxWidth: 520 }}>
      <h3>Profile</h3>
      {msg && <div className="badge badge-success" style={{ marginBottom: 12 }}>{msg}</div>}
      {!edit ? (
        <div className="detail-grid">
          <div className="detail-item"><span className="k">Name</span><span className="v">{u.name}</span></div>
          <div className="detail-item"><span className="k">Email</span><span className="v">{u.email}</span></div>
          <div className="detail-item"><span className="k">Phone</span><span className="v">{u.phone}</span></div>
          <div className="detail-item"><span className="k">Status</span><span className="v">{u.accountStatus}</span></div>
          <div className="detail-item"><span className="k">Referral Code</span><span className="v">{u.referralCode}</span></div>
        </div>
      ) : (
        <div>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEdit(false)}>Cancel</button>
          </div>
        </div>
      )}
      {!edit && <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => setEdit(true)}>Edit Profile</button>}
    </div>
  );
}
