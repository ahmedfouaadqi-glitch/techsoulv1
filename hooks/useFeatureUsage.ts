import { useCallback } from 'react';
import { Feature, PageType } from '../types';
import { checkAndAwardAchievements } from '../services/achievementService';
import { getItem, setItem } from '../services/storageService';

const USAGE_STATS_KEY = 'featureUsageStats';

interface UsageStat {
  count: number;
  lastVisited: number;
}

interface UsageStats {
  [key: string]: UsageStat;
}

export const useFeatureUsage = () => {
  const getUsageStats = useCallback((): UsageStats => {
    return getItem<UsageStats>(USAGE_STATS_KEY, {});
  }, []);

  const trackFeatureUsage = useCallback((pageType: string) => {
    const stats = getUsageStats();
    const existing = stats[pageType] || { count: 0, lastVisited: 0 };
    stats[pageType] = { 
      count: existing.count + 1,
      lastVisited: Date.now() 
    };
    setItem(USAGE_STATS_KEY, stats);
    
    // Check for achievements after tracking usage
    checkAndAwardAchievements();
  }, [getUsageStats]);

  const getUsageSortedFeatures = useCallback((features: Feature[]): Feature[] => {
    const stats = getUsageStats();
    const sortedFeatures = [...features].sort((a, b) => {
      const usageA = stats[a.pageType]?.count || 0;
      const usageB = stats[b.pageType]?.count || 0;
      return usageB - usageA;
    });
    return sortedFeatures;
  }, [getUsageStats]);

  const getLastVisitedFeature = useCallback((): PageType | null => {
    const stats = getUsageStats();
    let lastVisited: { pageType: PageType | null; timestamp: number } = { pageType: null, timestamp: 0 };
    
    for (const key in stats) {
        const pageType = key as PageType;
        // Exclude core navigation pages from being considered as "last feature"
        if (['home', 'chat', 'imageAnalysis', 'globalSearch', 'healthDiary'].includes(pageType)) continue;

        if (stats[pageType].lastVisited > lastVisited.timestamp) {
            lastVisited = { pageType, timestamp: stats[pageType].lastVisited };
        }
    }

    // Only consider it recent if visited within the last 5 minutes
    if (lastVisited.pageType && (Date.now() - lastVisited.timestamp < 5 * 60 * 1000)) {
        return lastVisited.pageType;
    }
    return null;
  }, [getUsageStats]);

  return { trackFeatureUsage, getUsageSortedFeatures, getLastVisitedFeature };
};
