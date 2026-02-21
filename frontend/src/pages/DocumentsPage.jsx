import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  FileText, Search, Upload, Calendar, User, Building2, Shield
} from 'lucide-react';

const DOC_TYPES = ['Contract', 'Invoice', 'SOW', 'Proposal', 'Technical', 'Other'];
const CUI_CATEGORIES = ['Not CUI', 'CUI Basic', 'CUI Specified'];
const DEPARTMENTS = ['Operations', 'Engineering', 'Finance', 'Logistics', 'Administration'];

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function CuiBadge({ category }) {
  const styles = {
    'CUI Basic': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    'CUI Specified': 'bg-red-100 text-red-700 border border-red-300',
    'Not CUI': 'bg-green-100 text-green-700 border border-green-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[category] || 'bg-slate-100 text-slate-600'}`}>
      {(category === 'CUI Basic' || category === 'CUI Specified') && <Shield size={10} />}
      {category}
    </span>
  );
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    doc_type: '', cui_category: '', department: '', search: '',
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.doc_type) params.append('doc_type', filters.doc_type);
      if (filters.cui_category) params.append('cui_category', filters.cui_category);
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);
      const qs = params.toString();
      const data = await apiGet(`/documents${qs ? '?' + qs : ''}`);
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Document Registry</h1>
          {!loading && (
            <p className="text-sm text-slate-500 mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--eaw-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Upload size={16} /> Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <select
          value={filters.doc_type}
          onChange={e => updateFilter('doc_type', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filters.cui_category}
          onChange={e => updateFilter('cui_category', e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All CUI Categories</option>
          {CUI_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
            placeholder="Search documents..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">No documents found</p>
          <p className="text-sm mt-1">Try adjusting your filters or upload a new document.</p>
        </div>
      ) : isMobile ? (
        /* Mobile Card Layout */
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400 font-mono mb-1">
                    DOC-{String(doc.id).padStart(3, '0')}
                  </div>
                  <div className="font-medium text-slate-800 truncate">{doc.title}</div>
                </div>
                <FileText size={18} className="text-slate-400 shrink-0" />
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {doc.doc_type}
                </span>
                <CuiBadge category={doc.cui_category} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                {doc.asset_title && (
                  <div className="col-span-2 text-blue-600 truncate">
                    Asset: {doc.asset_title}
                  </div>
                )}
                {doc.library && (
                  <div className="flex items-center gap-1">
                    <Building2 size={12} /> {doc.library}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User size={12} /> {doc.uploaded_by_name || '--'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(doc.date_received || doc.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Doc ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">CUI Category</th>
                  <th className="px-4 py-3">Related Asset</th>
                  <th className="px-4 py-3">Library</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Date Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      DOC-{String(doc.id).padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                      {doc.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {doc.doc_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CuiBadge category={doc.cui_category} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[120px]">
                      {doc.asset_title || '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {doc.library || '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {doc.uploaded_by_name || '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {formatDate(doc.date_received || doc.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
