import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded w-12 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
        </div>
      ))}
    </div>
  </div>
);

export const ListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow animate-pulse">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow">
    <div className="animate-pulse">
      <div className="h-14 bg-gray-100 dark:bg-gray-700"></div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 border-t border-gray-200 dark:border-gray-700 px-6 flex items-center gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-pulse">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
        <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-12 bg-gray-100 dark:bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);