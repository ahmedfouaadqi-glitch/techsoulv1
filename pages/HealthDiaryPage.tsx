import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavigationProps, DiaryEntry, QuickAddAction } from '../types';
import { getDiaryEntries, deleteDiaryEntry, addDiaryEntry } from '../services/diaryService';
import { getQuickAddActions, saveQuickAddActions, performQuickAdd } from '../services/quickAddService';
import { analyzeDiaryEntries } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { FEATURES } from '../constants';
import { NotebookText, Trash2, Calendar, ChevronLeft, ChevronRight, ArchiveX, Plus, Settings, X, Save, BrainCircuit, Sparkles } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { playSound } from '../services/soundService';

const DiaryEntryCard: React.FC<{ entry: DiaryEntry, onDelete: (id: string) => void }> = ({ entry, onDelete }) => (
    <div className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex items-start gap-4 animate-fade-in">
        <div className="text-3xl mt-1">{entry.icon}</div>
        <div className="flex-1">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{entry.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-gray-800 transition">
                    <Trash2 size={16} />
                </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{entry.details}</p>
        </div>
        <style>{`
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(5px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        `}</style>
    </div>
);

const HealthDiaryPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [isNoteInputVisible, setIsNoteInputVisible] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [quickAddActions, setQuickAddActions] = useState<QuickAddAction[]>([]);
    const [isManagingQuickAdd, setIsManagingQuickAdd] = useState(false);
    const [weeklyAnalysis, setWeeklyAnalysis] = useState<{ result: string, error: string | null }>({ result: '', error: null });
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    const refreshEntries = useCallback(() => {
        const dateWithoutTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setEntries(getDiaryEntries(dateWithoutTime));
    }, [selectedDate]);

    useEffect(() => {
        refreshEntries();
    }, [selectedDate, refreshEntries]);
    
    useEffect(() => {
        setQuickAddActions(getQuickAddActions());
    }, []);

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الإدخال؟')) {
            const dateWithoutTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            deleteDiaryEntry(dateWithoutTime, id);
            playSound('tap');
            refreshEntries();
        }
    };
    
    const handleAnalyzeWeek = async () => {
        setIsAnalysisLoading(true);
        setWeeklyAnalysis({ result: '', error: null });
        playSound('tap');
        try {
            const result = await analyzeDiaryEntries();
            setWeeklyAnalysis({ result, error: null });
            playSound('notification');
        } catch(e) {
            setWeeklyAnalysis({ result: '', error: e instanceof Error ? e.message : 'فشل تحليل البيانات' });
            playSound('error');
        } finally {
            setIsAnalysisLoading(false);
        }
    };

    const handleSaveNote = () => {
        if (noteText.trim()) {
            addDiaryEntry(selectedDate, { type: 'note', icon: '📝', title: 'ملاحظة', details: noteText.trim() });
            playSound('success');
            setNoteText('');
            setIsNoteInputVisible(false);
            refreshEntries();
        }
    };
    
    const handleQuickAdd = (action: QuickAddAction) => {
        performQuickAdd(action, selectedDate);
        playSound('success');
        refreshEntries();
    };
    
    const handleManageQuickAdd = () => {
        playSound('tap');
        setIsManagingQuickAdd(true);
    };

    const changeDate = (amount: number) => {
        playSound('tap');
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + amount);
            return newDate;
        });
    };
    
    const formattedDate = useMemo(() => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (selectedDate.toDateString() === today.toDateString()) return 'اليوم';
        if (selectedDate.toDateString() === yesterday.toDateString()) return 'الأمس';

        return new Intl.DateTimeFormat('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate);
    }, [selectedDate]);


    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title="سجل الروح" Icon={NotebookText} color="indigo" />
            <main className="p-4">
                 <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">إضافة سريعة</h3>
                        <button onClick={handleManageQuickAdd} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-900 transition"><Settings size={18}/></button>
                    </div>
                     <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {quickAddActions.map(action => (
                            <button key={action.id} onClick={() => handleQuickAdd(action)} className="flex flex-col items-center p-2 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition text-center active:scale-90">
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">{action.label}</span>
                            </button>
                        ))}
                        <button onClick={() => setIsNoteInputVisible(true)} className="flex flex-col items-center p-2 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition text-center active:scale-90">
                            <span className="text-2xl">📝</span>
                            <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">إضافة ملاحظة</span>
                        </button>
                     </div>
                     {isNoteInputVisible && (
                        <div className="mt-4">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="اكتب ملاحظتك هنا..."
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-black"
                                rows={3}
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleSaveNote} className="flex-1 p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">حفظ الملاحظة</button>
                                <button onClick={() => setIsNoteInputVisible(false)} className="flex-1 p-2 bg-gray-200 dark:bg-gray-800 rounded-md">إلغاء</button>
                            </div>
                        </div>
                     )}
                </div>
                
                 <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">مستشارك الاستباقي</h3>
                    <button onClick={handleAnalyzeWeek} disabled={isAnalysisLoading} className="w-full p-3 bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-600 transition disabled:bg-indigo-400 active:scale-95">
                        <BrainCircuit size={20} />
                        {isAnalysisLoading ? '...جاري التحليل' : 'تحليل الأسبوع وتقديم النصائح'}
                    </button>
                     {isAnalysisLoading && (
                        <div className="text-center p-4 mt-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-200 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">يقوم الذكاء الاصطناعي بمراجعة بياناتك...</p>
                        </div>
                     )}
                     {weeklyAnalysis.error && <p className="text-red-500 text-sm mt-2">{weeklyAnalysis.error}</p>}
                     {weeklyAnalysis.result && (
                        <div className="mt-4 p-3 bg-indigo-50 dark:bg-black rounded-lg border border-indigo-200 dark:border-indigo-500/50">
                            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2"><Sparkles size={18}/> رؤى أسبوعية</h4>
                            <MarkdownRenderer content={weeklyAnalysis.result} />
                        </div>
                     )}
                </div>


                <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                        <ChevronRight className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="text-center">
                        <h2 className="font-bold text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                           <Calendar size={20} />
                           {formattedDate}
                        </h2>
                    </div>
                    <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                        <ChevronLeft className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {entries.length > 0 ? (
                    <div className="space-y-4">
                        {entries.map(entry => (
                            <DiaryEntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 px-4 bg-white dark:bg-black rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
                         <ArchiveX size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">لا توجد إدخالات لهذا اليوم</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            الإدخالات التي تضيفها ستظهر هنا.
                        </p>
                    </div>
                )}
                 {isManagingQuickAdd && (
                    <ManageQuickAddModal 
                        actions={quickAddActions} 
                        onClose={() => setIsManagingQuickAdd(false)} 
                        onSave={(newActions) => {
                            saveQuickAddActions(newActions);
                            setQuickAddActions(newActions);
                            setIsManagingQuickAdd(false);
                        }}
                    />
                 )}
            </main>
        </div>
    );
};

const ManageQuickAddModal: React.FC<{actions: QuickAddAction[], onClose: () => void, onSave: (actions: QuickAddAction[]) => void}> = ({ actions, onClose, onSave }) => {
    const [currentActions, setCurrentActions] = useState(actions);
    const [newAction, setNewAction] = useState({ icon: '💡', label: '' });

    const handleDelete = (id: string) => {
        setCurrentActions(currentActions.filter(a => a.id !== id));
    };

    const handleAdd = () => {
        if (newAction.label.trim() && newAction.icon.trim()) {
            const newQuickAdd: QuickAddAction = {
                id: `custom-${Date.now()}`,
                icon: newAction.icon,
                label: newAction.label,
                type: 'note',
                title: newAction.label,
                details: `تم تسجيل: ${newAction.label}`
            };
            setCurrentActions([...currentActions, newQuickAdd]);
            setNewAction({ icon: '💡', label: '' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-black rounded-lg p-6 w-full max-w-md shadow-lg border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">إدارة الإضافات السريعة</h3>
                    <button onClick={onClose}><X/></button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                    {currentActions.map(action => (
                        <div key={action.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                           <span>{action.icon} {action.label}</span>
                           <button onClick={() => handleDelete(action.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                 <div className="border-t dark:border-gray-700 pt-4">
                    <h4 className="font-semibold mb-2">إضافة زر جديد</h4>
                    <div className="flex gap-2">
                        <input value={newAction.icon} onChange={e => setNewAction({...newAction, icon: e.target.value})} placeholder="أيقونة" className="w-1/4 p-2 border rounded-md dark:bg-black dark:border-gray-600"/>
                        <input value={newAction.label} onChange={e => setNewAction({...newAction, label: e.target.value})} placeholder="الاسم" className="w-3/4 p-2 border rounded-md dark:bg-black dark:border-gray-600"/>
                    </div>
                     <button onClick={handleAdd} className="w-full mt-2 p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center justify-center gap-2"><Plus size={18}/>إضافة زر</button>
                </div>
                <button onClick={() => onSave(currentActions)} className="w-full mt-4 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center gap-2"><Save size={18}/>حفظ التغييرات</button>
            </div>
        </div>
    );
}

export default HealthDiaryPage;