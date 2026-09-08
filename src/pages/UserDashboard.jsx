import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, Wallet as WalletIcon, Receipt, Percent, Share2, User as UserIcon,
  LogOut, Loader2, AlertCircle, TrendingUp, ArrowDownToLine, Menu, X, Copy, CheckCircle,
  BarChart3, CreditCard, Users, ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, {
  getMyInvestments, getMyWallet, getMyTransactions, requestDeposit, getPlans,
  getMyRoiHistory, getMyDownlines, getMyProfile, updateMyProfile,
  transferRoiToMain, transferProfitShareToMain, getUserConfig, activateAccount,
  transferFundToUser,
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

const CHART_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { key: 'investments', label: 'My Investments', icon: LineChart, to: '/dashboard/investments' },
  { key: 'wallet', label: 'Wallet', icon: WalletIcon, to: '/dashboard/wallet' },
  { key: 'transactions', label: 'Transactions', icon: Receipt, to: '/dashboard/transactions' },
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

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
          <div className="sidebar-logo"><WalletIcon size={20} /></div>
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
          {page === 'dashboard' && <UserOverview toastSuccess={success} toastError={toastError} />}
          {page === 'investments' && <UserInvestments toastSuccess={success} toastError={toastError} />}
          {page === 'wallet' && <UserWallet toastSuccess={success} toastError={toastError} />}
          {page === 'transactions' && <UserTransactions />}
          {page === 'roi' && <UserRoi />}
          {page === 'referrals' && <UserReferrals />}
          {page === 'profile' && <UserProfile toastSuccess={success} toastError={toastError} />}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */
function UserOverview({ toastSuccess, toastError }) {
  const [wallet, setWallet] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [w, i, p] = await Promise.all([getMyWallet(), getMyInvestments({ status: 'ACTIVE' }), getMyProfile()]);
        setWallet(w.wallet);
        setInvestments(i.investments || []);
        setProfile(p);
        try { const s = await getUserConfig(); setSettings(s); } catch (_) {}
      } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await activateAccount();
      if (res.alreadyActivated) {
        toastSuccess('Already Activated', 'Your account is already activated');
      } else {
        toastSuccess('Account Activated', 'Your account has been activated successfully!');
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
    { label: 'Main Wallet', value: fmt(wallet?.mainBalance), color: 'blue', icon: CreditCard },
    { label: 'E-Wallet', value: fmt(wallet?.ewalletBalance), color: 'yellow', icon: WalletIcon },
    { label: 'ROI Wallet', value: fmt(wallet?.roiBalance), color: 'green', icon: TrendingUp },
    { label: 'Profit Share', value: fmt(wallet?.profitShareBalance), color: 'purple', icon: BarChart3 },
    { label: 'Fund Wallet', value: fmt(wallet?.fundBalance), color: 'teal', icon: Users },
    { label: 'Pending Commissions', value: fmt(wallet?.pendingCommissions), color: 'red', icon: AlertCircle },
    { label: 'Total Earnings', value: fmt(wallet?.totalEarnings), color: 'orange', icon: TrendingUp },
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
    <div className="slide-up">
      <div className="stats-grid">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div className="stat-card" key={s.label}>
              <div className={`stat-icon ${s.color}`}><Icon size={22} /></div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activation Banner */}
      {profile && !profile.user?.isActivated && settings && settings.activationFee > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          marginTop: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#92400e', fontSize: 15 }}>
              <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Activate Your Account
            </div>
            <div style={{ color: '#a16207', fontSize: 13, marginTop: 4 }}>
              Activation fee: <strong>${settings.activationFee}</strong> will be deducted from your Main Wallet ({fmt(wallet?.mainBalance)}).
              {wallet?.mainBalance < settings.activationFee && (
                <span style={{ color: '#dc2626', marginLeft: 6 }}>Insufficient balance.</span>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleActivate}
            disabled={activating || (wallet?.mainBalance || 0) < settings.activationFee}
          >
            {activating ? 'Activating...' : `Activate Now — $${settings.activationFee}`}
          </button>
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
              <BarChart data={investments.map((iv) => ({ name: iv.plan, amount: iv.originalAmount }))}>
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
  const [plans, setPlans] = useState([]);
  const [mine, setMine] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invest, setInvest] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, w] = await Promise.all([getPlans(), getMyInvestments(status ? { status } : {}), getMyWallet()]);
      setPlans(p.plans || []);
      setMine(m.investments || []);
      setWallet(w.wallet);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const submitInvest = async () => {
    setBusy(true);
    setFormError('');
    const amt = Number(amount);
    if (!invest || !amt || amt <= 0) { setFormError('Enter a valid amount'); setBusy(false); return; }
    if (amt < invest.minAmount || amt > invest.maxAmount) { setFormError(`Amount must be between ${fmt(invest.minAmount)} and ${fmt(invest.maxAmount)}`); setBusy(false); return; }
    if (amt > (wallet?.mainBalance || 0)) { setFormError('Insufficient main balance'); setBusy(false); return; }
    try {
      await apiClient.post('/investments', { amount: amt, planId: invest._id, plan: invest.name });
      setInvest(null); setAmount('');
      toastSuccess('Investment Created', `Successfully invested ${fmt(amt)} in ${invest.name}`);
      await load();
    } catch (e) { setFormError(e.response?.data?.message || 'Investment failed'); toastError('Investment Failed', e.response?.data?.message); }
    finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading investments..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="slide-up">
      <div className="page-header">
        <div>
          <h1>Investment Plans</h1>
          <p className="subtitle">Browse available plans and manage your investments</p>
        </div>
      </div>

      {plans.length === 0 ? (
        <EmptyState title="No plans available" subtitle="Admin has not published any investment plans yet." />
      ) : (
        <div className="investments-list">
          {plans.map((p) => (
            <div className="investment-card" key={p._id}>
              <div className="investment-header">
                <h3>{p.name}</h3>
                <span className="badge badge-info">{p.roiPercentage}% ROI</span>
              </div>
              <div className="investment-details">
                <div className="detail-row">
                  <span>Duration: {p.durationDays} days</span>
                  <span>Range: {fmt(p.minAmount)} – {fmt(p.maxAmount)}</span>
                </div>
                {p.description && <span>{p.description}</span>}
              </div>
              <div className="investment-actions">
                <button className="btn btn-primary btn-sm" onClick={() => { setInvest(p); setAmount(p.minAmount); }}>
                  <TrendingUp size={14} /> Invest Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="page-header" style={{ marginTop: 'var(--space-8)' }}>
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
                <th>Plan</th>
                <th>Amount</th>
                <th>ROI %</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mine.length === 0 && <tr><td colSpan={6} className="table-empty">No investments found</td></tr>}
              {mine.map((iv) => (
                <tr key={iv._id}>
                  <td data-label="Plan" className="cell-strong">{iv.plan}</td>
                  <td data-label="Amount">{fmt(iv.originalAmount)}</td>
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

      {invest && (
        <Modal title={`Invest — ${invest.name}`}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setInvest(null)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitInvest} disabled={busy}>
                {busy ? <><span className="spinner" /> Processing...</> : 'Confirm Investment'}
              </button>
            </>
          }
          onClose={() => setInvest(null)}>
          <p style={{ marginBottom: 'var(--space-4)' }}>Available main balance: <strong>{fmt(wallet?.mainBalance)}</strong></p>
          <div className="form-group">
            <label className="form-label">Investment Amount</label>
            <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={invest.minAmount} max={invest.maxAmount} />
            <span className="form-hint">Allowed: {fmt(invest.minAmount)} – {fmt(invest.maxAmount)}</span>
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
  const [showFundForm, setShowFundForm] = useState(false);
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
        const s = await getAdminSettings();
        setSettings(s.settings);
      } catch (e) { /* settings fetch optional */ }
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitDeposit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    setSuccess('');
    const amt = Number(amount);
    if (!amt || amt <= 0) { setFormError('Enter a valid amount'); setBusy(false); return; }
    try {
      await requestDeposit({ amount: amt, description: desc });
      setSuccess('Deposit request submitted. Awaiting admin approval.');
      toastSuccess('Deposit Submitted', `Deposit request for ${fmt(amt)} submitted successfully.`);
      setAmount('');
      setDesc('');
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

  const today = new Date().getUTCDate();
  const roiTransferAllowed = settings?.roiTransferEnabled && today === settings?.roiTransferDay;
  const psTransferAllowed = settings?.profitShareTransferEnabled && today === settings?.profitShareTransferDay;

  return (
    <div className="slide-up">
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

      {/* Transfer Sections */}
      <div style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowDepositForm(!showDepositForm)}
        >
          <ArrowDownToLine size={16} /> {showDepositForm ? 'Close' : 'Request Deposit'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowFundForm(!showFundForm)}
        >
          <ArrowRightLeft size={16} /> {showFundForm ? 'Close' : 'Fund Transfer'}
        </button>
      </div>

      <div className="transfers-grid">
        <div className="panel">
          <h3>ROI Wallet Transfer</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Transfer ROI balance to Main Wallet. Available on {settings?.roiTransferDay || 1}th of each month.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRoiTransfer}
              disabled={!roiTransferAllowed || transferring || (wallet?.roiBalance || 0) <= 0}
            >
              {transferring ? 'Transferring...' : 'Transfer to Main Wallet'}
            </button>
            {!settings?.roiTransferEnabled && <span className="text-muted" style={{ fontSize: 12 }}>Disabled by admin</span>}
            {settings?.roiTransferEnabled && !roiTransferAllowed && <span className="text-muted" style={{ fontSize: 12 }}>Available on {settings?.roiTransferDay}th</span>}
          </div>
        </div>

        <div className="panel">
          <h3>Profit Share Transfer</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Transfer Profit Share balance to Main Wallet. Available on {settings?.profitShareTransferDay || 15}th of each month.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleProfitShareTransfer}
              disabled={!psTransferAllowed || transferring || (wallet?.profitShareBalance || 0) <= 0}
            >
              {transferring ? 'Transferring...' : 'Transfer to Main Wallet'}
            </button>
            {!settings?.profitShareTransferEnabled && <span className="text-muted" style={{ fontSize: 12 }}>Disabled by admin</span>}
            {settings?.profitShareTransferEnabled && !psTransferAllowed && <span className="text-muted" style={{ fontSize: 12 }}>Available on {settings?.profitShareTransferDay}th</span>}
          </div>
        </div>
      </div>

      {showDepositForm && (
        <div className="deposit-form" style={{ marginTop: 'var(--space-4)' }}>
          <h3>Request Deposit</h3>
          <form onSubmit={submitDeposit}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Details / Reference</label>
              <input className="form-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional — payment reference or note" />
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
        <div className="deposit-form" style={{ marginTop: 'var(--space-4)' }}>
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
          <button className="btn btn-primary btn-block" onClick={handleFundTransfer} disabled={fundBusy || !fundReceiver || !fundAmount}>
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
    <div className="slide-up">
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
   ROI
   ========================================================= */
function UserRoi() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try { const r = await getMyRoiHistory(); setRows(r.history || []); }
      catch (e) { setError(e.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading ROI history..." />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="slide-up">
      <div className="page-header">
        <div>
          <h1>ROI History</h1>
          <p className="subtitle">Track your return on investment earnings</p>
        </div>
      </div>
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [d, p] = await Promise.all([getMyDownlines(), getMyProfile()]);
        setDownlines(d.directDownlines || []);
        setProfile(p);
        if (tab === 'commissions') {
          const c = await getMyTransactions({ type: 'COMMISSION' });
          setCommissions(c.transactions || []);
        }
      } catch (e) { setError(e.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, [tab]);

  const copyReferral = () => {
    navigator.clipboard.writeText(profile?.referralLink || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Spinner label="Loading referrals..." />;
  if (error) return <ErrorBox message={error} />;

  if (tab === 'commissions') {
    return (
      <div className="slide-up">
        <div className="page-header">
          <div>
            <h1>Commission Earnings</h1>
            <p className="subtitle">Track your referral commission income</p>
          </div>
        </div>
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {commissions.length === 0 && <tr><td colSpan={3} className="table-empty">No commission earnings yet</td></tr>}
                {commissions.map((c) => (
                  <tr key={c._id}>
                    <td data-label="Amount" className="cell-strong">{fmt(c.amount)}</td>
                    <td data-label="Status"><StatusBadge status={c.status} /></td>
                    <td data-label="Date">{fmtDateTime(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="page-header">
        <div>
          <h1>Referrals</h1>
          <p className="subtitle">Invite friends and earn commissions</p>
        </div>
      </div>

      <div className="panel">
        <h3>Your Referral Link</h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-3)' }}>
          <input className="form-input" readOnly value={profile?.referralLink || ''} onFocus={(e) => e.target.select()} style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm" onClick={copyReferral}>
            {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <span className="text-muted text-sm">Your Referral Code: </span>
          <strong>{profile?.user?.referralCode}</strong>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <div>
          <h2>My Referrals ({downlines.length})</h2>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {downlines.length === 0 && <tr><td colSpan={4} className="table-empty">No referrals yet</td></tr>}
              {downlines.map((d) => (
                <tr key={d._id}>
                  <td data-label="Name" className="cell-strong">{d.name}</td>
                  <td data-label="Email">{d.email}</td>
                  <td data-label="Status"><StatusBadge status={d.accountStatus} /></td>
                  <td data-label="Joined">{fmtDate(d.createdAt)}</td>
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
    <div className="slide-up">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="subtitle">Manage your account information</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 600 }}>
        {!edit ? (
          <>
            <div className="detail-grid">
              <div className="detail-item"><span className="k">Name</span><span className="v">{u.name}</span></div>
              <div className="detail-item"><span className="k">Email</span><span className="v">{u.email}</span></div>
              <div className="detail-item"><span className="k">Phone</span><span className="v">{u.phone}</span></div>
              <div className="detail-item"><span className="k">Status</span><span className="v"><StatusBadge status={u.accountStatus} /></span></div>
              <div className="detail-item"><span className="k">Referral Code</span><span className="v">{u.referralCode}</span></div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-5)' }} onClick={() => setEdit(true)}>
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
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
