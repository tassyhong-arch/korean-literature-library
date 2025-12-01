'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Book } from '@/lib/books';
import { useBooks } from '@/lib/useBooks';
import BookReader from '@/components/BookReader';
import { Search, BookOpen, PlayCircle, Settings, Loader2 } from 'lucide-react';

export default function Home() {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { books, isLoaded } = useBooks();

  const filteredBooks = books.filter(book =>
    book.title.includes(searchTerm) || book.author.includes(searchTerm)
  );

  return (
    <div className="min-h-screen pb-20 bg-[#fdfbf7]">
      {/* Header */}
      <header className="pt-16 pb-8 px-6 text-center border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 relative">
        <Link
          href="/admin"
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
          title="관리자 페이지"
        >
          <Settings className="w-5 h-5" />
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 font-serif">한국문학도서관</h1>
        <p className="text-gray-500 text-sm md:text-base mb-6">Google Drive 스트리밍 & 프리미엄 뷰어</p>

        {/* Search */}
        <div className="max-w-md mx-auto relative group">
          <input
            type="text"
            placeholder="도서명 또는 작가 검색..."
            className="w-full pl-12 pr-6 py-3 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Book List */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!isLoaded ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 font-serif">{book.title}</h3>
                      <span className="text-sm text-gray-500 font-medium">{book.author}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                      {book.summary}
                    </p>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => setCurrentBook(book)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      <BookOpen className="w-4 h-4" />
                      읽기
                    </button>
                    {book.videoUrl && (
                      <a
                        href={book.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium border border-amber-100"
                      >
                        <PlayCircle className="w-4 h-4" />
                        영상
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}

          </>
        )}
      </main>

      {/* Reader Overlay */}
      {currentBook && (
        <BookReader
          title={currentBook.title}
          initialContent={currentBook.content}
          googleDocUrl={currentBook.googleDocUrl}
          onClose={() => setCurrentBook(null)}
        />
      )}
    </div>
  );
}
