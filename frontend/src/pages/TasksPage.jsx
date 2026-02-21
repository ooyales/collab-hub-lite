import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from '../hooks/useApi';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  Plus, Search, List, LayoutGrid, CheckSquare, Square,
  Calendar, User, AlertTriangle
} from 'lucide-react';

const STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Completed'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const BUCKETS = ['Hardware', 'Software', 'Contract', 'Project', 'General'];

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'Completed') return false;
  return new Date(dateStr) < new Date();
}

export default function TasksPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({
    status: '', priority: '', bucket: '', search: '',
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.bucket) params.append('bucket', filters.bucket);
      if (filters.search) params.append('search', filters.search);
      const qs = params.toString();
      const data = await apiGet(`/tasks${qs ? '?' + qs : ''}`);
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const handleMarkComplete = async (e, task) => {
    e.stopPropagation();
    try {
      await apiPut(`/tasks/${task.id}`, { status: 'Completed', pct_complete: 100 });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Board view grouping
  const boardColumns = STATUSES.map(status => ({
    status,
    tasks: tasks.filter(t => t.status === status),
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List size={16} /> List
            </button>
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'board' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={16} /> Board
            </button>
          </div>
          <button
            onClick={() => navigate('/tasks/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--eaw-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <select
          value={filters.status}
          onChange={e => updateFilter('status', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filters.priority}
          onChange={e => updateFilter('priority', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filters.bucket}
          onChange={e => updateFilter('bucket', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Buckets</option>
          {BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckSquare size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new task.</p>
        </div>
      ) : view === 'list' ? (
        /* List View */
        isMobile ? (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-lg border p-4 ${
                  isOverdue(task.due_date, task.status) ? 'bg-red-50 border-red-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 mb-1">TASK-{String(task.id).padStart(3, '0')}</div>
                    <div className="font-medium text-slate-800 truncate">{task.title}</div>
                  </div>
                  {task.status !== 'Completed' && (
                    <button
                      onClick={e => handleMarkComplete(e, task)}
                      className="text-slate-400 hover:text-green-600 shrink-0 p-1"
                      title="Mark complete"
                    >
                      <Square size={18} />
                    </button>
                  )}
                  {task.status === 'Completed' && (
                    <CheckSquare size={18} className="text-green-500 shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(task.due_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={12} /> {task.assigned_to_name || '--'}
                  </div>
                  {task.asset_title && (
                    <div className="col-span-2 text-blue-600 truncate">
                      Asset: {task.asset_title}
                    </div>
                  )}
                </div>
                {isOverdue(task.due_date, task.status) && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                    <AlertTriangle size={12} /> Overdue
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">Task ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Asset</th>
                    <th className="px-4 py-3">Assigned To</th>
                    <th className="px-4 py-3">% Complete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map(task => (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isOverdue(task.due_date, task.status) ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        {task.status !== 'Completed' ? (
                          <button
                            onClick={e => handleMarkComplete(e, task)}
                            className="text-slate-400 hover:text-green-600"
                            title="Mark complete"
                          >
                            <Square size={16} />
                          </button>
                        ) : (
                          <CheckSquare size={16} className="text-green-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        TASK-{String(task.id).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                        {task.title}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {formatDate(task.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {task.asset_id ? (
                          <button
                            onClick={() => navigate(`/assets/${task.asset_id}`)}
                            className="text-blue-600 hover:underline text-xs truncate max-w-[120px] block"
                          >
                            {task.asset_title || `Asset #${task.asset_id}`}
                          </button>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {task.assigned_to_name || '--'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                (task.pct_complete || 0) === 100 ? 'bg-green-500' :
                                (task.pct_complete || 0) >= 50 ? 'bg-blue-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${task.pct_complete || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{task.pct_complete || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Board View (Kanban) */
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
          {boardColumns.map(col => (
            <div key={col.status} className="bg-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">{col.status}</h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {col.tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.tasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No tasks</div>
                ) : (
                  col.tasks.map(task => (
                    <div
                      key={task.id}
                      className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm ${
                        isOverdue(task.due_date, task.status) ? 'border-red-300 bg-red-50' : ''
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-800 mb-2 line-clamp-2">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(task.due_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {task.assigned_to_name || 'Unassigned'}
                        </span>
                      </div>
                      {isOverdue(task.due_date, task.status) && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                          <AlertTriangle size={11} /> Overdue
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
