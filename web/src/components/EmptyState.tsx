import React from 'react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionPath?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'gradient' | 'minimal';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  secondaryActionLabel,
  secondaryActionPath,
  onSecondaryAction,
  variant = 'default',
}) => {
  const navigate = useNavigate();

  const getContainerClass = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20';
      case 'minimal':
        return 'bg-transparent';
      default:
        return 'bg-white dark:bg-gray-800';
    }
  };

  return (
    <div className={`${getContainerClass()} rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 transition-all hover:border-blue-300 dark:hover:border-blue-600`}>
      {/* Animated Icon */}
      <div className="text-8xl mb-6 animate-bounce-in inline-block">
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h2>

      {/* Description */}
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {actionLabel && (onAction || actionPath) && (
          <button
            onClick={onAction ? onAction : () => navigate(actionPath!)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all shadow-lg"
          >
            {actionLabel}
          </button>
        )}

        {secondaryActionLabel && (onSecondaryAction || secondaryActionPath) && (
          <button
            onClick={onSecondaryAction ? onSecondaryAction : () => navigate(secondaryActionPath!)}
            className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-600 transform hover:scale-105 transition-all"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};
export default EmptyState;