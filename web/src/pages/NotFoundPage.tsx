import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 max-w-md">
        {/* 404 */}
        <div className="text-[8rem] md:text-[10rem] font-black leading-none tracking-tighter bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent select-none">
          404
        </div>

        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 -mt-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">{t('notFound.title')}</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          {t('notFound.desc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {t('notFound.goBack')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {t('notFound.backToHome')}
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-4">{t('notFound.quickLinks')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Workout', path: '/workout' },
              { label: 'Plans', path: '/workout-plans' },
              { label: 'Stats', path: '/stats' },
              { label: 'Nutrition', path: '/nutrition' },
            ].map(link => (
              <button key={link.path} onClick={() => navigate(link.path)}
                className="text-xs font-semibold text-slate-400 hover:text-blue-400 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all">
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
