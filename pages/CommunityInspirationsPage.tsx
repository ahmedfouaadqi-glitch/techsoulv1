import React, { useState, useEffect } from 'react';
import { NavigationProps, InspirationItem, WorkoutPlan } from '../types';
import { getInspirations } from '../services/inspirationService';
import PageHeader from '../components/PageHeader';
import { FEATURES } from '../constants';
import { Users, ChefHat, Dumbbell, User, Clock } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

const feature = FEATURES.find(f => f.pageType === 'communityInspirations')!;

const WorkoutPlanCard: React.FC<{ plan: WorkoutPlan }> = ({ plan }) => (
    <div className="space-y-3">
        {plan.weeklyPlan.map((day, index) => (
            <div key={index} className="p-3 bg-gray-100 dark:bg-gray-900 rounded-md">
                <h4 className="font-bold text-pink-800 dark:text-pink-300">{day.day}: <span className="font-normal text-gray-700 dark:text-gray-200">{day.focus}</span></h4>
                <ul className="mt-2 space-y-2 text-sm">
                    {day.exercises.map((ex, exIndex) => (
                        <li key={exIndex} className="pl-4 border-l-2 border-gray-300 dark:border-gray-700">
                            <p className="font-semibold">{ex.name} ({ex.sets}x{ex.reps})</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{ex.description}</p>
                        </li>
                    ))}
                </ul>
            </div>
        ))}
    </div>
);


const CommunityInspirationsPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [inspirations, setInspirations] = useState<InspirationItem[]>([]);
    const [activeTab, setActiveTab] = useState<'recipe' | 'workout'>('recipe');

    useEffect(() => {
        setInspirations(getInspirations());
    }, []);

    const filteredInspirations = inspirations.filter(item => item.type === activeTab);

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-4 bg-gray-100 dark:bg-black max-w-sm mx-auto">
                    <button onClick={() => setActiveTab('recipe')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'recipe' ? 'bg-pink-500 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                        <ChefHat size={16}/> وصفات
                    </button>
                    <button onClick={() => setActiveTab('workout')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'workout' ? 'bg-pink-500 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                        <Dumbbell size={16}/> تمارين
                    </button>
                </div>
                
                {filteredInspirations.length > 0 ? (
                    <div className="space-y-4">
                        {filteredInspirations.map(item => (
                            <div key={item.id} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{item.title}</h3>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 my-2">
                                     <span className="flex items-center gap-1"><User size={12} /> {item.sourceUser}</span>
                                     <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.timestamp).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none mt-3">
                                    {item.type === 'recipe' && typeof item.content === 'string' && <MarkdownRenderer content={item.content} />}
                                    {item.type === 'workout' && typeof item.content === 'object' && <WorkoutPlanCard plan={item.content as WorkoutPlan} />}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">لا يوجد إلهام لمشاركته في هذا القسم بعد.</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">كن أول من يشارك!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CommunityInspirationsPage;
