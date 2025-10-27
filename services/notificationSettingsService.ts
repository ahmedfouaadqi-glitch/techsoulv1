import { NotificationSettings } from '../types';
import { getItem, setItem } from './storageService';

const SETTINGS_KEY = 'notificationSettings';

const DEFAULT_SETTINGS: NotificationSettings = {
    morningBriefing: true,
    proactiveInsights: true,
    challengeReminders: true,
    dailyReward: true,
    diaryReminders: true,
};

export const getNotificationSettings = (): NotificationSettings => {
    const savedSettings = getItem<Partial<NotificationSettings>>(SETTINGS_KEY, {});
    // Merge with defaults to ensure all keys are present
    return { ...DEFAULT_SETTINGS, ...savedSettings };
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
    setItem(SETTINGS_KEY, settings);
};
