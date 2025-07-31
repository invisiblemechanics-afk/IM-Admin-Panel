import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { useChapter } from '../contexts/ChapterContext';

// Hook for chapter-scoped collections
export function useChapterCollection<T extends { id: string }>(collectionSuffix: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedChapter } = useChapter();

  useEffect(() => {
    if (!selectedChapter) {
      setData([]);
      setLoading(false);
      setError('No chapter selected');
      return;
    }

    // Use the chapter name for collection path to match Firestore structure
    const chapterName = selectedChapter.name || selectedChapter.slug;
    const collectionPath = `Chapters/${selectedChapter.id}/${chapterName}-${collectionSuffix}`;
    console.log(`Subscribing to collection: ${collectionPath}`);
    
    const collectionRef = collection(db, collectionPath);
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        
        console.log(`Loaded ${items.length} items from ${collectionPath}`);
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error loading ${collectionPath}:`, err instanceof Error ? err.message : String(err));
        setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedChapter, collectionSuffix]);

  const createItem = useCallback(async (item: Omit<T, 'id'>) => {
    if (!selectedChapter) {
      throw new Error('No chapter selected');
    }

    // Use the chapter name for collection path to match Firestore structure
    const chapterName = selectedChapter.name || selectedChapter.slug;
    const collectionPath = `Chapters/${selectedChapter.id}/${chapterName}-${collectionSuffix}`;
    
    try {
      console.log(`Creating item in ${collectionPath}`);
      const docRef = await addDoc(collection(db, collectionPath), {
        ...item,
        chapterId: chapterName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Update count on chapter document
      console.log('Selected chapter for count update:', { id: selectedChapter.id, slug: selectedChapter.slug, name: selectedChapter.name });
      await updateChapterCount(selectedChapter.id, collectionSuffix, 1);
      
      console.log(`Created item with ID: ${docRef.id}`);
      return docRef.id;
    } catch (err) {
      console.error('Create error:', err);
      throw new Error(`Failed to create item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [selectedChapter, collectionSuffix]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    if (!selectedChapter) {
      throw new Error('No chapter selected');
    }

    // Use the chapter name for collection path to match Firestore structure
    const chapterName = selectedChapter.name || selectedChapter.slug;
    const collectionPath = `Chapters/${selectedChapter.id}/${chapterName}-${collectionSuffix}`;
    
    try {
      console.log(`Updating item ${id} in ${collectionPath}`);
      await updateDoc(doc(db, collectionPath, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Update error:', err);
      throw new Error(`Failed to update item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [selectedChapter, collectionSuffix]);

  const deleteItem = useCallback(async (id: string) => {
    if (!selectedChapter) {
      throw new Error('No chapter selected');
    }

    // Use the chapter name for collection path to match Firestore structure
    const chapterName = selectedChapter.name || selectedChapter.slug;
    const collectionPath = `Chapters/${selectedChapter.id}/${chapterName}-${collectionSuffix}`;
    
    try {
      console.log(`Deleting item ${id} from ${collectionPath}`);
      await deleteDoc(doc(db, collectionPath, id));
      
      // Update count on chapter document
      await updateChapterCount(selectedChapter.id, collectionSuffix, -1);
      
    } catch (err) {
      console.error('Delete error:', err);
      throw new Error(`Failed to delete item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [selectedChapter, collectionSuffix]);

  return {
    data,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    selectedChapter
  };
}

// Helper function to update chapter counts
async function updateChapterCount(chapterId: string, collectionSuffix: string, change: number) {
  const countFieldMap: { [key: string]: string } = {
    'Diagnostic-Questions': 'questionCountDiagnostic',
    'Practice-Questions': 'questionCountPractice',
    'Test-Questions': 'questionCountTest',
    'Breakdowns': 'questionCountBreakdowns'
  };

  const fieldName = countFieldMap[collectionSuffix];
  if (!fieldName) return; // No count field for this collection type

  try {
    console.log(`Attempting to update chapter count for ID: "${chapterId}"`);
    const chapterRef = doc(db, 'Chapters', chapterId);
    await updateDoc(chapterRef, {
      [fieldName]: increment(change)
    });
    console.log(`Updated ${fieldName} by ${change} for chapter ${chapterId}`);
  } catch (err) {
    console.error('Failed to update chapter count:', err);
  }
}