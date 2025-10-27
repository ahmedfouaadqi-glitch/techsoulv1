import React, { useState, useEffect, useRef } from 'react';
import { NavigationProps } from '../types';
import { generateVideo, getVideosOperation } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { FEATURES } from '../constants';
import { Clapperboard, Sparkles, Send, Download, RefreshCw } from 'lucide-react';
import MediaInput from '../components/MediaInput';
import toast from 'react-hot-toast';
import { GenerateVideosOperation } from '@google/genai';

const feature = FEATURES.find(f => f.pageType === 'videoGeneration')!;

const LOADING_MESSAGES = [
    "النماذج العصبونية ترسم رؤيتك...",
    "الذكاء الاصطناعي ينسج إطارات الفيديو...",
    "لحظات من الإبداع الرقمي، انتظر قليلاً...",
    "تحويل الكلمات إلى عالم متحرك...",
    "قد يستغرق الأمر بضع دقائق، شكراً لصبرك."
];

const VideoGenerationPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const loadingIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        };
    }, []);

    const resetState = () => {
        setImage(null);
        setPrompt('');
        setVideoUrl(null);
        setIsLoading(false);
        setError(null);
        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };

    const handleGenerate = async () => {
        if (!prompt && !image) {
            toast.error("الرجاء إدخال وصف أو رفع صورة.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);

        // Start cycling through loading messages
        let messageIndex = 0;
        loadingIntervalRef.current = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
            setLoadingMessage(LOADING_MESSAGES[messageIndex]);
        }, 5000);

        try {
            const imagePayload = image ? {
                mimeType: image.match(/data:(.*);base64,/)?.[1] || 'image/jpeg',
                data: image.split(',')[1],
            } : undefined;

            let operation = await generateVideo(prompt, imagePayload, aspectRatio);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await getVideosOperation(operation);
            }

            if (operation.error) {
                // FIX: Handle potential 'undefined' error message from video generation operation by providing a fallback error message.
                // FIX: Safely convert the 'unknown' error message to a string.
                throw new Error(operation.error.message ? String(operation.error.message) : 'حدث خطأ غير معروف أثناء إنشاء الفيديو.');
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const videoBlob = await response.blob();
                const url = URL.createObjectURL(videoBlob);
                setVideoUrl(url);
                toast.success('تم إنشاء الفيديو بنجاح!');
            } else {
                throw new Error("لم يتم العثور على رابط الفيديو في الاستجابة.");
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير متوقع.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        }
    };
    
    if (isLoading) {
        return (
             <div className="bg-gray-50 dark:bg-black min-h-screen flex flex-col items-center justify-center text-center p-4">
                <div className="animate-pulse">
                    <Sparkles size={48} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-bold mt-4">جاري إنشاء الفيديو...</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{loadingMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                {videoUrl ? (
                    <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-2">الفيديو جاهز!</h3>
                        <video src={videoUrl} controls className="w-full rounded-lg"></video>
                        <div className="mt-4 flex gap-2">
                             <a href={videoUrl} download={`video-${Date.now()}.mp4`} className="flex-1 p-2 bg-green-500 text-white rounded-md flex items-center justify-center gap-2 text-center">
                                <Download size={16}/> تحميل
                             </a>
                            <button onClick={resetState} className="flex-1 p-2 bg-blue-500 text-white rounded-md flex items-center justify-center gap-2"><RefreshCw size={16}/> إنشاء جديد</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                            <MediaInput image={image} onImageChange={setImage} onClearImage={() => setImage(null)} promptText="أضف صورة بداية (اختياري)" />
                        </div>
                        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صف الفيديو الذي تريد إنشاءه:</label>
                             <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="مثال: قطة ترتدي نظارات شمسية وتقود سيارة رياضية"
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-black dark:border-gray-700"
                                rows={3}
                            />
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الأبعاد:</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setAspectRatio('16:9')} className={`p-2 border rounded-md ${aspectRatio === '16:9' ? 'bg-blue-500 text-white' : ''}`}>عرضي 16:9</button>
                                    <button onClick={() => setAspectRatio('9:16')} className={`p-2 border rounded-md ${aspectRatio === '9:16' ? 'bg-blue-500 text-white' : ''}`}>طولي 9:16</button>
                                </div>
                            </div>
                            <button onClick={handleGenerate} className="w-full mt-4 p-3 bg-blue-500 text-white rounded-md flex items-center justify-center gap-2">
                                <Sparkles size={18} /> إنشاء الفيديو
                            </button>
                        </div>
                    </>
                )}
                 {error && (
                     <div className="mt-4 bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold mb-2">حدث خطأ</h3>
                        <p>{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VideoGenerationPage;