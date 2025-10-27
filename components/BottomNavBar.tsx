import React from 'react';
import { Page, NavigationProps } from '../types';
import { Home, Camera, NotebookText, BrainCircuit, Search } from 'lucide-react';
import { useFeatureUsage } from '../hooks/useFeatureUsage';
import { playSound } from '../services/soundService';

interface BottomNavBarProps extends NavigationProps {
  currentPage: Page;
  diaryIndicatorActive: boolean;
}

const navItems = [
  { page: { type: 'home' } as Page, pageType: 'home', Icon: Home, label: 'الرئيسية' },
  { page: { type: 'healthDiary' } as Page, pageType: 'healthDiary', Icon: NotebookText, label: 'السجل' },
  { page: { type: 'imageAnalysis' } as Page, pageType: 'imageAnalysis', Icon: Camera, label: 'العين' },
  { page: { type: 'chat' } as Page, pageType: 'chat', Icon: BrainCircuit, label: 'العقل' },
  { page: { type: 'globalSearch' } as Page, pageType: 'globalSearch', Icon: Search, label: 'البحث' },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentPage, navigateTo, diaryIndicatorActive }) => {
  const { trackFeatureUsage } = useFeatureUsage();

  const handleNavigation = (page: Page, pageType: string) => {
    playSound('tap');
    trackFeatureUsage(pageType);
    navigateTo(page);
  };

  const isCurrentPage = (itemPageType: string): boolean => {
    return currentPage.type === itemPageType;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map(({ page, pageType, Icon, label }) => {
          const isActive = isCurrentPage(pageType);
          const hasIndicator = pageType === 'healthDiary' && diaryIndicatorActive;
          return (
            <button
              key={pageType}
              onClick={() => handleNavigation(page, pageType)}
              className={`flex flex-col items-center justify-center h-full w-full text-xs transition-colors duration-200
                ${isActive ? 'text-cyan-500 dark:text-cyan-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-cyan-500'}`}
            >
              <div className="relative">
                 <Icon className="w-6 h-6 mb-0.5" />
                 {hasIndicator && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-black animate-pulse"></span>
                 )}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
