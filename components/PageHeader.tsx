import React from 'react';
import { Page, NavigationProps } from '../types';
import { ArrowRight } from 'lucide-react';

interface PageHeaderProps {
  navigateTo: NavigationProps['navigateTo'];
  title: string;
  subTitle?: string; // Added subtitle prop
  Icon: React.ElementType;
  color: string;
  backPage?: Page;
  onBack?: () => void;
  action?: {
    Icon: React.ElementType;
    onClick: () => void;
    label: string;
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ navigateTo, title, subTitle, Icon, color, onBack, backPage = { type: 'home' }, action }) => {
  const colorClasses: { [key: string]: { bg: string, text: string, darkText: string } } = {
    teal: { bg: 'bg-teal-500', text: 'text-teal-800', darkText: 'dark:text-teal-300' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-800', darkText: 'dark:text-orange-300' },
    green: { bg: 'bg-green-500', text: 'text-green-800', darkText: 'dark:text-green-300' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-800', darkText: 'dark:text-pink-300' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-800', darkText: 'dark:text-purple-300' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-800', darkText: 'dark:text-indigo-300' },
    red: { bg: 'bg-red-500', text: 'text-red-800', darkText: 'dark:text-red-300' },
    amber: { bg: 'bg-amber-700', text: 'text-amber-900', darkText: 'dark:text-amber-300' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-800', darkText: 'dark:text-blue-300' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-800', darkText: 'dark:text-cyan-300' },
  };
  const colors = colorClasses[color] || colorClasses.teal;

  return (
    <header className={`p-4 shadow-md ${colors.bg} dark:bg-black dark:border-b dark:border-gray-800 text-white dark:text-gray-200 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-900 transition-colors -ml-2"
            aria-label={action.label}
          >
            <action.Icon className="w-6 h-6" />
          </button>
        )}
        <Icon className={`w-8 h-8 text-white ${colors.darkText}`} />
        <div className="flex flex-col">
            <h1 className="text-xl font-bold">{title}</h1>
            {subTitle && <p className="text-sm opacity-80 -mt-1">{subTitle}</p>}
        </div>
      </div>
      <button 
        onClick={onBack ? onBack : () => navigateTo(backPage)}
        className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-900 transition-colors"
        aria-label="العودة"
      >
        <ArrowRight className="w-6 h-6" />
      </button>
    </header>
  );
};

export default PageHeader;
