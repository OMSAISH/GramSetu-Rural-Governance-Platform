import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Lock, Phone, User, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessRole }) => {
  const { language, t } = useLanguage();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<'citizen' | 'official'>('citizen');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'citizen' && isRegisterMode) {
        const res = await api.register({
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          password,
          preferred_language: language,
          role: 'citizen',
          age: 35,
          annual_income: 80000,
          category: 'OBC',
          occupation: 'farmer'
        });
        login(res.access_token, res.user);
        onSuccessRole?.('citizen');
        onClose();
      } else {
        const res = await api.login(phoneNumber.trim(), password);
        login(res.access_token, res.user);
        onSuccessRole?.(res.user.role);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoCitizen = () => {
    setActiveTab('citizen');
    setIsRegisterMode(false);
    setPhoneNumber('9876543210');
    setPassword('Citizen@123');
    setErrorMsg(null);
  };

  const handleFillDemoOfficial = () => {
    setActiveTab('official');
    setIsRegisterMode(false);
    setPhoneNumber('9822001122');
    setPassword('Official@123');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
              GS
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {t.appName} Login Portal
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('citizen');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'citizen' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.auth.citizenLogin}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('official');
              setIsRegisterMode(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'official' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.auth.officialLogin}</span>
          </button>
        </div>

        {/* Citizen Login / Register mode toggle */}
        {activeTab === 'citizen' && (
          <div className="flex justify-center space-x-4 text-xs font-semibold text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`${!isRegisterMode ? 'text-emerald-700 border-b-2 border-emerald-600 pb-0.5' : ''}`}
            >
              {t.auth.loginTab}
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`${isRegisterMode ? 'text-emerald-700 border-b-2 border-emerald-600 pb-0.5' : ''}`}
            >
              {t.auth.registerTab}
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-medium">
          {activeTab === 'citizen' && isRegisterMode && (
            <div>
              <label className="block text-slate-700 mb-1">{t.auth.nameLabel}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Shankar Rao"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 mb-1">{t.auth.phoneLabel}</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">{t.auth.passwordLabel}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 text-white rounded-xl font-bold shadow-md transition text-xs mt-2 ${
              activeTab === 'official'
                ? 'bg-blue-700 hover:bg-blue-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            {isLoading
              ? 'Verifying...'
              : isRegisterMode
              ? t.auth.submitRegister
              : t.auth.submitLogin}
          </button>
        </form>

        {/* Demo Fast Fill Buttons for Testing & Evaluators */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
            Demo Credentials (1-Click Fill)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFillDemoCitizen}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold text-center transition"
            >
              Fill Citizen Demo
            </button>
            <button
              type="button"
              onClick={handleFillDemoOfficial}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold text-center transition"
            >
              Fill Official Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
