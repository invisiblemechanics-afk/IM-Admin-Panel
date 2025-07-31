import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Chapter {
  id: string;
  name: string;
  slug: string;
  subject: string;
  questionCountDiagnostic?: number;
  questionCountPractice?: number;
  questionCountTest?: number;
  questionCountBreakdowns?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChapterContextType {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  loading: boolean;
  error: string | null;
  selectChapter: (chapter: Chapter) => void;
}

const ChapterContext = createContext<ChapterContextType | undefined>(undefined);

export function ChapterProvider({ children }: { children: ReactNode }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'Chapters'),
      (snapshot) => {
        const chaptersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || doc.id,
            subject: data.subject || '',
            questionCountDiagnostic: data.questionCountDiagnostic || 0,
            questionCountPractice: data.questionCountPractice || 0,
            questionCountTest: data.questionCountTest || 0,
            questionCountBreakdowns: data.questionCountBreakdowns || 0,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined
          };
        }) as Chapter[];
        
        // Sort chapters by name
        chaptersList.sort((a, b) => a.name.localeCompare(b.name));
        
        setChapters(chaptersList);
        setLoading(false);
        
        // Auto-select first chapter if none selected
        if (!selectedChapter && chaptersList.length > 0) {
          setSelectedChapter(chaptersList[0]);
        }
      },
      (err) => {
        console.error('Error loading chapters:', err instanceof Error ? err.message : String(err));
        setError('Failed to load chapters');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []); // Remove selectedChapter dependency to avoid infinite loop

  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    // Store in localStorage for persistence
    try {
      localStorage.setItem('selectedChapterId', String(chapter.id));
    } catch (error) {
      console.warn('Failed to save chapter to localStorage:', error);
    }
  };

  // Load selected chapter from localStorage on mount
  useEffect(() => {
    if (chapters.length > 0) {
      try {
        const savedChapterId = localStorage.getItem('selectedChapterId');
        if (savedChapterId) {
          const savedChapter = chapters.find(ch => String(ch.id) === savedChapterId);
          if (savedChapter) {
            setSelectedChapter(savedChapter);
            return;
          }
        }
        // Auto-select first chapter if no saved chapter found
        if (!selectedChapter) {
          setSelectedChapter(chapters[0]);
        }
      } catch (error) {
        console.warn('Failed to load chapter from localStorage:', error);
        // Fallback to first chapter
        if (!selectedChapter) {
          setSelectedChapter(chapters[0]);
        }
      }
    }
  }, [chapters, selectedChapter]);

  return (
    <ChapterContext.Provider value={{ chapters, selectedChapter, loading, error, selectChapter }}>
      {children}
    </ChapterContext.Provider>
  );
}

export function useChapter() {
  const context = useContext(ChapterContext);
  if (context === undefined) {
    throw new Error('useChapter must be used within a ChapterProvider');
  }
  return context;
}