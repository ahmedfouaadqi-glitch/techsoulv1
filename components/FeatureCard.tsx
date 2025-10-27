import React from 'react';
import { Feature, NavigationProps } from '../types';
import { ArrowLeft } from 'lucide-react';
import { useFeatureUsage } from '../hooks/useFeatureUsage';
import { playSound } from '../services/soundService';

interface FeatureCardProps {
  feature: Feature;
  navigateTo: NavigationProps['navigateTo'];
  indicator?: React.ReactNode;
}

const colorClasses: { [key: string]: { bg: string, text: string, border: string, iconBg: string, darkBg: string, darkText: string, darkBorder: string } } = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', iconBg: 'bg-teal-500', darkBg: 'dark:bg-black', darkText: 'dark:text-teal-300', darkBorder: 'dark:border-teal-500/50' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-500', darkBg: 'dark:bg-black', darkText: 'dark:text-orange-300', darkBorder: 'dark:border-orange-500/50' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', iconBg: 'bg-green-500', darkBg: 'dark:bg-black', darkText: 'dark:text-green-300', darkBorder: 'dark:border-green-500/50' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', iconBg: 'bg-pink-500', darkBg: 'dark:bg-black', darkText: 'dark:text-pink-300', darkBorder: 'dark:border-pink-500/50' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-500', darkBg: 'dark:bg-black', darkText: 'dark:text-purple-300', darkBorder: 'dark:border-purple-500/50' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-500', darkBg: 'dark:bg-black', darkText: 'dark:text-indigo-300', darkBorder: 'dark:border-indigo-500/50' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', iconBg: 'bg-red-500', darkBg: 'dark:bg-black', darkText: 'dark:text-red-300', darkBorder: 'dark:border-red-500/50' },
  amber: { bg: 'bg-amber-800/10', text: 'text-amber-800', border: 'border-amber-300', iconBg: 'bg-amber-700', darkBg: 'dark:bg-black', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-500/50' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-500', darkBg: 'dark:bg-black', darkText: 'dark:text-blue-300', darkBorder: 'dark:border-blue-500/50' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', iconBg: 'bg-cyan-500', darkBg: 'dark:bg-black', darkText: 'dark:text-cyan-300', darkBorder: 'dark:border-cyan-500/50' },
};

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, navigateTo, indicator }) => {
  const { title, description, Icon, color, page } = feature;
  const colors = colorClasses[color] || colorClasses.teal;
  const { trackFeatureUsage } = useFeatureUsage();

  const handleClick = () => {
    playSound('tap');
    trackFeatureUsage(feature.pageType);
    navigateTo(page);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative w-full p-4 rounded-xl shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95 ${colors.bg} ${colors.darkBg} border ${colors.border} ${colors.darkBorder}`}
    >
      {indicator && (
        <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 w-6 h-6 bg-teal-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
            {indicator}
        </div>
      )}
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className={`p-3 rounded-lg ${colors.iconBg}`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${colors.text} ${colors.darkText}`}>{title}</h3>
          <p className={`${colors.text} ${colors.darkText} opacity-80 text-sm`}>{description}</p>
        </div>
        <ArrowLeft className={`w-6 h-6 ${colors.text} ${colors.darkText} opacity-60`} />
      </div>
    </div>
  );
};

export default FeatureCard;
