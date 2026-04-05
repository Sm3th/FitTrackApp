import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Measurement {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  waist?: number;
}

interface UserProfile {
  age?: number;
  gender?: string;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  experienceLevel?: string;
}

interface OnboardingData {
  goal?: string;
  level?: string;
  daysPerWeek?: number;
  calorieGoal?: number;
}

const GOAL_META: Record<string, { label: string; icon: string; color: string }> = {
  lose_weight:   { label: 'Lose Weight',        icon: '🔥', color: 'text-orange-500' },
  build_muscle:  { label: 'Build Muscle',        icon: '💪', color: 'text-blue-500'   },
  stay_fit:      { label: 'Stay Fit',            icon: '✨', color: 'text-emerald-500' },
  endurance:     { label: 'Endurance',           icon: '🏃', color: 'text-cyan-500'   },
  flexibility:   { label: 'Flexibility',         icon: '🧘', color: 'text-violet-500' },
  sport:         { label: 'Sport Performance',   icon: '⚡', color: 'text-yellow-500' },
};

const FIELD_CLASSES = 'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const VALUE_CLASSES = 'px-4 py-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-gray-900 dark:text-gray-100 font-medium text-sm';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({});
  const [onboarding, setOnboarding] = useState<OnboardingData>({});
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setPageLoading(true);
    setTimeout(() => {
      const savedProfile = localStorage.getItem('userProfile');
      const savedOnboarding: OnboardingData = JSON.parse(localStorage.getItem('onboarding_data') || '{}');
      setOnboarding(savedOnboarding);
      if (savedProfile) {
        const parsed: UserProfile = JSON.parse(savedProfile);
        // Pre-fill from onboarding if profile fields are empty
        if (!parsed.fitnessGoal && savedOnboarding.goal) parsed.fitnessGoal = savedOnboarding.goal;
        if (!parsed.experienceLevel && savedOnboarding.level) parsed.experienceLevel = savedOnboarding.level;
        setProfile(parsed);
      } else if (savedOnboarding.goal || savedOnboarding.level) {
        setProfile({
          fitnessGoal: savedOnboarding.goal,
          experienceLevel: savedOnboarding.level,
        });
      }
      setPageLoading(false);
    }, 500);
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (
        ['age', 'height', 'currentWeight', 'targetWeight'].includes(name) ? parseFloat(value) : value
      ),
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Persist locally always
      localStorage.setItem('userProfile', JSON.stringify(profile));
      // Sync to backend if logged in
      try {
        await apiClient.patch('/users/me/profile', profile);
      } catch { /* backend optional — local save already done */ }
      showToast(t('profile.profileSaved'), 'success');
      setIsEditing(false);
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (profile.height && profile.currentWeight) {
      const h = profile.height / 100;
      return (profile.currentWeight / (h * h)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: string | null) => {
    if (!bmi) return null;
    const v = parseFloat(bmi);
    if (v < 18.5) return { text: 'Underweight', color: 'text-blue-500' };
    if (v < 25)   return { text: 'Normal', color: 'text-emerald-500' };
    if (v < 30)   return { text: 'Overweight', color: 'text-yellow-500' };
    return { text: 'Obese', color: 'text-red-500' };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);
  const initials = (user.fullName || user.username || 'U').slice(0, 2).toUpperCase();
  const goalMeta = onboarding.goal ? GOAL_META[onboarding.goal] : null;

  // Weight trend from body measurements
  const weightChartData = useMemo(() => {
    try {
      const raw: Measurement[] = JSON.parse(localStorage.getItem('bodyMeasurements') || '[]');
      return raw
        .filter(m => m.weight)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-12)
        .map(m => ({
          date: new Date(m.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          weight: m.weight,
          bodyFat: m.bodyFat,
        }));
    } catch { return []; }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-violet-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/30 flex-shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">{user.fullName || user.username || 'My Profile'}</h1>
                <p className="text-white/40 text-sm mt-0.5">{user.email} · @{user.username}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/15 hover:border-red-500/40 text-white/60 hover:text-red-400 text-sm font-semibold transition-all flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">{t('profile.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {pageLoading ? (
          <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>
        ) : (
          <div className="space-y-6">

            {/* Personal Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="font-bold text-gray-900 dark:text-white">{t('profile.personalInfo')}</h2>
                <button onClick={() => setIsEditing(!isEditing)}
                  className={isEditing ? 'btn-secondary text-sm py-2 px-4' : 'btn-primary text-sm py-2 px-4'}>
                  {isEditing ? t('common.cancel') : t('profile.editProfile')}
                </button>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-5">
                  {[
                    { name: 'age', label: t('profile.age'), type: 'number', placeholder: '25', display: profile.age ? `${profile.age} ${t('common.years') || 'years'}` : t('profile.notSet') },
                    { name: 'height', label: t('profile.heightCm'), type: 'number', placeholder: '175', display: profile.height ? `${profile.height} cm` : t('profile.notSet') },
                    { name: 'currentWeight', label: t('profile.currentWeightKg'), type: 'number', placeholder: '70', display: profile.currentWeight ? `${profile.currentWeight} kg` : t('profile.notSet') },
                    { name: 'targetWeight', label: t('profile.targetWeightKg'), type: 'number', placeholder: '65', display: profile.targetWeight ? `${profile.targetWeight} kg` : t('profile.notSet') },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{field.label}</label>
                      {isEditing ? (
                        <input type={field.type} name={field.name} step="0.1"
                          value={(profile as any)[field.name] || ''}
                          onChange={handleChange} placeholder={field.placeholder}
                          className={FIELD_CLASSES} />
                      ) : (
                        <div className={VALUE_CLASSES}>{field.display}</div>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('profile.gender')}</label>
                    {isEditing ? (
                      <select name="gender" value={profile.gender || ''} onChange={handleChange} className={FIELD_CLASSES}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className={VALUE_CLASSES + ' capitalize'}>{profile.gender || t('profile.notSet')}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('profile.activityLevel')}</label>
                    {isEditing ? (
                      <select name="activityLevel" value={profile.activityLevel || ''} onChange={handleChange} className={FIELD_CLASSES}>
                        <option value="">Select level</option>
                        <option value="sedentary">Sedentary (little or no exercise)</option>
                        <option value="light">Light (1–3 days/week)</option>
                        <option value="moderate">Moderate (3–5 days/week)</option>
                        <option value="active">Active (6–7 days/week)</option>
                        <option value="very_active">Very Active (athlete)</option>
                      </select>
                    ) : (
                      <div className={VALUE_CLASSES + ' capitalize'}>{profile.activityLevel?.replace('_', ' ') || t('profile.notSet')}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('profile.fitnessGoal')}</label>
                    {isEditing ? (
                      <select name="fitnessGoal" value={profile.fitnessGoal || ''} onChange={handleChange} className={FIELD_CLASSES}>
                        <option value="">Select goal</option>
                        <option value="lose_weight">Lose Weight</option>
                        <option value="maintain">Maintain Weight</option>
                        <option value="gain_muscle">Gain Muscle</option>
                        <option value="get_fit">Get Fit</option>
                      </select>
                    ) : (
                      <div className={VALUE_CLASSES + ' capitalize'}>{profile.fitnessGoal?.replace('_', ' ') || t('profile.notSet')}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('profile.experienceLevel')}</label>
                    {isEditing ? (
                      <select name="experienceLevel" value={profile.experienceLevel || ''} onChange={handleChange} className={FIELD_CLASSES}>
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    ) : (
                      <div className={VALUE_CLASSES + ' capitalize'}>{profile.experienceLevel || t('profile.notSet')}</div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                    <button onClick={handleSave} disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
                      {loading ? t('workout.saving') : t('profile.saveProfile')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Health Metrics */}
            {profile.height && profile.currentWeight ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">{t('profile.healthMetrics')}</h2>
                </div>
                <div className="p-6 grid md:grid-cols-3 gap-4">
                  <div className="text-center p-5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">{bmi}</div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('profile.bmi')}</div>
                    {bmiCategory && <div className={`text-sm font-bold ${bmiCategory.color}`}>{bmiCategory.text}</div>}
                  </div>

                  {profile.targetWeight && (
                    <div className="text-center p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                        {Math.abs(profile.currentWeight! - profile.targetWeight).toFixed(1)}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('profile.kgToGoal')}</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {profile.currentWeight! > profile.targetWeight ? t('profile.toLose') : t('profile.toGain')}
                      </div>
                    </div>
                  )}

                  <div className="text-center p-5 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900/40">
                    <div className="text-3xl mb-1">🎯</div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('profile.currentGoal')}</div>
                    <div className="text-sm font-bold text-violet-600 dark:text-violet-400 capitalize">
                      {profile.fitnessGoal?.replace('_', ' ') || t('profile.notSet')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-10 text-center">
                <div className="text-5xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('profile.completeProfile')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('profile.completeProfileDesc')}</p>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="btn-primary text-sm py-2.5 px-6">{t('profile.editProfile')}</button>
                )}
              </div>
            )}
            {/* Weight Trend Chart */}
            {weightChartData.length >= 2 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">Weight Trend</h2>
                  <a href="/measurements" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">View all →</a>
                </div>
                <div className="p-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {(() => {
                      const first = weightChartData[0].weight!;
                      const last  = weightChartData[weightChartData.length - 1].weight!;
                      const diff  = last - first;
                      const min   = Math.min(...weightChartData.map(d => d.weight!));
                      const max   = Math.max(...weightChartData.map(d => d.weight!));
                      return (
                        <>
                          <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{last} kg</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current</div>
                          </div>
                          <div className={`text-center p-3 rounded-xl ${diff < 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : diff > 0 ? 'bg-orange-50 dark:bg-orange-950/30' : 'bg-gray-50 dark:bg-slate-800/60'}`}>
                            <div className={`text-lg font-black ${diff < 0 ? 'text-emerald-600 dark:text-emerald-400' : diff > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Change</div>
                          </div>
                          <div className="text-center p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
                            <div className="text-lg font-black text-violet-600 dark:text-violet-400">{(max - min).toFixed(1)} kg</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Range</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={weightChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--chart-label, #94a3b8)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--chart-label, #94a3b8)' }} tickLine={false} axisLine={false}
                        domain={([min, max]: number[]) => [Math.floor(min - 1), Math.ceil(max + 1)]} />
                      <Tooltip
                        contentStyle={{ background: 'var(--tooltip-bg, #1e293b)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 12 }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                        itemStyle={{ color: '#a5b4fc' }}
                        formatter={(v: number) => [`${v} kg`, 'Weight']} />
                      <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2.5}
                        fill="url(#weightGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#6366f1' }}
                        isAnimationActive animationDuration={900} animationEasing="ease-out" />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Body fat mini chart if available */}
                  {weightChartData.some(d => d.bodyFat) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Body Fat %</p>
                      <ResponsiveContainer width="100%" height={110}>
                        <AreaChart data={weightChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                          <defs>
                            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.08)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--chart-label, #94a3b8)' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--chart-label, #94a3b8)' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'var(--tooltip-bg, #1e293b)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 12 }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                            itemStyle={{ color: '#fcd34d' }}
                            formatter={(v: number) => [`${v}%`, 'Body Fat']} />
                          <Area type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2}
                            fill="url(#fatGrad)" dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#f59e0b' }}
                            isAnimationActive animationDuration={900} animationEasing="ease-out" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Training Goals — from onboarding */}
            {(onboarding.goal || onboarding.level || onboarding.daysPerWeek || onboarding.calorieGoal) && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">{t('profile.trainingGoals')}</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">{t('profile.fromSetup')}</span>
                </div>
                <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goalMeta && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl gap-2 text-center">
                      <span className="text-3xl">{goalMeta.icon}</span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('profile.primaryGoal')}</span>
                      <span className={`text-sm font-black ${goalMeta.color}`}>{goalMeta.label}</span>
                    </div>
                  )}
                  {onboarding.level && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl gap-2 text-center">
                      <span className="text-3xl">{onboarding.level === 'beginner' ? '🌱' : onboarding.level === 'intermediate' ? '⚡' : '🏆'}</span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('profile.experience')}</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white capitalize">{onboarding.level}</span>
                    </div>
                  )}
                  {onboarding.daysPerWeek && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl gap-2 text-center">
                      <span className="text-3xl">📅</span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('profile.daysPerWeek')}</span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">{onboarding.daysPerWeek}x</span>
                    </div>
                  )}
                  {onboarding.calorieGoal && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl gap-2 text-center">
                      <span className="text-3xl">🔥</span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('profile.dailyCalorieGoal')}</span>
                      <span className="text-sm font-black text-orange-500">{onboarding.calorieGoal.toLocaleString()} kcal</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="font-bold text-gray-900 dark:text-white">{t('profile.account')}</h2>
              </div>
              <div className="p-4 space-y-2">
                <button onClick={() => { localStorage.removeItem('onboarding_complete'); localStorage.removeItem('onboarding_data'); window.location.reload(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('profile.redoSetup')}</div>
                    <div className="text-xs text-gray-400">{t('profile.redoSetupDesc')}</div>
                  </div>
                </button>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-500 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">{t('profile.signOut')}</div>
                    <div className="text-xs text-gray-400">{t('profile.signOutDesc')}</div>
                  </div>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default ProfilePage;
