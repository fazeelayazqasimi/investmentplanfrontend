import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, Wallet as WalletIcon, Receipt, Percent, Share2, User as UserIcon,
  LogOut, Loader2, AlertCircle, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Menu, X, CheckCircle,
  BarChart3, CreditCard, Users, ArrowRightLeft, DollarSign, Copy, ChevronDown, Megaphone, Trophy, Zap, Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient, {
  getMyInvestments, getMyWallet, getMyTransactions, requestDeposit,
  getMyRoiHistory, getMyProfile, updateMyProfile, uploadMyProfilePhoto,
  transferRoiToMain, transferProfitShareToMain, getUserConfig, activateAccount,
  transferFundToUser, getTransferSettings, getProgressData,
  transferMainToFund, activateAccountWithSource, investForDownline, getMyDownlines,
  activateDownlineAccount, depositForDownline,
  getBankAccounts, getActiveAnnouncements, searchMyDownlines, getPendingCommissionDetails,
  requestWithdrawal as requestWithdrawalApi,
  getMyWithdrawals,
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
import UserRanksContent from './UserRanks';
import ChatWidget from '../components/ChatWidget';
import logoHeader from '../images/favicon.png';

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
  { key: 'referrals', label: 'Referrals', icon: Share2, to: '/dashboard/referrals' },
  { key: 'ranks', label: 'My Rank', icon: Trophy, to: '/dashboard/ranks' },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, to: '/dashboard/announcements' },
  { key: 'profile', label: 'Profile', icon: UserIcon, to: '/dashboard/profile' },
];

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
          <div className="sidebar-logo"><img src={logoHeader} alt="FinRise Global" style={{ width: 28, height: 28, borderRadius: 6 }} /></div>
          <div>
            <div className="sidebar-title">My Account</div>
            <div className="sidebar-subtitle">FinRise Global</div>
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

        <div className="page-content">
          {announcements.filter((a) => a.showBanner && !dismissedAnnouncements.has(a._id)).length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              {announcements.filter((a) => a.showBanner && !dismissedAnnouncements.has(a._id)).map((a) => {
                const colors = { INFO: 'var(--color-primary-soft)', PROMOTION: 'var(--color-primary-soft)', WARNING: 'var(--color-warning-soft)', UPDATE: 'var(--color-primary-soft)', EVENT: 'var(--color-primary-soft)' };
                const borders = { INFO: 'var(--color-primary-border)', PROMOTION: 'var(--color-primary-border)', WARNING: 'var(--color-warning-border)', UPDATE: 'var(--color-primary-border)', EVENT: 'var(--color-primary-border)' };
                const icons = { INFO: 'ℹ️', PROMOTION: '🎉', WARNING: '⚠️', UPDATE: '🔄', EVENT: '📅' };
                const hasImages = a.images && a.images.length > 0;
                return (
                  <div key={a._id} style={{
                    background: colors[a.type] || 'var(--color-primary-soft)',
                    border: `1px solid ${borders[a.type] || 'var(--color-primary-border)'}`,
                    borderRadius: 'var(--radius-xl)',
                    padding: '14px 20px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: hasImages ? 'stretch' : 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    {hasImages && (
                      <img
                        src={a.images[0].url}
                        alt={a.title}
                        style={{ width: 80, height: 60, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0, alignSelf: 'center' }}
                      />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
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
          {page === 'referrals' && <UserReferrals />}
          {page === 'announcements' && <UserAnnouncements />}
          {page === 'ranks' && <UserRanksContent />}
          {page === 'profile' && <UserProfile toastSuccess={success} toastError={toastError} />}
        </div>
      </div>
      <ToastContainer />
      <ChatWidget />

      {modalAnnouncement && (
        <div className="modal-overlay" onClick={() => { dismissAnnouncement(modalAnnouncement._id); setModalAnnouncement(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{modalAnnouncement.title}</h3>
              <button className="modal-close" onClick={() => { dismissAnnouncement(modalAnnouncement._id); setModalAnnouncement(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {modalAnnouncement.images && modalAnnouncement.images.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {modalAnnouncement.images.length === 1 ? (
                    <img
                      src={modalAnnouncement.images[0].url}
                      alt={modalAnnouncement.title}
                      style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {modalAnnouncement.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.url}
                          alt={`${modalAnnouncement.title} ${i + 1}`}
                          style={{ minWidth: 200, maxWidth: 280, height: 180, objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{
                padding: '16px 20px',
                background: 'var(--color-bg-alt)',
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
  const [allInvestments, setAllInvestments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [progress, setProgress] = useState(null);
  const [directIncome, setDirectIncome] = useState(0);
  const [levelIncome, setLevelIncome] = useState(0);
  const [profitShareTotal, setProfitShareTotal] = useState(0);
  const [investmentStats, setInvestmentStats] = useState({ totalInvestment: 0, activeInvestment: 0 });
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
        const [w, i, iAll, p, directTxn, levelTxn, pendingTxn] = await Promise.all([getMyWallet(), getMyInvestments({ status: 'ACTIVE' }), getMyInvestments(), getMyProfile(), getMyTransactions({ type: 'DIRECT_INCOME' }), getMyTransactions({ type: 'LEVEL_INCOME' }), getMyTransactions({ type: 'PENDING_NETWORK_COMMISSION', limit: 500 })]);
        setWallet(w.wallet);
        setInvestments(i.investments || []);
        setAllInvestments(iAll.investments || []);
        setInvestmentStats(iAll.stats || i.stats || { totalInvestment: 0, activeInvestment: 0 });
        setProfile(p);
        const directCredited = (directTxn.transactions || []).reduce((s, t) => s + (t.amount || 0), 0);
        const directPending = (pendingTxn.transactions || []).filter((t) => t.metadata?.incomeType === 'DIRECT_INCOME').reduce((s, t) => s + (t.amount || 0), 0);
        setDirectIncome(directCredited + directPending);
        const levelCredited = (levelTxn.transactions || []).reduce((s, t) => s + (t.amount || 0), 0);
        const levelPending = (pendingTxn.transactions || []).filter((t) => t.metadata?.incomeType === 'LEVEL_INCOME').reduce((s, t) => s + (t.amount || 0), 0);
        setLevelIncome(levelCredited + levelPending);
        const psCredited = w.wallet?.profitShareBalance || 0;
        const psPending = (pendingTxn.transactions || []).filter((t) => t.metadata?.incomeType === 'PROFIT_SHARE' || t.metadata?.incomeType === 'PROFIT_SHARE_FROM_ROI').reduce((s, t) => s + (t.amount || 0), 0);
        setProfitShareTotal(psCredited + psPending);
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
    { label: 'Direct Income', value: fmt(directIncome), accent: 'stat-success', icon: DollarSign },
    { label: 'Level Income', value: fmt(levelIncome), accent: 'stat-info', icon: BarChart3 },
    { label: 'Profit Share', value: fmt(profitShareTotal), accent: 'stat-purple', icon: BarChart3 },
    { label: 'Fund Wallet', value: fmt(wallet?.fundBalance), accent: 'stat-teal', icon: Users },
    { label: 'Pending Commission', value: fmt(wallet?.pendingCommissions), accent: 'stat-danger', icon: AlertCircle },
    { label: 'Total Earning', value: fmt(wallet?.totalEarnings), accent: 'stat-orange', icon: TrendingUp },
    { label: 'Total Withdraw', value: fmt(wallet?.totalWithdrawn), accent: 'stat-teal', icon: ArrowUpFromLine },
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
      {/* Top Greeting + Referral Card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), #0d9e6a)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: 'var(--space-5)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Welcome back</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{user?.name || 'there'}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{user?.email}</div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
              background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.4)',
            }}>
              {profile?.user?.avatar ? (
                <img src={profile.user.avatar} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserIcon size={22} />
              )}
            </div>
          </div>

          {/* Referral Link */}
          <div style={{
            background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 16px',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Share2 size={14} /> Share your referral link
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                readOnly
                value={referralLink}
                style={{
                  flex: 1, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.1)',
                  color: '#fff', fontFamily: 'monospace', minWidth: 150,
                }}
              />
              <button
                className="btn btn-sm"
                onClick={copyReferral}
                style={{
                  background: '#fff', color: 'var(--color-primary)', fontWeight: 600,
                  flexShrink: 0, border: 'none',
                }}
              >
                {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
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

      {/* Active Investment + Total Investment - Same Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="wallet-card" style={{ background: '#111827', color: '#fff', border: 'none', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="wallet-card-label" style={{ color: '#9CA3AF' }}>Active Investment</div>
              <div className="wallet-card-balance" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: '#00C389' }}>
                {fmt(investmentStats.activeInvestment || 0)}
              </div>
            </div>
            <Zap size={32} style={{ color: '#00C389' }} />
          </div>
        </div>
        <div className="wallet-card" style={{ background: '#111827', color: '#fff', border: 'none', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="wallet-card-label" style={{ color: '#9CA3AF' }}>Total Investment</div>
              <div className="wallet-card-balance" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: '#fff' }}>
                {fmt(investmentStats.totalInvestment || 0)}
              </div>
            </div>
            <TrendingUp size={32} style={{ color: '#00C389' }} />
          </div>
        </div>
      </div>

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
        <div>
          {/* 3X Cap Reached Alert */}
          {progress.percentage3x >= 100 && (
            <div style={{
              padding: '16px 20px', marginBottom: 'var(--space-4)',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.05) 100%)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#ef4444', marginBottom: 2 }}>
                  Your ROI Has Stopped
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  3X income limit reached ({fmt(progress.milestone3x)}). <strong>Invest more</strong> to unlock new limits and resume earning ROI.
                </div>
              </div>
            </div>
          )}

          {/* Combined 2X Progress */}
          {progress.milestone2x > 0 && (
            <div className="invest-progress-card" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="invest-progress-header">
                <div className="invest-progress-title">
                  <TrendingUp size={16} />
                  <span>2X Return Target: {fmt(progress.milestone2x)}</span>
                </div>
                <span className={`invest-progress-badge ${progress.percentage2x >= 100 ? 'completed' : 'active'}`}>
                  {progress.percentage2x >= 100 ? 'COMPLETED' : 'ACTIVE'}
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill green" style={{ width: `${Math.min(progress.percentage2x, 100)}%` }} />
              </div>
              <div className="invest-progress-info">
                <span>Returned: {fmt(progress.progress2x)}</span>
                <span>{progress.percentage2x}%</span>
              </div>
              {progress.remaining2x > 0 && (
                <div className="invest-progress-remaining">{fmt(progress.remaining2x)} remaining to reach 2X</div>
              )}
              {progress.percentage2x >= 100 && (
                <div className="invest-progress-complete">2X Milestone Reached!</div>
              )}
              {progress.cycle2xCompletions > 0 && (
                <div style={{ marginTop: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
                  ✅ 2X completed {progress.cycle2xCompletions} time{progress.cycle2xCompletions > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Global 3X Cap */}
          <div className="progress-section">
            <div className="progress-card progress-3x">
              <div className="progress-header">
                <div className="progress-title">
                  <BarChart3 size={18} />
                  <span>Income 3X Cap</span>
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
              {progress.remaining3x <= 0 && progress.totalInvestment > 0 && (
                <div style={{
                  marginTop: 8, padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: '#ef4444', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertCircle size={14} />
                  ROI Stopped — Invest More to Resume Earning
                </div>
              )}
              {progress.totalInvestment === 0 && (
                <div style={{
                  marginTop: 8, padding: '10px 14px',
                  background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: '#10b981', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Zap size={14} />
                  Start investing and upgrade your progress
                </div>
              )}
            </div>
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
                            <div style={{ flex: 1, height: 6, background: '#E6E8E8', borderRadius: 3, overflow: 'hidden' }}>
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
  const [investmentStats, setInvestmentStats] = useState({ totalInvestment: 0, activeInvestment: 0 });
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
  // Downline Activation modal
  const [showActivateDownlineModal, setShowActivateDownlineModal] = useState(false);
  const [activateDownlineReceiver, setActivateDownlineReceiver] = useState('');
  // Downline Deposit modal
  const [showDepositDownlineModal, setShowDepositDownlineModal] = useState(false);
  const [depositDownlineReceiver, setDepositDownlineReceiver] = useState('');
  const [depositDownlineAmount, setDepositDownlineAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, w] = await Promise.all([getMyInvestments(status ? { status } : {}), getMyWallet()]);
      setMine(m.investments || []);
      setInvestmentStats(m.stats || { totalInvestment: 0, activeInvestment: 0 });
      setWallet(w.wallet);
      try { const pr = await getProgressData(); setProgress(pr); } catch (_) {}
      try { const dl = await getMyDownlines(); setDownlines(dl.directDownlines || dl.downlines || []); } catch (_) {}
      try { const s = await getTransferSettings(); setDownlineSettings(s); } catch (_) {}
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const roundToTwo = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

  const ewalletInvestmentEnabled = !!downlineSettings?.ewalletInvestmentEnabled;

  // Auto-calculate wallet split: Main → E-Wallet → Fund
  const autoAllocate = (total) => {
    const amt = Number(total) || 0;
    const maxEwalletPct = ewalletInvestmentEnabled ? (downlineSettings?.selfInvestmentEwalletMaxPercentage || 0) : 0;
    const maxEwalletFromPct = maxEwalletPct > 0 ? roundToTwo(amt * maxEwalletPct / 100) : Infinity;
    const maxMain = Math.min(amt, wallet?.mainBalance || 0);
    const remaining = amt - maxMain;
    const maxEwallet = ewalletInvestmentEnabled ? Math.min(remaining, wallet?.ewalletBalance || 0, maxEwalletFromPct) : 0;
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
    (ewalletInvestmentEnabled && (Number(ewalletAmount) || 0) > (wallet?.ewalletBalance || 0)) ||
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
    if (ewalletInvestmentEnabled && ewalletAmt > (wallet?.ewalletBalance || 0)) { setFormError('E-Wallet amount exceeds available balance'); setBusy(false); return; }
    if (fundAmt > (wallet?.fundBalance || 0)) { setFormError('Fund Wallet amount exceeds available balance'); setBusy(false); return; }
    if (!ewalletInvestmentEnabled && ewalletAmt > 0) { setFormError('E-Wallet for investment is currently disabled by admin'); setBusy(false); return; }
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

  const submitActivateDownline = async () => {
    setBusy(true);
    setFormError('');
    if (!activateDownlineReceiver) { setFormError('Select a downline member'); setBusy(false); return; }
    try {
      await activateDownlineAccount({ receiverId: activateDownlineReceiver });
      setShowActivateDownlineModal(false); setActivateDownlineReceiver('');
      toastSuccess('Downline Activated', 'Downline account activated successfully using E-Wallet');
      await load();
    } catch (e) { setFormError(e.response?.data?.message || 'Activation failed'); toastError('Activation Failed', e.response?.data?.message); }
    finally { setBusy(false); }
  };

  const submitDepositDownline = async () => {
    setBusy(true);
    setFormError('');
    const amt = Number(depositDownlineAmount);
    if (!amt || amt <= 0) { setFormError('Enter a valid amount'); setBusy(false); return; }
    if (!depositDownlineReceiver) { setFormError('Select a downline member'); setBusy(false); return; }
    try {
      await depositForDownline({ receiverId: depositDownlineReceiver, amount: amt });
      setShowDepositDownlineModal(false); setDepositDownlineReceiver(''); setDepositDownlineAmount('');
      toastSuccess('Deposit Successful', `${fmt(amt)} deposited to downline using E-Wallet`);
      await load();
    } catch (e) { setFormError(e.response?.data?.message || 'Deposit failed'); toastError('Deposit Failed', e.response?.data?.message); }
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
        {downlines.length > 0 && downlineSettings?.ewalletDownlineActivationEnabled && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setShowActivateDownlineModal(true); setActivateDownlineReceiver(''); setFormError(''); }}>
            <CheckCircle size={14} /> Activate Downline
          </button>
        )}
        {downlines.length > 0 && downlineSettings?.ewalletDownlineDepositEnabled && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setShowDepositDownlineModal(true); setDepositDownlineReceiver(''); setDepositDownlineAmount(''); setFormError(''); }}>
            <DollarSign size={14} /> Deposit for Downline
          </button>
        )}
      </div>

      {/* Progress Bars */}
      {progress && (
        <div>
          {/* Combined 2X Progress */}
          {progress.milestone2x > 0 && (
            <div className="invest-progress-card" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="invest-progress-header">
                <div className="invest-progress-title">
                  <TrendingUp size={16} />
                  <span>2X Return Target: {fmt(progress.milestone2x)}</span>
                </div>
                <span className={`invest-progress-badge ${progress.percentage2x >= 100 ? 'completed' : 'active'}`}>
                  {progress.percentage2x >= 100 ? 'COMPLETED' : 'ACTIVE'}
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill green" style={{ width: `${Math.min(progress.percentage2x, 100)}%` }} />
              </div>
              <div className="invest-progress-info">
                <span>Returned: {fmt(progress.progress2x)}</span>
                <span>{progress.percentage2x}%</span>
              </div>
              {progress.remaining2x > 0 && (
                <div className="invest-progress-remaining">{fmt(progress.remaining2x)} remaining to reach 2X</div>
              )}
              {progress.percentage2x >= 100 && (
                <div className="invest-progress-complete">2X Milestone Reached!</div>
              )}
              {progress.cycle2xCompletions > 0 && (
                <div style={{ marginTop: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
                  ✅ 2X completed {progress.cycle2xCompletions} time{progress.cycle2xCompletions > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Global 3X Cap */}
          <div className="progress-section">
            <div className="progress-card progress-3x">
              <div className="progress-header">
                <div className="progress-title">
                  <BarChart3 size={18} />
                  <span>Income 3X Cap</span>
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
              {progress.remaining3x <= 0 && progress.totalInvestment > 0 && (
                <div style={{
                  marginTop: 8, padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: '#ef4444', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertCircle size={14} />
                  ROI Stopped — Invest More to Resume Earning
                </div>
              )}
              {progress.totalInvestment === 0 && (
                <div style={{
                  marginTop: 8, padding: '10px 14px',
                  background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: '#10b981', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Zap size={14} />
                  Start investing and upgrade your progress
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="wallet-card" style={{ marginBottom: 'var(--space-4)', background: '#111827', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="wallet-card-label" style={{ color: '#9CA3AF' }}>Total Investment</div>
            <div className="wallet-card-balance" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: '#fff' }}>
              {fmt(investmentStats.totalInvestment || 0)}
            </div>
          </div>
          <TrendingUp size={32} style={{ color: '#00C389' }} />
        </div>
      </div>

      <div className="wallet-card" style={{ marginBottom: 'var(--space-4)', background: '#111827', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="wallet-card-label" style={{ color: '#9CA3AF' }}>Active Investment</div>
            <div className="wallet-card-balance" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: '#00C389' }}>
              {fmt(investmentStats.activeInvestment || 0)}
            </div>
          </div>
          <Zap size={32} style={{ color: '#00C389' }} />
        </div>
      </div>

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
                <th>Invest Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mine.length === 0 && <tr><td colSpan={3} className="table-empty">No investments found</td></tr>}
              {mine.map((iv) => (
                <tr key={iv._id}>
                  <td data-label="Amount" className="cell-strong">{fmt(iv.originalAmount)}</td>
                  <td data-label="Invest Date">{fmtDate(iv.startDate)}</td>
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
            {ewalletInvestmentEnabled && (
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>E-Wallet</span>
                  <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 12 }}>Available: {fmt(wallet?.ewalletBalance)}</span>
                </label>
                {downlineSettings?.selfInvestmentEwalletMaxPercentage > 0 && investAmount > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                    Max from E-Wallet: {fmt(roundToTwo(investAmount * downlineSettings.selfInvestmentEwalletMaxPercentage / 100))} ({downlineSettings.selfInvestmentEwalletMaxPercentage}% of investment)
                  </span>
                )}
                <input className="form-input" type="number" value={ewalletAmount} onChange={(e) => handleWalletChange('ewallet', e.target.value)} min="0" max={downlineSettings?.selfInvestmentEwalletMaxPercentage > 0 && investAmount > 0 ? Math.min(wallet?.ewalletBalance || 0, roundToTwo(investAmount * downlineSettings.selfInvestmentEwalletMaxPercentage / 100)) : (wallet?.ewalletBalance || 0)} placeholder="0.00" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fund Wallet</span>
                <span style={{ fontWeight: 400, color: 'var(--gray-500)', fontSize: 12 }}>Available: {fmt(wallet?.fundBalance)}</span>
              </label>
              <input className="form-input" type="number" value={fundAmount} onChange={(e) => handleWalletChange('fund', e.target.value)} min="0" max={wallet?.fundBalance || 0} placeholder="0.00" />
            </div>
            {investAmount > 0 && (
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 'var(--space-2)' }}>
                Split: {fmt(Number(mainAmount) || 0)} + {ewalletInvestmentEnabled && `${fmt(Number(ewalletAmount) || 0)} + `}{fmt(Number(fundAmount) || 0)} = <strong>{fmt(totalWalletSplit)}</strong>
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

      {showActivateDownlineModal && (
        <Modal title="Activate Downline Account"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowActivateDownlineModal(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitActivateDownline} disabled={busy}>
                {busy ? <><span className="spinner" /> Processing...</> : 'Activate Account'}
              </button>
            </>
          }
          onClose={() => setShowActivateDownlineModal(false)}>
          <p style={{ marginBottom: 'var(--space-2)' }}>Available E-Wallet: <strong>{fmt(wallet?.ewalletBalance)}</strong></p>
          <p style={{ marginBottom: 'var(--space-4)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Activation fee will be deducted from your E-Wallet balance.
          </p>
          <div className="form-group">
            <label className="form-label">Select Downline Member</label>
            <select className="select" value={activateDownlineReceiver} onChange={(e) => setActivateDownlineReceiver(e.target.value)}>
              <option value="">Choose a member...</option>
              {downlines.filter((dl) => !dl.isActivated).map((dl) => (
                <option key={dl._id || dl.user?._id} value={dl._id || dl.user?._id}>
                  {dl.name || dl.user?.name} ({dl.email || dl.user?.email})
                </option>
              ))}
            </select>
          </div>
          {downlines.filter((dl) => !dl.isActivated).length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-4)' }}>
              All downline members are already activated.
            </p>
          )}
          {formError && <ErrorBox message={formError} />}
        </Modal>
      )}

      {showDepositDownlineModal && (
        <Modal title="Deposit for Downline"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDepositDownlineModal(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submitDepositDownline} disabled={busy}>
                {busy ? <><span className="spinner" /> Processing...</> : 'Confirm Deposit'}
              </button>
            </>
          }
          onClose={() => setShowDepositDownlineModal(false)}>
          <p style={{ marginBottom: 'var(--space-2)' }}>Available E-Wallet: <strong>{fmt(wallet?.ewalletBalance)}</strong></p>
          <div className="form-group">
            <label className="form-label">Select Downline Member</label>
            <select className="select" value={depositDownlineReceiver} onChange={(e) => setDepositDownlineReceiver(e.target.value)}>
              <option value="">Choose a member...</option>
              {downlines.map((dl) => (
                <option key={dl._id || dl.user?._id} value={dl._id || dl.user?._id}>
                  {dl.name || dl.user?.name} ({dl.email || dl.user?.email})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Deposit Amount ($)</label>
            <input className="form-input" type="number" value={depositDownlineAmount} onChange={(e) => setDepositDownlineAmount(e.target.value)} min="1" max={wallet?.ewalletBalance || 0} />
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
  const [proofImageFile, setProofImageFile] = useState(null);
  const [showFundForm, setShowFundForm] = useState(false);
  const [showMainToFundForm, setShowMainToFundForm] = useState(false);
  const [mainToFundAmount, setMainToFundAmount] = useState('');
  const [mainToFundBusy, setMainToFundBusy] = useState(false);
  const [mainToFundError, setMainToFundError] = useState('');
  const [fundReceiver, setFundReceiver] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundBusy, setFundBusy] = useState(false);
  const [fundError, setFundError] = useState('');
  const [fundReceiverSearch, setFundReceiverSearch] = useState('');
  const [downlineSuggestions, setDownlineSuggestions] = useState([]);
  const [selectedDownline, setSelectedDownline] = useState(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawField, setWithdrawField] = useState('mainBalance');
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawBep20Address, setWithdrawBep20Address] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [withdrawHistoryLoading, setWithdrawHistoryLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingDetails, setPendingDetails] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');

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
      try {
        const wd = await getMyWithdrawals({ limit: 50 });
        setWithdrawHistory(wd.data?.transactions || []);
      } catch (e) { /* withdrawal history optional */ }
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
      const fd = new FormData();
      fd.append('amount', amt);
      fd.append('description', desc);
      if (selectedBank) fd.append('bankAccountId', selectedBank);
      if (proofImageFile) fd.append('proofImage', proofImageFile);
      await requestDeposit(fd);
      setSuccess('Deposit request submitted. Awaiting admin approval.');
      toastSuccess('Deposit Submitted', `Deposit request for ${fmt(amt)} submitted successfully.`);
      setAmount('');
      setDesc('');
      setSelectedBank('');
      setProofImageFile(null);
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
    if (!fundReceiver || !amt || amt <= 0) { setFundError('Enter valid receiver and amount'); setFundBusy(false); return; }
    try {
      await transferFundToUser({ receiverId: fundReceiver, amount: amt });
      toastSuccess('Fund Transfer Complete', `${fmt(amt)} transferred successfully.`);
      setFundReceiver('');
      setFundAmount('');
      setFundReceiverSearch('');
      setSelectedDownline(null);
      setDownlineSuggestions([]);
      setShowFundForm(false);
      await load();
    } catch (er) { setFundError(er.response?.data?.message || 'Transfer failed'); toastError('Transfer Failed', er.response?.data?.message); }
    finally { setFundBusy(false); }
  };

  const handleWithdraw = async () => {
    setWithdrawBusy(true);
    setWithdrawError('');
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) { setWithdrawError('Enter a valid amount'); setWithdrawBusy(false); return; }

    if (!withdrawBep20Address.trim()) { setWithdrawError('USDT BEP20 wallet address is required'); setWithdrawBusy(false); return; }

    const payoutDetails = { bep20Address: withdrawBep20Address.trim() };

    try {
      await requestWithdrawalApi({
        amount: amt,
        balanceField: withdrawField,
        payoutMethod: 'BEP20',
        payoutDetails,
        notes: withdrawNotes.trim(),
      });
      toastSuccess('Withdrawal Submitted', 'Amount deducted from your balance. It will be refunded if the admin rejects the request.');
      setWithdrawAmount('');
      setWithdrawBep20Address('');
      setWithdrawNotes('');
      await load();
      setTimeout(() => setShowWithdrawModal(false), 2000);
    } catch (er) { setWithdrawError(er.response?.data?.message || 'Withdrawal failed'); toastError('Withdrawal Failed', er.response?.data?.message); }
    finally { setWithdrawBusy(false); }
  };

  let searchDebounceRef = null;
  const handleDownlineSearch = async (e) => {
    const val = e.target.value;
    setFundReceiverSearch(val);
    setSelectedDownline(null);
    setFundReceiver('');
    if (searchDebounceRef) clearTimeout(searchDebounceRef);
    if (!val || val.trim().length < 1) {
      setDownlineSuggestions([]);
      return;
    }
    searchDebounceRef = setTimeout(async () => {
      setSearchBusy(true);
      try {
        const result = await searchMyDownlines(val.trim());
        setDownlineSuggestions(result.users || []);
      } catch (_) {
        setDownlineSuggestions([]);
      } finally {
        setSearchBusy(false);
      }
    }, 300);
  };

  const selectDownlineUser = (user) => {
    setSelectedDownline(user);
    setFundReceiver(user._id);
    setFundReceiverSearch(user.email);
    setDownlineSuggestions([]);
  };

  const handlePendingClick = async () => {
    if ((wallet?.pendingCommissions || 0) <= 0) return;
    setShowPendingModal(true);
    setPendingLoading(true);
    setPendingError('');
    try {
      const res = await getPendingCommissionDetails();
      setPendingDetails(res.pendingCommissions || []);
    } catch (e) {
      setPendingError(e.response?.data?.message || 'Failed to load details');
    } finally {
      setPendingLoading(false);
    }
  };

  if (loading) return <Spinner label="Loading wallet..." />;
  if (error) return <ErrorBox message={error} />;

  const balances = [
    { label: 'Main Wallet', value: fmt(wallet?.mainBalance), color: 'primary', icon: CreditCard },
    { label: 'E-Wallet', value: fmt(wallet?.ewalletBalance), color: 'yellow', icon: WalletIcon },
    { label: 'ROI Wallet', value: fmt(wallet?.roiBalance), color: 'green', icon: TrendingUp },
    { label: 'Profit Share Wallet', value: fmt(wallet?.profitShareBalance), color: 'purple', icon: BarChart3 },
    { label: 'Fund Wallet', value: fmt(wallet?.fundBalance), color: 'teal', icon: Users },
    { label: 'Pending Commissions', value: fmt(wallet?.pendingCommissions), color: 'red', icon: AlertCircle, clickable: true, onClick: handlePendingClick },
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
          <div
            className={`balance-card ${b.color} ${b.clickable ? 'clickable' : ''}`}
            key={b.label}
            onClick={b.clickable ? b.onClick : undefined}
            style={b.clickable ? { cursor: 'pointer' } : undefined}
          >
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
        <button
          className="btn btn-primary"
          onClick={() => { setWithdrawError(''); setShowWithdrawModal(true); }}
        >
          <ArrowUpFromLine size={16} /> Request Withdrawal
        </button>
      </div>

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
          </div>
        </div>
      </div>

      {showMainToFundForm && (
        <div className="deposit-form">
          <h3>Move to Fund Wallet</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 'var(--space-3)' }}>
            Transfer funds from your Main Wallet to your Fund Wallet. Available: <strong>{fmt(wallet?.mainBalance)}</strong>
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
                      <div className="bank-card-type" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{acc.accountType === 'LOCAL_BANK' ? <><CreditCard size={14} /> Local Bank</> : <><WalletIcon size={14} /> USDT BEP20</>}</div>
                      <div className="bank-card-name">{acc.bankName}</div>
                      <div className="bank-card-holder">{acc.accountHolder}</div>
                      <div className="bank-card-number" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{acc.accountNumber}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(acc.accountNumber); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 2 }} title="Copy account number"><Copy size={14} /></button>
                      </div>
                      {acc.iban && <div className="bank-card-iban" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{acc.iban}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(acc.iban); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 2 }} title="Copy IBAN"><Copy size={14} /></button>
                      </div>}
                      {acc.walletAddress && <div className="bank-card-number" style={{ fontSize: 11, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{acc.walletAddress}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(acc.walletAddress); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 2, flexShrink: 0 }} title="Copy wallet address"><Copy size={14} /></button>
                      </div>}
                      {acc.qrCodeImage && <img src={acc.qrCodeImage} alt="QR Code" style={{ marginTop: 8, maxWidth: 150, maxHeight: 150, borderRadius: 8, border: '1px solid var(--color-border)' }} />}
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
            <div className="form-group">
              <label className="form-label">Payment Proof Image (optional)</label>
              <input className="form-input" type="file" accept="image/*" onChange={(e) => setProofImageFile(e.target.files[0] || null)} />
              {proofImageFile && <p className="form-hint" style={{ marginTop: 4 }}>{proofImageFile.name}</p>}
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
            Transfer funds from your Fund Wallet to another user in your downline. Available balance: <strong>{fmt(wallet?.fundBalance)}</strong>
          </p>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Search Downline Member (email or name)</label>
            <input
              className="form-input"
              value={fundReceiverSearch}
              onChange={handleDownlineSearch}
              placeholder="Type email or name..."
              autoComplete="off"
            />
            {searchBusy && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Searching...</span>}
            {downlineSuggestions.length > 0 && !selectedDownline && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', maxHeight: 240, overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {downlineSuggestions.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => selectDownlineUser(u)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{u.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-success)' }}>{fmt(u.totalBalance)}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>balance</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedDownline && (
            <div style={{
              padding: '12px 16px', marginBottom: 'var(--space-3)',
              background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedDownline.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{selectedDownline.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-success)' }}>{fmt(selectedDownline.totalBalance)}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>total balance</div>
              </div>
            </div>
          )}
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

      {showWithdrawModal && (
        <Modal title="Request Withdrawal" onClose={() => setShowWithdrawModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 380 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Wallet</label>
              <select className="form-input" value={withdrawField} onChange={(e) => setWithdrawField(e.target.value)}>
                <option value="mainBalance">Main Wallet ({fmt(wallet?.mainBalance)})</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" min="0.01" />
              {settings?.withdrawalMinAmount > 0 && (
                <p className="text-muted" style={{ fontSize: 12, marginTop: 4, color: '#f59e0b' }}>
                  Minimum withdrawal amount: {fmt(settings.withdrawalMinAmount)}
                </p>
              )}
              {settings?.withdrawalMaxAmount > 0 && (
                <p className="text-muted" style={{ fontSize: 12, marginTop: 4, color: '#f59e0b' }}>
                  Maximum withdrawal amount: {fmt(settings.withdrawalMaxAmount)}
                </p>
              )}
              {(settings?.withdrawalFeePercentage || 0) > 0 && (
                <p style={{ fontSize: 12, marginTop: 4, color: '#f59e0b', fontWeight: 500 }}>
                  Fee: {settings.withdrawalFeePercentage}%
                  {Number(withdrawAmount) > 0 && (
                    <> — You will receive: {fmt(Number(withdrawAmount) - (Number(withdrawAmount) * settings.withdrawalFeePercentage) / 100)}</>
                  )}
                </p>
              )}
              <p style={{ fontSize: 12, marginTop: 4, color: 'var(--text-secondary)' }}>
                Amount is deducted from your balance immediately. If the admin rejects the request, it will be refunded.
              </p>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">USDT BEP20 Wallet Address</label>
              <input className="form-input" type="text" value={withdrawBep20Address} onChange={(e) => setWithdrawBep20Address(e.target.value)} placeholder="0x..." />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes (Optional)</label>
              <input className="form-input" type="text" value={withdrawNotes} onChange={(e) => setWithdrawNotes(e.target.value)} placeholder="Any additional notes for admin" />
            </div>
            {withdrawError && <ErrorBox message={withdrawError} />}
            <button className="btn btn-primary btn-sm" onClick={handleWithdraw} disabled={withdrawBusy || !withdrawAmount} style={{ alignSelf: 'flex-start' }}>
              {withdrawBusy ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </div>
        </Modal>
      )}

      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <div>
          <h2>Withdrawal History</h2>
        </div>
      </div>
      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Amount</th><th>Fee</th><th>Net</th><th>Wallet</th><th>Payout</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {withdrawHistory.length === 0 && (
                <tr><td colSpan={7} className="table-empty">No withdrawal requests yet</td></tr>
              )}
              {withdrawHistory.map((w) => (
                <tr key={w._id}>
                  <td data-label="Amount" className="cell-strong">{fmt(Math.abs(w.amount))}</td>
                  <td data-label="Fee">{w.metadata?.fee != null ? fmt(w.metadata.fee) : '—'}</td>
                  <td data-label="Net">{w.metadata?.netAmount != null ? fmt(w.metadata.netAmount) : fmt(Math.abs(w.amount))}</td>
                  <td data-label="Wallet">{w.metadata?.balanceField === 'mainBalance' ? 'Main' : w.metadata?.balanceField === 'roiBalance' ? 'ROI' : w.metadata?.balanceField === 'ewalletBalance' ? 'E-Wallet' : w.metadata?.balanceField === 'profitShareBalance' ? 'Profit Share' : w.metadata?.balanceField === 'fundBalance' ? 'Fund' : 'Other'}</td>
                  <td data-label="Payout">{w.metadata?.payoutMethod === 'BANK' ? `Bank: ${w.metadata?.payoutDetails?.bankName || '-'}` : w.metadata?.payoutMethod === 'BEP20' ? `USDT BEP20: ${(w.metadata?.payoutDetails?.bep20Address || '').slice(0, 10)}...` : '-'}</td>
                  <td data-label="Status"><StatusBadge status={w.status} /></td>
                  <td data-label="Date">{fmtDate(w.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Pending Commission Detail Modal */}
      {showPendingModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} onClick={() => setShowPendingModal(false)}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)', maxWidth: 600, width: '90%', maxHeight: '80vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Pending Commissions Detail</h2>
              <button onClick={() => setShowPendingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 'var(--space-3)', padding: '12px 16px', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Total Pending: <strong style={{ color: 'var(--color-danger)' }}>{fmt(wallet?.pendingCommissions)}</strong>
            </div>

            {pendingLoading && <Spinner label="Loading details..." />}
            {pendingError && <ErrorBox message={pendingError} />}

            {!pendingLoading && !pendingError && pendingDetails.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
                No pending commission records found.
              </div>
            )}

            {!pendingLoading && !pendingError && pendingDetails.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {pendingDetails.map((txn) => {
                  const incomeTypeLabels = {
                    'ROI_OVERFLOW': 'ROI Cap Overflow',
                    'NETWORK_COMMISSION': 'Direct/Level Income Overflow',
                    'DIRECT_INCOME': 'Direct Income Overflow',
                    'LEVEL_INCOME': 'Level Income Overflow',
                    'PROFIT_SHARE': 'Profit Share Overflow',
                    'PROFIT_SHARE_FROM_ROI': 'Profit Share from ROI Overflow',
                  };
                  const typeLabel = incomeTypeLabels[txn.incomeType] || (txn.type === 'PENDING_ROI' ? 'ROI Cap Overflow' : 'Network Commission Overflow');
                  return (
                    <div key={txn._id} style={{
                      padding: '14px 16px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-danger)' }}>{fmt(txn.amount)}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {typeLabel}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{fmtDateTime(txn.createdAt)}</div>
                        </div>
                      </div>

                      {txn.sourceUser && (
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                          <strong>From:</strong> {txn.sourceUser.name} ({txn.sourceUser.email})
                        </div>
                      )}

                      {(txn.sourceInvestmentAmount || txn.investmentAmount) && (
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                          <strong>Downline Investment:</strong> {fmt(txn.sourceInvestmentAmount || txn.investmentAmount)}
                        </div>
                      )}

                      {txn.incomePercentage && (
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                          <strong>Income Rate:</strong> {txn.incomePercentage}%
                        </div>
                      )}

                      {txn.description && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6, fontStyle: 'italic' }}>
                          {txn.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
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
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try { const t = await getMyTransactions(); setRows(t.transactions || []); }
      catch (e) { setError(e.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading transactions..." />;
  if (error) return <ErrorBox message={error} />;

  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

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
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="subtitle">Click any row to view complete details</p>
        </div>
      </div>
      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="table-empty">No transactions found</td></tr>}
              {rows.map((t) => (
                <>
                  <tr key={t._id} className="txn-row-clickable" onClick={() => toggle(t._id)}>
                    <td data-label="">
                      <span className={`txn-expand-icon ${expandedId === t._id ? 'open' : ''}`}>
                        <ChevronDown size={16} />
                      </span>
                    </td>
                    <td data-label="Type">
                      <span className={`txn-type-badge ${getTypeBadgeClass(t.type)}`}>{t.type.replace(/_/g, ' ')}</span>
                    </td>
                    <td data-label="Amount" className="cell-strong">{fmt(t.amount)}</td>
                    <td data-label="Status"><StatusBadge status={t.status} /></td>
                    <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                  </tr>
                  {expandedId === t._id && (
                    <tr className="txn-detail-row" key={`${t._id}-detail`}>
                      <td colSpan={5}>
                        <div className="txn-detail-panel">
                          <div className="txn-detail-grid">
                            <div className="txn-detail-item">
                              <span className="txn-detail-label">Transaction Type</span>
                              <span className="txn-detail-value">{getIncomeCategory(t.type) || t.type.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="txn-detail-item">
                              <span className="txn-detail-label">Amount</span>
                              <span className="txn-detail-value">{fmt(t.amount)}</span>
                            </div>
                            <div className="txn-detail-item">
                              <span className="txn-detail-label">Status</span>
                              <span className="txn-detail-value"><StatusBadge status={t.status} /></span>
                            </div>
                            <div className="txn-detail-item">
                              <span className="txn-detail-label">Wallet</span>
                              <span className="txn-detail-value">{getWalletLabel(t.type)}</span>
                            </div>
                            {t.metadata?.investmentAmount != null && (
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Downline Investment Amount</span>
                                <span className="txn-detail-value">{fmt(t.metadata.investmentAmount)}</span>
                              </div>
                            )}
                            {t.metadata?.percentage != null && (
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Income Percentage</span>
                                <span className="txn-detail-value">{t.metadata.percentage}%</span>
                              </div>
                            )}
                            {t.metadata?.level != null && (
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Level</span>
                                <span className="txn-detail-value">Level {t.metadata.level}</span>
                              </div>
                            )}
                            {t.investment?.user && (
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Downline Member</span>
                                <span className="txn-detail-value">{t.investment.user.name} ({t.investment.user.email})</span>
                              </div>
                            )}
                            {t.investment?.originalAmount != null && (
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Investment Amount</span>
                                <span className="txn-detail-value">{fmt(t.investment.originalAmount)}</span>
                              </div>
                            )}
                            {t.description && (
                              <div className="txn-detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="txn-detail-label">Description</span>
                                <span className="txn-detail-value">{t.description}</span>
                              </div>
                            )}
                            {t.reference && (
                              <div className="txn-detail-item">
                                <span className="txn-detail-label">Reference ID</span>
                                <span className="txn-detail-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.reference}</span>
                              </div>
                            )}
                            <div className="txn-detail-item">
                              <span className="txn-detail-label">Created</span>
                              <span className="txn-detail-value">{fmtDateTime(t.createdAt)}</span>
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
  const [roiRows, setRoiRows] = useState([]);
  const [progress, setProgress] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [directTxn, levelTxn, pendingTxn, w, roiRes] = await Promise.all([
          getMyTransactions({ type: 'DIRECT_INCOME' }),
          getMyTransactions({ type: 'LEVEL_INCOME' }),
          getMyTransactions({ type: 'PENDING_NETWORK_COMMISSION', limit: 500 }),
          getMyWallet(),
          getMyRoiHistory(),
        ]);
        const pending = pendingTxn.transactions || [];
        const pendingDirect = pending.filter((t) => t.metadata?.incomeType === 'DIRECT_INCOME');
        const pendingLevel = pending.filter((t) => t.metadata?.incomeType === 'LEVEL_INCOME');
        const markedDirect = pendingDirect.map((t) => ({ ...t, _pending: true }));
        const markedLevel = pendingLevel.map((t) => ({ ...t, _pending: true }));
        setDirectRows([...(directTxn.transactions || []), ...markedDirect]);
        setLevelRows([...(levelTxn.transactions || []), ...markedLevel]);
        setWallet(w.wallet);
        setRoiRows(roiRes.history || []);
        try { const pr = await getProgressData(); setProgress(pr); } catch (_) {}
      } catch (e) { setError(e.response?.data?.message || 'Failed to load income data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading income data..." />;
  if (error) return <ErrorBox message={error} />;

  const totalDirect = directRows.reduce((s, t) => s + (t.amount || 0), 0);
  const totalLevel = levelRows.reduce((s, t) => s + (t.amount || 0), 0);
  const totalRoi = wallet?.totalRoiEarned || 0;
  const totalProfitShare = wallet?.totalProfitShareEarned || 0;
  const totalIncome = totalDirect + totalLevel + totalRoi + totalProfitShare;

  const filteredRoiRows = roiRows.filter((r) => {
    if (dateFrom && new Date(r.roiDate) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.roiDate) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Income</h1>
          <p className="subtitle">Track all your income earnings in one place</p>
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
          <div className="stat-icon"><Percent size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total ROI</div>
            <div className="stat-value">{fmt(totalRoi)}</div>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Profit Share</div>
            <div className="stat-value">{fmt(totalProfitShare)}</div>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon"><WalletIcon size={22} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Income (All Incomes)</div>
            <div className="stat-value">{fmt(totalIncome)}</div>
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
                <tr key={t._id} style={t._pending ? { opacity: 0.75 } : undefined}>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-success cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status">{t._pending ? <span className="badge badge-amber" style={{ fontSize: 11 }}>Pending</span> : <StatusBadge status={t.status} />}</td>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                </tr>
              ))}
              {tab === 'level' && levelRows.map((t) => (
                <tr key={t._id} style={t._pending ? { opacity: 0.75 } : undefined}>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-blue cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status">{t._pending ? <span className="badge badge-amber" style={{ fontSize: 11 }}>Pending</span> : <StatusBadge status={t.status} />}</td>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROI Section (merged from separate ROI tab) */}
      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <div>
          <h2>ROI</h2>
          <p className="subtitle">Track your return on investment earnings</p>
        </div>
      </div>

      {progress && (
        <div>
          {/* 3X Cap Reached Alert */}
          {progress.percentage3x >= 100 && (
            <div style={{
              padding: '16px 20px', marginBottom: 'var(--space-4)',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.05) 100%)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#ef4444', marginBottom: 2 }}>
                  Your ROI Has Stopped
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  3X income limit reached ({fmt(progress.milestone3x)}). <strong>Invest more</strong> to unlock new limits and resume earning ROI.
                </div>
              </div>
            </div>
          )}

          {/* Combined 2X Progress */}
          {progress.milestone2x > 0 && (
            <div className="invest-progress-card" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="invest-progress-header">
                <div className="invest-progress-title">
                  <TrendingUp size={16} />
                  <span>2X Return Target: {fmt(progress.milestone2x)}</span>
                </div>
                <span className={`invest-progress-badge ${progress.percentage2x >= 100 ? 'completed' : 'active'}`}>
                  {progress.percentage2x >= 100 ? 'COMPLETED' : 'ACTIVE'}
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill green" style={{ width: `${Math.min(progress.percentage2x, 100)}%` }} />
              </div>
              <div className="invest-progress-info">
                <span>Returned: {fmt(progress.progress2x)}</span>
                <span>{progress.percentage2x}%</span>
              </div>
              {progress.remaining2x > 0 && (
                <div className="invest-progress-remaining">{fmt(progress.remaining2x)} remaining to reach 2X</div>
              )}
              {progress.percentage2x >= 100 && (
                <div className="invest-progress-complete">2X Milestone Reached!</div>
              )}
              {progress.cycle2xCompletions > 0 && (
                <div style={{ marginTop: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
                  ✅ 2X completed {progress.cycle2xCompletions} time{progress.cycle2xCompletions > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Global 3X Cap */}
          <div className="progress-section">
            <div className="progress-card progress-3x">
              <div className="progress-header">
                <div className="progress-title">
                  <BarChart3 size={18} />
                  <span>Income 3X Cap</span>
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
              {progress.remaining3x <= 0 && progress.totalInvestment > 0 && (
                <div style={{
                  marginTop: 8, padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: '#ef4444', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertCircle size={14} />
                  ROI Stopped — Invest More to Resume Earning
                </div>
              )}
              {progress.totalInvestment === 0 && (
                <div style={{
                  marginTop: 8, padding: '10px 14px',
                  background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: '#10b981', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Zap size={14} />
                  Start investing and upgrade your progress
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-4)', marginTop: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>From:</label>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ width: 160, padding: '6px 10px', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>To:</label>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ width: 160, padding: '6px 10px', fontSize: 13 }}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filteredRoiRows.length === 0 && <tr><td colSpan={3} className="table-empty">No ROI credited yet</td></tr>}
              {filteredRoiRows.map((r) => (
                <tr key={r._id}>
                  <td data-label="Amount" className="cell-strong">{fmt(r.roiAmount)}</td>
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
   DIRECT INCOME
   ========================================================= */
function UserDirectIncome() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [res, pendingRes] = await Promise.all([
          getMyTransactions({ type: 'DIRECT_INCOME' }),
          getMyTransactions({ type: 'PENDING_NETWORK_COMMISSION', limit: 500 }),
        ]);
        const credited = (res.transactions || []).map((t) => ({ ...t, _pending: false }));
        const pending = (pendingRes.transactions || [])
          .filter((t) => t.metadata?.incomeType === 'DIRECT_INCOME')
          .map((t) => ({ ...t, _pending: true }));
        setRows([...credited, ...pending]);
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
                <tr key={t._id} style={t._pending ? { opacity: 0.75 } : undefined}>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-success cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status">{t._pending ? <span className="badge badge-amber" style={{ fontSize: 11 }}>Pending</span> : <StatusBadge status={t.status} />}</td>
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
        const [res, pendingRes] = await Promise.all([
          getMyTransactions({ type: 'LEVEL_INCOME' }),
          getMyTransactions({ type: 'PENDING_NETWORK_COMMISSION', limit: 500 }),
        ]);
        const credited = (res.transactions || []).map((t) => ({ ...t, _pending: false }));
        const pending = (pendingRes.transactions || [])
          .filter((t) => t.metadata?.incomeType === 'LEVEL_INCOME')
          .map((t) => ({ ...t, _pending: true }));
        setRows([...credited, ...pending]);
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
                <tr key={t._id} style={t._pending ? { opacity: 0.75 } : undefined}>
                  <td data-label="Date">{fmtDateTime(t.createdAt)}</td>
                  <td data-label="Level" className="cell-strong">{t.metadata?.level ? `Level ${t.metadata.level}` : '—'}</td>
                  <td data-label="From" className="cell-strong">{t.description || 'Referral'}</td>
                  <td data-label="Investment">{fmt(t.metadata?.investmentAmount)}</td>
                  <td data-label="Income %">{t.metadata?.percentage ? `${t.metadata.percentage}%` : '—'}</td>
                  <td data-label="Amount" className="text-blue cell-strong">{fmt(t.amount)}</td>
                  <td data-label="Status">{t._pending ? <span className="badge badge-amber" style={{ fontSize: 11 }}>Pending</span> : <StatusBadge status={t.status} />}</td>
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
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    try {
      await uploadMyProfilePhoto(photoFile);
      setPhotoFile(null);
      toastSuccess('Photo Updated', 'Your profile photo has been updated.');
      await load();
    } catch (e) {
      toastError('Upload Failed', e.response?.data?.message || 'Failed to upload photo');
    } finally { setUploadingPhoto(false); }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'var(--space-4)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: 'var(--color-bg-alt)', border: '2px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {u.avatar ? (
              <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-secondary)' }}>{u.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 6 }}>Profile Photo</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => setPhotoFile(e.target.files[0] || null)}
              style={{ fontSize: 13, display: 'block' }}
            />
            {photoFile && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={uploadPhoto} disabled={uploadingPhoto}>
                {uploadingPhoto ? <><span className="spinner" /> Uploading...</> : 'Upload Photo'}
              </button>
            )}
          </div>
        </div>

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

            <div className="form-group">
              <label className="form-label">Primary Email</label>
              <input className="form-input" value={u.email} disabled style={{ opacity: 0.6 }} />
              <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>Primary email cannot be changed</p>
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

/* =========================================================
   ANNOUNCEMENTS PAGE
   ========================================================= */
function UserAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getActiveAnnouncements();
        setAnnouncements(data.announcements || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load announcements'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading announcements..." />;
  if (error) return <ErrorBox message={error} />;

  const typeColors = {
    INFO: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', icon: 'info', color: '#3b82f6' },
    PROMOTION: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: 'party', color: '#10b981' },
    WARNING: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: 'warning', color: '#f59e0b' },
    UPDATE: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', icon: 'refresh', color: '#6366f1' },
    EVENT: { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.3)', icon: 'calendar', color: '#ec4899' },
  };

  const typeLabels = { INFO: 'Info', PROMOTION: 'Promotion', WARNING: 'Warning', UPDATE: 'Update', EVENT: 'Event' };
  const priorityLabels = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>Announcements</h1>
          <p className="subtitle">Stay updated with the latest news and updates</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <EmptyState title="No announcements" subtitle="There are no active announcements at the moment." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {announcements.map((a) => {
            const tc = typeColors[a.type] || typeColors.INFO;
            return (
              <div key={a._id} style={{
                background: 'var(--color-surface)',
                border: `1px solid ${tc.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                borderLeft: `4px solid ${tc.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <span style={{
                    background: tc.bg,
                    color: tc.color,
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                  }}>
                    {typeLabels[a.type] || a.type}
                  </span>
                  {a.priority && a.priority !== 'MEDIUM' && (
                    <span style={{
                      background: a.priority === 'URGENT' || a.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
                      color: a.priority === 'URGENT' || a.priority === 'HIGH' ? '#ef4444' : '#9ca3af',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                    }}>
                      {priorityLabels[a.priority] || a.priority}
                    </span>
                  )}
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
                    {new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text)' }}>
                  {a.title}
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: 'var(--font-size-sm)' }}>
                  {a.message}
                </p>
                {a.images && a.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                    {a.images.map((img, i) => (
                      <img key={i} src={img.url} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
