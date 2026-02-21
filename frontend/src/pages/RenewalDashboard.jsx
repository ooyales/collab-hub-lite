import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../hooks/useApi';
import KpiCard from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertTriangle, Clock, Calendar, CalendarCheck,
  RefreshCw, Bell
} from 'lucide-react';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const RENEWAL_COLORS = {
  Expired: '#991B1B',
  '7 Days': '#D13438',
  '30 Days': '#F97316',
  '60 Days': '#EAB308',
  '90 Days': '#3B82F6',
  '90+ Days': '#10B981',
};

export default function RenewalDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [renewals, setRenewals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertResult, setAlertResult] = useState(null);
  const [runningAlerts, setRunningAlerts] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet('/dashboard/summary').catch(() => null),
      apiGet('/dashboard/renewals').catch(() => null),
    ]).then(([summaryData, renewalData]) => {
      setSummary(summaryData);
      setRenewals(renewalData);
    }).finally(() => setLoading(false));
  }, []);

  const runRenewalAlerts = async () => {
    setRunningAlerts(true);
    setAlertResult(null);
    try {
      const result = await apiGet('/dashboard/renewal-alerts/run');
      setAlertResult(result);
    } catch (err) {
      setAlertResult({ error: err.message || 'Failed to run renewal alerts' });
    } finally {
      setRunningAlerts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading renewal data...</div>
      </div>
    );
  }

  // Build timeline chart data
  const timelineCategories = ['Expired', '7 Days', '30 Days', '60 Days', '90 Days', '90+ Days'];
  const keyMap = {
    'Expired': 'expired',
    '7 Days': 'in_7_days',
    '30 Days': 'in_30_days',
    '60 Days': 'in_60_days',
    '90 Days': 'in_90_days',
    '90+ Days': 'beyond_90_days',
  };

  const timelineData = timelineCategories.map(label => {
    const items = renewals?.[keyMap[label]];
    return {
      name: label,
      count: Array.isArray(items) ? items.length : (items ?? 0),
      fill: RENEWAL_COLORS[label],
    };
  });

  // Flatten all assets approaching expiration (within 90 days, Active or Pending Renewal)
  const expiringAssets = [];
  const categoriesToInclude = ['expired', 'in_7_days', 'in_30_days', 'in_60_days', 'in_90_days'];
  if (renewals) {
    for (const key of categoriesToInclude) {
      const items = renewals[key];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.status === 'Active' || item.status === 'Pending Renewal') {
            expiringAssets.push(item);
          }
        }
      }
    }
  }
  expiringAssets.sort((a, b) => (a.days_until_expiration ?? 999) - (b.days_until_expiration ?? 999));

  const getDaysLeftColor = (days) => {
    if (days == null) return 'text-slate-400';
    if (days <= 0) return 'text-red-700 bg-red-50';
    if (days <= 7) return 'text-red-600 bg-red-50';
    if (days <= 30) return 'text-orange-600 bg-orange-50';
    if (days <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // KPI counts
  const countForKey = (key) => {
    const items = renewals?.[key];
    return Array.isArray(items) ? items.length : (items ?? 0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Renewal Management</h1>
        <p className="text-sm text-slate-500 mt-1">Track and manage upcoming asset renewals</p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Renewals Due 7 Days"
          value={countForKey('in_7_days')}
          icon={AlertTriangle}
          color="red"
        />
        <KpiCard
          label="Renewals Due 30 Days"
          value={countForKey('in_30_days')}
          icon={Clock}
          color="yellow"
        />
        <KpiCard
          label="Renewals Due 60 Days"
          value={countForKey('in_60_days')}
          icon={Calendar}
          color="blue"
        />
        <KpiCard
          label="Renewals Due 90 Days"
          value={countForKey('in_90_days')}
          icon={CalendarCheck}
          color="green"
        />
      </div>

      {/* Row 2: Renewal Timeline Chart */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Renewal Timeline</h2>
        {timelineData.every(d => d.count === 0) ? (
          <div className="text-sm text-slate-400 py-10 text-center">No renewal data</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timelineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
              <Tooltip
                formatter={(value) => [`${value} assets`, 'Count']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="count" name="Assets" radius={[0, 4, 4, 0]}>
                {timelineData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Expiring Assets Table */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Assets Approaching Expiration
          <span className="ml-2 text-xs font-normal text-slate-400">({expiringAssets.length} assets)</span>
        </h2>
        {expiringAssets.length === 0 ? (
          <div className="text-sm text-slate-400 py-10 text-center">
            No assets approaching expiration
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asset ID</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">End Date</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days Left</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {expiringAssets.map((asset, i) => (
                  <tr
                    key={asset.id || asset.asset_id || i}
                    className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/assets/${asset.id || asset.asset_id}`)}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-blue-600">{asset.asset_id}</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{asset.title}</td>
                    <td className="px-3 py-2 text-slate-500">{asset.asset_type || '--'}</td>
                    <td className="px-3 py-2 text-slate-500">{asset.vendor || '--'}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(asset.end_date)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getDaysLeftColor(asset.days_until_expiration)}`}>
                        {asset.days_until_expiration != null
                          ? (asset.days_until_expiration <= 0 ? 'Expired' : `${asset.days_until_expiration}d`)
                          : '--'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={asset.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 4: Run Renewal Alert Check */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Renewal Alert Check</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan assets and generate notifications for upcoming renewals
            </p>
          </div>
          <button
            onClick={runRenewalAlerts}
            disabled={runningAlerts}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {runningAlerts ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Bell size={16} />
                Run Renewal Alert Check
              </>
            )}
          </button>
        </div>

        {alertResult && (
          <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${
            alertResult.error
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {alertResult.error
              ? alertResult.error
              : alertResult.message || `Renewal alerts processed: ${alertResult.alerts_created ?? 0} alerts created`
            }
          </div>
        )}
      </div>
    </div>
  );
}
