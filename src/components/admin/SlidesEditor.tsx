import React, { useState, useEffect, memo } from 'react';
import { BreakdownSlide } from '../../types';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, FileText, HelpCircle } from 'lucide-react';
import SlideForm from './SlideForm';
import Button from './Button';

interface SlidesEditorProps {
  breakdownId: string;
  chapterSlug: string;
}

function SlidesEditor({ breakdownId, chapterSlug }: SlidesEditorProps) {
  const [slides, setSlides] = useState<BreakdownSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState<BreakdownSlide | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [slideType, setSlideType] = useState<'theory' | 'question'>('theory');

  useEffect(() => {
    const slidesRef = collection(db, 'Chapters', chapterSlug, `${chapterSlug}-Breakdowns`, breakdownId, 'slides');
    const q = query(slidesRef, orderBy('createdAt'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const slidesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BreakdownSlide[];
      setSlides(slidesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [breakdownId, chapterSlug]);

  const handleCreateSlide = (type: 'theory' | 'question') => {
    setSelectedSlide(null);
    setSlideType(type);
    setIsFormOpen(true);
  };

  const handleEditSlide = (slide: BreakdownSlide) => {
    setSelectedSlide(slide);
    setSlideType(slide.kind);
    setIsFormOpen(true);
  };

  const handleSubmitSlide = async (slideData: Omit<BreakdownSlide, 'id' | 'createdAt' | 'updatedAt'>) => {
    const slidesRef = collection(db, 'Chapters', chapterSlug, `${chapterSlug}-Breakdowns`, breakdownId, 'slides');
    
    if (selectedSlide) {
      // Update existing slide
      await updateDoc(doc(db, 'Chapters', chapterSlug, `${chapterSlug}-Breakdowns`, breakdownId, 'slides', selectedSlide.id), {
        ...slideData,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new slide
      await addDoc(slidesRef, {
        ...slideData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (confirm('Are you sure you want to delete this slide?')) {
      await deleteDoc(doc(db, 'Chapters', chapterSlug, `${chapterSlug}-Breakdowns`, breakdownId, 'slides', slideId));
    }
  };

  const moveSlide = async (slideId: string, direction: 'up' | 'down') => {
    // Simple reordering by updating timestamps
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

    // Swap timestamps
          await updateDoc(doc(db, 'Chapters', chapterSlug, `${chapterSlug}-Breakdowns`, breakdownId, 'slides', currentSlide.id), {
      createdAt: targetSlide.createdAt
    });
    
          await updateDoc(doc(db, 'Chapters', chapterSlug, `${chapterSlug}-Breakdowns`, breakdownId, 'slides', targetSlide.id), {
      createdAt: currentSlide.createdAt
    });
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
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Slides Editor</h2>
        <div className="space-x-2">
          <Button
            onClick={() => handleCreateSlide('theory')}
            icon={Plus}
            variant="success"
          >
            Add Theory Slide
          </Button>
          <Button
            onClick={() => handleCreateSlide('question')}
            icon={Plus}
            variant="primary"
          >
            Add Question Slide
          </Button>
        </div>
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
                  <p className="text-sm text-gray-500 max-w-md truncate">{slide.content}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveSlide(slide.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSlide(slide.id, 'down')}
                  disabled={index === slides.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditSlide(slide)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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