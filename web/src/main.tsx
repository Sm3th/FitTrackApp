import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { checkAndFireReminder } from './pages/WorkoutRemindersPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initVitals } from './utils/vitals'
import './i18n'
import './index.css'

// Register service worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app still works online
    });
  });
}

// Measure Core Web Vitals
initVitals();

// Check workout reminder on every app load
checkAndFireReminder();
// Re-check when the tab regains focus
window.addEventListener('focus', checkAndFireReminder);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
