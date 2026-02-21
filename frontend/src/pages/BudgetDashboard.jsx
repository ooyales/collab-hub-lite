import { useState, useEffect } from 'react';
import { apiGet } from '../hooks/useApi';
import KpiCard from '../components/KpiCard';
import {
  DollarSign, TrendingUp, Wallet, Percent
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const fmtPct = (val) => (val * 100).toFixed(1) + '%';

const DEPT_COLORS = {
  Operations: '#0078D4',
  Engineering: '#107C10',
  Finance: '#FFB900',
  Logistics: '#D13438',
  Administration: '#7C3AED',
};

const PIE_COLORS = Object.values(DEPT_COLORS);

function utilizationColor(val) {
  if (val < 0.75) return 'green';
  if (val <= 0.9) return 'yellow';
  return 'red';
}

function utilizationBarColor(val) {
  if (val < 0.75) return 'bg-green-500';
  if (val <= 0.9) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function BudgetDashboard() {
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/dashboard/summary').catch(() => null),
      apiGet('/dashboard/budget').catch(() => []),
    ]).then(([summaryData, budgetData]) => {
      setSummary(summaryData);
      setBudget(Array.isArray(budgetData) ? budgetData : budgetData?.departments || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading budget data...</div>
      </div>
    );
  }

  const totalBudget = summary?.total_budget ?? budget.reduce((s, d) => s + (d.total_budget || 0), 0);
  const totalSpent = summary?.total_spent ?? budget.reduce((s, d) => s + (d.spent || 0), 0);
  const remaining = totalBudget - totalSpent;
  const utilization = totalBudget > 0 ? totalSpent / totalBudget : 0;

  // Chart data for horizontal stacked bar
  const barData = budget.map(d => ({
    name: d.department || d.name,
    spent: d.spent || 0,
    remaining: (d.total_budget || 0) - (d.spent || 0),
    total_budget: d.total_budget || 0,
  }));

  // Pie data
  const pieData = budget.map(d => ({
    name: d.department || d.name,
    value: d.total_budget || 0,
  }));

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const spent = payload.find(p => p.dataKey === 'spent')?.value || 0;
    const rem = payload.find(p => p.dataKey === 'remaining')?.value || 0;
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-slate-600">Total: {fmtCurrency(spent + rem)}</p>
        <p className="text-blue-600">Spent: {fmtCurrency(spent)}</p>
        <p className="text-slate-400">Remaining: {fmtCurrency(rem)}</p>
      </div>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700">{d.name}</p>
        <p className="text-slate-600">{fmtCurrency(d.value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Budget Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">Financial overview across all departments</p>
      </div>

      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Budget"
          value={fmtCurrency(totalBudget)}
          icon={DollarSign}
          color="green"
        />
        <KpiCard
          label="Total Spent"
          value={fmtCurrency(totalSpent)}
          icon={TrendingUp}
          color="yellow"
        />
        <KpiCard
          label="Remaining"
          value={fmtCurrency(remaining)}
          icon={Wallet}
          color="blue"
        />
        <KpiCard
          label="Utilization"
          value={fmtPct(utilization)}
          icon={Percent}
          color={utilizationColor(utilization)}
        />
      </div>

      {/* Row 2: Budget by Department horizontal bar */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Budget by Department</h2>
        {barData.length === 0 ? (
          <div className="text-sm text-slate-400 py-10 text-center">No department budget data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={barData.length * 60 + 60}>
            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => fmtCurrency(v)} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar dataKey="spent" stackId="budget" fill="#0078D4" name="Spent" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remaining" stackId="budget" fill="#B4D6F5" name="Remaining" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Table + Pie side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Budget Table */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Department Budget Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase">Department</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Budget</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Spent</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Remaining</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Utilization</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Assets</th>
                </tr>
              </thead>
              <tbody>
                {budget.map((d, i) => {
                  const deptName = d.department || d.name;
                  const deptBudget = d.total_budget || 0;
                  const deptSpent = d.spent || 0;
                  const deptRemaining = deptBudget - deptSpent;
                  const deptUtil = deptBudget > 0 ? deptSpent / deptBudget : 0;
                  return (
                    <tr key={i} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-700">{deptName}</td>
                      <td className="py-2.5 text-right text-slate-600">{fmtCurrency(deptBudget)}</td>
                      <td className="py-2.5 text-right text-slate-600">{fmtCurrency(deptSpent)}</td>
                      <td className="py-2.5 text-right text-slate-600">{fmtCurrency(deptRemaining)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${utilizationBarColor(deptUtil)}`}
                              style={{ width: `${Math.min(deptUtil * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600 w-12 text-right">
                            {fmtPct(deptUtil)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-slate-600">{d.asset_count ?? '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Distribution Pie */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Budget Distribution</h2>
          {pieData.length === 0 ? (
            <div className="text-sm text-slate-400 py-10 text-center">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={50}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DEPT_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
