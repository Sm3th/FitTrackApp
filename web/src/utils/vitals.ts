/**
 * Web Vitals tracking — measures Core Web Vitals and logs them.
 * In production you'd send these to an analytics endpoint.
 * For the thesis, metrics are stored in localStorage so they
 * can be displayed in the app's performance dashboard.
 */

interface VitalEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

const VITALS_KEY = 'fittrack_vitals';

function rateMetric(name: string, value: number): VitalEntry['rating'] {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],   // ms
    FID: [100, 300],     // ms
    CLS: [0.1, 0.25],    // score
    FCP: [1800, 3000],   // ms
    TTFB: [800, 1800],   // ms
    INP: [200, 500],     // ms
  };
  const [good, poor] = thresholds[name] || [1000, 3000];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function saveVital(name: string, value: number) {
  const entry: VitalEntry = {
    name, value,
    rating: rateMetric(name, value),
    timestamp: Date.now(),
  };
  try {
    const existing: VitalEntry[] = JSON.parse(localStorage.getItem(VITALS_KEY) || '[]');
    // Keep last 20 entries
    const updated = [entry, ...existing.filter(e => e.name !== name)].slice(0, 20);
    localStorage.setItem(VITALS_KEY, JSON.stringify(updated));
  } catch { /* quota */ }

  // Dev console output
  if (import.meta.env.DEV) {
    const color = entry.rating === 'good' ? '#22c55e' : entry.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444';
    console.log(`%c[Web Vitals] ${name}: ${Math.round(value)}${name === 'CLS' ? '' : 'ms'} (${entry.rating})`, `color: ${color}; font-weight: bold`);
  }
}

export async function initVitals() {
  try {
    const wv = await import('web-vitals');
    if ('onLCP'  in wv) (wv.onLCP  as (cb: (m: { value: number }) => void) => void)(m => saveVital('LCP',  m.value));
    if ('onCLS'  in wv) (wv.onCLS  as (cb: (m: { value: number }) => void) => void)(m => saveVital('CLS',  m.value));
    if ('onFCP'  in wv) (wv.onFCP  as (cb: (m: { value: number }) => void) => void)(m => saveVital('FCP',  m.value));
    if ('onTTFB' in wv) (wv.onTTFB as (cb: (m: { value: number }) => void) => void)(m => saveVital('TTFB', m.value));
    if ('onINP'  in wv) (wv.onINP  as (cb: (m: { value: number }) => void) => void)(m => saveVital('INP',  m.value));
  } catch { /* web-vitals not available */ }
}

export function getStoredVitals(): VitalEntry[] {
  try { return JSON.parse(localStorage.getItem(VITALS_KEY) || '[]'); }
  catch { return []; }
}
