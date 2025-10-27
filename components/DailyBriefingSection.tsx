import React from 'react';
import { SpiritMessage } from '../types';
import { Lightbulb, Smile, Sparkles, Bell, HeartPulse } from 'lucide-react';

interface DailyBriefingSectionProps {
  spiritMessage: SpiritMessage | null;
  isLoading: boolean;
}

const SpiritMessageCard: React.FC<{ spiritMessage: SpiritMessage }> = ({ spiritMessage }) => {
    const { type, content } = spiritMessage;
    let Icon, title, colorClass;

    switch (type) {
        case 'tip': Icon = Lightbulb; title = 'همسة اليوم'; colorClass = 'text-amber-500'; break;
        case 'joke': Icon = Smile; title = 'ضحكة اليوم'; colorClass = 'text-pink-500'; break;
        case 'hint': Icon = Sparkles; title = 'تلميح الروح'; colorClass = 'text-purple-500'; break;
        case 'alert': Icon = Bell; title = 'تنبيه ودي'; colorClass = 'text-red-500'; break;
        case 'quote': Icon = HeartPulse; title = 'اقتباس ملهم'; colorClass = 'text-green-500'; break;
        default: Icon = Lightbulb; title = 'رسالة اليوم'; colorClass = 'text-gray-500';
    }

    return (
        <div className="bg-white dark:bg-black p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg">
            <div className={`flex items-center justify-start gap-2 text-sm font-semibold ${colorClass}`}>
                <Icon size={16} />
                <p>{title}</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-2">"{content}"</p>
        </div>
    );
};


const DailyBriefingSection: React.FC<DailyBriefingSectionProps> = ({ spiritMessage, isLoading }) => {
    
    if (isLoading) {
        return (
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-400 mb-2 text-center">نبض اليوم</h2>
                <div className="bg-white dark:bg-black p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                    <HeartPulse size={32} className="text-cyan-500 animate-pulse mb-3" />
                    <p className="font-semibold text-gray-600 dark:text-gray-300">الروح تستشعر نبض يومك...</p>
                </div>
            </div>
        );
    }
    
    if (!spiritMessage) {
        return null; // Don't render the section at all if loading is finished but there's no message
    }

    return (
        <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-400 mb-2 text-center">نبض اليوم</h2>
            <SpiritMessageCard spiritMessage={spiritMessage} />
        </div>
    );
};

export default DailyBriefingSection;