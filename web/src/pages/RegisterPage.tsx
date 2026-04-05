import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !formData.password) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/register', {
        email: formData.email, username: formData.username,
        password: formData.password, fullName: formData.fullName,
      });
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        showToast('Account created! Welcome to FitTrack!', 'success');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] animate-orb-2 pointer-events-none" />
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
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t('auth.createAccount')}</h1>
          <p className="text-slate-400 text-sm">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'fullName', label: t('auth.fullName'), type: 'text', placeholder: 'John Doe', required: false },
              { id: 'username', label: t('auth.username'), type: 'text', placeholder: 'johndoe', required: true },
              { id: 'email', label: t('auth.emailRequired'), type: 'email', placeholder: 'your@email.com', required: true },
              { id: 'password', label: t('auth.passwordRequired'), type: 'password', placeholder: '••••••••', required: true },
              { id: 'confirmPassword', label: t('auth.confirmPassword'), type: 'password', placeholder: '••••••••', required: true },
            ].map(field => (
              <div key={field.id}>
                <label className="block text-sm font-semibold text-slate-300 mb-2">{field.label}</label>
                <input type={field.type} name={field.id}
                  value={formData[field.id as keyof typeof formData]}
                  onChange={handleChange} placeholder={field.placeholder} required={field.required}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none transition-all focus-primary" />
                {field.id === 'password' && (
                  <p className="text-xs text-slate-500 mt-1">{t('auth.minPassword')}</p>
                )}
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t('auth.creatingAccount')}
                </span>
              ) : t('auth.createAccountBtn')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {t('auth.alreadyAccount')}{' '}
            <button onClick={() => navigate('/login')}
              className="font-semibold transition-colors"
              style={{ color: 'var(--p-text)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              {t('auth.logIn')}
            </button>
          </div>
          <div className="mt-3 text-center">
            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              {t('auth.backToHome')}
            </button>
          </div>
        </div>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default RegisterPage;
