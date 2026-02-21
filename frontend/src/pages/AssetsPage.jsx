import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { Search, Package } from 'lucide-react';

const STATUS_OPTIONS = ['', 'Active', 'Pending Renewal', 'Expired', 'Retired'];
const TYPE_OPTIONS = ['', 'Hardware', 'Software', 'Contract', 'Project'];
const DEPARTMENT_OPTIONS = ['', 'Operations', 'Engineering', 'Finance', 'Logistics', 'Administration'];

export default function AssetsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('type', typeFilter);
    if (deptFilter) params.append('department', deptFilter);
    const qs = params.toString();
    apiGet(`/assets${qs ? '?' + qs : ''}`)
      .then(data => {
        const items = Array.isArray(data) ? data : data?.assets || [];
        setAssets(items);
        setTotal(data?.total ?? items.length);
      })
      .catch(() => {
        setAssets([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, typeFilter, deptFilter]);

  const formatCurrency = (val) => {
    if (val == null) return '--';
    return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package size={24} className="text-blue-600" />
            Assets
          </h1>
          <p className="text-sm text-slate-500 mt-1">{total} total assets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {/* Type */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.filter(Boolean).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {/* Department */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Departments</option>
            {DEPARTMENT_OPTIONS.filter(Boolean).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No assets found</div>
      ) : isMobile ? (
        /* Mobile Card Layout */
        <div className="space-y-3">
          {assets.map(asset => (
            <button
              key={asset.id}
              onClick={() => navigate(`/assets/${asset.id}`)}
              className="w-full bg-white rounded-xl border p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm text-slate-800">{asset.title}</div>
                <StatusBadge status={asset.status} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <TypeBadge type={asset.asset_type || asset.type} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <span className="text-slate-400">Vendor: </span>
                  {asset.vendor || '--'}
                </div>
                <div>
                  <span className="text-slate-400">End: </span>
                  {formatDate(asset.end_date)}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Desktop Table */
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Asset ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">End Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Budget</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map(asset => (
                  <tr
                    key={asset.id}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{asset.asset_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{asset.title}</td>
                    <td className="px-4 py-3"><TypeBadge type={asset.asset_type || asset.type} /></td>
                    <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{asset.vendor || '--'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(asset.end_date)}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">{formatCurrency(asset.total_budget)}</td>
                    <td className="px-4 py-3 text-slate-600">{asset.department || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
