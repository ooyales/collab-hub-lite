import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../hooks/useApi';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const DEPARTMENTS = ['Operations', 'Engineering', 'Finance', 'Logistics', 'Administration'];

export default function NewTaskPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('asset_id') || '';

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    asset_id: preselectedAssetId,
    assigned_to: '',
    department: '',
  });
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiGet('/assets')
      .then(data => setAssets(Array.isArray(data) ? data : data.assets || []))
      .catch(() => {});
    apiGet('/auth/users')
      .then(data => setUsers(Array.isArray(data) ? data : data.users || []))
      .catch(() => {});
  }, []);

  // Update asset_id when assets load and preselected ID exists
  useEffect(() => {
    if (preselectedAssetId && assets.length > 0) {
      setForm(prev => ({ ...prev, asset_id: preselectedAssetId }));
    }
  }, [preselectedAssetId, assets]);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        asset_id: form.asset_id ? parseInt(form.asset_id, 10) : null,
        assigned_to: form.assigned_to ? parseInt(form.assigned_to, 10) : null,
      };
      await apiPost('/tasks', payload);
      setSuccess('Task created successfully!');
      setTimeout(() => navigate('/tasks'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Create Task</h1>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder="Enter task title"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Describe the task..."
            rows={4}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          />
        </div>

        {/* Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={e => updateField('priority', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => updateField('due_date', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Related Asset */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Related Asset</label>
          <select
            value={form.asset_id}
            onChange={e => updateField('asset_id', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- No Asset --</option>
            {assets.map(a => (
              <option key={a.id} value={a.id}>
                {a.asset_id} - {a.title}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
          <select
            value={form.assigned_to}
            onChange={e => updateField('assigned_to', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Unassigned --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
          <select
            value={form.department}
            onChange={e => updateField('department', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Department --</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[var(--eaw-primary)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Save size={16} /> Create Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
