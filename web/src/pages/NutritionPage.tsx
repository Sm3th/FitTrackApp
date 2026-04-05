import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';

// ── Barcode Scanner Component ─────────────────────────────────────────────────
declare class BarcodeDetector {
  constructor(options: { formats: string[] });
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
  static getSupportedFormats(): Promise<string[]>;
}

const BarcodeScannerModal: React.FC<{
  onDetect: (barcode: string) => void;
  onClose: () => void;
}> = ({ onDetect, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!supported) return;
    let animFrame: number;
    let stopped = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
        setScanning(true);
        const scan = async () => {
          if (stopped) return;
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                stopped = true;
                onDetect(barcodes[0].rawValue);
                return;
              }
            } catch { /* ignore */ }
          }
          animFrame = requestAnimationFrame(scan);
        };
        scan();
      } catch (e: any) {
        setError(e.message || 'Camera access denied');
      }
    };
    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(animFrame);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [supported, onDetect]);

  const handleManual = () => {
    const cleaned = manual.trim();
    if (cleaned.length >= 8) onDetect(cleaned);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>🔲</span> Barcode Scanner
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        {supported && !error && (
          <div className="relative mb-4 rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-emerald-400 rounded-xl opacity-70">
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400/60 animate-pulse" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-xs text-white/60">Point at a barcode</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!supported && (
          <p className="text-slate-400 text-sm mb-4">Camera barcode detection is not supported in this browser.</p>
        )}

        <div className="mt-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Or enter barcode manually</p>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={e => setManual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManual()}
              placeholder="e.g. 5000112637922"
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
            />
            <button
              onClick={handleManual}
              disabled={manual.trim().length < 8}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm active:scale-95">
              Look up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OFFProduct {
  product_name: string;
  brands?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string; // ISO
}

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DEFAULT_GOALS: DailyGoals = { calories: 2000, protein: 150, carbs: 250, fat: 65 };
const MEAL_ICONS  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const MEAL_COLORS = {
  breakfast: 'from-amber-500 to-orange-500',
  lunch:     'from-emerald-500 to-teal-500',
  dinner:    'from-blue-500 to-indigo-500',
  snack:     'from-pink-500 to-rose-500',
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadEntries = (date: string): FoodEntry[] => {
  try { return JSON.parse(localStorage.getItem(`nutrition_${date}`) || '[]'); }
  catch { return []; }
};

const saveEntries = (date: string, entries: FoodEntry[]) =>
  localStorage.setItem(`nutrition_${date}`, JSON.stringify(entries));

const loadGoals = (): DailyGoals => {
  try { return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem('nutrition_goals') || '{}') }; }
  catch { return DEFAULT_GOALS; }
};

const MacroRing: React.FC<{ value: number; goal: number; color: string; label: string; unit: string }> = ({ value, goal, color, label, unit }) => {
  const pct = Math.min(value / goal, 1);
  const r = 30; const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="-rotate-90" width="80" height="80">
          <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none"/>
          <circle cx="40" cy="40" r={r} stroke={color} strokeWidth="8" fill="none"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
            className="transition-all duration-700"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black text-white leading-none">{value}</span>
          <span className="text-[9px] text-slate-500 uppercase">{unit}</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className="text-[10px] text-slate-600">/{goal}{unit}</span>
    </div>
  );
};

const NutritionPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const MEAL_LABELS = { breakfast: t('nutrition.breakfast'), lunch: t('nutrition.lunch'), dinner: t('nutrition.dinner'), snack: t('nutrition.snack') };
  const [date, setDate] = useState(todayKey());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoals>(loadGoals());
  const [showAdd, setShowAdd] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [editGoals, setEditGoals] = useState<DailyGoals>(loadGoals());

  const [form, setForm] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '',
    meal: 'breakfast' as FoodEntry['meal'],
  });

  // ── Barcode scanner ───────────────────────────────────────────────────────
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  const handleBarcode = useCallback(async (barcode: string) => {
    setShowScanner(false);
    setBarcodeLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        alert('Product not found in database. Try searching by name.');
        return;
      }
      const p = data.product as OFFProduct;
      const n = p.nutriments;
      setForm(f => ({
        ...f,
        name: p.product_name + (p.brands ? ` (${p.brands.split(',')[0].trim()})` : ''),
        calories: Math.round(n['energy-kcal_100g'] || 0).toString(),
        protein: (n.proteins_100g || 0).toFixed(1),
        carbs: (n.carbohydrates_100g || 0).toFixed(1),
        fat: (n.fat_100g || 0).toFixed(1),
      }));
      setShowAdd(true);
    } catch {
      alert('Failed to look up barcode. Please try again.');
    } finally {
      setBarcodeLoading(false);
    }
  }, []);

  // ── Open Food Facts search ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OFFProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [serving, setServing] = useState('100');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchFood = useCallback(async (query: string) => {
    if (query.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=6&fields=product_name,brands,nutriments`
      );
      const data = await res.json();
      const products: OFFProduct[] = (data.products || []).filter(
        (p: OFFProduct) => p.product_name && p.nutriments?.['energy-kcal_100g']
      );
      setSearchResults(products.slice(0, 5));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchFood(value), 500);
  };

  const applyProduct = (product: OFFProduct) => {
    const grams = parseFloat(serving) || 100;
    const ratio = grams / 100;
    const n = product.nutriments;
    setForm(f => ({
      ...f,
      name: product.product_name + (product.brands ? ` (${product.brands.split(',')[0].trim()})` : ''),
      calories: Math.round((n['energy-kcal_100g'] || 0) * ratio).toString(),
      protein:  ((n.proteins_100g || 0) * ratio).toFixed(1),
      carbs:    ((n.carbohydrates_100g || 0) * ratio).toFixed(1),
      fat:      ((n.fat_100g || 0) * ratio).toFixed(1),
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    setEntries(loadEntries(date));
  }, [date, navigate]);

  const totals = entries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAdd = async () => {
    if (!form.name.trim() || !form.calories) return;
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: form.name.trim(),
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      meal: form.meal,
      time: new Date().toISOString(),
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(date, next);
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', meal: form.meal });
    setShowAdd(false);
    // Sync to backend (fire-and-forget)
    apiClient.post('/nutrition', { ...entry, date }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    saveEntries(date, next);
    // Sync to backend (fire-and-forget)
    apiClient.delete(`/nutrition/${id}`).catch(() => {});
  };

  const handleSaveGoals = () => {
    setGoals(editGoals);
    localStorage.setItem('nutrition_goals', JSON.stringify(editGoals));
    setShowGoals(false);
  };

  const caloriesLeft = goals.calories - totals.calories;
  const byMeal = (['breakfast', 'lunch', 'dinner', 'snack'] as FoodEntry['meal'][]).map(meal => ({
    meal,
    items: entries.filter(e => e.meal === meal),
  })).filter(g => g.items.length > 0);

  const isToday = date === todayKey();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/10"/>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }}/>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-1">{t('nutrition.daily') || 'Daily Nutrition'}</p>
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('nutrition.title')}</h1>
            <p className="text-white/40 text-sm">{t('nutrition.subtitle')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowGoals(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {t('nutrition.goals')}
            </button>
            <button onClick={() => setShowScanner(true)}
              disabled={barcodeLoading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50">
              {barcodeLoading
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <span className="text-base leading-none">🔲</span>
              }
              Barcode
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              {t('nutrition.addFood')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Date selector */}
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate()-1); setDate(d.toISOString().slice(0,10)); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-gray-500 dark:text-gray-400 font-bold text-lg">
            ‹
          </button>
          <div className="flex-1 text-center">
            <span className="font-black text-gray-900 dark:text-white text-base">
              {isToday ? t('common.today') : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <button onClick={() => { if (!isToday) { const d = new Date(date); d.setDate(d.getDate()+1); setDate(d.toISOString().slice(0,10)); }}}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all text-lg font-bold ${isToday ? 'opacity-30 cursor-not-allowed bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-400' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-gray-500 dark:text-gray-400'}`}>
            ›
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
          {/* Calorie bar */}
          <div className="mb-6">
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className="text-4xl font-black text-white">{totals.calories.toLocaleString()}</span>
                <span className="text-slate-500 text-sm ml-1">/ {goals.calories.toLocaleString()} kcal</span>
              </div>
              <div className={`text-sm font-bold px-3 py-1 rounded-full ${caloriesLeft >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {caloriesLeft >= 0 ? t('nutrition.caloriesLeft', { n: caloriesLeft }) : t('nutrition.caloriesOver', { n: Math.abs(caloriesLeft) })}
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${totals.calories > goals.calories ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                style={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Macro rings */}
          <div className="flex justify-around">
            <MacroRing value={totals.protein} goal={goals.protein} color="#6366f1" label={t('nutrition.protein')} unit="g"/>
            <MacroRing value={totals.carbs}   goal={goals.carbs}   color="#f59e0b" label={t('nutrition.carbs')}   unit="g"/>
            <MacroRing value={totals.fat}     goal={goals.fat}     color="#ec4899" label={t('nutrition.fat')}     unit="g"/>
          </div>
        </div>

        {/* Meals */}
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl">🥗</div>
            <p className="text-lg font-black text-gray-700 dark:text-gray-300 mb-1">{t('nutrition.nothingLogged')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">{t('nutrition.nothingLoggedDesc')}</p>
            <button onClick={() => setShowAdd(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:scale-95">
              {t('nutrition.logFirstMeal')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {byMeal.map(({ meal, items }) => {
              const mealCals = items.reduce((s, e) => s + e.calories, 0);
              return (
                <div key={meal} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className={`flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ${MEAL_COLORS[meal]} bg-opacity-10`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{MEAL_ICONS[meal]}</span>
                      <span className="font-black text-white text-sm">{MEAL_LABELS[meal]}</span>
                    </div>
                    <span className="text-white/70 text-xs font-semibold">{mealCals} kcal</span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-slate-800">
                    {items.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{entry.name}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-indigo-500 font-medium">{entry.protein}g P</span>
                            <span className="text-xs text-amber-500 font-medium">{entry.carbs}g C</span>
                            <span className="text-xs text-pink-500 font-medium">{entry.fat}g F</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-gray-900 dark:text-white text-sm">{entry.calories}</p>
                          <p className="text-xs text-gray-400">kcal</p>
                        </div>
                        <button onClick={() => handleDelete(entry.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScannerModal onDetect={handleBarcode} onClose={() => setShowScanner(false)} />
      )}

      {/* Add Food Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}/>
          <div className="relative z-10 w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-white">{t('nutrition.addFood')}</h3>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            {/* Meal selector */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {(['breakfast','lunch','dinner','snack'] as FoodEntry['meal'][]).map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, meal: m }))}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${form.meal === m ? `bg-gradient-to-r ${MEAL_COLORS[m]} text-white shadow-md` : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {MEAL_ICONS[m]} {MEAL_LABELS[m]}
                </button>
              ))}
            </div>

            {/* ── Food Search (Open Food Facts) ── */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">🔍</span>
                  <input
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Search food database…"
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                  />
                  {searchLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setShowAdd(false); setShowScanner(true); }}
                  title="Scan barcode"
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-800 border border-slate-600 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500 transition-all text-lg">
                  🔲
                </button>
              </div>

              {/* Serving size */}
              {searchResults.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">Serving size:</span>
                  <input
                    type="number" min="1" value={serving}
                    onChange={e => setServing(e.target.value)}
                    className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
              )}

              {/* Results dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-700/50">
                  {searchResults.map((product, i) => {
                    const grams = parseFloat(serving) || 100;
                    const ratio = grams / 100;
                    const kcal = Math.round((product.nutriments['energy-kcal_100g'] || 0) * ratio);
                    const prot = ((product.nutriments.proteins_100g || 0) * ratio).toFixed(1);
                    return (
                      <button key={i} onClick={() => applyProduct(product)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 transition-colors text-left">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-semibold truncate">{product.product_name}</p>
                          {product.brands && (
                            <p className="text-slate-500 text-xs truncate">{product.brands.split(',')[0].trim()}</p>
                          )}
                        </div>
                        <div className="ml-3 shrink-0 text-right">
                          <span className="text-emerald-400 text-xs font-bold">{kcal} kcal</span>
                          <span className="text-slate-500 text-xs ml-1.5">{prot}g P</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <input
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t('nutrition.foodName')}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm font-medium"
              />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'calories', label: 'Calories (kcal)', placeholder: '350' },
                  { key: 'protein',  label: 'Protein (g)',     placeholder: '30' },
                  { key: 'carbs',    label: 'Carbs (g)',       placeholder: '45' },
                  { key: 'fat',      label: 'Fat (g)',         placeholder: '10' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                    <input
                      type="number" min="0"
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleAdd}
              disabled={!form.name.trim() || !form.calories}
              className="w-full mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              {t('nutrition.addTo', { meal: MEAL_LABELS[form.meal] })}
            </button>
          </div>
        </div>
      )}

      {/* Goals Modal */}
      {showGoals && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoals(false)}/>
          <div className="relative z-10 w-full sm:max-w-sm bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-white">{t('nutrition.dailyGoals')}</h3>
              <button onClick={() => setShowGoals(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'calories', label: t('nutrition.calories'), unit: 'kcal', color: 'text-emerald-400' },
                { key: 'protein',  label: t('nutrition.protein'),  unit: 'g',    color: 'text-indigo-400' },
                { key: 'carbs',    label: t('nutrition.carbs'),    unit: 'g',    color: 'text-amber-400' },
                { key: 'fat',      label: t('nutrition.fat'),      unit: 'g',    color: 'text-pink-400' },
              ].map(({ key, label, unit, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={`text-sm font-black w-20 ${color}`}>{label}</div>
                  <input
                    type="number" min="0"
                    value={(editGoals as any)[key]}
                    onChange={e => setEditGoals(g => ({ ...g, [key]: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm font-bold"
                  />
                  <span className="text-xs text-slate-500 w-8">{unit}</span>
                </div>
              ))}
            </div>
            <button onClick={handleSaveGoals}
              className="w-full mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 hover:from-emerald-400 hover:to-teal-400">
              {t('nutrition.saveGoals')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionPage;
