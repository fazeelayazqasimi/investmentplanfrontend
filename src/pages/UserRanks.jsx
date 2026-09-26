import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, DollarSign, BarChart3, Users } from 'lucide-react';
import { getMyRank, getMyRankHistory } from '../services/apiClient';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function UserRanksContent() {
  const [rankInfo, setRankInfo] = useState(null);
  const [rankData, setRankData] = useState(null);
  const [allRanks, setAllRanks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [rankRes, histRes] = await Promise.all([getMyRank(), getMyRankHistory()]);
        setRankInfo(rankRes.data?.userRank || null);
        setRankData(rankRes.data?.rankData || null);
        setAllRanks(rankRes.data?.allRanks || []);
        setHistory(histRes.data || []);
      } catch (e) { setError(e.response?.data?.message || 'Failed to load rank data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Spinner label="Loading rank data..." />;
  if (error) return <ErrorBox message={error} />;

  const currentRank = rankInfo?.rank;
  const nextRank = allRanks.find(r => r.level === (currentRank?.level || 0) + 1);

  const getProgress = (current, target) => {
    if (!target || target <= 0) return 100;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const legsTarget = nextRank?.criteria?.legs || 0;
  const minLegBusiness = nextRank?.criteria?.minBusinessPerLeg || 0;
  // Same rule as the backend: no per-leg minimum configured => legs simply
  // count direct referrals.
  const qualifiedLegs = minLegBusiness > 0
    ? (rankData?.legBusiness || []).filter((b) => b >= minLegBusiness).length
    : (rankData?.legs || 0);

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <h1>My Rank</h1>
          <p className="subtitle">Your rank status and progress</p>
        </div>
      </div>

      {/* Current Rank Card */}
      <div style={{
        background: currentRank
          ? `linear-gradient(135deg, ${currentRank.color}22, ${currentRank.color}11)`
          : 'var(--color-surface)',
        border: `1px solid ${currentRank ? currentRank.color + '44' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-4)',
        textAlign: 'center',
      }}>
        {currentRank ? (
          <>
            <div style={{ fontSize: 64, marginBottom: 'var(--space-2)' }}>{currentRank.symbol || '⭐'}</div>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: currentRank.color }}>
              {currentRank.name}
            </h2>
            <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Level {currentRank.level} Rank
            </p>
            {rankInfo?.achievedAt && (
              <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                Achieved on {new Date(rankInfo.achievedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, marginBottom: 'var(--space-2)', opacity: 0.3 }}>🎖️</div>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              No Rank Yet
            </h2>
            <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              Meet the criteria to earn your first rank!
            </p>
          </>
        )}
      </div>

      {/* Progress Section */}
      {rankData && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-5)',
          marginBottom: 'var(--space-4)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
            {nextRank ? `Progress to ${nextRank.symbol || '⭐'} ${nextRank.name}` : 'Maximum Rank Achieved!'}
          </h3>
          {nextRank && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[
                { label: 'Self Deposit', current: rankData.selfDeposit, target: nextRank.criteria?.selfDeposit || 0, icon: DollarSign },
                { label: 'Direct Business', current: rankData.directBusiness, target: nextRank.criteria?.directBusiness || 0, icon: TrendingUp },
                { label: 'Total Team Business', current: rankData.totalTeamBusiness, target: nextRank.criteria?.totalTeamBusiness || 0, icon: BarChart3 },
                {
                  label: 'Qualifying Legs',
                  current: qualifiedLegs,
                  target: legsTarget,
                  icon: Users,
                  isCount: true,
                  hint: minLegBusiness > 0
                    ? `min ${fmt(minLegBusiness)} per leg`
                    : 'direct referrals',
                },
              ].map((item) => {
                const pct = getProgress(item.current, item.target);
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <item.icon size={14} /> {item.label}
                        {item.hint && (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                            ({item.hint})
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {item.isCount ? `${item.current} / ${item.target}` : `${fmt(item.current)} / ${fmt(item.target)}`}
                      </span>
                    </div>
                    <div className="rank-progress-bar">
                      <div className="rank-progress-fill" style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? 'var(--color-success)' : nextRank.color || 'var(--color-primary)',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* All Ranks */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-4)',
      }}>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>All Ranks</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {allRanks.map((rank) => {
            const isCurrent = currentRank?._id === rank._id;
            const isPast = currentRank && rank.level < currentRank.level;
            const isFuture = currentRank && rank.level > currentRank.level;
            return (
              <div key={rank._id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: isCurrent ? `${rank.color}15` : 'transparent',
                border: isCurrent ? `2px solid ${rank.color}` : '2px solid transparent',
                borderRadius: 'var(--radius-lg)',
                opacity: isFuture ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 32 }}>{rank.symbol || '⭐'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: rank.color, fontSize: 'var(--font-size-base)' }}>{rank.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Level {rank.level}</div>
                </div>
                {isCurrent && <span className="badge badge-green" style={{ fontSize: 10 }}>Current</span>}
                {isPast && <span className="badge badge-gray" style={{ fontSize: 10 }}>Achieved</span>}
                {isFuture && <span className="badge badge-purple" style={{ fontSize: 10 }}>Locked</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-5)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Rank History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {history.map((h) => (
              <div key={h._id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderBottom: '1px solid var(--color-border-light)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: h.reason === 'DOWNGRADE' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {h.reason === 'DOWNGRADE' ? '📉' : '🎉'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    {h.fromRank ? `${h.fromRank.symbol || '⭐'} ${h.fromRank.name}` : 'No Rank'}
                    {' → '}
                    {h.toRank ? `${h.toRank.symbol || '⭐'} ${h.toRank.name}` : 'No Rank'}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    {h.reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} • {new Date(h.achievedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
