import React, { useState, useRef, useEffect } from 'react';
import { NavigationProps } from '../types';
import { callGeminiApi } from '../services/geminiService';
import { addDiaryEntry } from '../services/diaryService';
import PageHeader from '../components/PageHeader';
import { Pill, AlertTriangle, Sparkles, Search, X, CheckCircle } from 'lucide-react';
import { FEATURES } from '../constants';
import Feedback from '../components/Feedback';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAnalysis } from '../context/AnalysisContext';
import FollowUpChat from '../components/FollowUpChat';
import MediaInput from '../components/MediaInput'; // Import the new component

const feature = FEATURES.find(f => f.pageType === 'pharmacy')!;

const PharmacyPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localImage, setLocalImage] = useState<string | null>(null);
    const [responseId, setResponseId] = useState<string | null>(null);
    const { analysisData, setAnalysisData } = useAnalysis();
    const contextApplied = useRef(false);
    const [isAddedToDiary, setIsAddedToDiary] = useState(false);
    
    const [initialUserQuery, setInitialUserQuery] = useState('');


    useEffect(() => {
        if (analysisData && !contextApplied.current && !localImage) {
            if (analysisData.images && analysisData.images.length > 0) setLocalImage(analysisData.images[0]);
            if (analysisData.text) setInput(analysisData.text);
            contextApplied.current = true;
        }
    }, [analysisData, localImage]);

    const handleClearContext = () => {
        setAnalysisData(null);
        setInput('');
        setLocalImage(null);
        contextApplied.current = false;
    };
    
    const handleAddToDiary = () => {
        const title = input || "دواء من صورة";
        if (!title || !result) return;
        addDiaryEntry(new Date(), {
            type: 'medication',
            icon: '💊',
            title: `بحث عن دواء: ${title}`,
            details: result
        });
        setIsAddedToDiary(true);
    };

    const getMedicineInfo = async (promptText: string, image?: { mimeType: string, data: string }) => {
        setIsLoading(true);
        setResult('');
        setError(null);
        setResponseId(null);
        setIsAddedToDiary(false);
        
        let prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت مساعد صيدلي ذكي. قم بتحليل الطلب التالي لتقديم معلومات مفصلة عن الدواء.`;

        if (image) {
            prompt += `حلل صورة علبة الدواء هذه وتعرف على اسمه، ثم قدم المعلومات التالية عنه:`;
        } else {
            prompt += `قدم المعلومات التالية عن دواء "${promptText}":`;
        }

        prompt += `
        1.  **الاستخدام:** لماذا يستخدم هذا الدواء؟
        2.  **الجرعة الشائعة:** إرشادات عامة حول كيفية تناوله.
        3.  **الآثار الجانبية المحتملة:** قائمة بالآثار الجانبية الشائعة.
        4.  **تحذيرات هامة:** معلومات حول الحالات التي يجب فيها توخي الحذر.

        **مهم جداً:** لا تقم بتضمين أي ملاحظات حول استشارة الطبيب في ردك, حيث سيتم عرضها بشكل منفصل في واجهة المستخدم.`;

        try {
            const apiResult = await callGeminiApi(prompt, image ? [image] : undefined);
            setResult(apiResult);
            setResponseId(`pharmacy-${Date.now()}`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير معروف.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const clearState = () => {
        setInput('');
        setLocalImage(null);
        setResult('');
        setError(null);
        setResponseId(null);
        setAnalysisData(null);
        setInitialUserQuery('');
    }

    const handleBack = () => {
        if (result || error) {
            clearState();
        } else {
            navigateTo({ type: 'home' });
        }
    };

    const handleSubmit = () => {
        const query = localImage ? (input || "تحليل الدواء في الصورة") : input.trim();
        if (!query) return;

        setInitialUserQuery(query);

        if (localImage) {
            const base64Data = localImage.split(',')[1];
            const mimeType = localImage.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
            getMedicineInfo(query, { mimeType, data: base64Data });
        } else if (input.trim()) {
            getMedicineInfo(query);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader onBack={handleBack} navigateTo={navigateTo} title="مركز مستشار الصيدلاني الذكي" Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                <div className="bg-yellow-50 dark:bg-black border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 p-4 mb-6" role="alert">
                    <div className="flex">
                        <div className="py-1"><AlertTriangle className="h-6 w-6 text-yellow-500 mr-4" /></div>
                        <div>
                            <p className="font-bold">ملاحظة هامة</p>
                            <p className="text-sm">هذه المعلومات إرشادية فقط ولا تغني أبداً عن استشارة الطبيب أو الصيدلي المختص. لا تقم بتغيير دوائك أو جرعتك بناءً على هذه المعلومات.</p>
                        </div>
                    </div>
                </div>

                 {analysisData && (
                    <div className="bg-teal-50 dark:bg-black border-l-4 border-teal-500 text-teal-800 dark:text-teal-300 p-4 mb-4 rounded-r-lg flex items-center gap-4 relative" role="alert">
                        {analysisData.images && analysisData.images[0] && <img src={analysisData.images[0]} alt="Context" className="w-16 h-16 rounded-md object-cover" />}
                        <div className="flex-1">
                            <p className="font-bold">استخدام السياق من الكاميرا الذكية</p>
                            {analysisData.text && <p className="text-sm truncate">"{analysisData.text}"</p>}
                        </div>
                        <button onClick={handleClearContext} className="p-1 rounded-full hover:bg-teal-200 dark:hover:bg-gray-900">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                    <MediaInput image={localImage} onImageChange={setLocalImage} onClearImage={() => setLocalImage(null)} promptText="ارفع صورة أو استخدم الكاميرا لمسح الدواء" />
                    
                    <div className="relative my-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => { setInput(e.target.value); if(localImage) setLocalImage(null); }}
                            placeholder="أو اكتب اسم الدواء هنا..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || (!input.trim() && !localImage)}
                        className={`w-full p-3 rounded-md text-white font-bold transition flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 active:scale-95`}
                    >
                        <Search size={20} />
                        {localImage ? 'تحليل الصورة' : 'بحث'}
                    </button>
                </div>
                
                { (result || error || isLoading) && (
                    <div className="mt-6">
                        {isLoading && (
                            <div className="text-center p-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-300">الصيدلاني الذكي يراجع بيانات الدواء...</p>
                            </div>
                        )}

                        {error && (
                             <div className="bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
                                <h3 className="font-bold mb-2">حدث خطأ</h3>
                                <p>{error}</p>
                                <button onClick={clearState} className="mt-3 px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition">حاول مرة أخرى</button>
                            </div>
                        )}

                        {result && !error && (
                            <div className="bg-green-50 dark:bg-black p-4 rounded-lg shadow-md border border-green-200 dark:border-green-500/50 text-gray-800 dark:text-gray-200">
                                <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 text-green-700 dark:text-green-300`}>
                                    <Sparkles size={20} />
                                    معلومات الدواء
                                </h3>
                                <MarkdownRenderer content={result} />

                                <div className="mt-4 text-center">
                                    <button
                                        onClick={handleAddToDiary}
                                        disabled={isAddedToDiary}
                                        className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-black dark:border dark:border-purple-500/50 dark:text-purple-300 disabled:opacity-70"
                                    >
                                        {isAddedToDiary ? <><CheckCircle size={18} /> تمت الإضافة لليوميات</> : '📌 إضافة لليوميات'}
                                    </button>
                                </div>
                                
                                {responseId && <Feedback responseId={responseId} />}
                                <FollowUpChat 
                                    initialUserPrompt={initialUserQuery}
                                    initialModelContent={result} 
                                    context={analysisData} 
                                    systemInstruction="أنت صيدلي خبير. أجب عن أسئلة المستخدم المتابعة بخصوص الدواء بناءً على المعلومات الأولية." 
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PharmacyPage;