import { useState, useEffect } from 'react';
import { apiGet } from '../hooks/useApi';
import KpiCard from '../components/KpiCard';
import {
  Building2, Package, CheckSquare, DollarSign, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const fmtPct = (val) => (val * 100).toFixed(1) + '%';

const DEPARTMENTS = ['All Departments', 'Operations', 'Engineering', 'Finance', 'Logistics', 'Administration'];

const DEPT_COLORS = {
  Operations: '#0078D4',
  Engineering: '#107C10',
  Finance: '#FFB900',
  Logistics: '#D13438',
  Administration: '#7C3AED',
};

const STATUS_COLORS = {
  'Not Started': '#64748b',
  'In Progress': '#0078D4',
  'Blocked': '#D13438',
  'Completed': '#107C10',
};

function cellColor(metric, value) {
  switch (metric) {
    case 'overdue_tasks':
      if (value === 0) return 'text-green-700 bg-green-50';
      if (value <= 2) return 'text-yellow-700 bg-yellow-50';
      return 'text-red-700 bg-red-50';
    case 'utilization':
      if (value < 0.75) return 'text-green-700 bg-green-50';
      if (value <= 0.9) return 'text-yellow-700 bg-yellow-50';
      return 'text-red-700 bg-red-50';
    case 'completion_rate':
      if (value >= 0.75) return 'text-green-700 bg-green-50';
      if (value >= 0.5) return 'text-yellow-700 bg-yellow-50';
      return 'text-red-700 bg-red-50';
    default:
      return 'text-slate-700 bg-white';
  }
}

export default function DepartmentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('All Departments');

  useEffect(() => {
    apiGet('/dashboard/department-scorecard')
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading department scorecard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Unable to load department data</div>
      </div>
    );
  }

  const departments = data.departments || [];
  const selectedDept = departments.find(d => (d.department || d.name) === selected);

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const spent = payload.find(p => p.dataKey === 'spent')?.value || 0;
    const remaining = payload.find(p => p.dataKey === 'remaining')?.value || 0;
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="text-blue-600">Spent: {fmtCurrency(spent)}</p>
        <p className="text-slate-400">Remaining: {fmtCurrency(remaining)}</p>
      </div>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700">{payload[0].name}</p>
        <p className="text-slate-600">{payload[0].value} tasks</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Department Scorecard</h1>
        <p className="text-sm text-slate-500 mt-1">Compare performance across departments</p>
      </div>

      {/* Department Selector */}
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map(dept => (
          <button
            key={dept}
            onClick={() => setSelected(dept)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selected === dept
                ? 'bg-[var(--eaw-primary)] text-white shadow-sm'
                : 'bg-white border text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* All Departments View */}
      {selected === 'All Departments' && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Department Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase">Department</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-center">Active Assets</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-center">Open Tasks</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-center">Overdue Tasks</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Total Budget</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Budget Spent</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-center">Utilization</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-center">Task Completion</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, i) => {
                  const name = dept.department || dept.name;
                  const totalBudget = dept.total_budget || 0;
                  const spent = dept.budget_spent || dept.spent || 0;
                  const utilization = totalBudget > 0 ? spent / totalBudget : 0;
                  const completionRate = dept.task_completion_rate ?? dept.completion_rate ?? 0;
                  const overdue = dept.overdue_tasks ?? 0;

                  return (
                    <tr key={i} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: DEPT_COLORS[name] || '#94a3b8' }}
                          />
                          <span className="font-medium text-slate-700">{name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center text-slate-600">{dept.active_assets ?? '--'}</td>
                      <td className="py-3 text-center text-slate-600">{dept.open_tasks ?? '--'}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor('overdue_tasks', overdue)}`}>
                          {overdue}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-600">{fmtCurrency(totalBudget)}</td>
                      <td className="py-3 text-right text-slate-600">{fmtCurrency(spent)}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor('utilization', utilization)}`}>
                          {fmtPct(utilization)}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor('completion_rate', completionRate)}`}>
                          {fmtPct(completionRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Department View */}
      {selected !== 'All Departments' && selectedDept && (
        <>
          {/* KPIs for selected department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Active Assets"
              value={selectedDept.active_assets ?? 0}
              icon={Package}
              color="blue"
            />
            <KpiCard
              label="Open Tasks"
              value={selectedDept.open_tasks ?? 0}
              icon={CheckSquare}
              color="yellow"
            />
            <KpiCard
              label="Overdue Tasks"
              value={selectedDept.overdue_tasks ?? 0}
              icon={AlertTriangle}
              color={(selectedDept.overdue_tasks ?? 0) > 0 ? 'red' : 'green'}
            />
            <KpiCard
              label="Total Budget"
              value={fmtCurrency(selectedDept.total_budget || 0)}
              icon={DollarSign}
              color="green"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Budget Bar - Spent vs Remaining */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Budget: Spent vs Remaining</h2>
              {(() => {
                const totalBudget = selectedDept.total_budget || 0;
                const spent = selectedDept.budget_spent || selectedDept.spent || 0;
                const remaining = totalBudget - spent;
                const utilization = totalBudget > 0 ? spent / totalBudget : 0;
                const barData = [{ name: selected, spent, remaining }];

                return (
                  <div>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => fmtCurrency(v)} tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="spent" stackId="budget" fill={DEPT_COLORS[selected] || '#0078D4'} name="Spent" />
                        <Bar dataKey="remaining" stackId="budget" fill="#e2e8f0" name="Remaining" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-between mt-4 px-2 text-sm">
                      <div>
                        <span className="text-slate-500">Spent: </span>
                        <span className="font-semibold text-slate-700">{fmtCurrency(spent)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Remaining: </span>
                        <span className="font-semibold text-slate-700">{fmtCurrency(remaining)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Utilization: </span>
                        <span className={`font-semibold ${
                          utilization > 0.9 ? 'text-red-600' : utilization > 0.75 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {fmtPct(utilization)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Task Breakdown Pie */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Task Breakdown</h2>
              {(() => {
                const taskBreakdown = selectedDept.task_breakdown || selectedDept.tasks_by_status || {};
                const pieData = Object.entries(taskBreakdown)
                  .filter(([, v]) => v > 0)
                  .map(([name, value]) => ({ name, value }));

                if (pieData.length === 0) {
                  return (
                    <div className="text-sm text-slate-400 py-10 text-center">No task data for this department</div>
                  );
                }

                return (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={45}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={true}
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.name] || ['#0078D4', '#107C10', '#FFB900', '#D13438', '#7C3AED'][index % 5]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {pieData.map((entry, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: STATUS_COLORS[entry.name] || ['#0078D4', '#107C10', '#FFB900', '#D13438', '#7C3AED'][i % 5] }}
                          />
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Selected department not found */}
      {selected !== 'All Departments' && !selectedDept && (
        <div className="bg-white rounded-xl border p-6 text-center">
          <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No data available for {selected}</p>
        </div>
      )}
    </div>
  );
}
