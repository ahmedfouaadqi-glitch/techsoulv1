import React, { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { getItem, setItem } from '../services/storageService';

interface SmartTipProps {
  tipId: string;
  message: string;
}

const SmartTip: React.FC<SmartTipProps> = ({ tipId, message }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasBeenDismissed = getItem(`tip_${tipId}_dismissed`, null);
    if (!hasBeenDismissed) {
      setIsVisible(true);
    }
  }, [tipId]);

  const handleDismiss = () => {
    setItem(`tip_${tipId}_dismissed`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-black border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 p-3 mb-4 rounded-r-lg flex items-center gap-3 relative text-sm animate-fade-in-down" role="alert">
      <Lightbulb size={20} className="flex-shrink-0 text-yellow-500" />
      <p>{message}</p>
      <button 
        onClick={handleDismiss} 
        className="absolute top-2 left-2 p-1 rounded-full hover:bg-yellow-200 dark:hover:bg-gray-900"
        aria-label="إخفاء التلميحة"
      >
        <X size={16} />
      </button>
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

export default SmartTip;
