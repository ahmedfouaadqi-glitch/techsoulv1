import React from 'react';
import { Badge as BadgeType } from '../types';

interface BadgeProps {
  badge: BadgeType;
  isLocked: boolean;
}

const Badge: React.FC<BadgeProps> = ({ badge, isLocked }) => {
  return (
    <div className={`p-4 rounded-lg shadow-sm border flex items-start gap-4 transition-opacity ${
        isLocked 
        ? 'bg-gray-100 dark:bg-black border-gray-200 dark:border-gray-800 opacity-60' 
        : 'bg-amber-50 dark:bg-black border-amber-200 dark:border-amber-500/50'
    }`}>
      <div className={`text-4xl ${isLocked ? '' : 'filter grayscale-0'}`}>
        {badge.icon}
      </div>
      <div className="flex-1">
        <h3 className={`font-bold ${isLocked ? 'text-gray-600 dark:text-gray-400' : 'text-amber-800 dark:text-amber-300'}`}>
          {badge.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {badge.description}
        </p>
      </div>
    </div>
  );
};

export default Badge;
