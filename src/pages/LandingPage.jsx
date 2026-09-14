import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  TrendingUp, ArrowUpRight, Wallet, Shield, Users, BarChart3,
  DollarSign, Zap, Lock, LineChart, ArrowRight, Sun, Moon,
  MessageSquare, X, Send,
} from 'lucide-react';
import '../styles/landing.css';
import logoBlack from '../images/black-logo.png';
import logoWhite from '../images/white-logo.png';
import companyLogo from '../images/company-logo.png';
import { useAuth } from '../context/AuthContext';
import {
  getUserConversations,
  getUserMessages,
  createUserConversation,
  sendUserMessage,
  closeConversation,
} from '../services/apiClient';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { icon: TrendingUp, title: 'Daily ROI Returns', desc: 'Earn consistent daily returns on your investments with our data-driven strategies.' },
  { icon: Shield, title: 'Bank-Grade Security', desc: 'Your assets are protected with enterprise-level encryption and secure wallets.' },
  { icon: Users, title: 'Referral Network', desc: 'Build your team and earn direct and level income from your growing network.' },
  { icon: Wallet, title: 'Multi-Wallet System', desc: 'Manage Main, ROI, E-Wallet, Fund Wallet — all from one clean dashboard.' },
  { icon: BarChart3, title: 'Real-Time Tracking', desc: 'Monitor your portfolio growth, earnings, and network activity live.' },
  { icon: Lock, title: 'Transparent Rules', desc: 'No hidden fees, no surprises. Every transaction is visible in your history.' },
];

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Sign up with a referral code and set up your profile in under a minute.' },
  { num: '02', title: 'Fund Wallet', desc: 'Deposit via bank transfer, JazzCash, or EasyPaisa into your wallet.' },
  { num: '03', title: 'Start Investing', desc: 'Choose your amount, split across wallets, and start earning daily ROI.' },
  { num: '04', title: 'Grow Network', desc: 'Refer others, build your team, and earn additional network income.' },
];

const WALLETS = [
  { name: 'Main Wallet', sub: 'Primary balance', icon: DollarSign },
  { name: 'ROI Wallet', sub: 'Daily returns', icon: TrendingUp },
  { name: 'E-Wallet', sub: 'Bonuses & perks', icon: Zap },
  { name: 'Profit Share', sub: 'Revenue share', icon: BarChart3 },
  { name: 'Fund Wallet', sub: 'Team transfers', icon: Wallet },
];

const GROWTH_BARS = [
  { h: 35, label: 'Jan' }, { h: 42, label: 'Feb' }, { h: 38, label: 'Mar' },
  { h: 55, label: 'Apr' }, { h: 48, label: 'May' }, { h: 62, label: 'Jun' },
  { h: 58, label: 'Jul' }, { h: 72, label: 'Aug' }, { h: 68, label: 'Sep' },
  { h: 80, label: 'Oct' }, { h: 85, label: 'Nov' }, { h: 95, label: 'Dec' },
];

/* ─────────────────────────────────────────────────────────
   Landing Chat Panel — reuses existing chat API
   ───────────────────────────────────────────────────────── */
