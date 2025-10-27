import React from 'react';
import { Feature, NavigationProps } from '../types';
import { ArrowLeft, Star } from 'lucide-react';
import { useFeatureUsage } from '../hooks/useFeatureUsage';
import { playSound } from '../services/soundService';

interface PriorityFeatureCardProps {
  feature: Feature;
  navigateTo: NavigationProps['navigateTo'];
}

// Reusing colors from FeatureCard for consistency
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


const PriorityFeatureCard: React.FC<PriorityFeatureCardProps> = ({ feature, navigateTo }) => {
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
      className={`relative w-full p-5 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.98] ${colors.bg} ${colors.darkBg} border-2 ${colors.border} ${colors.darkBorder} flex flex-col items-center text-center`}
    >
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-400/20 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <Star size={12} />
            <span>مقترح لك</span>
        </div>
      <div className={`p-4 rounded-full ${colors.iconBg} mb-3`}>
        <Icon className="w-10 h-10 text-white" />
      </div>
      <h3 className={`font-bold text-xl ${colors.text} ${colors.darkText}`}>{title}</h3>
      <p className={`${colors.text} ${colors.darkText} opacity-80 text-sm mt-1`}>{description}</p>
      <div className={`mt-4 w-full text-center px-4 py-2 rounded-lg font-semibold ${colors.text} ${colors.darkText} bg-white/50 dark:bg-black/30`}>
        ابدأ الآن
      </div>
    </div>
  );
};

export default PriorityFeatureCard;
