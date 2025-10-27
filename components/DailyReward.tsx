import React, { useState, useEffect } from 'react';
import { Gift, X, Loader2 } from 'lucide-react';
import { canClaimReward, claimReward } from '../services/rewardService';
import { SpiritReward } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { playSound } from '../services/soundService';

const DailyReward: React.FC = () => {
    const [isClaimable, setIsClaimable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reward, setReward] = useState<SpiritReward | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setIsClaimable(canClaimReward());
    }, []);

    const handleClaim = async () => {
        if (!isClaimable || isLoading) return;

        setIsLoading(true);
        playSound('tap');
        try {
            const newReward = await claimReward();
            setReward(newReward);
            setIsModalOpen(true);
            setIsClaimable(false); // Update UI state immediately
            playSound('success');
        } catch (error) {
            console.error(error);
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setReward(null);
    }

    if (!isClaimable) {
        return null; // Don't show anything if it's not claimable to keep UI clean
    }

    return (
        <>
            <div className="px-4 my-4">
                 <div
                    onClick={handleClaim}
                    className="relative w-full p-5 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 bg-gradient-to-br from-amber-400 to-orange-500 text-white border-2 border-amber-300 flex items-center gap-4"
                >
                    <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
                    <div className="relative">
                        <Gift className="w-10 h-10 animate-bounce" />
                    </div>
                    <div className="relative flex-1">
                        <h3 className="font-bold text-lg">صندوق الروح اليومي!</h3>
                        <p className="text-sm opacity-90">هديتك اليومية في انتظارك. انقر لفتحها!</p>
                    </div>
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
            
            {isModalOpen && reward && (
                <div 
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up relative"
                    >
                         <button onClick={closeModal} className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
                         <div className="w-20 h-20 mx-auto bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 -mt-16 text-5xl">
                            {reward.icon}
                        </div>
                        <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-white">{reward.title}</h2>
                        <div className="text-gray-600 dark:text-gray-300 mt-2 mb-6 max-h-60 overflow-y-auto p-2">
                             <MarkdownRenderer content={reward.content} />
                        </div>
                        
                        <button
                          onClick={closeModal}
                          className="w-full p-3 rounded-lg font-bold text-white transition-all duration-300 bg-amber-500 hover:bg-amber-600"
                        >
                          رائع!
                        </button>
                    </div>
                    <style>{`
                        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes slide-up { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
                    `}</style>
                </div>
            )}
        </>
    );
};

export default DailyReward;
