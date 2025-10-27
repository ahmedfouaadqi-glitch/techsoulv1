import React, { useState, useEffect } from 'react';
import { generateMorningBriefing } from '../services/geminiService';
import { Sun, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { UserProfile } from '../types';
import { getItem, setItem } from '../services/storageService';

interface MorningBriefingProps {
    userProfile: UserProfile | null;
}

const MorningBriefing: React.FC<MorningBriefingProps> = ({ userProfile }) => {
    const [briefing, setBriefing] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkAndFetchBriefing = async () => {
            const lastShownDate = getItem('lastBriefingShownDate', null);
            const today = new Date().toDateString();

            if (lastShownDate !== today) {
                setIsVisible(true);
                try {
                    const result = await generateMorningBriefing(userProfile?.name || null);
                    setBriefing(result);
                    setItem('lastBriefingShownDate', today);
                } catch (error) {
                    // Fail silently, don't show an error to the user
                    console.error("Failed to fetch morning briefing:", error);
                    setIsVisible(false);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        checkAndFetchBriefing();
    }, [userProfile]);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible || isLoading) {
        return null; // Don't show anything if it's not time or still loading
    }
    
    if (!briefing) {
        return null; // Or if fetching resulted in no briefing
    }

    return (
        <div className="bg-yellow-50 dark:bg-black border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 p-4 mb-6 rounded-r-lg relative animate-fade-in-down" role="alert">
            <button 
                onClick={handleDismiss} 
                className="absolute top-2 left-2 p-1 rounded-full hover:bg-yellow-200 dark:hover:bg-gray-900"
                aria-label="إخفاء الموجز"
            >
                <X size={16} />
            </button>
            <div className="flex items-start gap-3">
                <Sun size={24} className="flex-shrink-0 text-yellow-500 mt-1" />
                <div className="flex-1 text-sm">
                    <MarkdownRenderer content={briefing} />
                </div>
            </div>
             <style>{`
                @keyframes fade-in-down {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }
             `}</style>
        </div>
    );
};

export default MorningBriefing;
