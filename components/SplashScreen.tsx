import React from 'react';
import { HeartPulse } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <HeartPulse className="w-24 h-24 text-cyan-400 animate-pulse" />
      <h1 className="text-3xl font-bold text-gray-200 mt-4">الروح التقنية</h1>
      <p className="text-gray-400 mt-2">...تتجلى الروح في عالمك الرقمي</p>
    </div>
  );
};

export default SplashScreen;
