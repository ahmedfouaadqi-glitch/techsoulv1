import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface CameraContextType {
  isCameraOpen: boolean;
  setIsCameraOpen: (isOpen: boolean) => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const value = useMemo(() => ({ isCameraOpen, setIsCameraOpen }), [isCameraOpen]);

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};
