import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3000/api/auth/login', formData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        showToast('Welcome back!', 'success');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] animate-orb-2 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 8px 24px var(--p-shadow)' }}>
              <span className="text-white font-black text-xl">F</span>
            </div>
            <span className="text-2xl font-black text-white tracking-tight">FitTrack</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t('auth.welcomeBack')}</h1>
          <p className="text-slate-400 text-sm">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">{t('auth.email')}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="your@email.com" required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none transition-all focus-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">{t('auth.password')}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••" required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none transition-all focus-primary" />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t('auth.loggingIn')}
                </span>
              ) : t('auth.login')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {t('auth.noAccount')}{' '}
            <button onClick={() => navigate('/register')}
              className="font-semibold transition-colors"
              style={{ color: 'var(--p-text)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              {t('auth.signUp')}
            </button>
          </div>
          <div className="mt-3 text-center">
            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              {t('auth.backToHome')}
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--p-500) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--p-500) 20%, transparent)' }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--p-text)' }}>{t('auth.demoAccount')}</p>
            <p className="text-xs text-slate-400">Email: demo@fittrack.com</p>
            <p className="text-xs text-slate-400">Password: demo123456</p>
          </div>
        </div>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default LoginPage;
