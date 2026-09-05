import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Landmark, Calendar, Hammer, IndianRupee, Search, Clock } from 'lucide-react';

interface GovernanceRecord {
  id: number;
  panchayat_id: string;
  title: string;
  description: string;
  category: 'meeting' | 'work' | 'fund';
  date: string;
  status: string;
  amount?: number;
}

export const GovernanceRecords: React.FC = () => {
  const { language, t } = useLanguage();
  const [records, setRecords] = useState<GovernanceRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [categoryFilter, language]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGovernanceRecords(
        categoryFilter || undefined,
        searchTerm || undefined,
        language
      );
      setRecords(data);
    } catch (err) {
      console.error('Failed to load governance records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <Landmark className="w-8 h-8 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-black">{t.governance.title}</h1>
        </div>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
          {t.governance.subtitle}
        </p>

        {/* Filters and Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                categoryFilter === '' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.governance.filterAll}
            </button>
            <button
              onClick={() => setCategoryFilter('meeting')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 ${
                categoryFilter === 'meeting' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.governance.filterMeetings}</span>
            </button>
            <button
              onClick={() => setCategoryFilter('work')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 ${
                categoryFilter === 'work' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>{t.governance.filterWorks}</span>
            </button>
            <button
              onClick={() => setCategoryFilter('fund')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 ${
                categoryFilter === 'fund' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{t.governance.filterFunds}</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.governance.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Record Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading governance records...
        </div>
      ) : records.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          {t.governance.emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((rec) => {
            const isMeeting = rec.category === 'meeting';
            const isWork = rec.category === 'work';

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 uppercase tracking-wider ${
                        isMeeting
                          ? 'bg-blue-100 text-blue-800'
                          : isWork
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isMeeting ? <Calendar className="w-3 h-3 mr-1" /> : (isWork ? <Hammer className="w-3 h-3 mr-1" /> : <IndianRupee className="w-3 h-3 mr-1" />)}
                      {rec.category}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        rec.status === 'completed' || rec.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : (rec.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200')
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">
                    {rec.title}
                  </h3>

                  <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    {rec.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(rec.date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {rec.amount && (
                    <div className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ₹{rec.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
