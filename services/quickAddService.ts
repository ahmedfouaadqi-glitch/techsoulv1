import { QuickAddAction } from '../types';
import { addDiaryEntry } from './diaryService';
import { getItem, setItem } from './storageService';

const QUICK_ADD_KEY = 'quickAddActions';

const DEFAULT_ACTIONS: QuickAddAction[] = [
  { id: 'water', icon: '💧', label: 'شرب الماء', type: 'note', title: 'شرب الماء', details: 'تم شرب كوب من الماء.' },
  { id: 'walk', icon: '🚶', label: 'مشي 15 د', type: 'activity', title: 'نشاط بدني', details: 'مشي لمدة 15 دقيقة.' },
  { id: 'meditate', icon: '🧘', label: 'تأمل 5 د', type: 'activity', title: 'استرخاء', details: 'جلسة تأمل لمدة 5 دقائق.' },
  { id: 'apple', icon: '🍎', label: 'تفاحة', type: 'food', title: 'وجبة خفيفة', details: 'تفاحة (حوالي 95 سعرة حرارية).' },
];

export const getQuickAddActions = (): QuickAddAction[] => {
    const stored = getItem<QuickAddAction[] | null>(QUICK_ADD_KEY, null);
    if (stored) {
        return stored;
    } else {
        setItem(QUICK_ADD_KEY, DEFAULT_ACTIONS);
        return DEFAULT_ACTIONS;
    }
};

export const saveQuickAddActions = (actions: QuickAddAction[]): void => {
    setItem(QUICK_ADD_KEY, actions);
};


export const performQuickAdd = (item: QuickAddAction, date: Date) => {
  addDiaryEntry(date, {
    type: item.type,
    icon: item.icon,
    title: item.title,
    details: item.details,
  });
};
