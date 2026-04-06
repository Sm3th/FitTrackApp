import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
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
      const response = await apiClient.post('/auth/login', formData);
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#080a12' }}>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] animate-orb-1 pointer-events-none"
        style={{ background: 'var(--p-from)', opacity: 0.18 }} />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-orb-2 pointer-events-none"
        style={{ background: 'var(--p-to)', opacity: 0.13 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                boxShadow: '0 8px 28px var(--p-shadow), 0 1px 0 rgba(255,255,255,0.15) inset',
              }}>
              <span className="text-white font-black text-xl">F</span>
            </div>
            <div className="text-left">
              <div className="text-xl font-black text-white leading-none tracking-tight">FitTrack</div>
              <div className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Pro</div>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t('auth.welcomeBack')}</h1>
          <p className="text-white/35 text-sm font-normal">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-7"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
          }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">{t('auth.email')}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="your@email.com" required
                className="input-dark w-full px-4 py-3.5 rounded-xl transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">{t('auth.password')}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="••••••••" required
                className="input-dark w-full px-4 py-3.5 rounded-xl transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed text-base">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t('auth.loggingIn')}
                </>
              ) : t('auth.login')}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-white/35">
            {t('auth.noAccount')}{' '}
            <button onClick={() => navigate('/register')}
              className="font-bold transition-all hover:opacity-80"
              style={{ color: 'var(--p-from)' }}>
              {t('auth.signUp')}
            </button>
          </div>
          <div className="mt-2.5 text-center">
            <button onClick={() => navigate('/')} className="text-white/20 hover:text-white/40 text-xs transition-colors font-medium">
              {t('auth.backToHome')}
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 p-3.5 rounded-xl"
            style={{
              background: 'color-mix(in srgb, var(--p-500) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--p-500) 18%, transparent)',
            }}>
            <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--p-from)' }}>{t('auth.demoAccount')}</p>
            <p className="text-xs text-white/40 font-mono">demo@fittrack.com</p>
            <p className="text-xs text-white/40 font-mono">demo123456</p>
          </div>
        </div>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default LoginPage;
