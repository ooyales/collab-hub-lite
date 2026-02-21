import { useState, useEffect } from 'react';
import { apiGet } from '../hooks/useApi';
import KpiCard from '../components/KpiCard';
import {
  Package, Activity, Clock, AlertTriangle, Percent, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const STATUS_COLORS = {
  Active: '#107C10',
  'Pending Renewal': '#FFB900',
  Expired: '#D13438',
  Retired: '#64748b',
};

const PRIORITY_COLORS = {
  Critical: '#D13438',
  High: '#F97316',
  Medium: '#3B82F6',
  Low: '#10B981',
};

const TASK_STATUS_COLORS = {
  'Not Started': '#94A3B8',
  'In Progress': '#3B82F6',
  Blocked: '#EF4444',
  Completed: '#10B981',
};

const RENEWAL_COLORS = ['#D13438', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'];
const RENEWAL_LABELS = ['Expired', '7 Days', '30 Days', '60 Days', '90 Days', '90+ Days'];

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState(null);
  const [renewals, setRenewals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/dashboard/summary').catch(() => null),
      apiGet('/dashboard/renewals').catch(() => null),
    ]).then(([summaryData, renewalData]) => {
      setSummary(summaryData);
      setRenewals(renewalData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading executive summary...</div>
      </div>
    );
  }

  // Build chart data
  const assetsByStatus = summary?.assets_by_status
    ? Object.entries(summary.assets_by_status).map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#94A3B8',
      }))
    : [];

  const tasksByPriority = summary?.tasks_by_priority
    ? Object.entries(summary.tasks_by_priority).map(([name, value]) => ({
        name,
        count: value,
        fill: PRIORITY_COLORS[name] || '#94A3B8',
      }))
    : [];

  const tasksByStatus = summary?.tasks_by_status
    ? Object.entries(summary.tasks_by_status).map(([name, value]) => ({
        name,
        value,
        color: TASK_STATUS_COLORS[name] || '#94A3B8',
      }))
    : [];

  const renewalTimeline = renewals
    ? RENEWAL_LABELS.map((label, i) => {
        const keyMap = {
          'Expired': 'expired',
          '7 Days': 'in_7_days',
          '30 Days': 'in_30_days',
          '60 Days': 'in_60_days',
          '90 Days': 'in_90_days',
          '90+ Days': 'beyond_90_days',
        };
        const items = renewals[keyMap[label]];
        return {
          name: label,
          count: Array.isArray(items) ? items.length : (items ?? 0),
          fill: RENEWAL_COLORS[i],
        };
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Executive Summary</h1>
        <p className="text-sm text-slate-500 mt-1">High-level view of your collaboration portfolio</p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Total Assets"
          value={summary?.total_assets ?? 0}
          icon={Package}
          color="blue"
        />
        <KpiCard
          label="Active Assets"
          value={summary?.active_assets ?? 0}
          icon={Activity}
          color="green"
        />
        <KpiCard
          label="Pending Renewal"
          value={summary?.pending_renewal ?? 0}
          icon={Clock}
          color="yellow"
        />
        <KpiCard
          label="Overdue Tasks"
          value={summary?.overdue_tasks ?? 0}
          icon={AlertTriangle}
          color="red"
        />
        <KpiCard
          label="Budget Utilization"
          value={`${summary?.budget_utilization_pct ?? 0}%`}
          icon={Percent}
          color="purple"
        />
        <KpiCard
          label="Total Budget"
          value={currencyFmt.format(summary?.total_budget ?? 0)}
          icon={DollarSign}
          color="slate"
        />
      </div>

      {/* Row 2: Assets by Status + Tasks by Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assets by Status — Donut */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Assets by Status</h2>
          {assetsByStatus.length === 0 ? (
            <div className="text-sm text-slate-400 py-10 text-center">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={assetsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {assetsByStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks by Priority — Bar */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tasks by Priority</h2>
          {tasksByPriority.length === 0 ? (
            <div className="text-sm text-slate-400 py-10 text-center">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tasksByPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                  {tasksByPriority.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Renewal Timeline + Tasks by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Renewal Timeline — Horizontal Bar */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Renewal Timeline</h2>
          {renewalTimeline.length === 0 ? (
            <div className="text-sm text-slate-400 py-10 text-center">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={renewalTimeline} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" name="Assets" radius={[0, 4, 4, 0]}>
                  {renewalTimeline.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks by Status — Pie */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tasks by Status</h2>
          {tasksByStatus.length === 0 ? (
            <div className="text-sm text-slate-400 py-10 text-center">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {tasksByStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
