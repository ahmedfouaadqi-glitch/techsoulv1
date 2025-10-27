import { AppHistoryItem, HistoryType } from '../types';
import { getItem, setItem, removeItem } from './storageService';

const HISTORY_KEY = 'appHistory';
const MAX_HISTORY_ITEMS = 200; // Overall limit

export const getHistory = (type?: HistoryType): AppHistoryItem[] => {
    const allHistory: AppHistoryItem[] = getItem<AppHistoryItem[]>(HISTORY_KEY, []);
    if (type) {
        return allHistory.filter(item => item.type === type);
    }
    return allHistory;
};

export const addHistoryItem = (itemData: Omit<AppHistoryItem, 'id' | 'timestamp'>): AppHistoryItem => {
    const allHistory = getHistory();
    const newItem: AppHistoryItem = {
        ...itemData,
        id: `${itemData.type}-${Date.now()}`,
        timestamp: Date.now()
    };
    
    const updatedHistory = [newItem, ...allHistory].slice(0, MAX_HISTORY_ITEMS);
    setItem(HISTORY_KEY, updatedHistory);
    return newItem;
};

export const clearHistory = (type?: HistoryType): void => {
     if (type) {
        const allHistory = getHistory();
        const updatedHistory = allHistory.filter(item => item.type !== type);
        setItem(HISTORY_KEY, updatedHistory);
    } else {
        removeItem(HISTORY_KEY);
    }
};
