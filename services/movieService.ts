import { FavoriteMovie } from '../types';
import { getItem, setItem } from './storageService';

const MOVIES_KEY = 'favoriteMovies';

export const getFavoriteMovies = (): FavoriteMovie[] => {
    return getItem<FavoriteMovie[]>(MOVIES_KEY, []);
};

export const addFavoriteMovie = (movieData: Omit<FavoriteMovie, 'id' | 'addedDate'>): FavoriteMovie => {
    const movies = getFavoriteMovies();
    // Prevent duplicates by title
    if (movies.some(movie => movie.title.trim().toLowerCase() === movieData.title.trim().toLowerCase())) {
        return movies.find(movie => movie.title.trim().toLowerCase() === movieData.title.trim().toLowerCase())!;
    }

    const newMovie: FavoriteMovie = {
        ...movieData,
        id: `movie-${Date.now()}`,
        addedDate: Date.now()
    };
    const updatedMovies = [newMovie, ...movies];
    setItem(MOVIES_KEY, updatedMovies);
    return newMovie;
};

export const deleteFavoriteMovie = (movieId: string): FavoriteMovie[] => {
    let movies = getFavoriteMovies();
    const updatedMovies = movies.filter(movie => movie.id !== movieId);
    setItem(MOVIES_KEY, updatedMovies);
    return updatedMovies;
};
