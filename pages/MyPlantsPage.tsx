import React, { useState, useEffect, useCallback } from 'react';
import { NavigationProps, UserPlant, PlantJournalEntry } from '../types';
import { getPlants, addPlant, deletePlant, updatePlant } from '../services/plantService';
import { callGeminiApi } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { Sprout, Trash2, Camera, PlusCircle, Leaf, ArchiveX, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import MediaInput from '../components/MediaInput';
import toast from 'react-hot-toast';


const PlantCard: React.FC<{ plant: UserPlant; onClick: () => void }> = ({ plant, onClick }) => {
    return (
        <div onClick={onClick} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.03] hover:shadow-md">
            <img src={plant.image} alt={plant.name} className="w-full h-40 object-cover" />
            <div className="p-3">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{plant.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    تمت الإضافة: {new Date(plant.addedDate).toLocaleDateString('ar-EG')}
                </p>
            </div>
        </div>
    );
};

const PlantDetailView: React.FC<{ plant: UserPlant; onBack: () => void; onUpdate: (updatedPlant: UserPlant) => void; onDelete: (id: string) => void; }> = ({ plant, onBack, onUpdate, onDelete }) => {
    const [newJournalNote, setNewJournalNote] = useState('');
    const [newJournalPhoto, setNewJournalPhoto] = useState<string | null>(null);

    const handleAddJournalEntry = () => {
        if (!newJournalPhoto) {
            toast.error('الرجاء إضافة صورة للإدخال.');
            return;
        }
        
        const newEntry: PlantJournalEntry = {
            id: `journal-${Date.now()}`,
            timestamp: Date.now(),
            photo: newJournalPhoto,
            note: newJournalNote.trim() || 'ملاحظة نمو جديدة.',
        };

        const updatedPlant: UserPlant = {
            ...plant,
            journal: [newEntry, ...(plant.journal || [])],
        };
        
        onUpdate(updatedPlant);
        setNewJournalNote('');
        setNewJournalPhoto(null);
        toast.success('تمت إضافة الإدخال إلى السجل!');
    };

    return (
        <div className="animate-fade-in">
             <div className="mb-4">
                 <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-500 font-semibold">
                    <ArrowRight size={18} />
                    العودة إلى كل النباتات
                </button>
             </div>
             <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden mb-4">
                <img src={plant.image} alt={plant.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-200">{plant.name}</h2>
                             <p className="text-xs text-gray-500 dark:text-gray-400">
                                تمت الإضافة: {new Date(plant.addedDate).toLocaleDateString('ar-EG')}
                            </p>
                        </div>
                         <button onClick={() => onDelete(plant.id)} className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-gray-800 transition">
                            <Trash2 size={20} />
                        </button>
                    </div>
                     {plant.careSchedule && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md text-sm text-gray-600 dark:text-gray-300 border dark:border-gray-800">
                            <h4 className="font-semibold mb-1 text-gray-700 dark:text-gray-200">جدول العناية</h4>
                            <p>💧 **الري:** {plant.careSchedule.watering}</p>
                            <p>🌱 **التسميد:** {plant.careSchedule.fertilizing}</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-4">
                <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><BookOpen size={20} className="text-indigo-500"/> سجل النمو</h3>
                 <div className="space-y-3 mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border dark:border-gray-800">
                     <h4 className="font-semibold text-gray-700 dark:text-gray-200">إضافة إدخال جديد</h4>
                    <MediaInput image={newJournalPhoto} onImageChange={setNewJournalPhoto} onClearImage={() => setNewJournalPhoto(null)} promptText="أضف صورة جديدة للتوثيق" />
                    <textarea value={newJournalNote} onChange={(e) => setNewJournalNote(e.target.value)} placeholder="أضف ملاحظة (اختياري)..." rows={2} className="w-full mt-2 p-2 border rounded-md bg-white dark:bg-black dark:border-gray-700"></textarea>
                    <button onClick={handleAddJournalEntry} disabled={!newJournalPhoto} className="w-full p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:bg-gray-400">
                        إضافة إلى السجل
                    </button>
                </div>

                <div className="space-y-4">
                    {(plant.journal || []).length > 0 ? (plant.journal || []).map(entry => (
                        <div key={entry.id} className="flex items-start gap-3 p-3 border-b dark:border-gray-800 last:border-b-0">
                            <img src={entry.photo} alt="Journal entry" className="w-20 h-20 rounded-md object-cover"/>
                            <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-200">{entry.note}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1"><Clock size={12} /> {new Date(entry.timestamp).toLocaleString('ar-EG')}</p>
                            </div>
                        </div>
                    )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">لا توجد إدخالات في السجل بعد. أضف أول صورة لتوثيق نمو نبتتك!</p>}
                </div>
            </div>
        </div>
    );
};

const MyPlantsPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [plants, setPlants] = useState<UserPlant[]>([]);
    const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { analysisData, setAnalysisData } = useAnalysis();

    const fetchPlants = useCallback(() => {
        setPlants(getPlants());
    }, []);

    useEffect(() => {
        fetchPlants();
    }, [fetchPlants]);

    const handleAddNewPlant = useCallback(async (plantName: string, plantImage: string) => {
        setIsLoading(true);
        try {
            const prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط.** بصفتك خبير نباتات، قدم جدول عناية بسيط وموجز لنبتة "${plantName}". اذكر فقط:
1.  **الري:** (مثال: مرة كل أسبوع)
2.  **التسميد:** (مثال: مرة كل شهر في الربيع والصيف)`;

            const careInfo = await callGeminiApi(prompt);
            
            let watering = "حسب الحاجة";
            let fertilizing = "حسب التوصيات";

            const wateringMatch = careInfo.match(/الري:\s*(.*)/);
            if (wateringMatch) watering = wateringMatch[1];
            
            const fertilizingMatch = careInfo.match(/التسميد:\s*(.*)/);
            if (fertilizingMatch) fertilizing = fertilizingMatch[1];

            addPlant({
                name: plantName,
                image: plantImage,
                addedDate: Date.now(),
                careSchedule: { watering, fertilizing },
            });
            fetchPlants();
        } catch (error) {
            console.error("Failed to get care schedule:", error);
            // Add plant without schedule if API fails
            addPlant({
                name: plantName,
                image: plantImage,
                addedDate: Date.now(),
            });
            fetchPlants();
        } finally {
            setIsLoading(false);
            setAnalysisData(null); // Clear context after use
        }
    }, [fetchPlants, setAnalysisData]);
    
    useEffect(() => {
        if (analysisData && analysisData.analysisType === 'plant_id' && analysisData.analysisDetails && analysisData.image) {
            handleAddNewPlant(analysisData.analysisDetails, analysisData.image);
        }
    }, [analysisData, handleAddNewPlant]);


    const handleDeletePlant = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه النبتة من مجموعتك؟')) {
            deletePlant(id);
            fetchPlants();
            setSelectedPlant(null); // Go back to list view if deleting the selected plant
        }
    };
    
    const handleUpdatePlant = (updatedPlant: UserPlant) => {
        const newPlants = updatePlant(updatedPlant.id, updatedPlant);
        setPlants(newPlants);
        setSelectedPlant(updatedPlant); // Keep the detail view open with updated data
    };

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title="مجموعتي النباتية" Icon={Leaf} color="indigo" backPage={{type: 'smartHealth', pageType: 'decorations'}}/>
            <main className="p-4">
                {selectedPlant ? (
                    <PlantDetailView 
                        plant={selectedPlant} 
                        onBack={() => setSelectedPlant(null)} 
                        onUpdate={handleUpdatePlant}
                        onDelete={handleDeletePlant}
                    />
                ) : (
                <>
                    <div className="mb-6 bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2"><PlusCircle size={20} className="text-indigo-500" /> إضافة نبتة جديدة</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">استخدم "عين الروح" للتعرف على نبتتك وإضافتها لمجموعتك للحصول على جدول عناية مخصص.</p>
                        <button onClick={() => navigateTo({ type: 'imageAnalysis' })} className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                        <Camera size={20} /> الذهاب إلى عين الروح
                        </button>
                    </div>

                    {isLoading && (
                        <div className="text-center p-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
                            <p className="mt-3 text-gray-600 dark:text-gray-300">...جاري إضافة النبتة وإنشاء جدول العناية</p>
                        </div>
                    )}

                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-xl">نباتاتك الحالية</h3>
                        {plants.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plants.map(plant => <PlantCard key={plant.id} plant={plant} onClick={() => setSelectedPlant(plant)} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-12 bg-white dark:bg-black rounded-lg border-2 border-dashed dark:border-gray-800">
                                <ArchiveX size={48} className="mb-4 text-gray-400 dark:text-gray-600" />
                                <h3 className="font-bold text-lg text-gray-600 dark:text-gray-200">مجموعتك فارغة</h3>
                                <p className="text-sm mt-1">ابدأ بإضافة نبتتك الأولى باستخدام عين الروح.</p>
                            </div>
                        )}
                    </div>
                </>
                )}
            </main>
        </div>
    );
};

export default MyPlantsPage;