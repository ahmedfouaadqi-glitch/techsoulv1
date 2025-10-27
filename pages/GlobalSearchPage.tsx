import React, { useState, useMemo, useEffect } from 'react';
import { NavigationProps, GroundingChunk, AppHistoryItem } from '../types';
import { callGeminiSearchApi } from '../services/geminiService';
import { getHistory, addHistoryItem } from '../services/historyService';
import PageHeader from '../components/PageHeader';
import { FEATURES, SEARCH_SUGGESTIONS } from '../constants';
import { Search, Sparkles, Link, BrainCircuit, Lightbulb, Map, Clock, ArchiveX } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useFeatureUsage } from '../hooks/useFeatureUsage';
import toast from 'react-hot-toast';


const feature = { title: "بحث الروح", Icon: Search, color: "indigo" };

const GlobalSearchPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useMaps, setUseMaps] = useState(false);
    const [searchHistory, setSearchHistory] = useState<AppHistoryItem[]>([]);
    const { getUsageSortedFeatures } = useFeatureUsage();
    
    useEffect(() => {
        setSearchHistory(getHistory('globalSearch'));
    }, []);

    const suggestions = useMemo(() => {
        const sortedFeatures = getUsageSortedFeatures(FEATURES);
        
        const topFeatureSuggestions = sortedFeatures
            .filter(f => SEARCH_SUGGESTIONS[f.pageType]) 
            .map(f => SEARCH_SUGGESTIONS[f.pageType]!) 
            .flat();

        const allSuggestions = [
            ...topFeatureSuggestions,
            ...(SEARCH_SUGGESTIONS.globalSearch || [])
        ];

        const uniqueSuggestions = [...new Set(allSuggestions)];
        const shuffled = uniqueSuggestions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }, [getUsageSortedFeatures]);

    const handleBack = () => {
        if (result || error) {
            setResult('');
            setError(null);
            setGroundingChunks([]);
            setInput('');
        } else {
            navigateTo({ type: 'home' });
        }
    };

    const handleSubmit = async (query?: string) => {
        const searchQuery = query || input;
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setResult('');
        setError(null);
        setGroundingChunks([]);

        let location: { latitude: number; longitude: number; } | undefined = undefined;

        if (useMaps) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
            } catch (geoError) {
                toast.error("فشل الوصول للموقع. سيتم البحث بدون معلومات الموقع.");
            }
        }

        try {
            const { text, groundingChunks } = await callGeminiSearchApi(searchQuery, useMaps, location);
            setResult(text);
            setGroundingChunks(groundingChunks);

            const newItem = addHistoryItem({
                type: 'globalSearch',
                title: searchQuery,
                data: { query: searchQuery, result: text, groundingChunks, useMaps }
            });
            setSearchHistory(prev => [newItem, ...prev]);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleHistoryClick = (item: AppHistoryItem) => {
        setInput(item.title);
        setResult(item.data.result);
        setGroundingChunks(item.data.groundingChunks);
        setUseMaps(item.data.useMaps);
        window.scrollTo(0, 0); // Scroll to top to see the result
    };
    
    const renderGroundingChunks = () => (
        <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-500/50">
            <h4 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><Link size={14}/> المصادر:</h4>
            <ul className="space-y-1">
                {groundingChunks.map((chunk, index) => {
                    if (chunk.web && chunk.web.uri) {
                        return (
                            <li key={`web-${index}`}>
                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
                                    {chunk.web.title || chunk.web.uri}
                                </a>
                            </li>
                        );
                    }
                    if (chunk.maps && chunk.maps.uri) {
                         return (
                            <li key={`map-${index}`}>
                                <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
                                    <Map size={12} className="inline-block mr-1"/> {chunk.maps.title || 'عرض الموقع'}
                                </a>
                            </li>
                        );
                    }
                    return null;
                })}
            </ul>
        </div>
    );

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader onBack={handleBack} navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                {!result && !isLoading && !error ? (
                <>
                <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="ابحث عن أي شيء..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            onClick={() => handleSubmit()}
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-gray-400"
                        >
                            <Search size={24} />
                        </button>
                    </div>
                     <div className="mt-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            <input type="checkbox" checked={useMaps} onChange={() => setUseMaps(!useMaps)} className="rounded text-indigo-500 focus:ring-indigo-500" />
                            البحث المكاني (قد يطلب إذن الموقع)
                        </label>
                    </div>
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1"><Lightbulb size={16}/> اقتراحات لك:</h4>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(s); handleSubmit(s); }}
                                    className="px-3 py-1 bg-indigo-50 dark:bg-black text-indigo-700 dark:text-indigo-300 rounded-full text-sm border border-indigo-200 dark:border-indigo-500/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">سجل البحث</h2>
                    {searchHistory.length > 0 ? (
                        <div className="space-y-3">
                            {searchHistory.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleHistoryClick(item)}
                                    className="bg-white dark:bg-black p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                >
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{item.title}</p>
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
                            <h3 className="font-semibold text-gray-600 dark:text-gray-300">لا يوجد عمليات بحث سابقة</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                عمليات البحث التي تقوم بها ستظهر هنا.
                            </p>
                        </div>
                    )}
                </div>
                </>
                ) : null}


                {isLoading && (
                    <div className="text-center p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">...الروح التقنية تبحث لك الآن</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold mb-2">حدث خطأ</h3>
                        <p>{error}</p>
                    </div>
                )}
                {result && (
                    <div className="bg-indigo-50 dark:bg-black p-4 rounded-lg shadow-md border border-indigo-200 dark:border-indigo-500/50 text-gray-800 dark:text-gray-200">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <BrainCircuit size={20} />
                            إجابة الروح التقنية
                        </h3>
                        <MarkdownRenderer content={result} />
                        {groundingChunks.length > 0 && renderGroundingChunks()}
                    </div>
                )}
            </main>
        </div>
    );
};

export default GlobalSearchPage;
