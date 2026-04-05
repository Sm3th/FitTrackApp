import React from 'react';

const S = 'bg-gray-200 dark:bg-slate-800 rounded animate-pulse';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 animate-pulse">
    <div className={`h-5 ${S} w-3/4 mb-4`} />
    <div className={`h-4 ${S} w-full mb-2`} />
    <div className={`h-4 ${S} w-5/6`} />
  </div>
);

export const ListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 animate-pulse flex gap-4 items-center">
        <div className={`w-12 h-12 ${S} rounded-xl flex-shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 ${S} w-1/3`} />
          <div className={`h-3 ${S} w-2/3`} />
        </div>
        <div className={`w-16 h-6 ${S} rounded-full`} />
      </div>
    ))}
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 animate-pulse">
        <div className={`w-12 h-12 ${S} rounded-xl mb-4`} />
        <div className={`h-8 ${S} w-20 mb-2`} />
        <div className={`h-4 ${S} w-32`} />
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
    <div className={`h-12 ${S} m-0 rounded-none`} />
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="h-14 border-t border-gray-100 dark:border-slate-800 px-5 flex items-center gap-4 animate-pulse">
        <div className={`h-3 ${S} w-1/4`} />
        <div className={`h-3 ${S} w-1/3`} />
        <div className={`h-3 ${S} w-1/6`} />
      </div>
    ))}
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="bg-slate-900 rounded-2xl p-8">
      <div className="flex items-center gap-5 mb-6">
        <div className={`w-16 h-16 ${S} rounded-2xl`} />
        <div className="space-y-2 flex-1">
          <div className={`h-5 ${S} w-1/3`} />
          <div className={`h-4 ${S} w-1/2`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className={`h-14 ${S} rounded-xl`} />)}
      </div>
    </div>
  </div>
);

/** Generic full-page skeleton — grid of cards */
export const PageSkeleton: React.FC<{ cards?: number }> = ({ cards = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
        <div className={`w-10 h-10 ${S} rounded-xl mb-4`} />
        <div className={`h-5 ${S} w-2/3 mb-2`} />
        <div className={`h-3 ${S} w-full mb-1`} />
        <div className={`h-3 ${S} w-4/5`} />
      </div>
    ))}
  </div>
);

// Legacy names kept for compatibility
export const DashboardSkeleton = StatsSkeleton;
