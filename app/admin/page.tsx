'use client';

import { useState, useEffect } from 'react';
import { Book } from '@/lib/books';
import { useBooks } from '@/lib/useBooks';
import { Save, Plus, Trash2, Link as LinkIcon, Loader2, Youtube } from 'lucide-react';

export default function AdminPage() {
    const { books, saveBooks, isLoaded } = useBooks();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Book>>({});

    const handleEdit = (book: Book) => {
        setEditingId(book.id);
        setEditForm(book);
    };

    const handleSave = () => {
        if (!editingId) return;

        const newBooks = books.map(book =>
            book.id === editingId ? { ...book, ...editForm } as Book : book
        );
        saveBooks(newBooks);

        setEditingId(null);
        setEditForm({});
        alert('저장되었습니다.');
    };

    const handleDelete = (id: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            const newBooks = books.filter(book => book.id !== id);
            saveBooks(newBooks);
        }
    };

    const handleAddNew = () => {
        const ids = books.map(b => parseInt(b.id)).filter(id => !isNaN(id));
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        const newId = (maxId + 1).toString();

        const newBook: Book = {
            id: newId,
            title: '새 도서',
            author: '',
            summary: '',
            content: ['내용을 입력하세요.'],
            googleDocUrl: ''
        };
        saveBooks([...books, newBook]);
        handleEdit(newBook);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        도서 추가
                    </button>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-medium text-gray-500 w-16">ID</th>
                                <th className="p-4 font-medium text-gray-500">제목 / 작가</th>
                                <th className="p-4 font-medium text-gray-500">Google Doc URL</th>
                                <th className="p-4 font-medium text-gray-500 w-32">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {books.map(book => (
                                <tr key={book.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 text-gray-500">{book.id}</td>
                                    <td className="p-4">
                                        {editingId === book.id ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editForm.title || ''}
                                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="제목"
                                                />
                                                <input
                                                    type="text"
                                                    value={editForm.author || ''}
                                                    onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                    placeholder="작가"
                                                />
                                                <textarea
                                                    value={editForm.summary || ''}
                                                    onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="요약"
                                                    rows={2}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-medium text-gray-900">{book.title}</div>
                                                <div className="text-sm text-gray-500">{book.author}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingId === book.id ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={editForm.googleDocUrl || ''}
                                                        onChange={e => setEditForm({ ...editForm, googleDocUrl: e.target.value })}
                                                        className="w-full p-2 border rounded font-mono text-sm"
                                                        placeholder="Google Doc URL"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Youtube className="w-4 h-4 text-red-500" />
                                                    <input
                                                        type="text"
                                                        value={editForm.videoUrl || ''}
                                                        onChange={e => setEditForm({ ...editForm, videoUrl: e.target.value })}
                                                        className="w-full p-2 border rounded font-mono text-sm"
                                                        placeholder="YouTube URL"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    {book.googleDocUrl ? (
                                                        <>
                                                            <LinkIcon className="w-4 h-4 text-blue-500" />
                                                            <span className="font-mono truncate max-w-[200px]">{book.googleDocUrl}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">Google Doc 미설정</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    {book.videoUrl ? (
                                                        <>
                                                            <Youtube className="w-4 h-4 text-red-500" />
                                                            <span className="font-mono truncate max-w-[200px]">{book.videoUrl}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">YouTube 미설정</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingId === book.id ? (
                                            <button
                                                onClick={handleSave}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                            >
                                                <Save className="w-3 h-3" />
                                                저장
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(book)}
                                                    className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(book.id)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
