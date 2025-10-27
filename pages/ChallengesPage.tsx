import React, { useState, useEffect, useCallback } from 'react';
import { NavigationProps, Challenge, UserChallenge, DiaryEntry } from '../types';
import { CHALLENGES, FEATURES } from '../constants';
import { getDiaryEntries } from '../services/diaryService';
import { checkAndAwardAchievements } from '../services/achievementService';
import PageHeader from '../components/PageHeader';
import { Plus, Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const feature = FEATURES.find(f => f.pageType === 'challenges')!;

const USER_CHALLENGES_KEY = 'userActiveChallenges';
const COMPLETED_CHALLENGES_KEY = 'completedChallenges';

const ChallengesPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);

    const calculateProgress = useCallback((challenge: UserChallenge): number => {
        let progress = 0;
        const today = new Date();
        const startDate = new Date(challenge.startDate);
        
        for (let i = 0; i < challenge.goal; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(startDate.getDate() + i);

            if (checkDate > today) break;

            const entries = getDiaryEntries(checkDate);
            const relevantEntryExists = entries.some(entry => 
                entry.type === challenge.relatedDiaryType && 
                (challenge.relatedDiaryTitle ? entry.title.includes(challenge.relatedDiaryTitle) : true)
            );
            if (relevantEntryExists) {
                progress++;
            }
        }
        return progress;
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem(USER_CHALLENGES_KEY);
        let activeChallenges: UserChallenge[] = stored ? JSON.parse(stored) : [];
        
        // Recalculate progress and check for completion
        activeChallenges = activeChallenges.map(challenge => {
            const newProgress = calculateProgress(challenge);
            if (newProgress >= challenge.goal && challenge.progress < challenge.goal) {
                // Challenge just completed
                const completed = JSON.parse(localStorage.getItem(COMPLETED_CHALLENGES_KEY) || '[]');
                if (!completed.includes(challenge.id)) {
                    localStorage.setItem(COMPLETED_CHALLENGES_KEY, JSON.stringify([...completed, challenge.id]));
                    checkAndAwardAchievements();
                }
            }
            return { ...challenge, progress: newProgress };
        });

        setUserChallenges(activeChallenges);
    }, [calculateProgress]);

    const joinChallenge = (challenge: Challenge) => {
        if (userChallenges.some(uc => uc.id === challenge.id)) {
            toast.error('أنت منضم بالفعل إلى هذا التحدي.');
            return;
        }
        const newUserChallenge: UserChallenge = {
            ...challenge,
            startDate: new Date().getTime(),
            progress: 0
        };
        const updatedChallenges = [...userChallenges, newUserChallenge];
        setUserChallenges(updatedChallenges);
        localStorage.setItem(USER_CHALLENGES_KEY, JSON.stringify(updatedChallenges));
        toast.success(`لقد انضممت إلى تحدي "${challenge.title}"!`);
    };
    
    const availableChallenges = CHALLENGES.filter(c => !userChallenges.some(uc => uc.id === c.id));

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">تحدياتي الحالية</h2>
                    {userChallenges.length > 0 ? (
                        <div className="space-y-4">
                            {userChallenges.map(challenge => (
                                <div key={challenge.id} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-start gap-3">
                                        <span className="text-3xl">{challenge.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-orange-800 dark:text-orange-300">{challenge.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{challenge.description}</p>
                                            <div className="mt-3">
                                                <div className="flex justify-between items-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                    <span>التقدم</span>
                                                    <span>{challenge.progress} / {challenge.goal} {challenge.unit}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                                    <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}></div>
                                                </div>
                                                {challenge.progress >= challenge.goal && (
                                                    <p className="text-green-600 dark:text-green-400 font-bold text-sm mt-2 flex items-center gap-1">
                                                        <Star size={16} /> مكتمل! أحسنت!
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">ليس لديك أي تحديات نشطة. انضم إلى تحدٍ جديد لتبدأ!</p>
                    )}
                </div>

                 <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">تحديات متاحة</h2>
                     {availableChallenges.length > 0 ? (
                        <div className="space-y-4">
                            {availableChallenges.map(challenge => (
                                <div key={challenge.id} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-start gap-3">
                                        <span className="text-3xl">{challenge.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-bold">{challenge.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{challenge.description}</p>
                                        </div>
                                        <button onClick={() => joinChallenge(challenge)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 hover:bg-green-600 transition">
                                            <Plus size={16} /> انضم
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">لقد انضممت إلى جميع التحديات المتاحة. رائع!</p>
                     )}
                </div>
            </main>
        </div>
    );
};

export default ChallengesPage;