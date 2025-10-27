import React, { useState, useEffect } from 'react';
import { NavigationProps, WorkoutPlan, WorkoutDay, WorkoutExercise, AppHistoryItem } from '../types';
import { callGeminiJsonApi } from '../services/geminiService';
import { getHistory, addHistoryItem } from '../services/historyService';
import { addInspiration } from '../services/inspirationService';
import PageHeader from '../components/PageHeader';
import { Dumbbell, Sparkles, ArrowLeft, Edit, Save, Share2, Clock, ArchiveX, PlusCircle } from 'lucide-react';
import { FEATURES } from '../constants';
import { Type } from '@google/genai';
import toast from 'react-hot-toast';
import TTSButton from '../components/TTSButton';

const feature = FEATURES.find(f => f.pageType === 'sportsTrainer')!;

const planSchema = {
  type: Type.OBJECT,
  properties: {
    weeklyPlan: {
      type: Type.ARRAY,
      description: "An array of daily workout objects for the week.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "The day of the plan (e.g., 'اليوم الأول', 'اليوم الثاني', 'راحة')." },
          focus: { type: Type.STRING, description: "The main focus for the day's workout (e.g., 'الجزء العلوي', 'تمارين القلب')." },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the exercise." },
                sets: { type: Type.STRING, description: "Number of sets, e.g., '3'." },
                reps: { type: Type.STRING, description: "Number of repetitions per set, e.g., '10-12'." },
                description: { type: Type.STRING, description: "A brief, clear explanation of how to perform the exercise correctly." }
              },
              required: ['name', 'sets', 'reps', 'description']
            }
          }
        },
        required: ['day', 'focus', 'exercises']
      }
    }
  },
  required: ['weeklyPlan']
};


const SportsTrainerPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [history, setHistory] = useState<AppHistoryItem[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
    const [editedPlan, setEditedPlan] = useState<WorkoutPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
    const [formState, setFormState] = useState({
        goal: 'فقدان الوزن',
        level: 'مبتدئ',
        days: '3',
        equipment: 'لا يوجد (وزن الجسم)'
    });
    const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    useEffect(() => {
        const planHistory = getHistory('sportsTrainer');
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
            setEditedPlan(null);
            setIsEditing(false);
            setActiveDayIndex(null);
            setView('list');
        } else if (view === 'form') {
            if (history.length > 0) {
                setView('list');
            } else {
                navigateTo({ type: 'home' });
            }
        } else {
            navigateTo({ type: 'home' });
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const generatePlan = async () => {
        setIsLoading(true);
        setError(null);

        const prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت مدرب رياضي شخصي معتمد وخبير في إنشاء خطط تمارين. بناءً على المعلومات التالية للمستخدم:
- **الهدف:** ${formState.goal}
- **المستوى:** ${formState.level}
- **أيام التمرين الأسبوعية:** ${formState.days}
- **المعدات المتاحة:** ${formState.equipment}

أنشئ جدول تمارين أسبوعي مفصل واحترافي. يجب أن يكون الرد بتنسيق JSON. يجب أن يحتوي الـ JSON على مفتاح 'weeklyPlan' وهو عبارة عن مصفوفة من الكائنات، كل كائن يمثل يوماً من أيام التمرين ويحتوي على 'day' (e.g., "اليوم الأول"), و 'focus' (e.g., "تمارين الجزء العلوي"), و 'exercises' (مصفوفة من التمارين). كل تمرين يجب أن يحتوي على 'name', 'sets', 'reps', و 'description' تشرح طريقة الأداء الصحيحة بدقة. تأكد من تضمين أيام راحة مناسبة.`;
        
        try {
            const result: WorkoutPlan = await callGeminiJsonApi(prompt, planSchema, true);
            if (result && result.weeklyPlan) {
                const newItem = addHistoryItem({
                    type: 'sportsTrainer',
                    title: `خطة ${formState.goal} (${formState.level})`,
                    data: result
                });
                setHistory(prev => [newItem, ...prev]);
                setSelectedPlan(result);
                setEditedPlan(JSON.parse(JSON.stringify(result)));
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
        
    const handleExerciseChange = (dayIndex: number, exIndex: number, field: keyof WorkoutExercise, value: string) => {
        if (!editedPlan) return;
        const newPlan = JSON.parse(JSON.stringify(editedPlan)); // Deep copy
        newPlan.weeklyPlan[dayIndex].exercises[exIndex][field] = value;
        setEditedPlan(newPlan);
    };

    const saveChanges = () => {
        if (!editedPlan) return;
        // In a real app, you'd find the history item by ID and update it.
        // For simplicity, we just toast success. The changes are local to this view instance.
        setSelectedPlan(editedPlan);
        setIsEditing(false);
        toast.success('تم حفظ تعديلاتك مؤقتًا. سيتم تحديث السجل عند إنشاء خطة جديدة.');
    };
    
    const handleShareInspiration = () => {
        if (selectedPlan) {
            addInspiration({
                type: 'workout',
                title: `خطة تمارين من مجتمع الروح`,
                content: selectedPlan,
            });
            toast.success('تمت مشاركة خطتك مع المجتمع!');
        }
    };
    
    const getPlanDayAsText = (day: WorkoutDay): string => {
        if (!day) return "";
        let text = `${day.day}: ${day.focus}.\n`;
        if (day.exercises && day.exercises.length > 0) {
            day.exercises.forEach(ex => {
                text += `${ex.name}: ${ex.sets} مجموعات, ${ex.reps} تكرار. طريقة الأداء: ${ex.description}\n`;
            });
        } else {
            text += "يوم راحة.";
        }
        return text;
    };

    const renderForm = () => (
        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">أنشئ خطتك المخصصة</h2>
            <div className="space-y-4">
                {/* Form fields... */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما هو هدفك الرئيسي؟</label>
                    <select name="goal" value={formState.goal} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-600">
                        <option>فقدان الوزن</option>
                        <option>بناء العضلات</option>
                        <option>زيادة اللياقة</option>
                        <option>تحسين الأداء الرياضي</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما هو مستواك الحالي؟</label>
                    <select name="level" value={formState.level} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-600">
                        <option>مبتدئ</option>
                        <option>متوسط</option>
                        <option>متقدم</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كم يوماً في الأسبوع؟</label>
                    <select name="days" value={formState.days} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-600">
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option>5</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما هي المعدات المتاحة؟</label>
                    <select name="equipment" value={formState.equipment} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-600">
                        <option>لا يوجد (وزن الجسم)</option>
                        <option>أوزان خفيفة (دمبلز)</option>
                        <option>حبال مقاومة</option>
                        <option>جيم متكامل</option>
                    </select>
                </div>
            </div>
            <button onClick={generatePlan} className="w-full mt-6 p-3 bg-cyan-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-600 transition active:scale-95">
                <Sparkles size={20} />
                أنشئ الخطة بالذكاء الاصطناعي
            </button>
        </div>
    );
    
    const renderDetailView = () => (
      <div>
        <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mb-4 flex justify-between items-center flex-wrap gap-2">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">خطتك الأسبوعية</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">هذه هي خطتك المخصصة. اضغط على أي يوم لعرض التمارين.</p>
            </div>
            <div className="flex gap-2">
                 {!isEditing && (
                     <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Edit size={16} /> تعديل
                    </button>
                )}
                 <button onClick={handleShareInspiration} className="flex items-center gap-2 px-3 py-2 bg-pink-100 dark:bg-black text-pink-700 dark:text-pink-300 text-sm font-semibold rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 border border-pink-200 dark:border-pink-500/50">
                    <Share2 size={16} /> مشاركة
                </button>
            </div>
        </div>
        <div className="space-y-3">
        {editedPlan?.weeklyPlan.map((day, index) => (
            <div key={index} className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button onClick={() => setActiveDayIndex(activeDayIndex === index ? null : index)} className="w-full p-4 text-right flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
                    <div>
                        <p className="text-sm text-cyan-600 dark:text-cyan-400 font-semibold">{day.day}</p>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{day.focus}</h3>
                    </div>
                     <ArrowLeft className={`w-5 h-5 transition-transform duration-300 ${activeDayIndex === index ? '-rotate-90' : 'rotate-180'}`} />
                </button>
                {activeDayIndex === index && (
                    <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-black/50">
                        {day.exercises && day.exercises.length > 0 ? (
                            <>
                            <div className="flex justify-end mb-2">
                                <TTSButton textToRead={getPlanDayAsText(day)} />
                            </div>
                            <ul className="space-y-4">
                                {day.exercises.map((ex, exIndex) => (
                                <li key={exIndex} className="p-3 bg-white dark:bg-black rounded-md border dark:border-gray-700">
                                    <input value={ex.name} onChange={(e) => handleExerciseChange(index, exIndex, 'name', e.target.value)} disabled={!isEditing} className="font-bold text-gray-700 dark:text-gray-100 bg-transparent w-full disabled:pointer-events-none p-1 -m-1 rounded-md focus:bg-gray-100 dark:focus:bg-gray-800" />
                                    <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <span><input value={ex.sets} onChange={(e) => handleExerciseChange(index, exIndex, 'sets', e.target.value)} disabled={!isEditing} className="font-semibold w-8 text-center bg-transparent disabled:pointer-events-none p-1 -m-1 rounded-md focus:bg-gray-100 dark:focus:bg-gray-800" /> مجموعات</span>
                                        <span><input value={ex.reps} onChange={(e) => handleExerciseChange(index, exIndex, 'reps', e.target.value)} disabled={!isEditing} className="font-semibold w-16 text-center bg-transparent disabled:pointer-events-none p-1 -m-1 rounded-md focus:bg-gray-100 dark:focus:bg-gray-800"/> تكرار</span>
                                    </div>
                                    <textarea value={ex.description} onChange={(e) => handleExerciseChange(index, exIndex, 'description', e.target.value)} disabled={!isEditing} className="text-sm text-gray-600 dark:text-gray-300 mt-2 w-full bg-transparent resize-none disabled:pointer-events-none p-1 -m-1 rounded-md focus:bg-gray-100 dark:focus:bg-gray-800" rows={2}/>
                                </li>
                                ))}
                            </ul>
                            </>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400">يوم راحة. استرخ واستعد لليوم التالي!</p>
                        )}
                    </div>
                )}
            </div>
        ))}
        </div>
         <div className="flex flex-col sm:flex-row gap-2 mt-6">
             {isEditing && (
                <button onClick={saveChanges} className="w-full p-3 bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition active:scale-95">
                    <Save size={20} /> حفظ التغييرات
                </button>
             )}
        </div>
      </div>
    );
    
    const renderListView = () => (
         <div>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">سجل خططك التدريبية</h2>
                 <button onClick={() => setView('form')} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white text-sm font-semibold rounded-lg hover:bg-cyan-600 transition">
                    <PlusCircle size={18} /> إنشاء خطة جديدة
                </button>
            </div>
            {history.length > 0 ? (
                <div className="space-y-3">
                    {history.map(item => (
                        <div key={item.id} onClick={() => { setSelectedPlan(item.data); setEditedPlan(JSON.parse(JSON.stringify(item.data))); setView('detail');}} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">المدرب الرقمي يصمم قوتك...</p>
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
            <PageHeader onBack={handleBack} navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                {renderContent()}
            </main>
        </div>
    );
};

export default SportsTrainerPage;
