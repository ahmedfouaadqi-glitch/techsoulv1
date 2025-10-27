import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, Camera, X, ImagePlus, Plus, User, CheckCircle } from 'lucide-react';
import DirectCameraInput from './DirectCameraInput';
import { useCamera } from '../context/CameraContext';

interface MediaInputProps {
  // Multi-image mode (used in ImageAnalysisPage)
  images?: string[];
  setImages?: React.Dispatch<React.SetStateAction<string[]>>;

  // Single-image mode (used in CalorieCounter, Pharmacy, SmartHealth)
  image?: string | null;
  onImageChange?: (image: string) => void;
  onClearImage?: () => void;

  promptText?: string;
}

const MediaInput: React.FC<MediaInputProps> = ({
    images, setImages,
    image, onImageChange, onClearImage,
    promptText
}) => {
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState<'user' | 'environment' | null>(null);
    const { setIsCameraOpen } = useCamera();

    const isMultiMode = !!(images && setImages);

    useEffect(() => {
        setIsCameraOpen(cameraMode !== null);
        
        return () => {
            if (cameraMode !== null) {
                setIsCameraOpen(false);
            }
        };
    }, [cameraMode, setIsCameraOpen]);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileReaders: Promise<string>[] = [];
        Array.from(files).forEach(file => {
            fileReaders.push(new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }));
        });

        Promise.all(fileReaders).then(base64Images => {
            handleImageAddition(base64Images);
        }).catch(err => {
            console.error("Error reading files:", err);
        });
    };
    
    const handleImageAddition = useCallback((newImages: string[]) => {
       if (isMultiMode && setImages) {
            setImages(prev => [...prev, ...newImages].slice(0, 10));
        } else if (onImageChange && newImages.length > 0) {
            onImageChange(newImages[0]);
        }
    }, [isMultiMode, onImageChange, setImages]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(event.target.files);
        if (event.target) {
            event.target.value = '';
        }
        setIsActionSheetOpen(false);
    };

    const triggerUpload = () => {
        setIsActionSheetOpen(false);
        uploadInputRef.current?.click();
    };

    const handleCameraCapture = useCallback((capturedImage: string) => {
        handleImageAddition([capturedImage]);
        setCameraMode(null);
    }, [handleImageAddition]);
    
    const handleCloseCamera = useCallback(() => {
        setCameraMode(null);
    }, []);

    const openCamera = (mode: 'user' | 'environment') => {
        setIsActionSheetOpen(false);
        setCameraMode(mode);
    }

    const handleRemoveImage = (indexToRemove: number) => {
        if (isMultiMode && setImages && images) {
            setImages(prev => prev.filter((_, index) => index !== indexToRemove));
        } else if (onClearImage) {
            onClearImage();
        }
    };

    const handleClearAll = () => {
        if (isMultiMode && setImages) {
            setImages([]);
        } else if (onClearImage) {
            onClearImage();
        }
    };
    
    const currentImages = isMultiMode ? (images || []) : (image ? [image] : []);

    const ActionSheet = () => (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-end animate-fade-in"
            onClick={() => setIsActionSheetOpen(false)}
        >
            <div 
                className="bg-white dark:bg-gray-900 rounded-t-2xl w-full animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
                    <h3 className="text-center font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">إضافة صورة</h3>
                    <div className="flex flex-col gap-3">
                         <button
                            onClick={() => openCamera('environment')}
                            className="p-4 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-xl flex items-center justify-center gap-3 transition hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
                        >
                            <Camera size={24} className="text-blue-500" />
                            <span className="font-semibold">الكاميرا الخلفية</span>
                        </button>
                        <button
                            onClick={() => openCamera('user')}
                            className="p-4 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-xl flex items-center justify-center gap-3 transition hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
                        >
                            <User size={24} className="text-purple-500" />
                            <span className="font-semibold">الكاميرا الأمامية</span>
                        </button>
                        <button
                            onClick={triggerUpload}
                            className="p-4 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-xl flex items-center justify-center gap-3 transition hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
                        >
                            <Upload size={24} className="text-teal-500" />
                            <span className="font-semibold">اختر من المعرض</span>
                        </button>
                    </div>
                </div>
                 <div className="border-t border-gray-200 dark:border-gray-700 p-4 mt-2">
                     <button
                        onClick={() => setIsActionSheetOpen(false)}
                        className="w-full p-3 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-xl flex items-center justify-center gap-3 transition hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95"
                    >
                        <span className="font-bold">إلغاء</span>
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );

    return (
        <div className="w-full">
            <input
                type="file"
                accept="image/*"
                multiple={isMultiMode}
                ref={uploadInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            
            {isActionSheetOpen && <ActionSheet />}
            {cameraMode && (
                <DirectCameraInput 
                    onCapture={handleCameraCapture}
                    onClose={handleCloseCamera}
                    initialFacingMode={cameraMode}
                />
            )}

            {currentImages.length > 0 ? (
                 <div className="mt-4">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">الصور المحددة ({currentImages.length})</h3>
                        <button onClick={handleClearAll} className="text-sm text-red-500 hover:underline">إزالة الكل</button>
                     </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {currentImages.map((imgSrc, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border dark:border-gray-700 group">
                                <img src={imgSrc} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="إزالة الصورة"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                         {isMultiMode && currentImages.length < 10 && (
                            <button 
                                onClick={() => setIsActionSheetOpen(true)}
                                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                                aria-label="إضافة المزيد من الصور"
                            >
                                <Plus size={24} />
                                <span className="text-xs mt-1">إضافة المزيد</span>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div 
                    onClick={() => setIsActionSheetOpen(true)}
                    className="w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black text-center cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-black/20 transition"
                >
                    <ImagePlus size={32} className="text-gray-400 dark:text-gray-600 mb-2" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{promptText || 'إضافة صورة أو التقاطها'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">انقر هنا لفتح الكاميرا أو معرض الصور</p>
                </div>
            )}
        </div>
    );
};

export default MediaInput;
