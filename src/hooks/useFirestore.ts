import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// New hook that can work with dynamic collection names
export function useCollection<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dynamicCollectionName, setDynamicCollectionName] = useState(collectionName);

  useEffect(() => {
    const collectionRef = collection(db, dynamicCollectionName);
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Connection timeout. Please check your Firebase configuration and Firestore security rules.');
        setLoading(false);
      }
    }, 10000);
    
    const unsubscribe = onSnapshot(collectionRef, 
      (snapshot) => {
        clearTimeout(timeout);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        clearTimeout(timeout);
        console.error('Firestore error:', err);
        
        // Handle permission errors specifically
        if (err.code === 'permission-denied') {
          setError('Permission denied. Please update your Firestore security rules to allow read/write access.');
        } else {
          setError(`Firestore error: ${err.message}`);
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [dynamicCollectionName]);

  const createItem = useCallback(async (item: Omit<T, 'id'>, targetCollection?: string) => {
    try {
      const finalCollection = targetCollection || dynamicCollectionName;
      console.log('Creating item in collection:', finalCollection);
      const docRef = await addDoc(collection(db, finalCollection), {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log('Item created with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Create error:', err);
      throw new Error(`Failed to create item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [dynamicCollectionName]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>, targetCollection?: string) => {
    try {
      const finalCollection = targetCollection || dynamicCollectionName;
      await updateDoc(doc(db, finalCollection, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Update error:', err);
      throw new Error(`Failed to update item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [dynamicCollectionName]);

  const deleteItem = useCallback(async (id: string, targetCollection?: string) => {
    try {
      const finalCollection = targetCollection || dynamicCollectionName;
      await deleteDoc(doc(db, finalCollection, id));
    } catch (err) {
      console.error('Delete error:', err);
      throw new Error(`Failed to delete item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [dynamicCollectionName]);

  // Function to change collection dynamically (for chapter-based collections)
  const updateCollectionName = useCallback((newCollectionName: string) => {
    setDynamicCollectionName(newCollectionName);
  }, []);

  return {
    data,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    updateCollectionName
  };
}

// Hook that queries ALL chapter collections based on your Firebase structure
export function useAggregatedQuestions<T extends { id: string }>(questionType: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // All chapters from your Firebase structure (based on screenshots)
    const allChapters = [
      'Kinematics', 'Center of Mass', 'Current Electricity', 'Dual Nature of Matter',
      'Electromagnetic Induction', 'Electromagnetic Waves', 'Electrostatics',
      'Experimental Skills', 'Fluid Mechanics', 'Gravitation', 'Kinetic Theory of Gases',
      'Laws of Motion', 'Magnetism', 'Nuclear Physics', 'Oscillations', 'Properties of Solids',
      'Atomic Structure', 'Basic Mathematics'
    ];
    
    const typeMap: { [key: string]: string } = {
      diagnosticQuestions: 'Diagnostic',
      practiceQuestions: 'Practice', 
      testQuestions: 'Test'
    };
    const formattedType = typeMap[questionType] || 'Diagnostic';
    
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Connection timeout. Please check your Firebase configuration and security rules.');
        setLoading(false);
      }
    }, 15000);
    
    // Aggregate data from all chapter collections
    let allQuestions: T[] = [];
    const unsubscribes: (() => void)[] = [];
    let successfulConnections = 0;
    let connectionAttempts = 0;
    
    console.log(`Attempting to query ${allChapters.length} chapter collections for ${formattedType} questions`);
    
    allChapters.forEach(chapter => {
      const collectionName = `${chapter}-${formattedType}-Questions`;
      const collectionRef = collection(db, collectionName);
      
      connectionAttempts++;
      console.log(`Querying: ${collectionName}`);
      
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          successfulConnections++;
          console.log(`✓ ${collectionName}: Found ${snapshot.docs.length} documents`);
          
          // Remove existing questions from this chapter
          allQuestions = allQuestions.filter(q => (q as any).chapter !== chapter);
          
          // Add new questions from this chapter
          const chapterQuestions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          
          allQuestions = [...allQuestions, ...chapterQuestions];
          setData([...allQuestions]);
          
          // If all collections have been queried successfully
          if (successfulConnections === allChapters.length) {
            clearTimeout(timeout);
            setLoading(false);
            setError(null);
            console.log(`✓ Successfully loaded questions from all ${allChapters.length} chapters`);
          }
        },
        (err) => {
          console.error(`✗ Error querying ${collectionName}:`, err);
          
          // Even if some collections fail, continue with others
          connectionAttempts--;
          if (connectionAttempts === 0) {
            clearTimeout(timeout);
            setLoading(false);
            
            if (successfulConnections === 0) {
              if (err.code === 'permission-denied') {
                setError('Permission denied. Please update your Firestore security rules to allow access to chapter collections.');
              } else {
                setError(`Firestore error: ${err.message}`);
              }
            } else {
              console.log(`✓ Loaded questions from ${successfulConnections}/${allChapters.length} chapters`);
              setError(null);
            }
          }
        }
      );
      
      unsubscribes.push(unsubscribe);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribes.forEach(unsub => unsub());
    };
  }, [questionType]);

  const createItem = useCallback(async (item: Omit<T, 'id'>) => {
    try {
      // Extract chapter from item and generate correct collection name
      const chapter = (item as any).chapter;
      if (!chapter) {
        throw new Error('Chapter is required to create a question');
      }
      
      const typeMap: { [key: string]: string } = {
        diagnosticQuestions: 'Diagnostic',
        practiceQuestions: 'Practice', 
        testQuestions: 'Test'
      };
      const formattedType = typeMap[questionType] || 'Diagnostic';
      const targetCollection = `${chapter}-${formattedType}-Questions`;
      
      console.log('Creating item in collection:', targetCollection);
      const docRef = await addDoc(collection(db, targetCollection), {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log('Item created with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Create error:', err);
      throw new Error(`Failed to create item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [questionType]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      // Extract chapter from updates to determine collection
      const chapter = (updates as any).chapter;
      if (!chapter) {
        throw new Error('Chapter is required to update a question');
      }
      
      const typeMap: { [key: string]: string } = {
        diagnosticQuestions: 'Diagnostic',
        practiceQuestions: 'Practice', 
        testQuestions: 'Test'
      };
      const formattedType = typeMap[questionType] || 'Diagnostic';
      const targetCollection = `${chapter}-${formattedType}-Questions`;
      
      await updateDoc(doc(db, targetCollection, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Update error:', err);
      throw new Error(`Failed to update item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [questionType]);

  const deleteItem = useCallback(async (id: string, question: any) => {
    try {
      // Extract chapter from question to determine collection
      const chapter = question.chapter;
      if (!chapter) {
        throw new Error('Chapter is required to delete a question');
      }
      
      const typeMap: { [key: string]: string } = {
        diagnosticQuestions: 'Diagnostic',
        practiceQuestions: 'Practice', 
        testQuestions: 'Test'
      };
      const formattedType = typeMap[questionType] || 'Diagnostic';
      const targetCollection = `${chapter}-${formattedType}-Questions`;
      
      await deleteDoc(doc(db, targetCollection, id));
    } catch (err) {
      console.error('Delete error:', err);
      throw new Error(`Failed to delete item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [questionType]);

  return { data, loading, error, createItem, updateItem, deleteItem };
}