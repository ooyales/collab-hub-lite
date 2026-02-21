import { useState, useEffect } from 'react';
import { apiGet } from '../hooks/useApi';
import KpiCard from '../components/KpiCard';
import {
  Layers, Building2, DollarSign, Info
} from 'lucide-react';

const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const SAVINGS_RATE = 0.12;

export default function ConsolidationDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/dashboard/consolidation')
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading consolidation data...</div>
      </div>
    );
  }

  const vendorsWithMultiple = data?.vendors_with_multiple_assets ?? 0;
  const opportunities = data?.consolidation_opportunities ?? 0;
  const vendorsDetail = data?.vendors_detail || [];

  // Calculate consolidatable budget and potential savings
  const consolidatableBudget = vendorsDetail.reduce((sum, v) => sum + (v.total_budget || 0), 0);
  const potentialSavings = consolidatableBudget * SAVINGS_RATE;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Consolidation Opportunities</h1>
        <p className="text-sm text-slate-500 mt-1">Identify vendors with overlapping assets for potential cost savings</p>
      </div>

      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Vendors with Multiple Assets"
          value={vendorsWithMultiple}
          icon={Building2}
          color="blue"
        />
        <KpiCard
          label="Consolidation Opportunities"
          value={opportunities}
          icon={Layers}
          color="yellow"
        />
        <KpiCard
          label="Potential Savings (12%)"
          value={fmtCurrency(potentialSavings)}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Row 2: Vendors Detail Table */}
      {vendorsDetail.length > 0 ? (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Vendors with Multiple Assets</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-center">Asset Count</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Total Budget</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase">Asset Types</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase text-right">Est. Savings (12%)</th>
                </tr>
              </thead>
              <tbody>
                {vendorsDetail.map((v, i) => {
                  const vendorBudget = v.total_budget || 0;
                  const vendorSavings = vendorBudget * SAVINGS_RATE;
                  const assetTypes = v.asset_types || [];
                  return (
                    <tr key={i} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-700">{v.vendor || v.name}</td>
                      <td className="py-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {v.asset_count || 0}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-600">{fmtCurrency(vendorBudget)}</td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {assetTypes.map((type, j) => (
                            <span
                              key={j}
                              className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600"
                            >
                              {type}
                            </span>
                          ))}
                          {assetTypes.length === 0 && (
                            <span className="text-xs text-slate-400">--</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-green-600 font-medium">
                        {fmtCurrency(vendorSavings)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="pt-3 text-slate-700">Total</td>
                  <td className="pt-3 text-center text-slate-600">
                    {vendorsDetail.reduce((s, v) => s + (v.asset_count || 0), 0)}
                  </td>
                  <td className="pt-3 text-right text-slate-700">{fmtCurrency(consolidatableBudget)}</td>
                  <td className="pt-3"></td>
                  <td className="pt-3 text-right text-green-700">{fmtCurrency(potentialSavings)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">What is Consolidation?</h3>
              <p className="text-sm text-slate-500">
                Consolidation analysis identifies vendors that supply multiple assets across your organization.
                By consolidating purchases with fewer vendors, organizations can negotiate volume discounts,
                reduce administrative overhead, and simplify vendor management. When vendors with multiple
                assets are detected, they will appear here with estimated savings projections.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Savings Methodology */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Consolidation Savings Estimate</h2>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Consolidatable Budget</div>
              <div className="text-xl font-bold text-slate-800">{fmtCurrency(consolidatableBudget)}</div>
              <div className="text-xs text-slate-400 mt-1">Budget across multi-asset vendors</div>
            </div>
            <div className="flex items-center justify-center">
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Savings Rate</div>
                <div className="text-xl font-bold text-slate-800">x 12%</div>
                <div className="text-xs text-slate-400 mt-1">Industry benchmark for volume consolidation</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Potential Savings</div>
              <div className="text-xl font-bold text-green-700">{fmtCurrency(potentialSavings)}</div>
              <div className="text-xs text-slate-400 mt-1">Estimated annual savings</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 text-xs text-slate-500">
            <strong>Methodology:</strong> Savings are estimated at 12% of total budget held by vendors with 2 or more
            assets. This reflects typical volume discount opportunities, reduced administrative costs, and
            streamlined procurement processes achievable through vendor consolidation.
          </div>
        </div>
      </div>
    </div>
  );
}
