import React, { useState, useEffect } from 'react';
import { NavigationProps, NotificationSettings as TNotificationSettings } from '../types';
import { getNotificationSettings, saveNotificationSettings } from '../services/notificationSettingsService';
import PageHeader from '../components/PageHeader';
import { Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const ToggleSwitch: React.FC<{ label: string; isEnabled: boolean; onToggle: () => void }> = ({ label, isEnabled, onToggle }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        <button
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-black ${isEnabled ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${isEnabled ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`}
            />
        </button>
    </div>
);


const NotificationSettingsPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [settings, setSettings] = useState<TNotificationSettings>(getNotificationSettings());

    const handleToggle = (key: keyof TNotificationSettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        saveNotificationSettings(newSettings);
        toast.success('تم حفظ الإعدادات');
    };

    const settingsOptions = [
        { key: 'morningBriefing' as keyof TNotificationSettings, label: 'الموجز الصباحي' },
        { key: 'proactiveInsights' as keyof TNotificationSettings, label: 'همسات الروح (النصائح الاستباقية)' },
        { key: 'dailyReward' as keyof TNotificationSettings, label: 'تذكير صندوق الروح اليومي' },
        { key: 'diaryReminders' as keyof TNotificationSettings, label: 'تذكيرات تسجيل اليوميات' },
        { key: 'challengeReminders' as keyof TNotificationSettings, label: 'مؤشر التحديات النشطة' },
    ];

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader
                navigateTo={navigateTo}
                title="إعدادات الإشعارات"
                Icon={Settings}
                color="cyan"
            />
            <main className="p-4 space-y-4">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    تحكم في الإشعارات والتنبيهات التي تظهر لك داخل التطبيق.
                </p>
                {settingsOptions.map(option => (
                     <ToggleSwitch
                        key={option.key}
                        label={option.label}
                        isEnabled={settings[option.key]}
                        onToggle={() => handleToggle(option.key)}
                    />
                ))}
            </main>
        </div>
    );
};

export default NotificationSettingsPage;
