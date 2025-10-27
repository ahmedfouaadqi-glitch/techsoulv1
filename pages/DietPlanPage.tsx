import React, { useState, useEffect } from 'react';
import { NavigationProps, DietPlan, AppHistoryItem } from '../types';
import { callGeminiJsonApi } from '../services/geminiService';
import { getHistory, addHistoryItem } from '../services/historyService';
import PageHeader from '../components/PageHeader';
import { UtensilsCrossed, Sparkles, PlusCircle, ArchiveX, Clock, ArrowLeft } from 'lucide-react';
import { PERSONAL_ADVISOR_BEAUTY_SUB_FEATURES } from '../constants';
import { Type } from '@google/genai';
import TTSButton from '../components/TTSButton';

const featureData = PERSONAL_ADVISOR_BEAUTY_SUB_FEATURES.subCategories.find(f => f.id === 'diet-plan')!;

const dietPlanSchema = {
  type: Type.OBJECT,
  properties: {
    planTitle: { type: Type.STRING, description: "عنوان جذاب وملخص للخطة الغذائية (مثال: خطة فقدان الوزن منخفضة الكربوهيدرات)." },
    dailyPlan: {
      type: Type.ARRAY,
      description: "مصفوفة من الخطط اليومية.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "اليوم المحدد في الخطة (مثال: اليوم الأول)." },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meal: { type: Type.STRING, description: "نوع الوجبة (فطور, غداء, عشاء, وجبة خفيفة)." },
                description: { type: Type.STRING, description: "وصف مفصل للوجبة ومكوناتها." },
                calories: { type: Type.NUMBER, description: "تقدير السعرات الحرارية للوجبة." },
              },
              required: ['meal', 'description', 'calories']
            }
          },
          dailyTotalCalories: { type: Type.NUMBER, description: "إجمالي السعرات الحرارية المقدرة لهذا اليوم." },
          dailyTip: { type: Type.STRING, description: "نصيحة صحية يومية قصيرة ومفيدة." }
        },
        required: ['day', 'meals', 'dailyTotalCalories', 'dailyTip']
      }
    }
  },
  required: ['planTitle', 'dailyPlan']
};


const DietPlanPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [history, setHistory] = useState<AppHistoryItem[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
    const [formState, setFormState] = useState({
        goal: 'فقدان الوزن',
        dietType: 'متوازن',
        allergies: ''
    });

    useEffect(() => {
        const planHistory = getHistory('dietPlan');
        setHistory(planHistory);
        if (planHistory.length === 0) {
            setView('form');
        } else {
            setView('list');
        }
    }, []);

    const handleBack = () => {
        if (view === 'detail') {
            setSelectedPlan(null);
            setView('list');
        } else if (view === 'form') {
            if (history.length > 0) {
                setView('list');
            } else {
                navigateTo({ type: 'smartHealth', pageType: 'beauty' });
            }
        } else {
            navigateTo({ type: 'smartHealth', pageType: 'beauty' });
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const generatePlan = async () => {
        setIsLoading(true);
        setError(null);

        const prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت خبير تغذية معتمد. أنشئ خطة غذائية مفصلة ومتعمقة لمدة 7 أيام بناءً على المعلومات التالية للمستخدم:
- **الهدف:** ${formState.goal}
- **نوع النظام:** ${formState.dietType}
- **معلومات إضافية (حساسية/أطعمة غير مفضلة):** ${formState.allergies || 'لا يوجد'}

يجب أن يكون الرد بتنسيق JSON. لكل يوم، قدم وجبات (فطور، غداء، عشاء، ووجبة خفيفة)، مع وصف لكل وجبة وتقدير سعراتها الحرارية. أضف إجمالي السعرات اليومية ونصيحة يومية. كن دقيقاً وعلمياً في اقتراحاتك.`;
        
        try {
            const result: DietPlan = await callGeminiJsonApi(prompt, dietPlanSchema, true);
            if (result && result.dailyPlan) {
                 const newItem = addHistoryItem({
                    type: 'dietPlan',
                    title: result.planTitle,
                    data: result
                });
                setHistory(prev => [newItem, ...prev]);
                setSelectedPlan(result);
                setView('detail');
            } else {
                throw new Error("لم يتمكن الذكاء الاصطناعي من إنشاء خطة بالصيغة الصحيحة.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "فشل إنشاء الخطة.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const getPlanAsText = (): string => {
        if (!selectedPlan) return "";
        let text = `${selectedPlan.planTitle}\n\n`;
        selectedPlan.dailyPlan.forEach(day => {
            text += `**${day.day} (إجمالي ~${day.dailyTotalCalories} سعرة)**\n`;
            day.meals.forEach(meal => {
                text += `- **${meal.meal} (~${meal.calories} سعرة):** ${meal.description}\n`;
            });
            text += `*نصيحة اليوم:* ${day.dailyTip}\n\n`;
        });
        return text;
    };


    const renderForm = () => (
        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">أنشئ خطتك الغذائية</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما هو هدفك؟</label>
                    <select name="goal" value={formState.goal} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-600">
                        <option>فقدان الوزن</option>
                        <option>الحفاظ على الوزن</option>
                        <option>بناء العضلات</option>
                        <option>نظام صحي متوازن</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما هو أسلوبك الغذائي؟</label>
                    <select name="dietType" value={formState.dietType} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-600">
                        <option>متوازن</option>
                        <option>نباتي</option>
                        <option>منخفض الكربوهيدرات</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">هل لديك حساسية أو أطعمة لا تفضلها؟</label>
                    <input name="allergies" value={formState.allergies} onChange={handleFormChange} placeholder="مثال: حساسية من المكسرات، لا أحب الأفوكادو" className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-600"/>
                </div>
            </div>
            <button onClick={generatePlan} className="w-full mt-6 p-3 bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-600 transition active:scale-95">
                <Sparkles size={20} />
                أنشئ الخطة بالذكاء الاصطناعي
            </button>
        </div>
    );
    
    const renderDetailView = () => (
      <div>
        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mb-4">
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{selectedPlan?.planTitle}</h2>
                <TTSButton textToRead={getPlanAsText()} />
            </div>
        </div>
        <div className="space-y-3">
        {selectedPlan?.dailyPlan.map((day, index) => (
            <div key={index} className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-300">{day.day}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">إجمالي السعرات: ~{day.dailyTotalCalories} سعرة</p>
                <div className="space-y-2">
                    {day.meals.map((meal, mealIndex) => (
                        <div key={mealIndex} className="pl-3 border-l-2 dark:border-gray-700">
                            <h4 className="font-semibold">{meal.meal} <span className="text-xs font-normal text-gray-400">(~{meal.calories} سعرة)</span></h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{meal.description}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-2 border-t dark:border-gray-800 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-black p-2 rounded-md">
                    <strong>نصيحة اليوم:</strong> {day.dailyTip}
                </div>
            </div>
        ))}
        </div>
      </div>
    );

    const renderListView = () => (
         <div>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">سجل خططك الغذائية</h2>
                 <button onClick={() => setView('form')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition">
                    <PlusCircle size={18} /> إنشاء خطة جديدة
                </button>
            </div>
            {history.length > 0 ? (
                <div className="space-y-3">
                    {history.map(item => (
                        <div key={item.id} onClick={() => { setSelectedPlan(item.data); setView('detail');}} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                            <p className="font-bold text-gray-800 dark:text-gray-200">{item.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(item.timestamp).toLocaleString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-8 px-4 bg-white dark:bg-black rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <ArchiveX size={40} className="mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                    <p>لا توجد خطط محفوظة بعد.</p>
                </div>
            )}
        </div>
    );
    
    const renderContent = () => {
        if (isLoading) {
             return (
                 <div className="text-center p-8 bg-white dark:bg-black rounded-lg shadow-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">...خبير التغذية يعد خطتك بعناية</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
                    <h3 className="font-bold mb-2">حدث خطأ</h3>
                    <p>{error}</p>
                    <button onClick={() => { setError(null); setView(history.length > 0 ? 'list' : 'form'); }} className="mt-2 text-sm text-red-700 dark:text-red-300 underline">حاول مرة أخرى</button>
                </div>
            );
        }
        
        switch(view) {
            case 'form': return renderForm();
            case 'detail': return renderDetailView();
            case 'list':
            default: return renderListView();
        }
    };


    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader onBack={handleBack} navigateTo={navigateTo} title="خطط غذائية" Icon={UtensilsCrossed} color="indigo" backPage={{ type: 'smartHealth', pageType: 'beauty' }}/>
            <main className="p-4">
                {renderContent()}
            </main>
        </div>
    );
};

export default DietPlanPage;
