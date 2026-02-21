import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import KpiCard from '../components/KpiCard';
import { PriorityBadge } from '../components/StatusBadge';
import {
  Package, CheckSquare, AlertTriangle, DollarSign,
  Plus, Upload, Eye, RefreshCw, ArrowRight, Clock
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [renewals, setRenewals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [runningAlerts, setRunningAlerts] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet('/dashboard/summary').catch(() => null),
      user?.id ? apiGet(`/tasks?assigned_to_id=${user.id}&status=not_completed`).catch(() => []) : Promise.resolve([]),
      apiGet('/dashboard/renewals').catch(() => null),
    ]).then(([summaryData, taskData, renewalData]) => {
      setSummary(summaryData);
      setTasks(Array.isArray(taskData) ? taskData : taskData?.tasks || []);
      setRenewals(renewalData);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const runRenewalAlerts = async () => {
    setRunningAlerts(true);
    try {
      const result = await apiPost('/dashboard/renewal-alerts/run', {});
      showToast(result.message || `Renewal alerts processed: ${result.alerts_created ?? 0} alerts created`);
    } catch (err) {
      showToast(err.message || 'Failed to run renewal alerts', 'error');
    } finally {
      setRunningAlerts(false);
    }
  };

  // Filter tasks due within 7 days
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tasksDueThisWeek = tasks.filter(t => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    return due >= now && due <= in7Days;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const priorityDot = (priority) => {
    const colors = {
      Critical: 'bg-red-500',
      High: 'bg-orange-500',
      Medium: 'bg-blue-500',
      Low: 'bg-green-500',
    };
    return colors[priority] || 'bg-slate-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.display_name || 'User'}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Assets"
          value={summary?.active_assets ?? 0}
          icon={Package}
          color="blue"
        />
        <KpiCard
          label="Open Tasks"
          value={summary?.open_tasks ?? 0}
          icon={CheckSquare}
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
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Second Row: Two cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Tasks Due This Week */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">My Tasks Due This Week</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          {tasksDueThisWeek.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">
              No tasks due this week
            </div>
          ) : (
            <div className="space-y-2">
              {tasksDueThisWeek.slice(0, 8).map(task => (
                <button
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot(task.priority)}`} />
                  <span className="flex-1 text-sm text-slate-700 truncate">{task.title}</span>
                  <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(task.due_date)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Assets */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Expiring Assets</h2>
            <button
              onClick={() => navigate('/assets')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          {!renewals || ((!renewals.in_7_days || renewals.in_7_days.length === 0) && (!renewals.in_30_days || renewals.in_30_days.length === 0)) ? (
            <div className="text-sm text-slate-400 py-6 text-center">
              No assets expiring soon
            </div>
          ) : (
            <div className="space-y-3">
              {/* 7 Days */}
              {renewals.in_7_days && renewals.in_7_days.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
                    Within 7 Days
                  </div>
                  {renewals.in_7_days.map(item => (
                    <button
                      key={item.id || item.asset_id}
                      onClick={() => navigate(`/assets/${item.id || item.asset_id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                    >
                      <div>
                        <span className="text-xs text-red-500 font-mono mr-2">{item.asset_id}</span>
                        <span className="text-sm text-slate-700">{item.title}</span>
                      </div>
                      <span className="text-xs text-red-500 font-medium">{item.days_until_expiration}d</span>
                    </button>
                  ))}
                </div>
              )}
              {/* 30 Days */}
              {renewals.in_30_days && renewals.in_30_days.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">
                    Within 30 Days
                  </div>
                  {renewals.in_30_days.map(item => (
                    <button
                      key={item.id || item.asset_id}
                      onClick={() => navigate(`/assets/${item.id || item.asset_id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-yellow-50 transition-colors text-left"
                    >
                      <div>
                        <span className="text-xs text-yellow-600 font-mono mr-2">{item.asset_id}</span>
                        <span className="text-sm text-slate-700">{item.title}</span>
                      </div>
                      <span className="text-xs text-yellow-600 font-medium">{item.days_until_expiration}d</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/tasks/new')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Plus size={20} className="text-blue-600" />
            <span className="text-xs font-medium text-slate-600">New Task</span>
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <Upload size={20} className="text-green-600" />
            <span className="text-xs font-medium text-slate-600">Upload Document</span>
          </button>
          <button
            onClick={() => navigate('/assets')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <Eye size={20} className="text-purple-600" />
            <span className="text-xs font-medium text-slate-600">View Assets</span>
          </button>
          <button
            onClick={runRenewalAlerts}
            disabled={runningAlerts}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={`text-orange-600 ${runningAlerts ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium text-slate-600">
              {runningAlerts ? 'Running...' : 'Run Renewal Alerts'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
