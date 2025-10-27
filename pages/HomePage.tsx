import React, { useMemo, useState, useEffect } from 'react';
import { NavigationProps, UserProfile, PageType, ProactiveInsight } from '../types';
import { FEATURES } from '../constants';
import FeatureCard from '../components/FeatureCard';
import { HeartPulse, Settings } from 'lucide-react';
import { useFeatureUsage } from '../hooks/useFeatureUsage';
import MorningBriefing from '../components/MorningBriefing';
import { getShoppingList } from '../services/shoppingListService';
import { getActiveChallenges } from '../services/challengeService';
import PriorityFeatureCard from '../components/PriorityFeatureCard';
import { getInsight, dismissInsight, shouldGenerateNewInsight, generateInsight } from '../services/proactiveInsightService';
import ProactiveInsightCard from '../components/ProactiveInsightCard';
import UserProfileCard from '../components/UserProfileCard';
import DynamicWelcomeCard from '../components/DynamicWelcomeCard';
import { getNotificationSettings } from '../services/notificationSettingsService';
import DailyReward from '../components/DailyReward';


interface HomePageProps extends NavigationProps {
    diaryIndicatorActive: boolean;
    userProfile: UserProfile | null;
}

const HomePage: React.FC<HomePageProps> = ({ navigateTo, diaryIndicatorActive, userProfile }) => {
  const { getUsageSortedFeatures } = useFeatureUsage();
  const [insight, setInsight] = useState<ProactiveInsight | null>(null);
  const [notificationSettings, setNotificationSettings] = useState(getNotificationSettings());

  const sortedFeatures = useMemo(() => getUsageSortedFeatures(FEATURES), [getUsageSortedFeatures]);
  const shoppingListCount = getShoppingList().filter(item => !item.isChecked).length;
  const activeChallengesCount = getActiveChallenges().length;

    // This effect ensures settings are up-to-date when the page is focused,
    // for example, after returning from the settings page.
    useEffect(() => {
        const handleFocus = () => {
            setNotificationSettings(getNotificationSettings());
        };
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);


  useEffect(() => {
    const manageInsight = async () => {
      if (!userProfile) return; // Wait for user profile to be loaded
      
      const existingInsight = getInsight();
      if (existingInsight && !existingInsight.isDismissed) {
        setInsight(existingInsight);
      } else if (await shouldGenerateNewInsight(userProfile)) {
        await generateInsight(userProfile);
        const newInsight = getInsight(); // Refetch after generation
        if (newInsight) {
          setInsight(newInsight);
        }
      } else {
        setInsight(null); // Ensure no stale insight is shown
      }
    };

    manageInsight();
  }, [userProfile]);


  const { priorityFeature, otherFeatures } = useMemo(() => {
    if (!userProfile || !userProfile.mainGoal) {
      return { priorityFeature: null, otherFeatures: sortedFeatures };
    }

    let priorityPageType: PageType | null = null;
    const mainGoal = userProfile.mainGoal.toLowerCase();

    if (mainGoal.includes('صحي')) {
      priorityPageType = 'sportsTrainer';
    } else if (mainGoal.includes('مهني')) {
      priorityPageType = 'financial';
    } else if (mainGoal.includes('حياتي')) {
      priorityPageType = 'decorations';
    }

    if (priorityPageType) {
      const feature = sortedFeatures.find(f => f.pageType === priorityPageType);
      if (feature) {
        return {
          priorityFeature: feature,
          otherFeatures: sortedFeatures.filter(f => f.pageType !== priorityPageType),
        };
      }
    }
    
    return { priorityFeature: null, otherFeatures: sortedFeatures };
  }, [userProfile, sortedFeatures]);


  const handleEditProfile = () => {
    navigateTo({ type: 'userProfileSetup' });
  };
  
  const handleDismissInsight = () => {
    if (insight) {
      dismissInsight(insight.id);
      setInsight(null);
    }
  };
  
  const handleNavigateToSettings = () => {
    navigateTo({ type: 'notificationSettings' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <header className="p-4 flex justify-between items-center bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-cyan-500" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">الروح التقنية</h1>
        </div>
        <button onClick={handleNavigateToSettings} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <Settings size={22} />
        </button>
      </header>
      <main className="p-4 flex-grow max-w-4xl mx-auto w-full">
        <UserProfileCard userProfile={userProfile} onEdit={handleEditProfile} />
        <DynamicWelcomeCard />
        
        {notificationSettings.dailyReward && <DailyReward />}
        
        {notificationSettings.morningBriefing && <MorningBriefing userProfile={userProfile} />}
        
        {notificationSettings.proactiveInsights && insight && <ProactiveInsightCard insightMessage={insight.message} onDismiss={handleDismissInsight} />}
        
        {priorityFeature && (
            <>
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-400 my-4 text-center">تركيزك لهذا اليوم</h2>
                <PriorityFeatureCard feature={priorityFeature} navigateTo={navigateTo} />
                <div className="border-b border-gray-200 dark:border-gray-800 my-6"></div>
            </>
        )}

        <p className="text-center text-gray-600 dark:text-gray-400 my-6">
            {priorityFeature ? 'استكشف بقية الخدمات' : 'تطبيق الحياة بروح رقمية'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherFeatures.map(feature => (
            <FeatureCard 
                key={feature.pageType} 
                feature={feature} 
                navigateTo={navigateTo} 
                indicator={
                    (feature.pageType === 'shoppingList' && shoppingListCount > 0) ? shoppingListCount :
                    (notificationSettings.challengeReminders && feature.pageType === 'challenges' && activeChallengesCount > 0) ? activeChallengesCount :
                    (feature.pageType === 'healthDiary' && diaryIndicatorActive) ? '✨' : undefined
                }
            />
          ))}
        </div>
      </main>
      <footer className="text-center p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">بصمة الروح الرقمية لـ</p>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">احمد معروف</p>
      </footer>
    </div>
  );
};

export default HomePage;