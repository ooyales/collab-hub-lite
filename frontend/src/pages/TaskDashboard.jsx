import { useState, useEffect } from 'react';
import { apiGet } from '../hooks/useApi';
import KpiCard from '../components/KpiCard';
import {
  CheckSquare, ListTodo, CheckCircle2, AlertTriangle, TrendingUp,
  ArrowUpRight, ArrowDownRight, Minus, Clock, BarChart3, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fmtPct = (val) => (val * 100).toFixed(1) + '%';

const STATUS_COLORS = {
  'Not Started': '#64748b',
  'In Progress': '#0078D4',
  'Blocked': '#D13438',
  'Completed': '#107C10',
};

const PRIORITY_COLORS = {
  Critical: '#D13438',
  High: '#F97316',
  Medium: '#0078D4',
  Low: '#107C10',
};

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

export default function TaskDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/dashboard/tasks-performance')
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading task performance...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Unable to load task performance data</div>
      </div>
    );
  }

  const totalTasks = data.total_tasks ?? 0;
  const openTasks = data.open_tasks ?? 0;
  const completedTasks = data.completed_tasks ?? 0;
  const overdueTasks = data.overdue_tasks ?? 0;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  function completionRateColor(rate) {
    if (rate >= 0.75) return 'green';
    if (rate >= 0.5) return 'yellow';
    return 'red';
  }

  // Status pie data
  const statusData = data.by_status
    ? Object.entries(data.by_status).map(([name, value]) => ({ name, value }))
    : [];

  // Priority bar data - ordered
  const priorityData = data.by_priority
    ? PRIORITY_ORDER
        .filter(p => data.by_priority[p] !== undefined)
        .map(name => ({ name, count: data.by_priority[name] || 0 }))
    : [];

  // MoM change
  const thisMonth = data.completed_this_month ?? 0;
  const lastMonth = data.completed_last_month ?? 0;
  const momChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) : 0;

  const MomArrow = () => {
    if (thisMonth > lastMonth) return <ArrowUpRight size={14} className="text-green-600" />;
    if (thisMonth < lastMonth) return <ArrowDownRight size={14} className="text-red-600" />;
    return <Minus size={14} className="text-slate-400" />;
  };

  const momColor = thisMonth >= lastMonth ? 'text-green-600' : 'text-red-600';

  const CustomStatusTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700">{d.name}</p>
        <p className="text-slate-600">{d.value} tasks</p>
      </div>
    );
  };

  const CustomPriorityTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="text-slate-600">{payload[0].value} tasks</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Task Performance</h1>
        <p className="text-sm text-slate-500 mt-1">Track task completion and productivity metrics</p>
      </div>

      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Tasks"
          value={totalTasks}
          icon={ListTodo}
          color="blue"
        />
        <KpiCard
          label="Open"
          value={openTasks}
          icon={CheckSquare}
          color="yellow"
        />
        <KpiCard
          label="Completed"
          value={completedTasks}
          icon={CheckCircle2}
          color="green"
        />
        <KpiCard
          label="Overdue"
          value={overdueTasks}
          icon={AlertTriangle}
          color="red"
        />
        <KpiCard
          label="Completion Rate"
          value={fmtPct(completionRate)}
          icon={TrendingUp}
          color={completionRateColor(completionRate)}
        />
      </div>

      {/* Row 2: Status Pie + Priority Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks by Status - Donut */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tasks by Status</h2>
          {statusData.length === 0 ? (
            <div className="text-sm text-slate-400 py-10 text-center">No status data</div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomStatusTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-2">
                {statusData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[entry.name] || '#94a3b8' }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tasks by Priority - Bar */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tasks by Priority</h2>
          {priorityData.length === 0 ? (
            <div className="text-sm text-slate-400 py-10 text-center">No priority data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomPriorityTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PRIORITY_COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Performance Metrics */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Avg Days to Complete */}
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <Clock size={24} className="mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-slate-800">
              {data.avg_days_to_complete != null ? data.avg_days_to_complete.toFixed(1) : '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Avg Days to Complete</div>
          </div>

          {/* Month-over-Month */}
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <BarChart3 size={24} className="mx-auto text-purple-500 mb-2" />
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-slate-800">{thisMonth}</span>
              <span className="text-xs text-slate-400">vs {lastMonth}</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <MomArrow />
              <span className={`text-xs font-medium ${momColor}`}>
                {momChange !== 0 ? `${momChange > 0 ? '+' : ''}${(momChange * 100).toFixed(0)}%` : 'No change'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Completed: This vs Last Month</div>
          </div>

          {/* Due This Week */}
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <Calendar size={24} className="mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-slate-800">
              {data.due_this_week ?? '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Tasks Due This Week</div>
          </div>

          {/* On-time Completion Rate */}
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <CheckCircle2 size={24} className="mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold text-slate-800">
              {data.on_time_completion_rate != null ? fmtPct(data.on_time_completion_rate) : '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">On-Time Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
