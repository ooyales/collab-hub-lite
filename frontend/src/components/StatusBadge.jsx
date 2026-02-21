export function StatusBadge({ status }) {
  const colorMap = {
    'Active': 'bg-green-100 text-green-700',
    'Pending Renewal': 'bg-yellow-100 text-yellow-700',
    'Expired': 'bg-red-100 text-red-700',
    'Retired': 'bg-slate-100 text-slate-600',
    'Not Started': 'bg-slate-100 text-slate-600',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Blocked': 'bg-red-100 text-red-700',
    'Completed': 'bg-green-100 text-green-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const colorMap = {
    'Critical': 'bg-red-100 text-red-700',
    'High': 'bg-orange-100 text-orange-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'Low': 'bg-green-100 text-green-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[priority] || 'bg-slate-100 text-slate-600'}`}>
      {priority}
    </span>
  );
}

export function TypeBadge({ type }) {
  const colorMap = {
    'Hardware': 'bg-purple-100 text-purple-700',
    'Software': 'bg-cyan-100 text-cyan-700',
    'Contract': 'bg-amber-100 text-amber-700',
    'Project': 'bg-indigo-100 text-indigo-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[type] || 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  );
}
