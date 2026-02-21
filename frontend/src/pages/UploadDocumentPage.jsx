import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../hooks/useApi';
import {
  Upload, ChevronRight, ChevronLeft, Check, FileText,
  AlertCircle, CheckCircle2, RotateCcw, Eye
} from 'lucide-react';

const DOC_TYPES = ['Contract', 'Invoice', 'SOW', 'Proposal', 'Technical', 'Other'];
const CUI_CATEGORIES = ['Not CUI', 'CUI Basic', 'CUI Specified'];
const DEPARTMENTS = ['IT', 'Finance', 'HR', 'Legal', 'Operations', 'Engineering', 'Security'];

const STEPS = [
  { num: 1, label: 'Select Asset & Type' },
  { num: 2, label: 'Document Details' },
  { num: 3, label: 'Confirm & Upload' },
];

export default function UploadDocumentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    asset_id: '',
    document_type: '',
    cui_category: 'Not CUI',
    title: '',
    date_received: new Date().toISOString().split('T')[0],
    department: '',
    filename: '',
  });

  useEffect(() => {
    apiGet('/assets')
      .then(data => {
        const list = Array.isArray(data) ? data : data?.assets || [];
        setAssets(list);
      })
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedAsset = assets.find(
    a => String(a.id) === String(form.asset_id) || a.asset_id === form.asset_id
  );

  const updateField = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-fill department from selected asset
      if (field === 'asset_id') {
        const asset = assets.find(
          a => String(a.id) === String(value) || a.asset_id === value
        );
        if (asset?.department) {
          next.department = asset.department;
        }
      }
      // Auto-fill title from filename
      if (field === 'filename' && (!prev.title || prev.title === prev.filename)) {
        next.title = value;
      }
      return next;
    });
  };

  const canProceedStep1 = form.asset_id && form.document_type && form.cui_category;
  const canProceedStep2 = form.title && form.date_received && form.department && form.filename;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        asset_id: Number(form.asset_id) || form.asset_id,
        document_type: form.document_type,
        cui_category: form.cui_category,
        title: form.title,
        date_received: form.date_received,
        department: form.department,
        filename: form.filename,
      };
      const res = await apiPost('/documents', payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setResult(null);
    setError(null);
    setForm({
      asset_id: '',
      document_type: '',
      cui_category: 'Not CUI',
      title: '',
      date_received: new Date().toISOString().split('T')[0],
      department: '',
      filename: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Success state
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-800">Document Uploaded Successfully</h2>
              <p className="text-sm text-green-600">
                Document ID: <span className="font-mono font-bold">{result.id || result.document_id || '--'}</span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Title</span>
              <span className="font-medium text-slate-700">{form.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="font-medium text-slate-700">{form.document_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Asset</span>
              <span className="font-medium text-slate-700">
                {selectedAsset ? `${selectedAsset.asset_id} - ${selectedAsset.title}` : form.asset_id}
              </span>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <RotateCcw size={16} />
              Upload Another
            </button>
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
            >
              <Eye size={16} />
              View Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Upload Document</h1>
        <p className="text-sm text-slate-500 mt-1">
          Attach a document to an asset in your portfolio
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between bg-white rounded-xl border p-4">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > s.num
                    ? 'bg-green-500 text-white'
                    : step === s.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.num ? <Check size={16} /> : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  step === s.num ? 'text-blue-600' : step > s.num ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border p-6">
        {/* Step 1: Select Asset & Type */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Select Asset & Type</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Related Asset</label>
              <select
                value={form.asset_id}
                onChange={e => updateField('asset_id', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select an asset --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.asset_id} - {a.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
              <select
                value={form.document_type}
                onChange={e => updateField('document_type', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select type --</option>
                {DOC_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CUI Category</label>
              <select
                value={form.cui_category}
                onChange={e => updateField('cui_category', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CUI_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Document Details */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Document Details</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Enter document title"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Received</label>
              <input
                type="date"
                value={form.date_received}
                onChange={e => updateField('date_received', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              {selectedAsset?.department ? (
                <input
                  type="text"
                  value={form.department}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600"
                />
              ) : (
                <select
                  value={form.department}
                  onChange={e => updateField('department', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select department --</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
              <input
                type="file"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) updateField('filename', file.name);
                }}
                className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {form.filename && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <FileText size={12} /> {form.filename}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Upload */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">Confirm & Upload</h2>
            <p className="text-sm text-slate-500">
              Review the details below and click Submit to upload the document.
            </p>

            <div className="bg-slate-50 rounded-lg border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">Asset</span>
                  <span className="font-medium text-slate-700">
                    {selectedAsset ? `${selectedAsset.asset_id} - ${selectedAsset.title}` : form.asset_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">Document Type</span>
                  <span className="font-medium text-slate-700">{form.document_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">CUI Category</span>
                  <span className="font-medium text-slate-700">{form.cui_category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">Title</span>
                  <span className="font-medium text-slate-700">{form.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">Date Received</span>
                  <span className="font-medium text-slate-700">{form.date_received}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">Department</span>
                  <span className="font-medium text-slate-700">{form.department}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-xs uppercase tracking-wide">File</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <FileText size={14} className="text-blue-500" /> {form.filename}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Submit
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
