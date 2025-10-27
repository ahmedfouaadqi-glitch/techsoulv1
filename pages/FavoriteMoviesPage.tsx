import React, { useState, useEffect, useCallback } from 'react';
import { NavigationProps, FavoriteMovie } from '../types';
import { getFavoriteMovies, deleteFavoriteMovie } from '../services/movieService';
import PageHeader from '../components/PageHeader';
import { GAMING_ADVISOR_SUB_FEATURES } from '../constants';
import { Film, Trash2, ArchiveX, ChevronDown } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

const featureData = GAMING_ADVISOR_SUB_FEATURES.subCategories.find(f => f.id === 'movies')!;

const MovieCard: React.FC<{ movie: FavoriteMovie; onDelete: (id: string) => void }> = ({ movie, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{movie.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            أُضيف بتاريخ: {new Date(movie.addedDate).toLocaleDateString('ar-EG')}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                         <button onClick={() => onDelete(movie.id)} className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500 hover:text-indigo-500 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-black/50">
                   <MarkdownRenderer content={movie.details} />
                </div>
            )}
        </div>
    );
};

const FavoriteMoviesPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [movies, setMovies] = useState<FavoriteMovie[]>([]);

    const fetchMovies = useCallback(() => {
        setMovies(getFavoriteMovies());
    }, []);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    const handleDeleteMovie = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الفيلم من مفضلتك؟')) {
            deleteFavoriteMovie(id);
            fetchMovies();
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title="أفلامي المفضلة" Icon={Film} color="indigo" backPage={{type: 'smartHealth', pageType: 'gaming'}}/>
            <main className="p-4">
                 <div className="mb-6 bg-white dark:bg-black p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                    <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">مكتبتك السينمائية</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">هنا تجد جميع الأفلام التي أضفتها إلى مفضلتك. يمكنك العودة إليها في أي وقت.</p>
                </div>

                {movies.length > 0 ? (
                    <div className="space-y-4">
                        {movies.map(movie => <MovieCard key={movie.id} movie={movie} onDelete={handleDeleteMovie} />)}
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-12 bg-white dark:bg-black rounded-lg border-2 border-dashed dark:border-gray-800">
                        <ArchiveX size={48} className="mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="font-bold text-lg text-gray-600 dark:text-gray-200">قائمتك فارغة</h3>
                        <p className="text-sm mt-1">اكتشف أفلاماً جديدة وأضفها إلى هنا!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FavoriteMoviesPage;