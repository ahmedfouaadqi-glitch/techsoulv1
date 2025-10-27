import React, { useState, useCallback, useEffect } from 'react';
import { NavigationProps, AnalysisData, AppHistoryItem } from '../types';
import { callGeminiApi } from '../services/geminiService';
import { getHistory, addHistoryItem } from '../services/historyService';
import PageHeader from '../components/PageHeader';
import { Camera, UtensilsCrossed, Leaf, Pill, Sparkles as BeautyIcon, HelpCircle, Sparkles, Send, Clock, ArchiveX } from 'lucide-react';
import { FEATURES } from '../constants';
import MediaInput from '../components/MediaInput';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAnalysis } from '../context/AnalysisContext';
import Feedback from '../components/Feedback';
import TTSButton from '../components/TTSButton';

const feature = { title: "عين الروح", Icon: Camera, color: "cyan" };

type AnalysisType = 'food' | 'plant_id' | 'medication' | 'skin' | 'general';

const analysisOptions: { type: AnalysisType; label: string; Icon: React.ElementType; prompt: string; color: string; navigateTo?: 'calorieCounter' | 'myPlants' | 'pharmacy' | 'beauty' }[] = [
    { type: 'food', label: 'تحليل طعام', Icon: UtensilsCrossed, prompt: '**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت خبير تغذية. من خلال الصورة، تعرف على الطعام وقدم وصفاً موجزاً له. لا تحلل السعرات الحرارية.', color: 'orange', navigateTo: 'calorieCounter' },
    { type: 'plant_id', label: 'التعرف على نبتة', Icon: Leaf, prompt: '**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت عالم نباتات. تعرف على اسم النبتة في الصورة.', color: 'amber', navigateTo: 'myPlants' },
    { type: 'medication', label: 'التعرف على دواء', Icon: Pill, prompt: '**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت صيدلي. تعرف على اسم الدواء من خلال العلبة في الصورة.', color: 'green', navigateTo: 'pharmacy' },
    { type: 'skin', label: 'تحليل البشرة', Icon: BeautyIcon, prompt: '**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت خبير بشرة. من خلال الصورة، حدد نوع البشرة الظاهر (دهنية، جافة، مختلطة). كن مباشراً ومختصراً.', color: 'pink', navigateTo: 'beauty' },
    { type: 'general', label: 'تحليل عام', Icon: HelpCircle, prompt: '**مهمتك: الرد باللغة العربية الفصحى فقط.** حلل الصورة المقدمة وقدم وصفاً تفصيلياً لما تراه.', color: 'blue' },
];

// Using a map for Tailwind classes to ensure they are statically analyzable and not purged.
const colorClasses: { [key: string]: { bg: string, text: string, border: string, hoverBorder: string, darkBorder: string, darkText: string, hoverBg: string } } = {
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hoverBorder: 'hover:border-orange-400', darkBorder: 'dark:border-orange-500/50', darkText: 'dark:text-orange-300', hoverBg: 'hover:bg-orange-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', hoverBorder: 'hover:border-amber-400', darkBorder: 'dark:border-amber-500/50', darkText: 'dark:text-amber-300', hoverBg: 'hover:bg-amber-100' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hoverBorder: 'hover:border-green-400', darkBorder: 'dark:border-green-500/50', darkText: 'dark:text-green-300', hoverBg: 'hover:bg-green-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', hoverBorder: 'hover:border-pink-400', darkBorder: 'dark:border-pink-500/50', darkText: 'dark:text-pink-300', hoverBg: 'hover:bg-pink-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hoverBorder: 'hover:border-blue-400', darkBorder: 'dark:border-blue-500/50', darkText: 'dark:text-blue-300', hoverBg: 'hover:bg-blue-100' },
};

const ImageAnalysisPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [images, setImages] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [responseId, setResponseId] = useState<string | null>(null);
    const [analysisHistory, setAnalysisHistory] = useState<AppHistoryItem[]>([]);
    const { setAnalysisData } = useAnalysis();

    useEffect(() => {
        setAnalysisHistory(getHistory('imageAnalysis'));
    }, []);

    const resetState = () => {
        setImages([]);
        setCustomPrompt('');
        setResult('');
        setError(null);
        setIsLoading(false);
        setResponseId(null);
    };

    const handleBack = () => {
        if (result || error || images.length > 0) {
            resetState();
            setAnalysisHistory(getHistory('imageAnalysis')); // Refresh history
        } else {
            navigateTo({ type: 'home' });
        }
    };
    
    const handleAnalysis = useCallback(async (analysisType: AnalysisType, prompt: string, navTarget?: string) => {
        if (images.length === 0) {
            setError('الرجاء رفع صورة أولاً.');
            return;
        }

        setIsLoading(true);
        setResult('');
        setError(null);
        setResponseId(null);
        
        const finalPrompt = customPrompt.trim() ? `${prompt} السؤال الإضافي من المستخدم هو: "${customPrompt}"` : prompt;

        try {
            const imagePayloads = images.map(img => ({
                mimeType: img.match(/data:(.*);base64,/)?.[1] || 'image/jpeg',
                data: img.split(',')[1],
            }));

            const apiResult = await callGeminiApi(finalPrompt, imagePayloads);
            
            if (navTarget) {
                const analysisContextData: AnalysisData = {
                    analysisType: analysisType,
                    images: images,
                    image: images[0], // For single image consumers
                    text: customPrompt,
                    analysisDetails: apiResult, // Pass the initial analysis result
                };
                setAnalysisData(analysisContextData);
                
                if (navTarget === 'beauty') {
                    navigateTo({ type: 'smartHealth', pageType: 'beauty' });
                } else {
                    navigateTo({ type: navTarget as any });
                }
            } else {
                 addHistoryItem({
                    type: 'imageAnalysis',
                    title: analysisOptions.find(opt => opt.type === analysisType)?.label || 'تحليل',
                    data: {
                        images,
                        result: apiResult,
                    }
                });
                setResult(apiResult);
                setResponseId(`image-analysis-${Date.now()}`);
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير متوقع.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [images, customPrompt, navigateTo, setAnalysisData]);

    const handleHistoryItemClick = (item: AppHistoryItem) => {
        setImages(item.data.images);
        setResult(item.data.result);
        setError(null);
        setIsLoading(false);
        setResponseId(`history-item-${item.id}`);
    };

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader onBack={handleBack} navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                {result === '' && !isLoading && !error ? (
                    <>
                        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                             <MediaInput setImages={setImages} images={images} />
                        </div>

                        {images.length > 0 && (
                             <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 animate-fade-in">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">اختر نوع التحليل:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                     {analysisOptions.map(opt => {
                                        const colors = colorClasses[opt.color] || colorClasses.blue;
                                        return (
                                            <button
                                                key={opt.type}
                                                onClick={() => handleAnalysis(opt.type, opt.prompt, opt.navigateTo)}
                                                className={`p-3 rounded-lg border-2 transition-all duration-200 text-right flex items-center gap-3 dark:bg-black active:scale-95 ${colors.bg} ${colors.border} ${colors.darkBorder} ${colors.hoverBorder} ${colors.hoverBg} dark:hover:border-gray-600`}
                                            >
                                                <opt.Icon size={24} className={`${colors.text} ${colors.darkText}`} />
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{opt.label}</span>
                                            </button>
                                        );
                                     })}
                                </div>
                                <div className="border-t dark:border-gray-700 pt-4">
                                    <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">أو أضف سؤالاً مخصصاً (اختياري):</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="custom-prompt"
                                            type="text"
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="مثال: هل هذه النبتة سامة للقطط؟"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200"
                                        />
                                        <button onClick={() => handleAnalysis('general', analysisOptions.find(o => o.type === 'general')!.prompt)} disabled={!customPrompt.trim()} className="p-3 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:bg-gray-400">
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                             </div>
                        )}
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">سجل التحليلات</h2>
                            {analysisHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {analysisHistory.map(item => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleHistoryItemClick(item)}
                                            className="bg-white dark:bg-black p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                        >
                                            <img src={item.data.images[0]} alt="Thumbnail" className="w-16 h-16 rounded-md object-cover"/>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold text-gray-700 dark:text-gray-300">{item.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">{item.data.result}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(item.timestamp).toLocaleString('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4 bg-white dark:bg-black rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <ArchiveX size={40} className="mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                                    <h3 className="font-semibold text-gray-600 dark:text-gray-300">لا يوجد تحليلات سابقة</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        التحليلات التي تقوم بها ستظهر هنا.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : null}

                {isLoading && (
                    <div className="text-center p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">عين الروح تركز الآن...</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold mb-2">حدث خطأ</h3>
                        <p>{error}</p>
                    </div>
                )}
                {result && (
                     <div className="bg-cyan-50 dark:bg-black p-4 rounded-lg shadow-md border border-cyan-200 dark:border-cyan-500/50 text-gray-800 dark:text-gray-200">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                                <Sparkles size={20} />
                                نتائج التحليل
                            </h3>
                            <TTSButton textToRead={result} />
                        </div>
                        {images.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">الصور التي تم تحليلها:</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {images.map((img, index) => (
                                        <img key={index} src={img} alt={`Analyzed content ${index + 1}`} className="rounded-lg w-full h-auto object-cover shadow-md" />
                                    ))}
                                </div>
                            </div>
                        )}
                        <MarkdownRenderer content={result} />
                        {responseId && <Feedback responseId={responseId} />}
                     </div>
                )}

            </main>
        </div>
    );
};

export default ImageAnalysisPage;
