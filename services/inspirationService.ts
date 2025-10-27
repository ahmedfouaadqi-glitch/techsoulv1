import { InspirationItem } from '../types';
import { getItem, setItem } from './storageService';

const INSPIRATIONS_KEY = 'communityInspirations';
const MAX_INSPIRATIONS = 100;

export const getInspirations = (): InspirationItem[] => {
    return getItem<InspirationItem[]>(INSPIRATIONS_KEY, []);
};

export const addInspiration = (itemData: Omit<InspirationItem, 'id' | 'timestamp' | 'sourceUser'>): InspirationItem => {
    const inspirations = getInspirations();
    
    // Simple anonymous user naming
    const userNumber = (getItem<number>('userCount', 100)) + inspirations.length;
    const anonymousUser = `مستخدم${userNumber}`;

    const newItem: InspirationItem = {
        ...itemData,
        id: `inspiration-${Date.now()}`,
        timestamp: Date.now(),
        sourceUser: anonymousUser
    };
    
    const updatedInspirations = [newItem, ...inspirations].slice(0, MAX_INSPIRATIONS);
    setItem(INSPIRATIONS_KEY, updatedInspirations);
    return newItem;
};
