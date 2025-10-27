import { UserPlant } from '../types';
import { addDiaryEntry } from './diaryService';
import { getItem, setItem } from './storageService';

const PLANTS_KEY = 'userPlantsCollection';

export const getPlants = (): UserPlant[] => {
    return getItem<UserPlant[]>(PLANTS_KEY, []);
};

export const addPlant = (newPlant: Omit<UserPlant, 'id'>): UserPlant => {
    const plants = getPlants();
    const plant: UserPlant = {
        ...newPlant,
        id: `plant-${Date.now()}`,
        journal: [], // Initialize with an empty journal
    };
    const updatedPlants = [plant, ...plants];
    setItem(PLANTS_KEY, updatedPlants);
    
    // Automatically create care schedule entries in the diary
    if (plant.careSchedule) {
        const today = new Date();
        addDiaryEntry(today, {
            type: 'plant_care',
            icon: '💧',
            title: `جدول ري جديد لـ ${plant.name}`,
            details: `الري: ${plant.careSchedule.watering}`
        });
         addDiaryEntry(today, {
            type: 'plant_care',
            icon: '🌱',
            title: `جدول تسميد جديد لـ ${plant.name}`,
            details: `التسميد: ${plant.careSchedule.fertilizing}`
        });
    }

    return plant;
};

export const updatePlant = (plantId: string, updatedPlant: UserPlant): UserPlant[] => {
    const plants = getPlants();
    const updatedPlants = plants.map(p => p.id === plantId ? updatedPlant : p);
    setItem(PLANTS_KEY, updatedPlants);
    return updatedPlants;
}

export const deletePlant = (plantId: string): UserPlant[] => {
    let plants = getPlants();
    const updatedPlants = plants.filter(plant => plant.id !== plantId);
    setItem(PLANTS_KEY, updatedPlants);
    return updatedPlants;
};
