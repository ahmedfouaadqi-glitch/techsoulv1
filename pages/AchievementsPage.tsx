import React, { useState, useEffect } from 'react';
import { NavigationProps, Achievement } from '../types';
import { getEarnedAchievements } from '../services/achievementService';
import { ACHIEVEMENTS_LIST, FEATURES } from '../constants';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import { Award, Lock } from 'lucide-react';

const feature = FEATURES.find(f => f.pageType === 'achievements')!;

const AchievementsPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [earnedAchievements, setEarnedAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        setEarnedAchievements(getEarnedAchievements());
    }, []);

    const earnedIds = new Set(earnedAchievements.map(a => a.badgeId));
    const earnedBadges = ACHIEVEMENTS_LIST.filter(b => earnedIds.has(b.id));
    const lockedBadges = ACHIEVEMENTS_LIST.filter(b => !earnedIds.has(b.id));

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <Award className="text-amber-500" />
                        الشارات التي حصلت عليها ({earnedBadges.length})
                    </h2>
                    {earnedBadges.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {earnedBadges.map(badge => (
                                <Badge key={badge.id} badge={badge} isLocked={false} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">لم تحصل على أي شارات بعد. ابدأ في استكشاف التطبيق!</p>
                    )}
                </div>
                
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <Lock className="text-gray-500" />
                        شارات يمكنك تحقيقها ({lockedBadges.length})
                    </h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lockedBadges.map(badge => (
                            <Badge key={badge.id} badge={badge} isLocked={true} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AchievementsPage;