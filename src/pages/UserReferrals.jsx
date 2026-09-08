import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, UserCheck, UserX, TrendingUp, DollarSign, Search, ChevronDown, ChevronRight,
  Copy, CheckCircle, ArrowUpRight, Network, Filter, X, ZoomIn, ZoomOut, Maximize2,
  Minimize2, RotateCcw, Wallet, BarChart3, Target, Activity, Clock, Eye, EyeOff,
  ChevronLeft, LayoutGrid, List,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, { getMyProfile, getEnrichedReferralData } from '../services/apiClient';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import useToast from '../components/useToast';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const fmtCompact = (n) => {
  if (!n || n === 0) return '$0';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Number(n).toFixed(2)}`;
};

const TABS = [
  { key: 'direct', label: 'Direct', icon: Users },
  { key: 'indirect', label: 'Indirect', icon: Network },
  { key: 'tree', label: 'Member Tree', icon: LayoutGrid },
];

export default function UserReferrals() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('direct');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [directMembers, setDirectMembers] = useState([]);
  const [indirectMembers, setIndirectMembers] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);
  const { ToastContainer, success, error: toastError } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [enriched, p] = await Promise.all([
          getEnrichedReferralData(),
          getMyProfile(),
        ]);
        setStats(enriched.stats);
        setDirectMembers(enriched.directDownlines || []);
        setIndirectMembers(enriched.indirectDownlines || []);
        setTreeData(enriched.tree || null);
        setProfile(p);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyReferral = () => {
    navigator.clipboard.writeText(profile?.referralLink || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Spinner label="Loading referral data..." />;
  if (error) return <ErrorBox message={error} />;

  const statCards = stats ? [
    { label: 'Total Members', value: stats.totalMembers, color: 'purple', icon: Users },
    { label: 'Direct Members', value: stats.directCount, color: 'green', icon: UserCheck },
    { label: 'Indirect Members', value: stats.indirectCount, color: 'blue', icon: Network },
    { label: 'Active Members', value: stats.activeTotalCount, color: 'green', icon: Activity },
    { label: 'Inactive Members', value: stats.inactiveTotalCount, color: 'red', icon: UserX },
    { label: 'Total Team Investment', value: fmt(stats.totalTeamInvestment), color: 'orange', icon: DollarSign },
  ] : [];

  return (
    <div className="ref-page slide-up">
      {/* Referral Link Section */}
      <div className="ref-link-section">
        <div className="ref-link-content">
          <div className="ref-link-info">
            <h3>Invite Friends & Earn</h3>
            <p>Share your referral link and earn commissions when they join and invest.</p>
          </div>
          <div className="ref-link-box">
            <div className="ref-link-input-group">
              <input className="ref-link-input" readOnly value={profile?.referralLink || ''} onFocus={(e) => e.target.select()} />
              <button className="ref-link-copy" onClick={copyReferral}>
                {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div className="ref-code">
              <span>Referral Code:</span>
              <strong>{profile?.user?.referralCode}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="ref-stats-grid">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div className={`ref-stat-card ref-stat-${s.color}`} key={s.label}>
                <div className={`ref-stat-icon ${s.color}`}>
                  <Icon size={20} />
                </div>
                <div className="ref-stat-info">
                  <div className="ref-stat-value">{s.value}</div>
                  <div className="ref-stat-label">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="ref-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tab.key === 'direct' ? directMembers.length : tab.key === 'indirect' ? indirectMembers.length : null;
          return (
            <button
              key={tab.key}
              className={`ref-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {count !== null && <span className="ref-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="ref-tab-content">
        {activeTab === 'direct' && (
          <DirectTab members={directMembers} />
        )}
        {activeTab === 'indirect' && (
          <IndirectTab members={indirectMembers} />
        )}
        {activeTab === 'tree' && (
          <MemberTreeTab treeData={treeData} currentUser={currentUser} />
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

/* =========================================================
   DIRECT TAB
   ========================================================= */
function DirectTab({ members }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = members
    .filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.referralCode?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && m.isActivated) || (statusFilter === 'inactive' && !m.isActivated);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'investment') return (b.totalInvestment || 0) - (a.totalInvestment || 0);
      if (sortBy === 'roi') return (b.totalRoiEarned || 0) - (a.totalRoiEarned || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, statusFilter, sortBy]);

  return (
    <div className="ref-list-section">
      <div className="ref-toolbar">
        <div className="ref-search">
          <Search size={16} className="ref-search-icon" />
          <input
            className="ref-search-input"
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="ref-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="ref-filters">
          <select className="ref-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="ref-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="investment">Highest Investment</option>
            <option value="roi">Highest ROI</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No direct referrals yet"
          subtitle="Share your referral link to start building your team."
        />
      ) : (
        <>
          <div className="ref-member-grid">
            {paginated.map((m) => (
              <MemberCard key={m._id} member={m} showIncome="direct" />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   INDIRECT TAB
   ========================================================= */
function IndirectTab({ members }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = members
    .filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.referralCode?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && m.isActivated) || (statusFilter === 'inactive' && !m.isActivated);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'investment') return (b.totalInvestment || 0) - (a.totalInvestment || 0);
      if (sortBy === 'roi') return (b.totalRoiEarned || 0) - (a.totalRoiEarned || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, statusFilter, sortBy]);

  return (
    <div className="ref-list-section">
      <div className="ref-toolbar">
        <div className="ref-search">
          <Search size={16} className="ref-search-icon" />
          <input
            className="ref-search-input"
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="ref-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="ref-filters">
          <select className="ref-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="ref-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="investment">Highest Investment</option>
            <option value="roi">Highest ROI</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No indirect referrals yet"
          subtitle="Level 2 members will appear here when your direct referrals invite others."
        />
      ) : (
        <>
          <div className="ref-member-grid">
            {paginated.map((m) => (
              <MemberCard key={m._id} member={m} showIncome="level" />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   MEMBER CARD
   ========================================================= */
function MemberCard({ member: m, showIncome }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = m.isActivated && m.accountStatus === 'ACTIVE';

  return (
    <div className={`ref-member-card ${isActive ? 'active' : 'inactive'}`}>
      <div className="ref-member-header">
        <div className="ref-member-avatar-row">
          <div className={`ref-member-avatar ${isActive ? 'active' : 'inactive'}`}>
            {m.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="ref-member-main-info">
            <div className="ref-member-name">{m.name}</div>
            <div className="ref-member-email">{m.email}</div>
          </div>
        </div>
        <div className={`ref-member-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? <><UserCheck size={12} /> Active</> : <><UserX size={12} /> Inactive</>}
        </div>
      </div>

      <div className="ref-member-details">
        <div className="ref-detail-row">
          <span className="ref-detail-label">User ID</span>
          <span className="ref-detail-value ref-detail-code">{m.referralCode || '—'}</span>
        </div>
        <div className="ref-detail-row">
          <span className="ref-detail-label">Joined</span>
          <span className="ref-detail-value">{fmtDate(m.createdAt)}</span>
        </div>
        <div className="ref-detail-row">
          <span className="ref-detail-label">Total Investment</span>
          <span className="ref-detail-value ref-detail-investment">{fmt(m.totalInvestment)}</span>
        </div>
        <div className="ref-detail-row">
          <span className="ref-detail-label">Total ROI Earned</span>
          <span className="ref-detail-value ref-detail-roi">{fmt(m.totalRoiEarned)}</span>
        </div>
        <div className="ref-detail-row">
          <span className="ref-detail-label">{showIncome === 'direct' ? 'Direct Income' : 'Level Income'}</span>
          <span className="ref-detail-value ref-detail-income">{fmt(showIncome === 'direct' ? m.directIncome : m.levelIncome)}</span>
        </div>
        <div className="ref-detail-row">
          <span className="ref-detail-label">Last Activity</span>
          <span className="ref-detail-value">{fmtDateTime(m.lastActivity)}</span>
        </div>
      </div>

      {m.wallet && (
        <div className="ref-member-expand">
          <button className="ref-expand-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? <><EyeOff size={14} /> Hide Wallet</> : <><Eye size={14} /> View Wallet</>}
          </button>
          {expanded && (
            <div className="ref-wallet-grid">
              <div className="ref-wallet-item blue">
                <Wallet size={14} />
                <span>Main: {fmt(m.wallet.mainBalance)}</span>
              </div>
              <div className="ref-wallet-item green">
                <TrendingUp size={14} />
                <span>ROI: {fmt(m.wallet.roiBalance)}</span>
              </div>
              <div className="ref-wallet-item yellow">
                <BarChart3 size={14} />
                <span>E-Wallet: {fmt(m.wallet.ewalletBalance)}</span>
              </div>
              <div className="ref-wallet-item purple">
                <Target size={14} />
                <span>Profit: {fmt(m.wallet.profitShareBalance)}</span>
              </div>
              <div className="ref-wallet-item red">
                <Clock size={14} />
                <span>Pending: {fmt(m.wallet.pendingCommissions)}</span>
              </div>
              <div className="ref-wallet-item teal">
                <DollarSign size={14} />
                <span>Total: {fmt(m.wallet.totalEarnings)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PAGINATION
   ========================================================= */
function Pagination({ page, totalPages, total, onPageChange }) {
  return (
    <div className="ref-pagination">
      <span className="ref-pagination-info">Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} of {total}</span>
      <div className="ref-pagination-controls">
        <button className="ref-page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum;
          if (totalPages <= 7) {
            pageNum = i + 1;
          } else if (page <= 4) {
            pageNum = i + 1;
          } else if (page >= totalPages - 3) {
            pageNum = totalPages - 6 + i;
          } else {
            pageNum = page - 3 + i;
          }
          return (
            <button
              key={pageNum}
              className={`ref-page-btn ${page === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}
        <button className="ref-page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBER TREE TAB
   ========================================================= */
function MemberTreeTab({ treeData, currentUser }) {
  return (
    <div className="ref-tree-section">
      <MemberTreeView treeData={treeData} currentUser={currentUser} />
    </div>
  );
}

/* =========================================================
   MEMBER TREE VIEW (Visual Tree Component)
   ========================================================= */
function MemberTreeView({ treeData, currentUser }) {
  const [zoom, setZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const treeRef = useRef(null);

  useEffect(() => {
    if (treeData) {
      const autoExpand = new Set();
      const autoExpandHelper = (node, depth) => {
        if (depth < 2 && node.children && node.children.length > 0) {
          autoExpand.add(node._id);
          node.children.forEach((child) => autoExpandHelper(child, depth + 1));
        }
      };
      autoExpandHelper(treeData, 0);
      setExpandedNodes(autoExpand);
    }
  }, [treeData]);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set();
    const collect = (node) => {
      if (node.children && node.children.length > 0) {
        all.add(node._id);
        node.children.forEach(collect);
      }
    };
    if (treeData) collect(treeData);
    setExpandedNodes(all);
  };

  const collapseAll = () => setExpandedNodes(new Set());

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.3));
  const handleReset = () => { setZoom(1); setSelectedNode(null); };

  if (!treeData) {
    return (
      <EmptyState
        title="No referral tree data"
        subtitle="Your network tree will appear here once you have referrals."
      />
    );
  }

  return (
    <div className="tree-viewer">
      <div className="tree-controls">
        <button className="tree-ctrl-btn" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <span className="tree-zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="tree-ctrl-btn" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <div className="tree-ctrl-divider" />
        <button className="tree-ctrl-btn" onClick={expandAll} title="Expand All">
          <Maximize2 size={16} />
        </button>
        <button className="tree-ctrl-btn" onClick={collapseAll} title="Collapse All">
          <Minimize2 size={16} />
        </button>
        <button className="tree-ctrl-btn" onClick={handleReset} title="Reset View">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="tree-canvas-wrapper" ref={treeRef}>
        <div className="tree-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
          <TreeNode
            node={treeData}
            isRoot={true}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            depth={0}
          />
        </div>
      </div>

      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}

/* =========================================================
   TREE NODE
   ========================================================= */
function TreeNode({ node, isRoot, expandedNodes, toggleNode, selectedNode, setSelectedNode, depth }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node._id);
  const isActive = node.isActivated && node.accountStatus === 'ACTIVE';
  const isSelected = selectedNode?._id === node._id;

  return (
    <div className={`tree-node-wrapper ${isRoot ? 'root' : ''} depth-${Math.min(depth, 4)}`}>
      <div className="tree-node-connector">
        {!isRoot && <div className="tree-connector-line" />}
      </div>

      <div
        className={`tree-node ${isActive ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''} ${isRoot ? 'root-node' : ''}`}
        onClick={() => setSelectedNode(node)}
      >
        <div className={`tree-node-avatar ${isActive ? 'active' : 'inactive'}`}>
          {node.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="tree-node-info">
          <div className="tree-node-name">{node.name}</div>
          <div className="tree-node-id">{node.referralCode || '—'}</div>
        </div>
        <div className="tree-node-meta">
          <div className={`tree-node-status ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </div>
          <div className="tree-node-investment">{fmtCompact(node.totalInvestment)}</div>
        </div>
        {hasChildren && (
          <button
            className="tree-node-toggle"
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node._id);
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="tree-child-count">{node.children.length}</span>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              isRoot={false}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   NODE DETAIL PANEL
   ========================================================= */
function NodeDetailPanel({ node, onClose }) {
  const isActive = node.isActivated && node.accountStatus === 'ACTIVE';

  return (
    <div className="tree-detail-panel">
      <div className="tree-detail-header">
        <h3>Member Details</h3>
        <button className="tree-detail-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="tree-detail-body">
        <div className="tree-detail-avatar-section">
          <div className={`tree-detail-avatar ${isActive ? 'active' : 'inactive'}`}>
            {node.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="tree-detail-name">{node.name}</div>
          <div className={`tree-detail-status ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? <><UserCheck size={14} /> Active</> : <><UserX size={14} /> Inactive</>}
          </div>
        </div>

        <div className="tree-detail-grid">
          <div className="tree-detail-item">
            <span className="tree-detail-label">Email</span>
            <span className="tree-detail-value">{node.email}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Referral Code</span>
            <span className="tree-detail-value ref-detail-code">{node.referralCode}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Level</span>
            <span className="tree-detail-value">Level {node.level || 0}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Joined</span>
            <span className="tree-detail-value">{fmtDate(node.createdAt)}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Total Investment</span>
            <span className="tree-detail-value ref-detail-investment">{fmt(node.totalInvestment)}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Total ROI Earned</span>
            <span className="tree-detail-value ref-detail-roi">{fmt(node.totalRoiEarned)}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Direct Income</span>
            <span className="tree-detail-value ref-detail-income">{fmt(node.directIncome)}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Level Income</span>
            <span className="tree-detail-value ref-detail-income">{fmt(node.levelIncome)}</span>
          </div>
          <div className="tree-detail-item">
            <span className="tree-detail-label">Team Members</span>
            <span className="tree-detail-value">{node.children?.length || 0}</span>
          </div>
        </div>

        {node.wallet && (
          <div className="tree-detail-wallet">
            <h4>Wallet Summary</h4>
            <div className="tree-detail-wallet-grid">
              <div className="tree-detail-wallet-item blue">
                <span>Main Wallet</span>
                <strong>{fmt(node.wallet.mainBalance)}</strong>
              </div>
              <div className="tree-detail-wallet-item green">
                <span>ROI Wallet</span>
                <strong>{fmt(node.wallet.roiBalance)}</strong>
              </div>
              <div className="tree-detail-wallet-item yellow">
                <span>E-Wallet</span>
                <strong>{fmt(node.wallet.ewalletBalance)}</strong>
              </div>
              <div className="tree-detail-wallet-item purple">
                <span>Profit Share</span>
                <strong>{fmt(node.wallet.profitShareBalance)}</strong>
              </div>
              <div className="tree-detail-wallet-item red">
                <span>Pending</span>
                <strong>{fmt(node.wallet.pendingCommissions)}</strong>
              </div>
              <div className="tree-detail-wallet-item teal">
                <span>Total Earnings</span>
                <strong>{fmt(node.wallet.totalEarnings)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
