import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { 
  LayoutDashboard, ShieldAlert, Search, RefreshCw, 
  BarChart3, Check, Edit3, X, UserCheck, Shield, CheckCircle2
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
  const { language, t } = useLanguage();

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
      setEscalationMsg(
        language === 'mr'
          ? `✓ SLA तपासणी पूर्ण: मुदत संपलेल्या तक्रारी गटविकास अधिकारी (BDO) कक्षाकडे वर्ग करण्यात आल्या.`
          : res.message
      );
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
      (g.citizen_phone && g.citizen_phone.toLowerCase().includes(query)) ||
      g.category.toLowerCase().includes(query) ||
      g.description_english.toLowerCase().includes(query) ||
      g.department_assigned.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* 1. Official Government MIS War Room Header */}
      <div className="bg-[#0A2540] text-white rounded-2xl shadow-lg border-t-4 border-[#FF9933] overflow-hidden">
        {/* Jurisdiction strip */}
        <div className="bg-[#061826] px-6 py-2 border-b border-blue-950 flex flex-wrap items-center justify-between text-xs text-blue-200">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-[#FF9933]" />
            <span className="font-semibold uppercase tracking-wider">
              {language === 'mr' 
                ? 'शासकीय प्रशासकीय नियंत्रण कक्ष | ग्रामपंचायत कोपरगाव' 
                : 'Administrative War Room | Gram Panchayat Kopargaon'}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-300">
            <span>{language === 'mr' ? 'तालुका: कोपरगाव | जिल्हा: अहिल्यानगर' : 'Block: Kopargaon | District: Ahilyanagar'}</span>
            <span className="bg-blue-800 text-blue-100 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
              OFFICER LOGIN: 9822001122
            </span>
          </div>
        </div>

        {/* Banner Content */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#133E87] to-[#0A2540] border border-blue-400/30 flex items-center justify-center shadow-inner">
                <LayoutDashboard className="w-6 h-6 text-[#FF9933]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {language === 'mr' ? 'ग्रामपंचायत प्रशासकीय नियंत्रण कक्ष' : t.official.dashboardTitle}
                </h1>
                <p className="text-xs text-amber-300 font-medium">
                  {language === 'mr' 
                    ? 'नागरिक हक्क सनद, तक्रार निवारण SLA सनियंत्रण व कल्याणकारी योजना प्रगती' 
                    : t.official.dashboardSubtitle}
                </p>
              </div>
            </div>

            {/* Officer details on duty */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-2">
              <span><strong>सरपंच:</strong> श्रीमती सुमित्रा गायकवाड</span>
              <span>•</span>
              <span><strong>ग्रामसेवक:</strong> श्री. आनंदराव शिंदे (GS-KPG-104)</span>
              <span>•</span>
              <span><strong>सहाय्यक अभियंता:</strong> श्री. विजय देशमुख</span>
            </div>
          </div>

          {/* SLA Auto-Escalation Trigger Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <button
              onClick={handleTriggerEscalation}
              disabled={isEscalating}
              className="px-4 py-2.5 bg-[#E65100] hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 border border-orange-400/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEscalating ? 'animate-spin' : ''}`} />
              <span>
                {isEscalating 
                  ? (language === 'mr' ? 'तपासणी सुरू आहे...' : 'Escalating Overdue...') 
                  : (language === 'mr' ? 'SLA मुदत तपासणी व BDO कडे वर्ग' : t.official.triggerSlaEscalation)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {escalationMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{escalationMsg}</span>
          </div>
          <button onClick={() => setEscalationMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Official KPI Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'mr' ? 'एकूण तक्रारी' : t.official.kpiTotalGrievances}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics.total_grievances}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              {language === 'mr' ? 'नागरिक नोंदणीकृत' : 'Registered by citizens'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-amber-200 bg-amber-50/20 shadow-sm">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              {language === 'mr' ? 'चौकशी सुरू' : t.official.kpiOpen}
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {analytics.open_grievances}
            </div>
            <span className="text-[10px] text-amber-700 font-medium mt-1 block">
              {language === 'mr' ? 'क्षेत्रीय तपासणी सुरू' : 'Field inspection ongoing'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-red-300 bg-red-50/30 shadow-sm">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block flex items-center">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {language === 'mr' ? 'वर्ग / प्रलंबित' : t.official.kpiEscalated}
            </span>
            <div className="text-2xl font-black text-red-600 mt-1">
              {analytics.escalated_grievances}
            </div>
            <span className="text-[10px] text-red-700 font-bold mt-1 block">
              {language === 'mr' ? 'SLA मुदत उल्लंघन' : 'SLA Breached'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/20 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              {language === 'mr' ? 'निवारण पूर्ण' : t.official.kpiResolved}
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {analytics.resolved_grievances}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
              {language === 'mr' ? 'नागरिक समाधान प्रमाणित' : 'Resolved & verified'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-blue-200 bg-blue-50/20 shadow-sm">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              {language === 'mr' ? 'कार्यक्षमता दर' : t.official.kpiResolutionRate}
            </span>
            <div className="text-2xl font-black text-[#133E87] mt-1">
              {analytics.resolution_rate_percent}%
            </div>
            <span className="text-[10px] text-blue-700 font-medium mt-1 block">
              {language === 'mr' ? 'SLA पालन प्रमाण' : 'SLA Compliance'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/20 shadow-sm">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
              {language === 'mr' ? 'योजना पडताळणी' : t.official.kpiSchemeChecks}
            </span>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {analytics.total_scheme_checks}
            </div>
            <span className="text-[10px] text-indigo-700 font-medium mt-1 block">
              {language === 'mr' ? 'पात्रता चौकशी' : 'Entitlement queries'}
            </span>
          </div>
        </div>
      )}

      {/* 3. Systemic Issue Bottlenecks & Scheme Uptake Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Department Breakdown Bar Graph */}
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#133E87]" />
                <span>{language === 'mr' ? 'विभागनिहाय तक्रार प्रमाण' : t.official.chartCategoryTitle}</span>
              </h3>
              <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                {language === 'mr' ? 'प्रशासकीय अडथळे' : 'Systemic Bottlenecks'}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {analytics.grievances_by_category.map((item) => {
                const percentage = analytics.total_grievances > 0 
                  ? Math.round((item.count / analytics.total_grievances) * 100) 
                  : 0;

                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize text-slate-800">
                        {item.category === 'water' ? (language === 'mr' ? 'पिण्याचे पाणी (Water Supply)' : 'Water Supply')
                          : item.category === 'electricity' ? (language === 'mr' ? 'वीज / पथदिवे (Streetlights)' : 'Streetlights')
                          : item.category === 'road' ? (language === 'mr' ? 'रस्ते व वाहतूक (PWD Roads)' : 'Roads')
                          : item.category === 'sanitation' ? (language === 'mr' ? 'स्वच्छता व सांडपाणी (Sanitation)' : 'Sanitation')
                          : (language === 'mr' ? 'पेंशन व इतर सेवा (Pension / Misc)' : 'Other')}
                      </span>
                      <span className="text-slate-600 font-mono">
                        {item.count} {language === 'mr' ? 'तक्रारी' : 'complaints'} ({percentage}%)
                      </span>
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
                        style={{ width: `${Math.max(percentage, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheme Uptake & Welfare Penetration */}
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>{language === 'mr' ? 'कल्याणकारी योजना पात्रता व मागणी' : t.official.chartSchemeUptake}</span>
              </h3>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                {language === 'mr' ? 'थेट लाभ हस्तांतरण' : 'Welfare Penetration'}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {analytics.scheme_uptake.map((s) => (
                <div key={s.scheme_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 line-clamp-1">{s.scheme_name}</span>
                    <span className="text-[#0D5C3A] font-bold whitespace-nowrap ml-2 font-mono">
                      {s.eligible_count}/{s.total_checks} ({s.eligibility_rate_percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.max(s.eligibility_rate_percent, 6)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Grievance Triage Table (प्रपत्र 'ब' - नागरिक तक्रार नोंदवही) */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Table Header Strip */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#0A2540] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                प्रपत्र 'ब'
              </span>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'mr' ? 'ग्रामपंचायत नागरिक तक्रार निवारण नोंदवही' : t.official.grievancesTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'mr' 
                ? 'महाराष्ट्र लोकसेवा हक्क कायदा २०१५ अंतर्गत अधिकृत वेळमर्यादा सनियंत्रण' 
                : 'Operational triage register under Public Services Guarantee Act'}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={language === 'mr' ? 'तक्रार आयडी किंवा नाव शोधा...' : 'Search ID, citizen, description...'}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">{t.official.allCategories}</option>
              <option value="water">{language === 'mr' ? 'पाणीपुरवठा' : 'Water'}</option>
              <option value="electricity">{language === 'mr' ? 'वीज / पथदिवे' : 'Electricity'}</option>
              <option value="road">{language === 'mr' ? 'रस्ते बांधकाम' : 'Road'}</option>
              <option value="sanitation">{language === 'mr' ? 'स्वच्छता' : 'Sanitation'}</option>
              <option value="pension">{language === 'mr' ? 'पेंशन' : 'Pension'}</option>
              <option value="other">{language === 'mr' ? 'इतर' : 'Other'}</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">{t.official.allStatuses}</option>
              <option value="submitted">{language === 'mr' ? 'दाखल' : 'Submitted'}</option>
              <option value="in_progress">{language === 'mr' ? 'चौकशी सुरू' : 'In Progress'}</option>
              <option value="escalated">{language === 'mr' ? 'वर्ग (BDO)' : 'Escalated'}</option>
              <option value="resolved">{language === 'mr' ? 'निवारण पूर्ण' : 'Resolved'}</option>
            </select>

            <button
              onClick={() => setFilterBreached(!filterBreached)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                filterBreached
                  ? 'bg-red-600 text-white border-red-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'मुदत संपलेल्या' : t.official.filterSlaBreach}</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px] tracking-wider">
                <th className="p-3.5">{language === 'mr' ? 'तक्रार आयडी' : t.official.tableTrackingId}</th>
                <th className="p-3.5">{language === 'mr' ? 'नागरिक तपशील' : t.official.tableCitizen}</th>
                <th className="p-3.5">{language === 'mr' ? 'विभाग' : t.official.tableCategory}</th>
                <th className="p-3.5">{language === 'mr' ? 'तक्रार स्वरूप' : t.official.tableIssue}</th>
                <th className="p-3.5">{language === 'mr' ? 'सद्यस्थिती' : t.official.tableStatus}</th>
                <th className="p-3.5">{language === 'mr' ? 'SLA मुदत तारीख' : t.official.tableSlaDeadline}</th>
                <th className="p-3.5 text-right">{language === 'mr' ? 'कारवाई' : t.official.tableAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGrievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {language === 'mr' ? 'कोणतीही तक्रार आढळली नाही.' : 'No grievances matched current filters.'}
                  </td>
                </tr>
              ) : (
                filteredGrievances.map((g) => (
                  <tr key={g.id} className="hover:bg-blue-50/40 transition">
                    <td className="p-3.5 font-mono font-bold text-[#133E87] whitespace-nowrap">
                      {g.tracking_id}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{g.citizen_name || 'गावकरी नागरिक'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{g.citizen_phone || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {g.category}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-slate-700 leading-snug">
                        {language === 'mr' ? g.description : (g.description_english || g.description)}
                      </p>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`font-black px-2.5 py-1 rounded-full text-[10px] border ${
                          g.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : g.status === 'escalated'
                            ? 'bg-red-100 text-red-900 border-red-300 animate-pulse'
                            : g.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-blue-100 text-blue-900 border-blue-300'
                        }`}
                      >
                        {g.status === 'resolved' 
                          ? (language === 'mr' ? 'निवारण पूर्ण' : 'RESOLVED')
                          : g.status === 'escalated'
                          ? (language === 'mr' ? 'वर्ग (BDO)' : 'ESCALATED')
                          : g.status === 'in_progress'
                          ? (language === 'mr' ? 'चौकशी सुरू' : 'IN PROGRESS')
                          : (language === 'mr' ? 'दाखल' : 'SUBMITTED')}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className={`font-semibold ${g.is_sla_breached ? 'text-red-600' : 'text-slate-700'}`}>
                        {new Date(g.sla_deadline).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      {g.is_sla_breached && (
                        <span className="text-[9px] font-black text-red-600 block uppercase">
                          ⚠ मुदत संपली (Breached)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenUpdateModal(g)}
                        className="px-3 py-1.5 bg-[#0A2540] hover:bg-blue-900 text-white font-bold rounded-lg text-xs transition inline-flex items-center space-x-1 shadow-xs"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{language === 'mr' ? 'स्थिती बदला' : 'Update'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Official Status Update & Resolution Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-300 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#133E87]" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {language === 'mr' ? 'तक्रार कारवाई व स्थिती नोंद' : 'Official Action & Status Update'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">तक्रार क्र:</span>
                <span className="font-mono font-bold text-[#133E87]">{selectedGrievance.tracking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">तक्रारदार:</span>
                <span>{selectedGrievance.citizen_name || 'गावकरी नागरिक'} ({selectedGrievance.citizen_phone || 'N/A'})</span>
              </div>
              <p className="italic text-slate-600 pt-1 border-t border-slate-200">
                "{selectedGrievance.description}"
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {language === 'mr' ? 'नवीन प्रशासकीय स्थिती:' : 'Update Status:'}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#133E87] font-semibold bg-white"
                >
                  <option value="submitted">{language === 'mr' ? 'दाखल (Submitted)' : 'Submitted'}</option>
                  <option value="in_progress">{language === 'mr' ? 'क्षेत्रीय तपासणी सुरू (In Progress / Field Inspection)' : 'In Progress / Field Inspection'}</option>
                  <option value="escalated">{language === 'mr' ? 'गटविकास अधिकारी (BDO) कडे वर्ग (Escalated)' : 'Escalated (Higher Authority)'}</option>
                  <option value="resolved">{language === 'mr' ? 'निवारण पूर्ण व बंद (Resolved & Closed)' : 'Resolved & Closed'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {language === 'mr' ? 'केलेली कारवाई व ग्रामसेवक शेरा:' : 'Official Resolution Notes / Action Taken:'}
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={language === 'mr' ? 'जागेवर प्रत्यक्ष पाहणी केली, पाइपलाइन दुरुस्ती काम पूर्ण झाले...' : 'Enter details of field inspection, contractor assigned, or resolution status...'}
                  className="w-full p-2.5 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#133E87] text-xs"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGrievance(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="flex-1 py-2.5 bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>{isUpdating ? (language === 'mr' ? 'नोंद होत आहे...' : 'Saving...') : (language === 'mr' ? 'शेरा नोंदवा व जतन करा' : 'Save & Publish')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
