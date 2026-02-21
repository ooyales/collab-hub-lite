import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPut } from '../hooks/useApi';
import { StatusBadge, PriorityBadge, TypeBadge } from '../components/StatusBadge';
import {
  Package, Edit3, Save, X, Plus, Upload, FileText, BookOpen,
  Clock, DollarSign, CheckSquare, AlertCircle, MessageSquare
} from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Package },
  { key: 'budget', label: 'Budget', icon: DollarSign },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'journal', label: 'Journal', icon: BookOpen },
];

const STATUS_OPTIONS = ['Active', 'Pending Renewal', 'Expired', 'Retired'];

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Tab data
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [journals, setJournals] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Journal form
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalForm, setJournalForm] = useState({ title: '', body: '', entry_type: 'note' });
  const [journalSaving, setJournalSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet(`/assets/${id}`)
      .then(data => {
        setAsset(data);
        setEditForm({
          description: data.description || '',
          vendor: data.vendor || '',
          notes: data.notes || '',
          status: data.status || 'Active',
        });
      })
      .catch(() => setAsset(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!asset) return;
    setTabLoading(true);
    if (activeTab === 'tasks') {
      apiGet(`/assets/${id}/tasks`)
        .then(data => setTasks(Array.isArray(data) ? data : data?.tasks || []))
        .catch(() => setTasks([]))
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'documents') {
      apiGet(`/assets/${id}/documents`)
        .then(data => setDocuments(Array.isArray(data) ? data : data?.documents || []))
        .catch(() => setDocuments([]))
        .finally(() => setTabLoading(false));
    } else if (activeTab === 'journal') {
      apiGet(`/assets/${id}/journals`)
        .then(data => setJournals(Array.isArray(data) ? data : data?.journals || []))
        .catch(() => setJournals([]))
        .finally(() => setTabLoading(false));
    } else {
      setTabLoading(false);
    }
  }, [activeTab, asset, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiPut(`/assets/${id}`, editForm);
      setAsset(prev => ({ ...prev, ...updated }));
      setEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      description: asset.description || '',
      vendor: asset.vendor || '',
      notes: asset.notes || '',
      status: asset.status || 'Active',
    });
    setEditing(false);
  };

  const handleAddJournal = async () => {
    if (!journalForm.title.trim()) return;
    setJournalSaving(true);
    try {
      const entry = await apiPost('/journals', {
        ...journalForm,
        asset_id: asset.id,
      });
      setJournals(prev => [entry, ...prev]);
      setJournalForm({ title: '', body: '', entry_type: 'note' });
      setShowJournalForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create journal entry');
    } finally {
      setJournalSaving(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return '$0';
    return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilExpiration = () => {
    if (!asset?.end_date) return null;
    const now = new Date();
    const end = new Date(asset.end_date);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDaysColor = (days) => {
    if (days == null) return 'text-slate-500';
    if (days > 90) return 'text-green-600';
    if (days >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDaysBg = (days) => {
    if (days == null) return 'bg-slate-100';
    if (days > 90) return 'bg-green-100';
    if (days >= 30) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getBudgetUtilization = () => {
    if (!asset?.total_budget || asset.total_budget === 0) return 0;
    return Math.round(((asset.spent_to_date || 0) / asset.total_budget) * 100);
  };

  const getUtilizationColor = (pct) => {
    if (pct < 75) return 'bg-green-500';
    if (pct <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getUtilizationTextColor = (pct) => {
    if (pct < 75) return 'text-green-600';
    if (pct <= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const entryTypeIcon = (type) => {
    switch (type) {
      case 'status_change': return <AlertCircle size={16} className="text-blue-500" />;
      case 'comment': return <MessageSquare size={16} className="text-green-500" />;
      case 'task_update': return <CheckSquare size={16} className="text-purple-500" />;
      default: return <BookOpen size={16} className="text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading asset...</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <div className="text-slate-400">Asset not found</div>
        <button onClick={() => navigate('/assets')} className="mt-4 text-sm text-blue-600 hover:underline">
          Back to Assets
        </button>
      </div>
    );
  }

  const daysUntil = getDaysUntilExpiration();
  const utilization = getBudgetUtilization();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono">
                {asset.asset_id}
              </span>
              <TypeBadge type={asset.asset_type || asset.type} />
              <StatusBadge status={asset.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{asset.title}</h1>
          </div>
          <div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 size={14} />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border">
        <div className="flex border-b overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</label>
                  {editing ? (
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 mt-1">{asset.description || 'No description'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Vendor</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.vendor}
                        onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 mt-1">{asset.vendor || '--'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contract Number</label>
                    <p className="text-sm text-slate-700 mt-1">{asset.contract_number || '--'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Department</label>
                    <p className="text-sm text-slate-700 mt-1">{asset.department || '--'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Owner</label>
                    <p className="text-sm text-slate-700 mt-1">{asset.owner_name || asset.owner || '--'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Start Date</label>
                    <p className="text-sm text-slate-700 mt-1">{formatDate(asset.start_date)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">End Date</label>
                    <p className="text-sm text-slate-700 mt-1">{formatDate(asset.end_date)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Days Until Expiration</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold ${getDaysBg(daysUntil)} ${getDaysColor(daysUntil)}`}>
                      <Clock size={14} />
                      {daysUntil != null ? (daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Expires today' : `Expired ${Math.abs(daysUntil)} days ago`) : 'N/A'}
                    </span>
                  </div>
                </div>

                {editing && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</label>
                {editing ? (
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    rows={10}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg min-h-[120px]">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{asset.notes || 'No notes'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Budget</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(asset.total_budget)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Spent to Date</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(asset.spent_to_date)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Remaining</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">
                    {formatCurrency((asset.total_budget || 0) - (asset.spent_to_date || 0))}
                  </div>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Budget Utilization</span>
                  <span className={`text-sm font-bold ${getUtilizationTextColor(utilization)}`}>
                    {utilization}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getUtilizationColor(utilization)}`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>$0</span>
                  <span>{formatCurrency(asset.total_budget)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Linked Tasks</h3>
                <button
                  onClick={() => navigate(`/tasks/new?asset_id=${asset.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} />
                  New Task
                </button>
              </div>
              {tabLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No tasks linked to this asset</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Task ID</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Title</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Priority</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Due Date</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasks.map(task => (
                        <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">{task.task_id || task.id}</td>
                          <td className="px-4 py-2 text-slate-800">{task.title}</td>
                          <td className="px-4 py-2"><PriorityBadge priority={task.priority} /></td>
                          <td className="px-4 py-2"><StatusBadge status={task.status} /></td>
                          <td className="px-4 py-2 text-slate-600">{formatDate(task.due_date)}</td>
                          <td className="px-4 py-2 text-slate-600">{task.assigned_to_name || task.assigned_to || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Linked Documents</h3>
                <button
                  onClick={() => navigate(`/upload?asset_id=${asset.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload size={14} />
                  Upload Document
                </button>
              </div>
              {tabLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No documents linked to this asset</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Doc ID</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Title</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Type</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">CUI Category</th>
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">{doc.document_id || doc.id}</td>
                          <td className="px-4 py-2 text-slate-800">{doc.title}</td>
                          <td className="px-4 py-2 text-slate-600">{doc.document_type || '--'}</td>
                          <td className="px-4 py-2 text-slate-600">{doc.cui_category || '--'}</td>
                          <td className="px-4 py-2 text-slate-600">{formatDate(doc.date_received)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Journal Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Journal Entries</h3>
                <button
                  onClick={() => setShowJournalForm(!showJournalForm)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} />
                  Add Entry
                </button>
              </div>

              {/* Inline Journal Form */}
              {showJournalForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Title</label>
                      <input
                        type="text"
                        value={journalForm.title}
                        onChange={e => setJournalForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Entry title"
                        className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Type</label>
                      <select
                        value={journalForm.entry_type}
                        onChange={e => setJournalForm(f => ({ ...f, entry_type: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="note">Note</option>
                        <option value="status_change">Status Change</option>
                        <option value="comment">Comment</option>
                        <option value="task_update">Task Update</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Body</label>
                    <textarea
                      value={journalForm.body}
                      onChange={e => setJournalForm(f => ({ ...f, body: e.target.value }))}
                      rows={3}
                      placeholder="Write your entry..."
                      className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddJournal}
                      disabled={journalSaving || !journalForm.title.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Save size={14} />
                      {journalSaving ? 'Saving...' : 'Save Entry'}
                    </button>
                    <button
                      onClick={() => {
                        setShowJournalForm(false);
                        setJournalForm({ title: '', body: '', entry_type: 'note' });
                      }}
                      className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {tabLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Loading journal...</div>
              ) : journals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No journal entries for this asset</div>
              ) : (
                <div className="space-y-0">
                  {journals.map((entry, idx) => (
                    <div key={entry.id} className="relative flex gap-3 pb-6">
                      {/* Timeline line */}
                      {idx < journals.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
                      )}
                      {/* Icon */}
                      <div className="shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10">
                        {entryTypeIcon(entry.entry_type)}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-medium text-slate-800">{entry.title}</span>
                            <span className="text-xs text-slate-400 ml-2">{entry.entry_type}</span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{formatDate(entry.created_at)}</span>
                        </div>
                        {entry.body && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{entry.body}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          by {entry.author_name || entry.author || 'System'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
