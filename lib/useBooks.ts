import { useState, useEffect } from 'react';
import { books as initialBooks, Book } from './books';

const STORAGE_KEY = 'korean-lib-books';

export function useBooks() {
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setBooks(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse books from local storage', e);
                setBooks(initialBooks);
            }
        } else {
            setBooks(initialBooks);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever books change
    const saveBooks = (newBooks: Book[]) => {
        setBooks(newBooks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBooks));
    };

    return { books, saveBooks, isLoaded };
}
