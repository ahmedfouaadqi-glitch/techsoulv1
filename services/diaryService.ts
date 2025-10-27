import { DiaryEntry } from '../types';
import { checkAndAwardAchievements } from './achievementService';
import toast from 'react-hot-toast';
import { getItem, setItem } from './storageService';

const DIARY_KEY_PREFIX = 'healthDiary-';

const getFormattedDate = (date: Date): string => {
    // Ensures the date is treated as local time, not UTC
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDiaryEntries = (date: Date): DiaryEntry[] => {
    const key = DIARY_KEY_PREFIX + getFormattedDate(date);
    return getItem<DiaryEntry[]>(key, []);
};

export const addDiaryEntry = (date: Date, newEntryData: Omit<DiaryEntry, 'id' | 'timestamp'>): DiaryEntry => {
    const entries = getDiaryEntries(date);
    const entry: DiaryEntry = {
        ...newEntryData,
        id: `entry-${Date.now()}`,
        timestamp: newEntryData.type === 'reminder' ? date.getTime() : Date.now() // Use future date for reminders
    };
    
    // For reminders, insert them in chronological order. For others, prepend.
    let updatedEntries;
    if (entry.type === 'reminder') {
        updatedEntries = [...entries, entry].sort((a, b) => a.timestamp - b.timestamp);
    } else {
        updatedEntries = [entry, ...entries];
    }

    const key = DIARY_KEY_PREFIX + getFormattedDate(date);
    setItem(key, updatedEntries);

    // Check for achievements after adding an entry
    checkAndAwardAchievements();

    return entry;
};

export const deleteDiaryEntry = (date: Date, entryId: string): DiaryEntry[] => {
    let entries = getDiaryEntries(date);
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    const key = DIARY_KEY_PREFIX + getFormattedDate(date);
    setItem(key, updatedEntries);
    return updatedEntries;
};


// This function is called by the live conversation tool.
// It adds a reminder entry to the diary for the specified future date.
// The actual push notification is intended to be handled by a backend service
// which would then trigger the 'push' event in sw.js.
export const createReminder = async (title: string, details: string | null, remindAt: Date): Promise<{success: boolean, message: string}> => {
    const delay = remindAt.getTime() - Date.now();
    if (delay <= 0) {
        return { success: false, message: 'لا يمكن إنشاء تذكير في الماضي.' };
    }

    // Request notification permission to prepare for backend push notifications
    if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            toast.error('تم رفض إذن الإشعارات. لن تتمكن من رؤية التذكير على شاشتك.');
        }
    }
    
    addDiaryEntry(remindAt, {
        type: 'reminder',
        icon: '🔔',
        title: `تذكير: ${title}`,
        details: details || 'لا توجد تفاصيل إضافية.'
    });

    // In a full-stack app, we would now make a call to our backend to schedule the push notification.
    // e.g., await fetch('/api/reminders', { method: 'POST', body: JSON.stringify({ title, details, remindAt, pushSubscription }) });
    // For this demo, adding it to the diary is the confirmation.

    return { success: true, message: 'تمت إضافة التذكير إلى سجلك.' };
};