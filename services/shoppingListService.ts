import { ShoppingListItem } from '../types';
import { getItem, setItem } from './storageService';

const SHOPPING_LIST_KEY = 'shoppingList';

export const getShoppingList = (): ShoppingListItem[] => {
    return getItem<ShoppingListItem[]>(SHOPPING_LIST_KEY, []);
};

export const saveShoppingList = (items: ShoppingListItem[]): void => {
    setItem(SHOPPING_LIST_KEY, items);
};

export const addItemToShoppingList = (newItem: ShoppingListItem): void => {
    const items = getShoppingList();
    // Prevent duplicates
    if (!items.some(item => item.name.trim().toLowerCase() === newItem.name.trim().toLowerCase())) {
        const updatedList = [newItem, ...items];
        saveShoppingList(updatedList);
    }
};

export const updateShoppingListItem = (itemId: string, updates: Partial<ShoppingListItem>): void => {
    const items = getShoppingList();
    const updatedList = items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
    );
    saveShoppingList(updatedList);
};

export const deleteShoppingListItem = (itemId: string): void => {
    const items = getShoppingList();
    const updatedList = items.filter(item => item.id !== itemId);
    saveShoppingList(updatedList);
};

export const clearCheckedItems = (): void => {
    const items = getShoppingList();
    const updatedList = items.filter(item => !item.isChecked);
    saveShoppingList(updatedList);
};
