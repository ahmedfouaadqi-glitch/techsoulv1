import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center pt-32">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mx-auto" />
      </div>
    </div>
  );
};

export default PageLoader;
