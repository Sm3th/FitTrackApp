import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const CONFIG: Record<ToastType, { gradient: string; icon: string; bar: string }> = {
  success: { gradient: 'from-emerald-500 to-green-500',   icon: '✓',  bar: 'bg-white/40' },
  error:   { gradient: 'from-red-500 to-rose-500',        icon: '✕',  bar: 'bg-white/40' },
  warning: { gradient: 'from-amber-500 to-orange-500',    icon: '!',  bar: 'bg-white/40' },
  info:    { gradient: 'from-blue-500 to-indigo-500',     icon: 'i',  bar: 'bg-white/40' },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3500 }) => {
  const [exiting, setExiting] = useState(false);
  const cfg = CONFIG[type];

  const dismiss = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onClose, 220); // match slide-out duration
  };

  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return (
    <div className={`fixed top-4 right-4 z-[9999] ${exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
      <div className={`bg-gradient-to-r ${cfg.gradient} rounded-2xl shadow-2xl shadow-black/20 overflow-hidden min-w-[260px] max-w-sm`}>
        {/* Content */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Icon circle */}
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
            {cfg.icon}
          </div>
          <p className="flex-1 text-white font-semibold text-sm leading-snug">{message}</p>
          <button
            onClick={dismiss}
            className="text-white/70 hover:text-white transition-colors text-lg font-bold leading-none ml-1 flex-shrink-0">
            ×
          </button>
        </div>

        {/* Progress bar that drains left→right */}
        <div className="h-[3px] bg-white/10">
          <div
            className={`h-full ${cfg.bar} animate-toast-progress`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
