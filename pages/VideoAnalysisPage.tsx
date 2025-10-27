import React, { useState, useRef } from 'react';
import { NavigationProps } from '../types';
import { analyzeVideoFrame } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { FEATURES } from '../constants';
import { Video, Upload, Film, Sparkles, Send } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import toast from 'react-hot-toast';

const feature = FEATURES.find(f => f.pageType === 'videoAnalysis')!;

const VideoAnalysisPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [frame, setFrame] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('حلل هذا الإطار من الفيديو وقدم وصفاً تفصيلياً لما يحدث.');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                toast.error("حجم الفيديو كبير جداً. الرجاء اختيار ملف أصغر من 50 ميجابايت.");
                return;
            }
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setFrame(null);
            setResult('');
        }
    };

    const captureFrame = () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg');
        setFrame(frameDataUrl);
        toast.success('تم التقاط الإطار بنجاح!');
    };
    
    const handleAnalyze = async () => {
        if (!frame || !prompt) return;
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const imagePayload = {
                mimeType: 'image/jpeg',
                data: frame.split(',')[1],
            };
            const analysisResult = await analyzeVideoFrame(prompt, imagePayload);
            setResult(analysisResult);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                 <input type="file" accept="video/*" ref={inputRef} onChange={handleFileChange} className="hidden" />
                <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                    {!videoSrc ? (
                        <button onClick={() => inputRef.current?.click()} className="w-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition">
                            <Upload size={40} />
                            <span className="mt-2 font-semibold">اختر ملف فيديو</span>
                            <span className="text-xs">الحد الأقصى 50 ميجابايت</span>
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <video ref={videoRef} src={videoSrc} controls className="w-full rounded-lg" onLoadedMetadata={captureFrame}></video>
                            <button onClick={captureFrame} className="w-full p-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 rounded-md flex items-center justify-center gap-2">
                                <Film size={18} />
                                التقط إطاراً آخر من الفيديو
                            </button>
                        </div>
                    )}
                </div>

                {frame && (
                    <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold mb-2">الإطار المحدد للتحليل:</h3>
                        <img src={frame} alt="Captured frame" className="rounded-lg w-full max-h-60 object-contain mb-4" />
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما الذي تريد تحليله في هذا الإطار؟</label>
                        <div className="flex items-center gap-2">
                             <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-black dark:border-gray-700"
                            />
                            <button onClick={handleAnalyze} disabled={isLoading || !prompt} className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">
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
                
                {result && (
                     <div className="mt-6 bg-blue-50 dark:bg-black p-4 rounded-lg shadow-md border border-blue-200 dark:border-blue-500/50 text-gray-800 dark:text-gray-200">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <Sparkles size={20} />
                            نتائج التحليل
                        </h3>
                        <MarkdownRenderer content={result} />
                    </div>
                )}

            </main>
        </div>
    );
};

export default VideoAnalysisPage;