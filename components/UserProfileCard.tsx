import React from 'react';
import { UserProfile } from '../types';
import { User, Edit2 } from 'lucide-react';

interface UserProfileCardProps {
  userProfile: UserProfile | null;
  onEdit: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ userProfile, onEdit }) => {
  if (!userProfile) {
    // Skeleton loader for the card
    return (
        <div className="bg-white dark:bg-black p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 mb-4 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                    <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-40"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
            <User size={24} className="text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <p className="text-md text-gray-500 dark:text-gray-400">مرحباً بعودتك،</p>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{userProfile.name}</h2>
          </div>
        </div>
        <button 
          onClick={onEdit}
          className="p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors flex-shrink-0"
          aria-label="تعديل الملف الشخصي"
        >
          <Edit2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default UserProfileCard;
