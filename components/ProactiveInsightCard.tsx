import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface ProactiveInsightCardProps {
    insightMessage: string;
    onDismiss: () => void;
}

const ProactiveInsightCard: React.FC<ProactiveInsightCardProps> = ({ insightMessage, onDismiss }) => {
    return (
        <div className="bg-indigo-50 dark:bg-black border-l-4 border-indigo-500 text-indigo-800 dark:text-indigo-300 p-4 mb-6 rounded-r-lg relative animate-fade-in-down" role="alert">
            <button 
                onClick={onDismiss} 
                className="absolute top-2 left-2 p-1 rounded-full hover:bg-indigo-200 dark:hover:bg-gray-900"
                aria-label="إخفاء الهمسة"
            >
                <X size={16} />
            </button>
            <div className="flex items-start gap-3">
                <Lightbulb size={24} className="flex-shrink-0 text-indigo-500 mt-1" />
                <div className="flex-1 text-sm">
                    <h3 className="font-bold mb-1">همسة من الروح...</h3>
                    <MarkdownRenderer content={insightMessage} />
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

export default ProactiveInsightCard;
