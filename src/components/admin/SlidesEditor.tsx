import React, { useState, useEffect, memo } from 'react';
import { Slide } from '../../types';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs, limit, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, FileText, HelpCircle, RefreshCw } from 'lucide-react';
import SlideForm from './SlideForm';
import Button from './Button';
import Math from '../Math';
import { useChapter } from '../../contexts/ChapterContext';
import { usePermissions } from '../../hooks/usePermissions';

interface SlidesEditorProps {
  breakdownId?: string;
  questionId?: string;
  collectionSuffix?: string;
}

function SlidesEditor({ breakdownId, questionId, collectionSuffix = 'Breakdowns' }: SlidesEditorProps) {
  const { selectedChapter } = useChapter();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [slideType, setSlideType] = useState<'theory' | 'question'>('theory');
  const [needsBackfill, setNeedsBackfill] = useState(false);
  
  // Check user permissions
  const { canDelete, canCreate, canUpdate } = usePermissions();

  // Helper function to get the path to slides collection
  const getSlidesCollection = () => {
    if (!selectedChapter) throw new Error('No chapter selected');
    const itemId = breakdownId || questionId;
    if (!itemId) throw new Error('No item ID provided');
    
    // Use the exact same pattern as useChapterCollection
    const chapterName = selectedChapter.name || selectedChapter.slug;
    const collectionPath = `Chapters/${selectedChapter.id}/${chapterName}-${collectionSuffix}/${itemId}/Slides`;
    
    console.log('SlidesEditor - Full collection path:', collectionPath);
    
    return collection(db, 'Chapters', selectedChapter.id, `${chapterName}-${collectionSuffix}`, itemId, 'Slides');
  };

  // Helper function to get next order value
  const getNextOrder = async (): Promise<number> => {
    try {
      const slidesRef = getSlidesCollection();
      const q = query(slidesRef, orderBy('order', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return 0;
      const top = snap.docs[0].data() as any;
      return (typeof top.order === 'number' ? top.order : -1) + 1;
    } catch (error) {
      // If order field doesn't exist, count all slides and use that as next order
      console.log('Order field not found, counting existing slides');
      const slidesRef = getSlidesCollection();
      const allSlides = await getDocs(slidesRef);
      return allSlides.size;
    }
  };

  useEffect(() => {
    if (!selectedChapter) return;

    const itemId = breakdownId || questionId;
    if (!itemId) return;

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      try {
        const slidesRef = getSlidesCollection();
        
        console.log('Setting up slides subscription...');
        
        // Start with basic query - no ordering to ensure it works
        unsubscribe = onSnapshot(slidesRef, (snapshot) => {
          console.log('Basic query success - snapshot size:', snapshot.size);
          const slidesData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Document data:', { id: doc.id, ...data });
            return {
              id: doc.id,
              ...data
            };
          }) as Slide[];
          
          console.log('All slides data:', slidesData);
          
          // Check if slides have order field
          const hasOrderField = slidesData.some(slide => typeof slide.order === 'number');
          console.log('Has order field:', hasOrderField);
          
          if (hasOrderField) {
            // Sort by order if available
            slidesData.sort((a, b) => (a.order || 0) - (b.order || 0));
            setNeedsBackfill(false);
          } else {
            // Sort by createdAt on client side
            slidesData.sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return aTime - bTime;
            });
            setNeedsBackfill(slidesData.length > 0); // Only show backfill if there are slides
          }
          
          setSlides(slidesData);
          setLoading(false);
        }, (error) => {
          console.error('Slides subscription failed:', error);
          setLoading(false);
        });
        
      } catch (error) {
        console.error('Error setting up slides subscription:', error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [breakdownId, questionId, selectedChapter, collectionSuffix]);

  const handleCreateSlide = (type: 'theory' | 'question') => {
    setSelectedSlide(null);
    setSlideType(type);
    setIsFormOpen(true);
  };

  const handleEditSlide = (slide: Slide) => {
    setSelectedSlide(slide);
    setSlideType(slide.kind);
    setIsFormOpen(true);
  };

  const handleSubmitSlide = async (slideData: Omit<Slide, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => {
    try {
      const slidesRef = getSlidesCollection();
      
      if (selectedSlide) {
        // Update existing slide (preserve order)
        const slideDoc = doc(slidesRef, selectedSlide.id);
        await updateDoc(slideDoc, {
          ...slideData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new slide with next order
        const order = await getNextOrder();
        await addDoc(slidesRef, {
          ...slideData,
          order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('Failed to save slide. Please try again.');
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!canDelete) {
      alert('You do not have permission to delete slides.');
      return;
    }
    if (confirm('Are you sure you want to delete this slide?')) {
      try {
        const slidesRef = getSlidesCollection();
        await deleteDoc(doc(slidesRef, slideId));
      } catch (error) {
        console.error('Error deleting slide:', error);
        alert('Failed to delete slide. Please try again.');
      }
    }
  };

  // Swap order values with neighbor using transaction
  const swapOrder = async (currentId: string, neighborId: string) => {
    try {
      const slidesRef = getSlidesCollection();
      const aRef = doc(slidesRef, currentId);
      const bRef = doc(slidesRef, neighborId);

      await runTransaction(db, async (tx) => {
        const a = await tx.get(aRef);
        const b = await tx.get(bRef);
        const aOrder = (a.data()?.order ?? 0) as number;
        const bOrder = (b.data()?.order ?? 0) as number;

        tx.update(aRef, { order: bOrder, updatedAt: serverTimestamp() });
        tx.update(bRef, { order: aOrder, updatedAt: serverTimestamp() });
      });
    } catch (error) {
      console.error('Error swapping slide order:', error);
      alert('Failed to reorder slides. Please try again.');
    }
  };

  const moveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const slideIndex = slides.findIndex(s => s.id === slideId);
    if (
      (direction === 'up' && slideIndex === 0) ||
      (direction === 'down' && slideIndex === slides.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;
    const currentSlide = slides[slideIndex];
    const targetSlide = slides[targetIndex];

    await swapOrder(currentSlide.id, targetSlide.id);
  };

  // Backfill order for existing slides
  const backfillOrder = async () => {
    try {
      const slidesRef = getSlidesCollection();
      const q = query(slidesRef, orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        alert('No slides found to backfill.');
        return;
      }
      
      const batch = writeBatch(db);
      snap.docs.forEach((d, i) => batch.update(d.ref, { order: i }));
      await batch.commit();
      
      setNeedsBackfill(false);
      alert(`✅ Order backfilled for ${snap.size} slides. Slides can now be reordered.`);
    } catch (error) {
      console.error('Error backfilling order:', error);
      alert('❌ Failed to backfill order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading slides...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Slides Editor</h2>
          <div className="space-x-2">
            {needsBackfill && slides.length > 0 && (
              <Button
                onClick={backfillOrder}
                icon={RefreshCw}
                variant="secondary"
                size="sm"
                title="Backfill order for existing slides to enable reordering"
                className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              >
                Fix Order
              </Button>
            )}
            <Button
              onClick={() => handleCreateSlide('theory')}
              icon={Plus}
              variant="success"
              disabled={!canCreate}
            >
              Add Theory Slide
            </Button>
            <Button
              onClick={() => handleCreateSlide('question')}
              icon={Plus}
              variant="primary"
              disabled={!canCreate}
            >
              Add Question Slide
            </Button>
          </div>
        </div>
        {needsBackfill && slides.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <div className="text-yellow-600 text-sm">
                ⚠️ Legacy slides detected. Click "Fix Order" to enable drag-and-drop reordering.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {slides.map((slide, index) => (
          <div key={slide.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {slide.kind === 'theory' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      slide.kind === 'theory' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {slide.kind}
                    </span>
                    <h3 className="font-medium text-gray-900">{slide.title}</h3>
                  </div>
                  <div className="text-sm text-gray-500 max-w-md truncate">
                    <Math>{slide.content}</Math>
                  </div>
                  {slide.imageUrl && (
                    <img src={slide.imageUrl} alt={slide.title} className="mt-2 h-12 w-12 object-cover rounded" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveSlide(slide.id, 'up')}
                  disabled={index === 0 || needsBackfill}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={needsBackfill ? "Fix order first to enable reordering" : "Move up"}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSlide(slide.id, 'down')}
                  disabled={index === slides.length - 1 || needsBackfill}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={needsBackfill ? "Fix order first to enable reordering" : "Move down"}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditSlide(slide)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-4">No slides yet</div>
            <div className="space-x-2">
              <button
                onClick={() => handleCreateSlide('theory')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Theory Slide
              </button>
              <button
                onClick={() => handleCreateSlide('question')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Question Slide
              </button>
            </div>
          </div>
        )}
      </div>

      <SlideForm
        slide={selectedSlide}
        slideType={slideType}
        onSubmit={handleSubmitSlide}
        onClose={() => setIsFormOpen(false)}
        isOpen={isFormOpen}
      />
    </div>
  );
}

export default memo(SlidesEditor);