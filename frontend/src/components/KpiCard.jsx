export default function KpiCard({ label, value, icon: Icon, color = 'blue', subtitle, onClick }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  const iconColorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div
      className={`bg-white rounded-xl border p-4 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1 text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColorMap[color] || iconColorMap.blue}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
