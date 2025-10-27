import React, { useState } from 'react';
import { NavigationProps } from '../types';
import { editImage } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { FEATURES } from '../constants';
import { Wand2, Send, Sparkles, Download, RefreshCw, X } from 'lucide-react';
import MediaInput from '../components/MediaInput';
import toast from 'react-hot-toast';

const feature = FEATURES.find(f => f.pageType === 'imageEditing')!;

const ImageEditingPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setOriginalImage(null);
        setEditedImage(null);
        setPrompt('');
        setIsLoading(false);
        setError(null);
    };

    const handleEdit = async () => {
        if (!prompt || !originalImage) return;
        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const imagePayload = {
                mimeType: originalImage.match(/data:(.*);base64,/)?.[1] || 'image/jpeg',
                data: originalImage.split(',')[1],
            };
            const resultBase64 = await editImage(prompt, imagePayload);
            setEditedImage(`data:image/png;base64,${resultBase64}`);
            toast.success('تم تعديل الصورة بنجاح!');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = editedImage;
        link.download = `edited-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                    {!originalImage ? (
                        <MediaInput onImageChange={setOriginalImage} promptText="اختر الصورة التي تريد تعديلها" />
                    ) : (
                        <div className="relative">
                            <img src={originalImage} alt="Original" className="rounded-lg w-full max-h-80 object-contain" />
                             <button onClick={() => setOriginalImage(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"><X size={16} /></button>
                        </div>
                    )}
                </div>

                {originalImage && (
                    <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كيف تريد تعديل الصورة؟</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="مثال: أضف طابعًا قديمًا للصورة"
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-black dark:border-gray-700"
                            />
                            <button onClick={handleEdit} disabled={isLoading || !prompt} className="p-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-gray-400">
                                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                )}
                
                {error && (
                     <div className="mt-4 bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold mb-2">حدث خطأ</h3>
                        <p>{error}</p>
                    </div>
                )}

                {editedImage && (
                    <div className="mt-6">
                         <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-pink-700 dark:text-pink-300">
                            <Sparkles size={20} />
                            الصورة المعدلة
                        </h3>
                        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                           <img src={editedImage} alt="Edited" className="rounded-lg w-full max-h-96 object-contain" />
                            <div className="mt-4 flex gap-2">
                                <button onClick={handleDownload} className="flex-1 p-2 bg-green-500 text-white rounded-md flex items-center justify-center gap-2"><Download size={16}/> تحميل</button>
                                <button onClick={resetState} className="flex-1 p-2 bg-blue-500 text-white rounded-md flex items-center justify-center gap-2"><RefreshCw size={16}/> تعديل جديد</button>
                           </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ImageEditingPage;