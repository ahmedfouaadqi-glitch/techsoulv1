/**
 * Retrieves an item from localStorage and parses it as JSON.
 * @param key The key of the item to retrieve.
 * @param defaultValue The default value to return if the item doesn't exist or parsing fails.
 * @returns The parsed item or the default value.
 */
export const getItem = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) {
            return defaultValue;
        }
        return JSON.parse(storedValue) as T;
    } catch (error) {
        console.error(`Error getting item "${key}" from localStorage`, error);
        return defaultValue;
    }
};

/**
 * Stores an item in localStorage after serializing it to JSON.
 * @param key The key under which to store the item.
 * @param value The value to store.
 */
export const setItem = <T>(key: string, value: T): void => {
    try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error(`Error setting item "${key}" in localStorage`, error);
    }
};

/**
 * Removes an item from localStorage.
 * @param key The key of the item to remove.
 */
export const removeItem = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing item "${key}" from localStorage`, error);
    }
};
