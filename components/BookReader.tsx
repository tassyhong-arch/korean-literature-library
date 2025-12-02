"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bookmark,
  Type,
  Sun,
  Moon,
  Coffee,
  Cloud,
  ExternalLink,
  Loader2,
  Columns,
  Smartphone,
} from "lucide-react";

interface BookReaderProps {
  title: string;
  initialContent: string[];
  googleDocUrl?: string;
  onClose: () => void;
}

type Theme = "light" | "dark" | "sepia";

const THEME_CLASSES = {
  light: "bg-[#fdfbf7] text-gray-900",
  dark: "bg-gray-900 text-gray-100",
  sepia: "bg-[#f4ecd8] text-[#5b4636]",
} as const;

export default function BookReader({
  title,
  initialContent,
  googleDocUrl,
  onClose,
}: BookReaderProps) {
  const [content, setContent] = useState<string[]>(initialContent);
  const [isLoading, setIsLoading] = useState(!!googleDocUrl);

  // Layout & Dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // View State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isTwoPageMode, setIsTwoPageMode] = useState(false);
  const [stride, setStride] = useState(0);
  const [totalColumns, setTotalColumns] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Appearance State
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState<Theme>("light");
  const [showSettings, setShowSettings] = useState(false);

  // Feature State
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  // Touch State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const GAP_SIZE = 40;

  useEffect(() => {
    const fetchGoogleDocContent = async () => {
      if (!googleDocUrl) return;
      try {
        setIsLoading(true);
        // Use our internal proxy to avoid CORS issues
        const response = await fetch(
          `/api/doc-proxy?url=${encodeURIComponent(googleDocUrl)}`
        );

        if (!response.ok) throw new Error("Failed to fetch document");

        const text = await response.text();
        const paragraphs = text.split("\n").filter((p) => p.trim() !== "");
        setContent(paragraphs);
      } catch (error) {
        console.error("Failed to fetch Google Doc content:", error);
        setContent([
          "문서를 불러오는데 실패했습니다.",
          "잠시 후 다시 시도해주세요.",
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoogleDocContent();
  }, [googleDocUrl]);

  const measure = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientWidth = Math.floor(rect.width);
    const clientHeight = Math.floor(rect.height);

    if (clientWidth <= 0 || clientHeight <= 0) return;

    // Calculate margins: Mobile 32px, Desktop 48px
    const margin = clientWidth > 768 ? 48 : 32;
    let availableWidth = clientWidth - margin * 2;

    const isTwoPage = availableWidth > 800;
    setIsTwoPageMode(isTwoPage);

    // Adjust available width for exact column calculations
    if (isTwoPage) {
      const colWidth = Math.floor((availableWidth - GAP_SIZE) / 2);
      availableWidth = colWidth * 2 + GAP_SIZE;
    }

    setDimensions({ width: availableWidth, height: clientHeight });
    setIsReady(true);
  }, [GAP_SIZE]);

  useEffect(() => {
    measure();

    let lastWidth = window.innerWidth;
    let resizeTimer: NodeJS.Timeout;

    const handleResize = () => {
      // 모바일 주소표시줄 변경 무시: width가 변경된 경우만 재계산
      const currentWidth = window.innerWidth;
      if (Math.abs(currentWidth - lastWidth) > 5) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          lastWidth = currentWidth;
          measure();
        }, 150);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [measure]);

  // Calculate column dimensions with memoization
  const columnDimensions = useMemo(() => {
    if (!isReady) return { colWidth: 0, colHeight: 0 };

    const availableWidth = dimensions.width;
    const colWidth = isTwoPageMode
      ? Math.floor((availableWidth - GAP_SIZE) / 2)
      : Math.floor(availableWidth);

    const verticalPadding = isTwoPageMode ? 80 : 40;
    const colHeight = Math.floor(dimensions.height - verticalPadding - 20);

    return { colWidth, colHeight };
  }, [isReady, dimensions, isTwoPageMode, GAP_SIZE]);

  const contentRef = useRef<HTMLDivElement>(null);

  // Reset container width when content or settings change
  useEffect(() => {
    setContainerWidth(null);
  }, [dimensions, fontSize, lineHeight, content, isTwoPageMode]);

  useEffect(() => {
    if (!isReady || !contentRef.current || dimensions.width === 0) return;

    // Wait for layout to settle
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const scrollWidth = contentRef.current.scrollWidth;
        const { colWidth } = columnDimensions;

        // Estimate number of columns created by CSS
        // scrollWidth = totalColumns * columnWidth + (totalColumns - 1) * gap
        // Solve for totalColumns
        const estimatedColumns = Math.round(
          (scrollWidth + GAP_SIZE) / (colWidth + GAP_SIZE)
        );

        setTotalColumns(estimatedColumns);

        // Only set container width on first measurement
        if (containerWidth === null) {
          // Calculate exact container width to force exact column widths
          // containerWidth = columns * colWidth + (columns - 1) * gap
          const exactWidth =
            estimatedColumns * colWidth + (estimatedColumns - 1) * GAP_SIZE;
          setContainerWidth(exactWidth);

          console.log(
            `📐 First render - Setting container width: ${exactWidth}px for ${estimatedColumns} columns (${colWidth}px each)`
          );
        } else {
          // On second render with explicit width, verify it worked
          const actualColumnWidth =
            estimatedColumns > 0
              ? (scrollWidth - (estimatedColumns - 1) * GAP_SIZE) /
                estimatedColumns
              : colWidth;
          const difference = Math.abs(colWidth - actualColumnWidth);
          const status = difference < 0.1 ? "✅" : "⚠️";
          console.log(
            `${status} Second render - Expected: ${colWidth}px, Actual: ${actualColumnWidth.toFixed(
              2
            )}px, Difference: ${difference.toFixed(2)}px`
          );
        }

        // Calculate stride based on exact column width (not adjusted)
        const columnsPerView = isTwoPageMode ? 2 : 1;
        const finalStride =
          columnsPerView * colWidth + columnsPerView * GAP_SIZE;

        setStride(finalStride);

        // Calculate total pages (how many "views" of columnsPerView we need)
        const pages = Math.ceil(estimatedColumns / columnsPerView);
        setTotalPages(Math.max(1, pages));

        setCurrentPage((prev) => Math.min(prev, Math.max(0, pages - 1)));
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    isReady,
    content,
    containerWidth,
    columnDimensions,
    isTwoPageMode,
    GAP_SIZE,
  ]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage, onClose]);

  const toggleBookmark = useCallback(() => {
    setBookmarks((prev) => {
      const newBookmarks = prev.includes(currentPage)
        ? prev.filter((p) => p !== currentPage)
        : [...prev, currentPage].sort((a, b) => a - b);

      localStorage.setItem(`bookmarks-${title}`, JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, [currentPage, title]);

  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextPage();
    } else if (isRightSwipe) {
      prevPage();
    }
  }, [touchStart, touchEnd, nextPage, prevPage]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col h-screen transition-colors duration-300 ${THEME_CLASSES[theme]}`}
    >
      {/* Header */}
      <header
        className={`flex justify-between items-center px-4 md:px-6 h-14 border-b ${
          theme === "dark"
            ? "border-gray-800 bg-gray-900/90"
            : "border-gray-200 bg-white/80"
        } backdrop-blur-md z-20`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-serif font-bold truncate max-w-[150px] md:max-w-md">
              {title}
            </h1>
            {googleDocUrl && (
              <span className="text-[10px] text-blue-500 flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Google Doc
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleBookmark}
            className={`p-2 hover:bg-black/5 rounded-full ${
              bookmarks.includes(currentPage) ? "text-amber-500" : ""
            }`}
          >
            <Bookmark
              className={`w-5 h-5 ${
                bookmarks.includes(currentPage) ? "fill-current" : ""
              }`}
            />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-black/5 rounded-full"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-16 right-4 p-5 rounded-xl shadow-2xl border z-30 w-80 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <p className="text-xs font-bold mb-3 opacity-60 uppercase tracking-wider">
                  테마
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      theme === "light"
                        ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                        : "border-gray-200 hover:bg-gray-50"
                    } flex flex-col items-center gap-1`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs">라이트</span>
                  </button>
                  <button
                    onClick={() => setTheme("sepia")}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      theme === "sepia"
                        ? "border-amber-500 bg-[#f4ecd8] ring-1 ring-amber-500"
                        : "border-gray-200 hover:bg-gray-50"
                    } flex flex-col items-center gap-1`}
                  >
                    <Coffee className="w-5 h-5" />
                    <span className="text-xs">세피아</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      theme === "dark"
                        ? "border-amber-500 bg-gray-700 text-white ring-1 ring-amber-500"
                        : "border-gray-200 hover:bg-gray-50"
                    } flex flex-col items-center gap-1`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs">다크</span>
                  </button>
                </div>
              </div>

              {/* Typography */}
              <div>
                <div className="flex justify-between mb-3">
                  <p className="text-xs font-bold opacity-60 uppercase tracking-wider">
                    글자 크기
                  </p>
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {fontSize}px
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <Type className="w-4 h-4 opacity-50" />
                  <input
                    type="range"
                    min="14"
                    max="32"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <Type className="w-6 h-6 opacity-80" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <p className="text-xs font-bold opacity-60 uppercase tracking-wider">
                    줄 간격
                  </p>
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {lineHeight}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <span className="text-xs opacity-50">좁게</span>
                  <input
                    type="range"
                    min="1.4"
                    max="2.4"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-xs opacity-80">넓게</span>
                </div>
              </div>

              {/* View Mode */}
              <div>
                <p className="text-xs font-bold mb-3 opacity-60 uppercase tracking-wider">
                  보기 모드
                </p>
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    onClick={() => setIsTwoPageMode(false)}
                    className={`flex-1 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      !isTwoPageMode
                        ? "bg-white dark:bg-gray-600 shadow-sm text-amber-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />한 페이지
                  </button>
                  <button
                    onClick={() => setIsTwoPageMode(true)}
                    className={`flex-1 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      isTwoPageMode
                        ? "bg-white dark:bg-gray-600 shadow-sm text-amber-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Columns className="w-4 h-4" />두 페이지
                  </button>
                </div>
              </div>

              {googleDocUrl && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={googleDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span>원본 문서 열기</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center">
        {(isLoading || !isReady) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-inherit">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="font-serif">문서를 불러오는 중입니다...</p>
          </div>
        )}

        <div
          ref={containerRef}
          className={`relative w-full h-full max-w-[1200px] mx-auto transition-all duration-300 ${
            isLoading || !isReady ? "opacity-0" : "opacity-100"
          }`}
          style={{
            paddingTop: isTwoPageMode ? "40px" : "20px",
            paddingBottom: isTwoPageMode ? "40px" : "20px",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Viewport mask */}
          <div
            className="h-full overflow-hidden mx-auto"
            style={{
              width: dimensions.width > 0 ? `${dimensions.width}px` : "100%",
            }}
          >
            {/* Sliding content track */}
            <motion.div
              animate={{ x: -currentPage * stride }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full"
              style={{
                display: "flex",
                width: "max-content",
                backfaceVisibility: "hidden",
              }}
            >
              {/* Content */}
              <div
                ref={contentRef}
                className="font-serif text-justify select-text"
                style={{
                  columnWidth: `${columnDimensions.colWidth}px`,
                  columnGap: `${GAP_SIZE}px`,
                  columnFill: "auto",
                  height: `${columnDimensions.colHeight}px`,
                  // Use explicit width if calculated, otherwise let it be max-content
                  width:
                    containerWidth !== null
                      ? `${containerWidth}px`
                      : "max-content",
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  boxSizing: "border-box",
                  padding: 0,
                  margin: 0,
                }}
              >
                <div className="mb-12 text-center break-inside-avoid">
                  <h2 className="text-2xl font-bold mb-4">{title}</h2>
                  <div className="w-10 h-1 bg-amber-500 mx-auto opacity-50"></div>
                </div>

                {content.map((paragraph, idx) => (
                  <p key={idx} className="mb-6 break-inside-avoid indent-1">
                    {paragraph}
                  </p>
                ))}

                <div className="h-[30vh] w-full break-inside-avoid flex items-center justify-center opacity-30">
                  <p className="text-sm font-sans">- 끝 -</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`h-14 flex flex-col justify-center px-6 border-t ${
          theme === "dark" ? "border-gray-800" : "border-gray-100"
        } z-20 bg-inherit`}
      >
        <div className="flex justify-between items-center max-w-[1200px] mx-auto w-full">
          <div className="flex-1 mr-8 hidden md:block">
            <div className="w-full bg-gray-200/50 h-1 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  theme === "dark" ? "bg-gray-500" : "bg-gray-800"
                }`}
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentPage + 1) / totalPages) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mx-auto md:mx-0">
            <button
              onClick={prevPage}
              disabled={currentPage === 0 || isLoading}
              className="group flex items-center gap-2 disabled:opacity-30 hover:text-amber-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">이전</span>
            </button>

            <span className="font-mono text-sm font-medium min-w-[60px] text-center">
              {isLoading ? "-" : `${currentPage + 1} / ${totalPages}`}
            </span>

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1 || isLoading}
              className="group flex items-center gap-2 disabled:opacity-30 hover:text-amber-600 transition-colors"
            >
              <span className="text-sm font-medium hidden sm:inline">다음</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
