"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import SocialShell from "@/components/layouts/SocialShell";
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronRight,
  List,
  Loader2,
  Search,
} from "lucide-react";

interface BookSummary {
  id: number;
  abbr: string;
  name: string;
  totalChapters: number;
}

interface ChapterItem {
  id: number;
  number: number;
}

interface ChaptersResponse {
  book: { id: number; abbr: string };
  chapters: ChapterItem[];
}

interface VerseItem {
  id: number;
  number: number;
  text: string;
  title: string;
}

interface VersesResponse {
  book: { id: number; abbr: string };
  chapter: { id: number; number: number };
  verses: VerseItem[];
}

interface VerseDetail {
  id: number;
  book: { id: number; abbr: string };
  chapter: { id: number; number: number };
  verse: { number: number; title: string; text: string };
}

type SelectorKey = "book" | "chapter" | "verse";

const useDebounce = <T,>(value: T, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

const getBookColorClass = (bookId: number, isSelected: boolean) => {
  const isOT = bookId <= 39;
  if (isSelected) return "ring-2 ring-offset-2 ring-slate-900 dark:ring-white";
  if (isOT) return "bg-red-500 hover:bg-red-600 text-white border-red-600";
  return "bg-blue-500 hover:bg-blue-600 text-white border-blue-600";
};

const T_MARKER_REGEX = /<\s*\/?\s*t\s*\/?\s*>/gi;
const HAS_T_MARKER_REGEX = /<\s*t\s*\/?>/i;

const getVerseTextMeta = (text: string) => {
  const hasIntroMarker = HAS_T_MARKER_REGEX.test(text);
  const cleanedText = text.replace(T_MARKER_REGEX, "").trim();
  return { hasIntroMarker, cleanedText };
};

export default function AlkitabPage() {
  const [activeSelector, setActiveSelector] = useState<SelectorKey | null>("book");
  const [isSelectorModalOpen, setSelectorModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number | null>(null);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(null);
  const [pendingScrollVerseId, setPendingScrollVerseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const readerTopRef = useRef<HTMLDivElement | null>(null);

  const scrollReaderToTop = () => {
    if (!readerTopRef.current) return;
    readerTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: books, isLoading: isBooksLoading } = useQuery<BookSummary[]>({
    queryKey: ["alkitab", "books"],
    queryFn: async () => (await apiClient.get("/alkitab/books")).data,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (books?.length && !selectedBookId) {
      setSelectedBookId(books[0].id);
    }
  }, [books, selectedBookId]);

  const { data: chaptersData, isLoading: isChaptersLoading } = useQuery<ChaptersResponse>({
    queryKey: ["alkitab", "chapters", selectedBookId],
    queryFn: async () =>
      (await apiClient.get(`/alkitab/books/${selectedBookId}/chapters`)).data,
    enabled: !!selectedBookId,
  });

  const { data: versesData, isFetching: isVersesFetching } = useQuery<VersesResponse>({
    queryKey: ["alkitab", "verses", selectedBookId, selectedChapterNumber],
    queryFn: async () =>
      (await apiClient.get(
        `/alkitab/books/${selectedBookId}/chapters/${selectedChapterNumber}/verses`
      )).data,
    enabled: !!selectedBookId && !!selectedChapterNumber,
  });

  const { data: searchData, isFetching: isSearchFetching } = useQuery<VerseDetail[]>({
    queryKey: ["alkitab", "search", debouncedSearch],
    queryFn: async () =>
      (await apiClient.get("/alkitab/search", { params: { keyword: debouncedSearch } })).data,
    enabled: debouncedSearch.trim().length > 1,
  });

  const currentBook = books?.find((b) => b.id === selectedBookId) ?? null;

  const oldTestamentBooks = useMemo(
    () => books?.filter((book) => book.id <= 39) ?? [],
    [books]
  );

  const newTestamentBooks = useMemo(
    () => books?.filter((book) => book.id > 39) ?? [],
    [books]
  );

  const closeSelectorModal = () => {
    setSelectorModalOpen(false);
    setActiveSelector(null);
  };

  const handleOpenSelectorFromHeader = () => {
    setActiveSelector("book");
    setSelectorModalOpen(true);
  };

  const setModalStep = (key: SelectorKey, disabled: boolean) => {
    if (disabled) return;
    setActiveSelector(key);
  };

  const handleBookSelect = (id: number) => {
    setSelectedBookId(id);
    setSelectedChapterNumber(null);
    setSelectedVerseNumber(null);
    setActiveSelector("chapter");
  };

  const handleChapterSelect = (number: number) => {
    setSelectedChapterNumber(number);
    setSelectedVerseNumber(null);
    setActiveSelector("verse");
  };

  const handleVerseSelect = (verse: VerseItem) => {
    setSelectedVerseNumber(verse.number);
    setPendingScrollVerseId(verse.id);
    closeSelectorModal();
  };

  const goToPreviousChapter = () => {
    if (!selectedChapterNumber || selectedChapterNumber <= 1) return;
    handleChapterSelect(selectedChapterNumber - 1);
    scrollReaderToTop();
  };

  const goToNextChapter = () => {
    if (!selectedChapterNumber || !currentBook) return;
    if (selectedChapterNumber >= currentBook.totalChapters) return;
    handleChapterSelect(selectedChapterNumber + 1);
    scrollReaderToTop();
  };

  const handleSearchJump = (result: VerseDetail) => {
    setSelectedBookId(result.book.id);
    setSelectedChapterNumber(result.chapter.number);
    setSelectedVerseNumber(result.verse.number);
    setPendingScrollVerseId(result.id);
    setSelectorModalOpen(false);
    setActiveSelector(null);
    setSearchTerm("");
  };

  useEffect(() => {
    scrollReaderToTop();
  }, [selectedBookId, selectedChapterNumber]);

  useEffect(() => {
    if (!pendingScrollVerseId || !versesData) return;
    const el = document.getElementById(`verse-${pendingScrollVerseId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-amber-100", "dark:bg-amber-900/30");
      setTimeout(() =>
        el.classList.remove("bg-amber-100", "dark:bg-amber-900/30"), 2000);
      setPendingScrollVerseId(null);
    }
  }, [pendingScrollVerseId, versesData]);

  const stepConfig = useMemo(
    () => [
      {
        key: "book" as const,
        label: "Kitab",
        value: currentBook ? currentBook.name ?? currentBook.abbr : "Pilih Kitab",
        helper: currentBook ? `${currentBook.totalChapters} pasal` : "Belum dipilih",
        disabled: false,
      },
      {
        key: "chapter" as const,
        label: "Pasal",
        value: selectedChapterNumber ? `Pasal ${selectedChapterNumber}` : "Pilih Pasal",
        helper: currentBook ? `Total ${currentBook.totalChapters}` : "Pilih kitab dahulu",
        disabled: !selectedBookId,
      },
      {
        key: "verse" as const,
        label: "Ayat",
        value: selectedVerseNumber ? `Ayat ${selectedVerseNumber}` : "Pilih Ayat",
        helper: selectedChapterNumber ? "Lanjut pilih ayat" : "Pilih pasal dahulu",
        disabled: !selectedChapterNumber,
      },
    ],
    [currentBook, selectedBookId, selectedChapterNumber, selectedVerseNumber]
  );

  const shouldShowSearchResults = searchTerm.trim().length > 1;
  const canGoPreviousChapter = Boolean(selectedChapterNumber && selectedChapterNumber > 1);
  const canGoNextChapter = Boolean(
    currentBook && selectedChapterNumber && selectedChapterNumber < currentBook.totalChapters
  );

  const renderSelectorContent = () => {
    if (!activeSelector) {
      return (
        <div className="text-center text-sm text-slate-500 py-10">
          Pilih langkah untuk memulai.
        </div>
      );
    }

    if (activeSelector === "book") {
      if (isBooksLoading) {
        return (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-8 h-8 text-slate-300" />
          </div>
        );
      }

      if (!books?.length) {
        return <p className="text-center text-sm text-slate-500">Data kitab belum tersedia.</p>;
      }

      return (
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Perjanjian Lama
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {oldTestamentBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleBookSelect(book.id)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold border shadow-sm transition-all active:scale-95 ${getBookColorClass(
                    book.id,
                    selectedBookId === book.id
                  )}`}
                >
                  <span>{book.abbr}</span>
                  <span className="text-[10px] opacity-80">{book.totalChapters} pasal</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Perjanjian Baru
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {newTestamentBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleBookSelect(book.id)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold border shadow-sm transition-all active:scale-95 ${getBookColorClass(
                    book.id,
                    selectedBookId === book.id
                  )}`}
                >
                  <span>{book.abbr}</span>
                  <span className="text-[10px] opacity-80">{book.totalChapters} pasal</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeSelector === "chapter") {
      if (!selectedBookId) {
        return <p className="text-sm text-slate-500">Pilih kitab terlebih dahulu.</p>;
      }

      if (isChaptersLoading) {
        return (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-8 h-8 text-slate-300" />
          </div>
        );
      }

      return (
        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
          {chaptersData?.chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => handleChapterSelect(chapter.number)}
              className={`aspect-square rounded-xl font-semibold text-sm border transition-all ${
                selectedChapterNumber === chapter.number
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400"
              }`}
            >
              {chapter.number}
            </button>
          ))}
        </div>
      );
    }

    if (activeSelector === "verse") {
      if (!selectedChapterNumber) {
        return <p className="text-sm text-slate-500">Pilih pasal terlebih dahulu.</p>;
      }

      if (isVersesFetching) {
        return (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-8 h-8 text-slate-300" />
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {versesData?.verses.map((verse) => {
            const { cleanedText } = getVerseTextMeta(verse.text);
            return (
              <button
                key={verse.id}
                onClick={() => handleVerseSelect(verse)}
                className={`rounded-2xl border text-left p-4 transition-all hover:border-amber-400 ${
                  selectedVerseNumber === verse.number
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Ayat {verse.number}
                </p>
                {verse.title && (
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-1 line-clamp-1">
                    {verse.title}
                  </p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                  {cleanedText}
                </p>
              </button>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <SocialShell
      mobileTitle="Ruang Alkitab"
      mobileDescription="Baca dan simpan ayat favoritmu"
      contentClassName="px-0 sm:px-4 md:px-6"
    >
      <div className="w-full max-w-6xl mx-auto p-4 lg:p-10 flex flex-col gap-6">
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <p className="uppercase text-xs tracking-[0.4em] text-slate-400 dark:text-slate-500 font-semibold">
              Terjemahan Baru
            </p>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Ruang Alkitab
              </h1>
              <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 gap-1">
                <span>{currentBook?.abbr ?? "Pilih Kitab"}</span>
                <ChevronRight className="w-4 h-4" />
                <span>
                  {selectedChapterNumber ? `Pasal ${selectedChapterNumber}` : "Pilih Pasal"}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span>
                  {selectedVerseNumber ? `Ayat ${selectedVerseNumber}` : "Pilih Ayat"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <span className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                Kitab: {stepConfig[0].value}
              </span>
              <span className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                Pasal: {selectedChapterNumber ? selectedChapterNumber : "Belum"}
              </span>
              <span className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                Ayat: {selectedVerseNumber ? selectedVerseNumber : "Semua"}
              </span>
            </div>
            <button
              onClick={handleOpenSelectorFromHeader}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-lg shadow-slate-300/60 dark:shadow-none hover:opacity-90"
            >
              <Search className="w-4 h-4" /> Pilih Bacaan
            </button>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ayat atau kata kunci..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 outline-none text-sm"
            />
          </div>
        </section>

        {isSelectorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={closeSelectorModal}
            />
            <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/30 dark:shadow-black/10 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                    Pilih Bacaan
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Atur Kitab, Pasal, dan Ayat
                  </h3>
                </div>
                <button
                  onClick={closeSelectorModal}
                  className="text-sm font-semibold text-slate-500 dark:text-slate-300 hover:text-amber-500"
                >
                  Tutup
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {stepConfig.map((step, index) => {
                  const isActive = activeSelector === step.key;
                  return (
                    <button
                      key={step.key}
                      disabled={step.disabled}
                      onClick={() => setModalStep(step.key, step.disabled)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                      } ${step.disabled ? "opacity-40 cursor-not-allowed" : "hover:border-amber-400"}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      {step.label}
                    </button>
                  );
                })}
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-1">{renderSelectorContent()}</div>
            </div>
          </div>
        )}

        {shouldShowSearchResults && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  Hasil pencarian
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  “{searchTerm.trim()}”
                </p>
              </div>
              {isSearchFetching && <Loader2 className="animate-spin w-5 h-5 text-amber-500" />}
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {!isSearchFetching && (!searchData || searchData.length === 0) ? (
                <p className="text-center text-sm text-slate-500 py-6">
                  Tidak ditemukan ayat untuk kata kunci ini.
                </p>
              ) : (
                searchData?.map((item) => {
                  const { cleanedText } = getVerseTextMeta(item.verse.text);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSearchJump(item)}
                      className="w-full text-left p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-400 transition"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <span>
                          {item.book.abbr} {item.chapter.number}:{item.verse.number}
                        </span>
                      </div>
                      {item.verse.title && (
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">
                          {item.verse.title}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {cleanedText}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        )}

        <section
          ref={readerTopRef}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none flex flex-col"
        >
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentBook?.abbr || "Alkitab"}{" "}
                <span className="text-amber-600 dark:text-amber-400">
                  {selectedChapterNumber ?? ""}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-[0.3em] uppercase mt-1">
                Fokus bacaan harian
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-amber-500">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {!selectedBookId || !selectedChapterNumber ? (
              <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
                <BookOpen className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-semibold">Mulai dengan memilih kitab dan pasal.</p>
                <p className="text-sm">Gunakan header di atas untuk menelusuri.</p>
              </div>
            ) : isVersesFetching ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              versesData?.verses.map((verse) => {
                const isActive = selectedVerseNumber === verse.number;
                const { cleanedText, hasIntroMarker } = getVerseTextMeta(verse.text);
                return (
                  <div
                    key={verse.id}
                    id={`verse-${verse.id}`}
                    className={`group relative rounded-2xl border p-4 sm:p-5 transition-all ${
                      isActive
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                        : "border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    <div className="flex gap-4 sm:gap-6">
                      <button
                        onClick={() => handleVerseSelect(verse)}
                        className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-sm transition-colors ${
                          isActive
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-amber-500"
                        }`}
                      >
                        {verse.number}
                      </button>
                      <div className="flex-1">
                        {verse.title && (
                          <span className="inline-flex text-[11px] font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-[0.2em] bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1 rounded-full shadow-sm ring-1 ring-amber-200/70 dark:ring-amber-500/30 mb-2">
                            {verse.title}
                          </span>
                        )}
                        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 flex items-start gap-3">
                          {hasIntroMarker && (
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 font-black text-lg">
                              T
                            </span>
                          )}
                          <span className="flex-1 leading-relaxed">{cleanedText}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {selectedChapterNumber && (
              <div className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 dark:border-slate-800 mt-8">
                <button
                  disabled={!canGoPreviousChapter}
                  onClick={goToPreviousChapter}
                  className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-semibold text-sm hover:border-amber-400 disabled:opacity-40 disabled:hover:border-slate-200"
                >
                  Pasal Sebelumnya
                </button>
                <button
                  disabled={!canGoNextChapter}
                  onClick={goToNextChapter}
                  className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-lg shadow-slate-200 dark:shadow-none hover:opacity-90 disabled:opacity-40"
                >
                  Pasal Berikutnya
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </SocialShell>
  );
}
