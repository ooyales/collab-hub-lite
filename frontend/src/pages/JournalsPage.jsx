import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  BookOpen, Search, Plus, ChevronDown, ChevronUp,
  Send, Loader2, StickyNote, RefreshCw, Lightbulb,
  AlertCircle, Flag
} from 'lucide-react';

const ENTRY_TYPES = ['Note', 'Update', 'Decision', 'Issue', 'Milestone'];
const DEPARTMENTS = ['Operations', 'Engineering', 'Finance', 'Logistics', 'Administration'];

const TYPE_COLORS = {
  Note: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  Update: { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  Decision: { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
  Issue: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
  Milestone: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
};

const TYPE_ICONS = {
  Note: StickyNote,
  Update: RefreshCw,
  Decision: Lightbulb,
  Issue: AlertCircle,
  Milestone: Flag,
};

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function JournalsPage() {
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [assets, setAssets] = useState([]);
  const [filters, setFilters] = useState({
    entry_type: '', department: '', search: '',
  });
  const [form, setForm] = useState({
    title: '', body: '', entry_type: 'Note', asset_id: '', department: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.entry_type) params.append('entry_type', filters.entry_type);
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);
      const qs = params.toString();
      const data = await apiGet(`/journals${qs ? '?' + qs : ''}`);
      setEntries(Array.isArray(data) ? data : data.journals || []);
    } catch (err) {
      console.error('Failed to fetch journals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  useEffect(() => {
    apiGet('/assets')
      .then(data => setAssets(Array.isArray(data) ? data : data.assets || []))
      .catch(() => {});
  }, []);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!form.body.trim()) {
      setFormError('Body is required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        asset_id: form.asset_id ? parseInt(form.asset_id, 10) : null,
      };
      await apiPost('/journals', payload);
      setFormSuccess('Entry created successfully!');
      setForm({ title: '', body: '', entry_type: 'Note', asset_id: '', department: '' });
      setTimeout(() => {
        setFormSuccess('');
        setShowForm(false);
        fetchEntries();
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'Failed to create entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Journal Feed</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--eaw-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
          {showForm ? 'Hide Form' : 'New Entry'}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Create New Entry</h2>

          {formSuccess && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
              {formSuccess}
            </div>
          )}
          {formError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateForm('title', e.target.value)}
                placeholder="Entry title"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Body <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.body}
                onChange={e => updateForm('body', e.target.value)}
                placeholder="Write your journal entry..."
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entry Type</label>
                <select
                  value={form.entry_type}
                  onChange={e => updateForm('entry_type', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Related Asset</label>
                <select
                  value={form.asset_id}
                  onChange={e => updateForm('asset_id', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- None --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.asset_id} - {a.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select
                  value={form.department}
                  onChange={e => updateForm('department', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--eaw-primary)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Posting...</>
                ) : (
                  <><Send size={16} /> Post Entry</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <select
          value={filters.entry_type}
          onChange={e => updateFilter('entry_type', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filters.department}
          onChange={e => updateFilter('department', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading journal entries...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">No journal entries found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new entry.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {entries.map((entry, idx) => {
            const typeStyle = TYPE_COLORS[entry.entry_type] || TYPE_COLORS.Note;
            const TypeIcon = TYPE_ICONS[entry.entry_type] || StickyNote;
            return (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline line and dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-3 h-3 rounded-full ${typeStyle.dot} ring-4 ring-white mt-5`} />
                  {idx < entries.length - 1 && (
                    <div className="w-0.5 bg-slate-200 flex-1 min-h-[16px]" />
                  )}
                </div>

                {/* Card */}
                <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 mb-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${typeStyle.badge} shrink-0 mt-0.5`}>
                      <TypeIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm">{entry.title}</h3>
                      {entry.body && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{entry.body}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-600">
                          {entry.author_name || 'Unknown'}
                        </span>
                        <span>{formatDate(entry.entry_date || entry.created_at)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.badge}`}>
                          {entry.entry_type}
                        </span>
                        {entry.asset_title && (
                          <span className="text-blue-600">
                            Asset: {entry.asset_title}
                          </span>
                        )}
                        {entry.department && (
                          <span className="text-slate-400">{entry.department}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
