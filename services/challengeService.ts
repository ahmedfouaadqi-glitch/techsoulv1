import { UserChallenge } from '../types';
import { getItem } from './storageService';

const USER_CHALLENGES_KEY = 'userActiveChallenges';

export const getActiveChallenges = (): UserChallenge[] => {
    return getItem<UserChallenge[]>(USER_CHALLENGES_KEY, []);
};