function LandingChatPanel({ open, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  const scrollBottom = () => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (open && isAuthenticated) loadConversations();
  }, [open, isAuthenticated]);

  useEffect(() => {
    if (activeConvo) loadMessages(activeConvo._id);
  }, [activeConvo]);

  useEffect(() => { scrollBottom(); }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getUserConversations();
      setConversations(data.conversations || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const loadMessages = async (id) => {
    try {
      setLoading(true);
      const data = await getUserMessages(id);
      setMessages(data.messages || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleNewConversation = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const data = await createUserConversation({ subject: newSubject || 'Support Request', message: newMessage });
      setShowNew(false);
      setNewSubject('');
      setNewMessage('');
      await loadConversations();
      setActiveConvo(data.conversation);
    } catch (_) {}
    finally { setSending(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvo) return;
    setSending(true);
    try {
      const data = await sendUserMessage(activeConvo._id, input);
      setMessages((prev) => [...prev, data.message]);
      setInput('');
      await loadConversations();
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (_) {}
    finally { setSending(false); }
  };

  const handleClose = async (id) => {
    try {
      await closeConversation(id);
      if (activeConvo?._id === id) { setActiveConvo(null); setMessages([]); }
      await loadConversations();
    } catch (_) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!open) return null;

  /* Not logged in — show login prompt */
  if (!isAuthenticated) {
    return (
      <div className="l-chat-panel">
        <div className="l-chat-panel-header">
          <div className="l-chat-panel-header-title">Support Chat</div>
          <button className="l-chat-panel-back" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="l-chat-login-prompt">
          <MessageSquare size={32} style={{ color: 'var(--brand-green)', opacity: 0.5 }} />
          <p>Login to access support chat and get help from our team.</p>
          <Link to="/login" className="l-chat-login-btn" onClick={onClose}>
            Login to Chat <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = (s) => s === 'OPEN' ? '#22C55E' : s === 'IN_PROGRESS' ? '#F59E0B' : s === 'RESOLVED' ? '#10B981' : '#6B7280';
  const statusBg = (s) => s === 'OPEN' ? 'rgba(34,197,94,0.1)' : s === 'IN_PROGRESS' ? 'rgba(245,158,11,0.1)' : s === 'RESOLVED' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)';

  return (
    <div className="l-chat-panel">
      <div className="l-chat-panel-header">
        <div className="l-chat-panel-header-title">Support Chat</div>
        {activeConvo ? (
          <button className="l-chat-panel-back" onClick={() => { setActiveConvo(null); setMessages([]); }}>
            ← Back
          </button>
        ) : (
          <button className="l-chat-panel-back" onClick={onClose}><X size={18} /></button>
        )}
      </div>

      <div className="l-chat-panel-body">
        {/* Conversation list */}
        {!activeConvo && !showNew && (
          <div className="l-chat-panel-list">
            <button className="l-chat-panel-new-btn" onClick={() => setShowNew(true)}>
              + New Conversation
            </button>
            {loading && <div className="l-chat-panel-loading">Loading...</div>}
            {!loading && conversations.length === 0 && (
              <div className="l-chat-panel-empty">No conversations yet. Start a new one!</div>
            )}
            {conversations.map((c) => (
              <div
                key={c._id}
                className="l-chat-panel-convo"
                onClick={() => setActiveConvo(c)}
              >
                <div className="l-chat-panel-convo-header">
                  <span className="l-chat-panel-convo-title">{c.subject}</span>
                  <span
                    className="l-chat-panel-convo-status"
                    style={{ background: statusBg(c.status), color: statusColor(c.status) }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="l-chat-panel-convo-last">{c.lastMessage}</div>
                <div className="l-chat-panel-convo-time">
                  {new Date(c.lastMessageAt).toLocaleDateString()}
                  {c.unreadByUser > 0 && (
                    <span className="l-chat-panel-unread">{c.unreadByUser} new</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New conversation form */}
        {showNew && (
          <div className="l-chat-form">
            <input
              placeholder="Subject (optional)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <textarea
              placeholder="How can we help you?"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={5}
              style={{ flex: 1, resize: 'none' }}
            />
            <div className="l-chat-form-actions">
              <button className="l-chat-form-cancel" onClick={() => setShowNew(false)}>Cancel</button>
              <button
                className="l-chat-form-send"
                onClick={handleNewConversation}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {activeConvo && (
          <>
            <div className="l-chat-messages">
              {loading && <div className="l-chat-panel-loading">Loading...</div>}
              {messages.map((m) => {
                const isUser = m.senderRole === 'USER';
                return (
                  <div key={m._id} className={`l-chat-msg ${isUser ? 'user' : 'admin'}`}>
                    <div className="l-chat-msg-bubble">
                      <div>{m.message}</div>
                      <div className="l-chat-msg-time">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEnd} />
            </div>
            <div className="l-chat-input-bar">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
              />
              <button
                className="l-chat-send-btn"
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
  );
}

/* ─────────────────────────────────────────────────────────
   Main Landing Page
   ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef(null);
  const navRef = useRef(null);

  /* Theme */
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('landing-theme') || 'light'; }
    catch { return 'light'; }
  });

  /* Chat */
  const [chatOpen, setChatOpen] = useState(false);

  /* Apply theme */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try { localStorage.setItem('landing-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => t === 'light' ? 'dark' : 'light');
  }, []);

  /* Sticky nav */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* GSAP */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.l-hero-badge', { opacity: 0, y: 20, duration: 0.6 })
        .from('.l-hero-title .line', { opacity: 0, y: 40, duration: 0.7, stagger: 0.12 }, '-=0.3')
        .from('.l-hero-desc', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3')
        .from('.l-hero-ctas', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
        .from('.l-hero-stats', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
        .from('.l-hero-logo', { opacity: 0, scale: 0.9, duration: 0.8, ease: 'power2.out' }, '-=0.6');

      gsap.utils.toArray('.gsap-reveal').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        });
      });

      gsap.utils.toArray('.gsap-reveal-left').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, x: -40 }, {
          opacity: 1, x: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });

      gsap.utils.toArray('.gsap-reveal-right').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, x: 40 }, {
          opacity: 1, x: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });

      gsap.fromTo('.l-feature-panel', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: '.l-features-grid', start: 'top 80%' },
      });

      gsap.fromTo('.l-step', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: '.l-steps-timeline', start: 'top 80%' },
      });

      gsap.fromTo('.l-wallet-card', { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: '.l-wallets-grid', start: 'top 80%' },
      });

      gsap.utils.toArray('.l-growth-bar').forEach((bar) => {
        const h = bar.getAttribute('data-height') || '60%';
        gsap.fromTo(bar, { height: '0%' }, {
          height: h, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: bar, start: 'top 85%' },
        });
      });

      gsap.fromTo('.l-net-node', { opacity: 0, scale: 0 }, {
        opacity: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '.l-network-visual', start: 'top 75%' },
      });

      gsap.fromTo('.l-about-bar', { height: 0 }, {
        height: (i, el) => el.getAttribute('data-height') || '60%',
        duration: 0.6, stagger: 0.05, ease: 'power2.out',
        scrollTrigger: { trigger: '.l-about-visual', start: 'top 80%' },
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing" ref={heroRef}>
      {/* ═══ NAVBAR ═══ */}
      <nav className="l-nav" ref={navRef}>
        <div className="l-container">
          <div className="l-nav-inner">
            <Link to="/" className="l-nav-logo">
              <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Fin Rise Global" className="l-nav-logo-img" />
            </Link>
            <ul className="l-nav-links">
              <li><a href="#intro" className="l-nav-link">About</a></li>
              <li><a href="#growth" className="l-nav-link">Returns</a></li>
              <li><a href="#features" className="l-nav-link">Features</a></li>
              <li><a href="#wallets" className="l-nav-link">Wallets</a></li>
              <li><a href="#how" className="l-nav-link">How It Works</a></li>
            </ul>
            <div className="l-nav-actions">
              <Link to="/login" className="l-nav-link">Login</Link>
              <Link to="/register" className="l-nav-cta">Get Started <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="l-hero">
        {/* Decorative lines */}
        <div className="l-hero-line-v left" />
        <div className="l-hero-line-v right" />
        <div className="l-hero-line-h top" />
        <div className="l-hero-line-h bottom" />

        <div className="l-hero-grid l-container">
          <div className="l-hero-content">
            <div className="l-hero-badge">
              <span className="l-hero-badge-dot" />
              Trusted by 10,000+ Investors
            </div>
            <h1 className="l-hero-title">
              <span className="line">Build Your</span>
              <span className="line"><span className="accent">Money</span> Smarter</span>
            </h1>
            <p className="l-hero-desc">
              Fin Rise Global gives you the tools to invest, earn daily returns, and grow a referral network — all from one platform.
            </p>
            <div className="l-hero-ctas">
              <Link to="/register" className="l-hero-cta-primary">
                Start Investing <ArrowRight size={18} />
              </Link>
              <a href="#how" className="l-hero-cta-secondary">Learn More</a>
            </div>
            <div className="l-hero-stats">
              <div>
                <div className="l-hero-stat-num">10K+</div>
                <div className="l-hero-stat-label">Active Investors</div>
              </div>
              <div>
                <div className="l-hero-stat-num">$5M+</div>
                <div className="l-hero-stat-label">Total Invested</div>
              </div>
              <div>
                <div className="l-hero-stat-num">2X</div>
                <div className="l-hero-stat-label">Max ROI Return</div>
              </div>
            </div>
          </div>
          <div className="l-hero-visual">
            <img src={companyLogo} alt="Fin Rise Global" className="l-hero-logo" />
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="l-trust">
        <div className="l-container">
          <div className="l-trust-grid gsap-reveal">
            <div className="l-trust-item">
              <div className="l-trust-num">10K+</div>
              <div className="l-trust-label">Active Investors</div>
            </div>
            <div className="l-trust-item">
              <div className="l-trust-num">$5M+</div>
              <div className="l-trust-label">Total Invested</div>
            </div>
            <div className="l-trust-item">
              <div className="l-trust-num">2X</div>
              <div className="l-trust-label">Max Return</div>
            </div>
            <div className="l-trust-item">
              <div className="l-trust-num">24/7</div>
              <div className="l-trust-label">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT / INTRO ═══ */}
      <section id="intro" className="l-about">
        <div className="l-container">
          <div className="l-about-grid">
            <div className="gsap-reveal-left">
              <div className="l-about-eyebrow">About the Platform</div>
              <h2 className="l-about-heading">
                <span className="w">Manage.</span>{' '}
                <span className="b">Invest.</span>{' '}
                <span className="g">Grow.</span>
              </h2>
              <p className="l-about-text">
                One platform to manage your investments, track your returns, and build a network that earns while you sleep. Built for serious investors who value transparency and consistency.
              </p>
              <a href="#features" className="l-hero-cta-secondary" style={{ display: 'inline-flex' }}>
                Explore Features <ArrowRight size={16} />
              </a>
            </div>
            <div className="l-about-visual gsap-reveal-right">
              <div className="l-about-label">Portfolio Growth</div>
              <div className="l-about-visual-inner">
                {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                  <div
                    key={i}
                    className="l-about-bar"
                    data-height={`${h}%`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GROWTH ═══ */}
      <section id="growth" className="l-growth">
        <div className="l-container">
          <div className="l-growth-grid">
            <div className="gsap-reveal-left">
              <div className="l-growth-header">
                <div className="l-section-label">Growth</div>
                <h2 className="l-section-title">Watch Your<br />Wealth Compound</h2>
                <p className="l-section-subtitle" style={{ marginTop: 16 }}>
                  Our investment engine works around the clock. Daily ROI distributions keep your portfolio growing consistently.
                </p>
              </div>
              <div className="l-growth-stats">
                <div className="l-growth-stat">
                  <div className="l-growth-stat-num">$5M+</div>
                  <div className="l-growth-stat-label">Total Invested</div>
                </div>
                <div className="l-growth-stat">
                  <div className="l-growth-stat-num">$2M+</div>
                  <div className="l-growth-stat-label">Returns Paid</div>
                </div>
                <div className="l-growth-stat">
                  <div className="l-growth-stat-num">2X</div>
                  <div className="l-growth-stat-label">Max Return</div>
                </div>
              </div>
            </div>
            <div className="gsap-reveal-right">
              <div className="l-growth-chart">
                <div className="l-growth-bars">
                  {GROWTH_BARS.map((b, i) => (
                    <div
                      key={i}
                      className="l-growth-bar"
                      data-height={`${b.h}%`}
                      data-label={b.label}
                      style={{ height: `${b.h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="l-features">
        <div className="l-container">
          <div className="l-features-header gsap-reveal">
            <div className="l-section-label">Features</div>
            <h2 className="l-section-title">Everything You Need</h2>
          </div>
          <div className="l-features-grid">
            {/* Large featured panel */}
            <div className="l-feature-panel l-feature-large">
              <div>
                <div className="l-feature-icon-wrap"><TrendingUp size={28} /></div>
                <div className="l-feature-title">Daily ROI Returns</div>
                <div className="l-feature-desc">Earn consistent daily returns on your investments with our data-driven strategies.</div>
              </div>
              <div className="l-feature-visual">
                <div className="l-feature-visual-block">
                  <div className="l-feature-visual-num">2X</div>
                  <div className="l-feature-visual-label">Max Return</div>
                </div>
                <div className="l-feature-visual-block">
                  <div className="l-feature-visual-num">Daily</div>
                  <div className="l-feature-visual-label">Distribution</div>
                </div>
              </div>
            </div>
            {/* Small panels */}
            {FEATURES.slice(1, 3).map((f) => {
              const Icon = f.icon;
              return (
                <div className="l-feature-panel l-feature-small" key={f.title}>
                  <div className="l-feature-icon-wrap"><Icon size={22} /></div>
                  <div className="l-feature-title">{f.title}</div>
                  <div className="l-feature-desc">{f.desc}</div>
                </div>
              );
            })}
            {/* Third row */}
            {FEATURES.slice(3).map((f) => {
              const Icon = f.icon;
              return (
                <div className="l-feature-panel l-feature-third" key={f.title}>
                  <div className="l-feature-icon-wrap"><Icon size={20} /></div>
                  <div className="l-feature-title">{f.title}</div>
                  <div className="l-feature-desc">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ WALLET ECOSYSTEM ═══ */}
      <section id="wallets" className="l-wallets">
        <div className="l-container">
          <div className="l-wallets-header gsap-reveal">
            <div>
              <div className="l-section-label">Wallets</div>
              <h2 className="l-section-title">Five Wallets.<br />One Dashboard.</h2>
            </div>
            <p className="l-section-subtitle">
              Every balance has a purpose. Manage them all from a single, clean interface.
            </p>
          </div>
          <div className="l-wallets-grid">
            {WALLETS.map((w) => {
              const Icon = w.icon;
              return (
                <div className="l-wallet-card" key={w.name}>
                  <div className="l-wallet-icon"><Icon size={18} /></div>
                  <div className="l-wallet-name">{w.name}</div>
                  <div className="l-wallet-desc">{w.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ NETWORK ═══ */}
      <section className="l-network">
        <div className="l-container">
          <div className="l-network-grid">
            <div className="gsap-reveal-left">
              <div className="l-section-label">Network</div>
              <h2 className="l-network-heading">Build Your<br />Income Tree</h2>
              <p className="l-network-text">
                Earn from two levels of referrals. Direct income from your invitees, and level income from their invitees.
              </p>
              <Link to="/register" className="l-hero-cta-primary">
                Join Now <ArrowRight size={18} />
              </Link>
            </div>
            <div className="l-network-visual gsap-reveal-right">
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
                <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="rgba(34,197,94,0.15)" strokeWidth="1.5" />
                <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="rgba(34,197,94,0.15)" strokeWidth="1.5" />
                <line x1="50%" y1="50%" x2="20%" y2="65%" stroke="rgba(34,197,94,0.12)" strokeWidth="1.5" />
                <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="rgba(34,197,94,0.12)" strokeWidth="1.5" />
                <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="rgba(34,197,94,0.1)" strokeWidth="1.5" />
                <line x1="25%" y1="20%" x2="12%" y2="8%" stroke="rgba(34,197,94,0.08)" strokeWidth="1" />
                <line x1="25%" y1="20%" x2="35%" y2="5%" stroke="rgba(34,197,94,0.08)" strokeWidth="1" />
                <line x1="75%" y1="25%" x2="88%" y2="12%" stroke="rgba(34,197,94,0.08)" strokeWidth="1" />
                <line x1="75%" y1="25%" x2="65%" y2="8%" stroke="rgba(34,197,94,0.08)" strokeWidth="1" />
              </svg>
              <div className="l-net-node l-net-center" style={{ top: '44%', left: '44%' }}>You</div>
              <div className="l-net-node l-net-primary" style={{ top: '15%', left: '20%' }}>AK</div>
              <div className="l-net-node l-net-primary" style={{ top: '18%', right: '18%' }}>SM</div>
              <div className="l-net-node l-net-primary" style={{ bottom: '28%', left: '14%' }}>RA</div>
              <div className="l-net-node l-net-primary" style={{ bottom: '22%', right: '16%' }}>MK</div>
              <div className="l-net-node l-net-secondary" style={{ top: '3%', left: '8%' }}>+</div>
              <div className="l-net-node l-net-secondary" style={{ top: '0%', right: '10%' }}>+</div>
              <div className="l-net-node l-net-tertiary" style={{ bottom: '10%', left: '5%' }}>+</div>
              <div className="l-net-node l-net-tertiary" style={{ bottom: '8%', right: '6%' }}>+</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="l-steps">
        <div className="l-container">
          <div className="l-steps-header gsap-reveal">
            <div className="l-section-label">How It Works</div>
            <h2 className="l-section-title">Start in Four Steps</h2>
            <p className="l-section-subtitle">
              From sign-up to your first earnings in under 10 minutes.
            </p>
          </div>
          <div className="l-steps-timeline">
            {STEPS.map((s) => (
              <div className="l-step" key={s.num}>
                <div className="l-step-num">{s.num}</div>
                <div className="l-step-title">{s.title}</div>
                <div className="l-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM / INVESTMENT ═══ */}
      <section className="l-platform">
        <div className="l-container">
          <div className="l-platform-grid">
            <div className="gsap-reveal-left">
              <div className="l-section-label">Platform</div>
              <h2 className="l-platform-heading">Your Investment<br />Command Center</h2>
              <p className="l-platform-text">
                A clean, powerful dashboard that puts you in control. Track every dollar, every referral, every earning — all in real time.
              </p>
              <Link to="/register" className="l-hero-cta-primary">
                Get Started <ArrowRight size={18} />
              </Link>
            </div>
            <div className="l-platform-visual gsap-reveal-right">
              <div className="l-platform-mock-header">
                <div className="l-platform-mock-dot" />
                <div className="l-platform-mock-dot" />
                <div className="l-platform-mock-dot" />
              </div>
              <div className="l-platform-mock-body">
                <div className="l-platform-mock-card">
                  <div className="l-platform-mock-label">Main Balance</div>
                  <div className="l-platform-mock-value">$8,420</div>
                </div>
                <div className="l-platform-mock-card">
                  <div className="l-platform-mock-label">ROI Earned</div>
                  <div className="l-platform-mock-value">$2,150</div>
                </div>
                <div className="l-platform-mock-chart">
                  {[35, 50, 42, 65, 55, 78, 68, 85, 80, 92].map((h, i) => (
                    <div key={i} className="l-platform-mock-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="l-cta">
        <div className="l-container">
          <div className="l-cta-inner gsap-reveal">
            <h2 className="l-cta-title">Ready to Grow<br />Your Wealth?</h2>
            <p className="l-cta-text">
              Join thousands of investors building their financial future with Fin Rise Global.
            </p>
            <Link to="/register" className="l-cta-btn">
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="l-footer">
        <div className="l-container">
          <div className="l-footer-grid">
            <div className="l-footer-brand-col">
              <img src={logoWhite} alt="Fin Rise Global" className="l-footer-logo" />
              <p className="l-footer-text">
                Empowering financial growth through smart investment solutions and transparent practices.
              </p>
            </div>
            <div>
              <h4 className="l-footer-heading">Platform</h4>
              <ul className="l-footer-links">
                <li><a href="#features" className="l-footer-link">Features</a></li>
                <li><a href="#wallets" className="l-footer-link">Wallets</a></li>
                <li><a href="#how" className="l-footer-link">How It Works</a></li>
                <li><a href="#growth" className="l-footer-link">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="l-footer-heading">Company</h4>
              <ul className="l-footer-links">
                <li><a href="#intro" className="l-footer-link">About</a></li>
                <li><a href="#features" className="l-footer-link">Referral Program</a></li>
                <li><a href="#" className="l-footer-link">Careers</a></li>
                <li><a href="#" className="l-footer-link">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="l-footer-heading">Legal</h4>
              <ul className="l-footer-links">
                <li><a href="#" className="l-footer-link">Privacy Policy</a></li>
                <li><a href="#" className="l-footer-link">Terms of Service</a></li>
                <li><a href="#" className="l-footer-link">Risk Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="l-footer-bottom">
            <span className="l-footer-bottom-text">
              &copy; {new Date().getFullYear()} Fin Rise Global. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* ═══ BOTTOM CONTROLS ═══ */}
      <div className="l-bottom-controls">
        {/* WhatsApp — Bottom Left */}
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="l-whatsapp-btn"
          title="Chat on WhatsApp"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

        {/* Theme Toggle — Bottom Center */}
        <div className="l-theme-toggle">
          <button
            className={`l-theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
            title="Light mode"
          >
            <Sun size={18} />
          </button>
          <button
            className={`l-theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
            title="Dark mode"
          >
            <Moon size={18} />
          </button>
        </div>

        {/* Chat — Bottom Right */}
        <button
          className="l-chat-btn"
          onClick={() => setChatOpen((o) => !o)}
          title="Support Chat"
        >
          {chatOpen ? <X size={22} /> : <MessageSquare size={22} />}
        </button>
      </div>

      {/* Chat Panel */}
      <LandingChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
