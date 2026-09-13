import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  TrendingUp, ArrowUpRight, Wallet, Shield, Users, BarChart3,
  DollarSign, Zap, Lock, LineChart, ArrowRight,
} from 'lucide-react';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { icon: TrendingUp, color: 'v', title: 'Daily ROI Returns', desc: 'Earn consistent daily returns on your investments with our data-driven strategies.' },
  { icon: Shield, color: 't', title: 'Bank-Grade Security', desc: 'Your assets are protected with enterprise-level encryption and secure wallets.' },
  { icon: Users, color: 'c', title: 'Referral Network', desc: 'Build your team and earn direct and level income from your growing network.' },
  { icon: Wallet, color: 'y', title: 'Multi-Wallet System', desc: 'Manage Main, ROI, E-Wallet, Fund Wallet — all from one clean dashboard.' },
  { icon: BarChart3, color: 'p', title: 'Real-Time Tracking', desc: 'Monitor your portfolio growth, earnings, and network activity live.' },
  { icon: Lock, color: 'v', title: 'Transparent Rules', desc: 'No hidden fees, no surprises. Every transaction is visible in your history.' },
];

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Sign up with a referral code and set up your profile in under a minute.' },
  { num: '02', title: 'Fund Wallet', desc: 'Deposit via bank transfer, JazzCash, or EasyPaisa into your wallet.' },
  { num: '03', title: 'Start Investing', desc: 'Choose your amount, split across wallets, and start earning daily ROI.' },
  { num: '04', title: 'Grow Network', desc: 'Refer others, build your team, and earn additional network income.' },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const navRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

  /* Sticky nav scroll effect */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* GSAP Animations */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Hero entrance */
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.l-hero-badge', { opacity: 0, y: 20, duration: 0.6 })
        .from('.l-hero-title .line', { opacity: 0, y: 40, duration: 0.7, stagger: 0.1 }, '-=0.3')
        .from('.l-hero-desc', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3')
        .from('.l-hero-ctas', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
        .from('.l-hero-stats', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
        .from('.l-hero-card-main', { opacity: 0, x: 40, duration: 0.7 }, '-=0.6')
        .from('.l-float', { opacity: 0, scale: 0.8, duration: 0.5, stagger: 0.1 }, '-=0.4');

      /* Floating elements gentle motion */
      gsap.to('.l-float-1', { y: -8, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.l-float-2', { y: 10, duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 });
      gsap.to('.l-float-3', { y: -6, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });
      gsap.to('.l-float-4', { y: 8, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.3 });

      /* Scroll reveals */
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

      /* Feature panels stagger */
      gsap.fromTo('.l-feature-panel', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: '.l-features-track', start: 'top 80%' },
      });

      /* Steps stagger */
      gsap.fromTo('.l-step', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: '.l-steps-grid', start: 'top 80%' },
      });

      /* Wallet items stagger */
      gsap.fromTo('.l-wallet-item', { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: '.l-wallets-grid', start: 'top 80%' },
      });

      /* Growth bar animation */
      gsap.utils.toArray('.l-growth-bar').forEach((bar) => {
        const h = bar.getAttribute('data-height') || '60%';
        gsap.fromTo(bar, { height: '0%' }, {
          height: h, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: bar, start: 'top 85%' },
        });
      });

      /* Network nodes */
      gsap.fromTo('.l-network-node', { opacity: 0, scale: 0 }, {
        opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '.l-network-visual', start: 'top 75%' },
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing" ref={heroRef}>
      {/* ===== NAVBAR ===== */}
      <nav className="l-nav" ref={navRef}>
        <div className="l-nav-inner">
          <Link to="/" className="l-nav-logo">
            <div className="l-nav-logo-mark">FR</div>
            Fin Rise Global
          </Link>
          <div className="l-nav-links" id="navLinks">
            <a href="#intro" className="l-nav-link">About</a>
            <a href="#growth" className="l-nav-link">Returns</a>
            <a href="#features" className="l-nav-link">Features</a>
            <a href="#wallets" className="l-nav-link">Wallets</a>
            <a href="#how" className="l-nav-link">How It Works</a>
          </div>
          <div className="l-nav-actions" id="navActions">
            <Link to="/login" className="l-btn l-btn-login">Login</Link>
            <Link to="/register" className="l-btn l-btn-primary">Get Started</Link>
          </div>
          <button className="l-nav-toggle" onClick={() => {
            document.getElementById('navLinks')?.classList.toggle('mobile-open');
            document.getElementById('navActions')?.classList.toggle('mobile-open');
            document.querySelector('.l-nav-toggle')?.classList.toggle('open');
          }}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="l-hero">
        <div className="l-hero-grid l-container">
          <div className="l-hero-left">
            <div className="l-hero-badge">
              <span className="l-hero-badge-dot" />
              Trusted by 10,000+ Investors
            </div>
            <h1 className="l-hero-title">
              <span className="line" style={{ display: 'block' }}>Build Your</span>
              <span className="line" style={{ display: 'block' }}><span className="l-hero-title-accent">Money</span> Smarter</span>
            </h1>
            <p className="l-hero-desc">
              Fin Rise Global gives you the tools to invest, earn daily returns, and grow a referral network — all from one platform.
            </p>
            <div className="l-hero-ctas">
              <Link to="/register" className="l-btn l-btn-primary l-btn-lg">
                Start Investing <ArrowRight size={18} />
              </Link>
              <a href="#how" className="l-btn l-btn-outline l-btn-lg">Learn More</a>
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
            {/* Main investment card */}
            <div className="l-hero-card-main">
              <div className="l-hero-card-header">
                <div>
                  <div className="l-hero-card-label">Portfolio Value</div>
                  <div className="l-hero-card-amount">$24,850</div>
                  <div className="l-hero-card-change">
                    <ArrowUpRight size={14} /> +12.4%
                  </div>
                </div>
              </div>
              <div className="l-hero-chart">
                <svg viewBox="0 0 400 140" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="heroChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B4BFF" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#5B4BFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="l-hero-chart-area" d="M0,120 C40,100 80,90 120,70 C160,50 200,60 240,40 C280,20 320,30 360,15 L400,10 L400,140 L0,140 Z" />
                  <path className="l-hero-chart-line" d="M0,120 C40,100 80,90 120,70 C160,50 200,60 240,40 C280,20 320,30 360,15 L400,10" />
                </svg>
              </div>
              <div className="l-hero-card-metrics">
                <div>
                  <div className="l-hero-metric-label">Total Earned</div>
                  <div className="l-hero-metric-value">$4,850</div>
                </div>
                <div>
                  <div className="l-hero-metric-label">Active Investments</div>
                  <div className="l-hero-metric-value">12</div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="l-float l-float-1">
              <div className="l-float-icon teal"><TrendingUp size={18} /></div>
              <div>
                <div className="l-float-value">+$2,450</div>
                <div className="l-float-sub">Monthly Returns</div>
              </div>
            </div>
            <div className="l-float l-float-2">
              <div className="l-float-icon coral"><DollarSign size={18} /></div>
              <div>
                <div className="l-float-value">ROI +12.4%</div>
                <div className="l-float-sub">This Quarter</div>
              </div>
            </div>
            <div className="l-float l-float-3">
              <div className="l-float-icon yellow"><Users size={18} /></div>
              <div>
                <div className="l-float-value">Team: 48</div>
                <div className="l-float-sub">Active Members</div>
              </div>
            </div>
            <div className="l-float l-float-4">
              <div className="l-float-icon violet"><Wallet size={18} /></div>
              <div>
                <div className="l-float-value">$12,400</div>
                <div className="l-float-sub">Wallet Balance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORM INTRO ===== */}
      <section id="intro" className="l-intro">
        <div className="l-intro-grid l-container">
          <div className="gsap-reveal-left">
            <div className="l-intro-words">
              <span className="l-intro-word violet">Manage.</span>
              <span className="l-intro-word teal">Invest.</span>
              <span className="l-intro-word coral">Grow.</span>
            </div>
            <p className="l-intro-para">
              One platform to manage your investments, track your returns, and build a network that earns while you sleep.
            </p>
          </div>
          <div className="gsap-reveal-right">
            <div className="l-intro-card">
              {[
                { icon: 'v', name: 'Main Wallet', sub: 'Primary balance', val: '$8,420', Icon: DollarSign },
                { icon: 't', name: 'ROI Earnings', sub: 'Daily returns', val: '$2,150', Icon: TrendingUp },
                { icon: 'c', name: 'Direct Income', sub: 'Level 1 referrals', val: '$1,840', Icon: Users },
                { icon: 'y', name: 'Level Income', sub: 'Network earnings', val: '$960', Icon: BarChart3 },
              ].map((item) => (
                <div className="l-intro-card-row" key={item.name}>
                  <div className="l-intro-card-left">
                    <div className={`l-intro-card-icon ${item.icon}`}><item.Icon size={18} /></div>
                    <div>
                      <div className="l-intro-card-name">{item.name}</div>
                      <div className="l-intro-card-sub">{item.sub}</div>
                    </div>
                  </div>
                  <div className="l-intro-card-val">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== INVESTMENT / GROWTH VISUAL ===== */}
      <section id="growth" className="l-growth">
        <div className="l-growth-grid l-container">
          <div className="gsap-reveal-left">
            <div className="l-section-label">Growth</div>
            <h2 className="l-section-title">Watch Your<br />Wealth Compound</h2>
            <p className="l-section-desc" style={{ marginTop: 16 }}>
              Our investment engine works around the clock. Daily ROI distributions keep your portfolio growing consistently.
            </p>
            <div className="l-growth-nums">
              <div>
                <div className="l-growth-num-val" style={{ color: 'var(--lr-violet)' }}>$5M+</div>
                <div className="l-growth-num-label">Total Invested</div>
              </div>
              <div>
                <div className="l-growth-num-val" style={{ color: 'var(--lr-teal)' }}>$2M+</div>
                <div className="l-growth-num-label">Returns Paid</div>
              </div>
              <div>
                <div className="l-growth-num-val" style={{ color: 'var(--lr-coral)' }}>2X</div>
                <div className="l-growth-num-label">Max Return</div>
              </div>
            </div>
          </div>
          <div className="gsap-reveal-right">
            <div className="l-growth-chart-card">
              <div className="l-growth-chart-header">
                <div className="l-growth-chart-title">Investment Growth</div>
                <div className="l-growth-chart-period">Last 12 Months</div>
              </div>
              <div className="l-growth-chart-bars">
                {[
                  { h: '35%', color: 'light' }, { h: '42%', color: 'light' },
                  { h: '38%', color: 'light' }, { h: '55%', color: 'light' },
                  { h: '48%', color: 'violet' }, { h: '62%', color: 'violet' },
                  { h: '58%', color: 'violet' }, { h: '72%', color: 'violet' },
                  { h: '68%', color: 'teal' }, { h: '80%', color: 'teal' },
                  { h: '85%', color: 'teal' }, { h: '95%', color: 'teal' },
                ].map((b, i) => (
                  <div key={i} className={`l-growth-bar ${b.color}`} data-height={b.h} />
                ))}
              </div>
              <div className="l-growth-bar-labels">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
                  <div key={m} className="l-growth-bar-label">{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SLIDER ===== */}
      <section id="features" className="l-features">
        <div className="l-container">
          <div className="l-features-header">
            <div className="gsap-reveal">
              <div className="l-section-label">Features</div>
              <h2 className="l-section-title">Everything You Need</h2>
            </div>
          </div>
        </div>
        <div className="l-features-track-wrapper">
          <div className="l-features-track" ref={featuresRef}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div className="l-feature-panel" key={f.title}>
                  <div className={`l-feature-icon-wrap ${f.color}`}><Icon size={24} /></div>
                  <div className="l-feature-title">{f.title}</div>
                  <div className="l-feature-desc">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== WALLET ECOSYSTEM ===== */}
      <section id="wallets" className="l-wallets">
        <div className="l-container">
          <div className="l-wallets-center gsap-reveal">
            <div className="l-section-label">Wallets</div>
            <h2 className="l-section-title">Five Wallets.<br />One Dashboard.</h2>
            <p className="l-section-desc" style={{ margin: '16px auto 0' }}>
              Every balance has a purpose. Manage them all from a single, clean interface.
            </p>
          </div>
          <div className="l-wallets-grid">
            {[
              { color: 'v', name: 'Main Wallet', sub: 'Primary balance' },
              { color: 't', name: 'ROI Wallet', sub: 'Daily returns' },
              { color: 'c', name: 'E-Wallet', sub: 'Bonuses & perks' },
              { color: 'y', name: 'Profit Share', sub: 'Revenue share' },
              { color: 'p', name: 'Fund Wallet', sub: 'Team transfers' },
            ].map((w) => (
              <div className="l-wallet-item" key={w.name}>
                <div className={`l-wallet-dot ${w.color}`} />
                <div className="l-wallet-name">{w.name}</div>
                <div className="l-wallet-sub">{w.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NETWORK ===== */}
      <section className="l-network">
        <div className="l-network-grid l-container">
          <div className="gsap-reveal-left">
            <div className="l-section-label">Network</div>
            <h2 className="l-section-title">Build Your<br />Income Tree</h2>
            <p className="l-section-desc" style={{ marginTop: 16 }}>
              Earn from two levels of referrals. Direct income from your invitees, and level income from their invitees.
            </p>
            <div style={{ marginTop: 28 }}>
              <Link to="/register" className="l-btn l-btn-primary l-btn-lg">
                Join Now <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="l-network-visual gsap-reveal-right">
            {/* Center node */}
            <div className="l-network-center">You</div>
            {/* Connection lines (SVG) */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="rgba(91,75,255,0.12)" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="rgba(22,199,135,0.12)" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="20%" y2="65%" stroke="rgba(255,107,107,0.12)" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="rgba(255,184,77,0.12)" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="rgba(91,75,255,0.08)" strokeWidth="2" />
              <line x1="25%" y1="20%" x2="12%" y2="8%" stroke="rgba(91,75,255,0.06)" strokeWidth="1.5" />
              <line x1="25%" y1="20%" x2="35%" y2="5%" stroke="rgba(22,199,135,0.06)" strokeWidth="1.5" />
              <line x1="75%" y1="25%" x2="88%" y2="12%" stroke="rgba(255,107,107,0.06)" strokeWidth="1.5" />
              <line x1="75%" y1="25%" x2="65%" y2="8%" stroke="rgba(255,184,77,0.06)" strokeWidth="1.5" />
            </svg>
            {/* Level 1 nodes */}
            <div className="l-network-node v" style={{ top: '15%', left: '20%' }}>AK</div>
            <div className="l-network-node t" style={{ top: '18%', right: '18%' }}>SM</div>
            <div className="l-network-node c" style={{ bottom: '28%', left: '14%' }}>RA</div>
            <div className="l-network-node y" style={{ bottom: '22%', right: '16%' }}>MK</div>
            {/* Level 2 nodes */}
            <div className="l-network-node v" style={{ top: '3%', left: '8%', width: 36, height: 36, fontSize: 11 }}>+</div>
            <div className="l-network-node t" style={{ top: '0%', right: '10%', width: 36, height: 36, fontSize: 11 }}>+</div>
            <div className="l-network-node c" style={{ bottom: '10%', left: '5%', width: 36, height: 36, fontSize: 11 }}>+</div>
            <div className="l-network-node y" style={{ bottom: '8%', right: '6%', width: 36, height: 36, fontSize: 11 }}>+</div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="l-steps">
        <div className="l-container">
          <div className="gsap-reveal">
            <div className="l-section-label">How It Works</div>
            <h2 className="l-section-title">Start in Four Steps</h2>
          </div>
          <div className="l-steps-grid">
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

      {/* ===== FINAL CTA ===== */}
      <section className="l-cta" ref={ctaRef}>
        <div className="l-cta-shape l-cta-shape-1" />
        <div className="l-cta-shape l-cta-shape-2" />
        <div className="l-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="gsap-reveal">
            <h2 className="l-cta-title">
              Ready to Grow<br />Your Wealth?
            </h2>
            <p className="l-cta-desc">
              Join thousands of investors building their financial future with Fin Rise Global.
            </p>
            <div className="l-cta-btns">
              <Link to="/register" className="l-btn l-btn-primary l-btn-lg">
                Create Free Account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="l-footer">
        <div className="l-container">
          <div className="l-footer-grid">
            <div>
              <div className="l-footer-brand">
                <div className="l-footer-brand-mark">FR</div>
                Fin Rise Global
              </div>
              <p className="l-footer-about">
                Empowering financial growth through smart investment solutions and transparent practices.
              </p>
            </div>
            <div className="l-footer-col">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#wallets">Wallets</a>
              <a href="#how">How It Works</a>
              <a href="#growth">Returns</a>
            </div>
            <div className="l-footer-col">
              <h4>Company</h4>
              <a href="#intro">About</a>
              <a href="#features">Referral Program</a>
              <a href="#">Careers</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="l-footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Risk Disclaimer</a>
            </div>
          </div>
          <div className="l-footer-bottom">
            &copy; {new Date().getFullYear()} Fin Rise Global. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
