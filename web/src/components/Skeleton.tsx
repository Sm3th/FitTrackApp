import React from 'react';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'lg' }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-${rounded} ${className}`}
  />
);

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="surface-elevated rounded-2xl p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 flex-shrink-0" rounded="xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
    ))}
  </div>
);

export const SkeletonStat: React.FC = () => (
  <div className="surface-elevated rounded-2xl p-6 space-y-4">
    <div className="flex justify-between">
      <Skeleton className="w-12 h-12" rounded="2xl" />
      <Skeleton className="w-16 h-6" rounded="full" />
    </div>
    <Skeleton className="h-10 w-20" />
    <Skeleton className="h-4 w-32" />
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="surface-elevated rounded-xl p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 flex-shrink-0" rounded="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-16 h-8" rounded="xl" />
      </div>
    ))}
  </div>
);

export default Skeleton;
