import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { 
  LayoutDashboard, ShieldAlert, Search, RefreshCw, 
  BarChart3, Check, Edit3, X, UserCheck
} from 'lucide-react';

interface AnalyticsData {
  total_grievances: number;
  open_grievances: number;
  escalated_grievances: number;
  resolved_grievances: number;
  sla_breached_grievances: number;
  resolution_rate_percent: number;
  total_citizens: number;
  total_scheme_checks: number;
  grievances_by_category: { category: string; count: number }[];
  grievances_by_status: { status: string; count: number }[];
  grievance_trends: { date: string; count: number }[];
  scheme_uptake: {
    scheme_id: number;
    scheme_name: string;
    total_checks: number;
    eligible_count: number;
    eligibility_rate_percent: number;
  }[];
}

interface GrievanceItem {
  id: number;
  tracking_id: string;
  user_id: number;
  citizen_name?: string;
  citizen_phone?: string;
  category: string;
  description: string;
  description_english: string;
  status: string;
  department_assigned: string;
  sla_deadline: string;
  is_sla_breached: boolean;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export const OfficialDashboard: React.FC = () => {
  const { t } = useLanguage();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationMsg, setEscalationMsg] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBreached, setFilterBreached] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState<string>('');

  // Status update modal
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterCategory, filterStatus, filterBreached]);

  const loadData = async () => {
    try {
      const [analyticsRes, grievancesRes] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getOfficialGrievances({
          category: filterCategory || undefined,
          status: filterStatus || undefined,
          sla_breached_only: filterBreached || undefined,
        }),
      ]);
      setAnalytics(analyticsRes);
      setGrievances(grievancesRes);
    } catch (err) {
      console.error('Failed to load official dashboard:', err);
    }
  };

  const handleTriggerEscalation = async () => {
    setIsEscalating(true);
    setEscalationMsg(null);
    try {
      const res = await api.triggerSlaEscalation();
      setEscalationMsg(res.message);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger SLA check');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleOpenUpdateModal = (g: GrievanceItem) => {
    setSelectedGrievance(g);
    setNewStatus(g.status);
    setResolutionNotes(g.resolution_notes || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedGrievance) return;
    setIsUpdating(true);
    try {
      await api.updateGrievanceStatus(selectedGrievance.id, newStatus, resolutionNotes);
      setSelectedGrievance(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter grievances by local search term
  const filteredGrievances = grievances.filter((g) => {
    if (!tableSearch.trim()) return true;
    const query = tableSearch.toLowerCase();
    return (
      g.tracking_id.toLowerCase().includes(query) ||
      (g.citizen_name && g.citizen_name.toLowerCase().includes(query)) ||
      g.category.toLowerCase().includes(query) ||
      g.description_english.toLowerCase().includes(query) ||
      g.department_assigned.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <LayoutDashboard className="w-7 h-7 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black">{t.official.dashboardTitle}</h1>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            {t.official.dashboardSubtitle}
          </p>
        </div>

        {/* SLA Auto-Escalation Trigger Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <button
            onClick={handleTriggerEscalation}
            disabled={isEscalating}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEscalating ? 'animate-spin' : ''}`} />
            <span>{isEscalating ? 'Escalating Overdue...' : t.official.triggerSlaEscalation}</span>
          </button>
        </div>
      </div>

      {escalationMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{escalationMsg}</span>
          <button onClick={() => setEscalationMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.official.kpiTotalGrievances}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics.total_grievances}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Logged village grievances</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.official.kpiOpen}
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {analytics.open_grievances}
            </div>
            <span className="text-[10px] text-amber-700 font-medium mt-1 block">Under inspection / action</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
            <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider block flex items-center">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {t.official.kpiEscalated}
            </span>
            <div className="text-2xl font-black text-red-600 mt-1">
              {analytics.escalated_grievances}
            </div>
            <span className="text-[10px] text-red-600 font-medium mt-1 block">Overdue SLA breaches</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.official.kpiResolved}
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {analytics.resolved_grievances}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Redressed & verified</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.official.kpiResolutionRate}
            </span>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {analytics.resolution_rate_percent}%
            </div>
            <span className="text-[10px] text-blue-700 font-medium mt-1 block">Panchayat SLA efficiency</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.official.kpiSchemeChecks}
            </span>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {analytics.total_scheme_checks}
            </div>
            <span className="text-[10px] text-indigo-700 font-medium mt-1 block">Citizen entitlement queries</span>
          </div>
        </div>
      )}

      {/* Analytics Visualization Section: Systemic Issue Insights & Scheme Uptake */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Grievances By Category (Bar breakdown) */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>{t.official.chartCategoryTitle}</span>
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Systemic Bottlenecks
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {analytics.grievances_by_category.map((item) => {
                const percentage = analytics.total_grievances > 0 
                  ? Math.round((item.count / analytics.total_grievances) * 100) 
                  : 0;

                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize text-slate-700">{item.category}</span>
                      <span className="text-slate-500">{item.count} complaints ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.category === 'water'
                            ? 'bg-blue-600'
                            : item.category === 'electricity'
                            ? 'bg-amber-500'
                            : item.category === 'road'
                            ? 'bg-orange-500'
                            : item.category === 'sanitation'
                            ? 'bg-emerald-600'
                            : 'bg-purple-600'
                        }`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheme Uptake & Eligibility Conversion */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>{t.official.chartSchemeUptake}</span>
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Welfare Penetration
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {analytics.scheme_uptake.map((s) => (
                <div key={s.scheme_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 line-clamp-1">{s.scheme_name}</span>
                    <span className="text-emerald-700 font-bold whitespace-nowrap ml-2">
                      {s.eligible_count}/{s.total_checks} ({s.eligibility_rate_percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.max(s.eligibility_rate_percent, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grievance Triage Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">{t.official.grievancesTitle}</h3>
            <p className="text-xs text-slate-500">Live operational queue with SLA monitoring and department dispatch</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search ID, citizen, description..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="">{t.official.allCategories}</option>
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="road">Road</option>
              <option value="sanitation">Sanitation</option>
              <option value="pension">Pension</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="">{t.official.allStatuses}</option>
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>

            <button
              onClick={() => setFilterBreached(!filterBreached)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                filterBreached
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.official.filterSlaBreach}</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="p-3.5">{t.official.tableTrackingId}</th>
                <th className="p-3.5">{t.official.tableCitizen}</th>
                <th className="p-3.5">{t.official.tableCategory}</th>
                <th className="p-3.5">{t.official.tableIssue}</th>
                <th className="p-3.5">{t.official.tableStatus}</th>
                <th className="p-3.5">{t.official.tableSlaDeadline}</th>
                <th className="p-3.5 text-right">{t.official.tableAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGrievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No grievances matched current filters.
                  </td>
                </tr>
              ) : (
                filteredGrievances.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {g.tracking_id}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{g.citizen_name || 'Citizen'}</div>
                      <div className="text-[10px] text-slate-400">{g.citizen_phone || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {g.category}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-slate-700 leading-snug">
                        {g.description_english || g.description}
                      </p>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          g.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : g.status === 'escalated'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : g.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {g.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className={`font-semibold ${g.is_sla_breached ? 'text-red-600' : 'text-slate-700'}`}>
                        {new Date(g.sla_deadline).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                      </div>
                      {g.is_sla_breached && (
                        <span className="text-[9px] font-bold text-red-600 block uppercase">
                          SLA Breached
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenUpdateModal(g)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold rounded-lg border border-slate-200 transition inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Update Grievance: <span className="font-mono text-blue-700">{selectedGrievance.tracking_id}</span>
              </h3>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Issue Description:</span>
              <p className="italic">"{selectedGrievance.description_english || selectedGrievance.description}"</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In Progress / Field Inspection</option>
                  <option value="escalated">Escalated (Higher Authority)</option>
                  <option value="resolved">Resolved & Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Resolution Notes / Action Taken:</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter details of field inspection, contractor assigned, or resolution status..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGrievance(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Saving...' : 'Save & Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
