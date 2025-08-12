import React, { useState } from 'react';
import { GripVertical, Trash2, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { TestItem } from '../../../types';
import TypeChips from './TypeChips';
import DifficultyBadge from './DifficultyBadge';
import TagChips from './TagChips';

interface SelectedQuestionsProps {
  questions: (TestItem & { title?: string })[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
  onUpdateMarks: (index: number, marksCorrect?: number | null, marksWrong?: number | null) => void;
  marksCorrectDefault?: number | null;
  marksWrongDefault?: number | null;
}

export default function SelectedQuestions({
  questions,
  onReorder,
  onRemove,
  onUpdateMarks,
  marksCorrectDefault,
  marksWrongDefault,
}: SelectedQuestionsProps) {
  const [loadingOriginalMarks, setLoadingOriginalMarks] = useState<{ [key: string]: boolean }>({});

  const moveUp = (index: number) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < questions.length - 1) {
      onReorder(index, index + 1);
    }
  };

  const fetchOriginalMarks = async (question: TestItem & { title?: string }, index: number) => {
    const loadingKey = `${question.questionId}-${index}`;
    setLoadingOriginalMarks(prev => ({ ...prev, [loadingKey]: true }));

    try {
      // Parse the refPath to get the document reference
      // refPath format: "Chapters/{chapterId}/{chapterName}-Test-Questions/{questionId}"
      const pathParts = question.refPath.split('/');
      if (pathParts.length !== 4) {
        throw new Error('Invalid refPath format');
      }

      const [, chapterId, collectionName, questionId] = pathParts;
      console.log('Fetching original marks from:', { chapterId, collectionName, questionId, refPath: question.refPath });
      
      const questionDocRef = doc(db, 'Chapters', chapterId, collectionName, questionId);
      
      const questionDoc = await getDoc(questionDocRef);
      
      if (questionDoc.exists()) {
        const questionData = questionDoc.data();
        const originalMarksCorrect = questionData.marksCorrect ?? null;
        const originalMarksWrong = questionData.marksWrong ?? null;
        
        console.log('Original marks found:', { 
          originalMarksCorrect, 
          originalMarksWrong, 
          partialScheme: questionData.partialScheme,
          timeSuggestedSec: questionData.timeSuggestedSec,
          status: questionData.status 
        });
        
        // Update the marks using the onUpdateMarks callback
        onUpdateMarks(index, originalMarksCorrect, originalMarksWrong);
        
        // Show success message with additional info if available
        const correctText = originalMarksCorrect !== null ? `+${originalMarksCorrect}` : 'default';
        const wrongText = originalMarksWrong !== null ? `${originalMarksWrong}` : 'default';
        const partialInfo = questionData.partialScheme && questionData.partialScheme.mode !== 'none' 
          ? ` (Partial: ${questionData.partialScheme.mode})` 
          : '';
        alert(`Marking scheme applied: Correct: ${correctText}, Wrong: ${wrongText}${partialInfo}`);
      } else {
        console.warn('Question document not found:', question.refPath);
        alert('Original question not found in database. Please check if the question exists in Test Questions.');
      }
    } catch (error) {
      console.error('Error fetching original marks:', error);
      alert('Failed to fetch original marking scheme. Please try again.');
    } finally {
      setLoadingOriginalMarks(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg font-medium mb-2">No questions selected</div>
        <div className="text-sm">Add questions from the library on the left</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Selected Questions ({questions.length})
        </h3>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={`${question.questionId}-${index}`}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <TypeChips type={question.type} />
                  {question.difficultyBand && (
                    <DifficultyBadge band={question.difficultyBand} />
                  )}
                </div>

                <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                  {question.title || 'Untitled Question'}
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  Chapter: {question.chapterId}
                </div>

                <TagChips tags={question.skillTags} maxVisible={3} />

                {/* Marks Override */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Correct:</label>
                      <input
                        type="number"
                        value={question.marksCorrect ?? marksCorrectDefault ?? ''}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null;
                          onUpdateMarks(index, value, question.marksWrong);
                        }}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Auto"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Wrong:</label>
                      <input
                        type="number"
                        value={question.marksWrong ?? marksWrongDefault ?? ''}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null;
                          onUpdateMarks(index, question.marksCorrect, value);
                        }}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Auto"
                      />
                    </div>
                  </div>
                  
                  {/* Use Assigned Marking Scheme Button */}
                  <button
                    onClick={() => fetchOriginalMarks(question, index)}
                    disabled={loadingOriginalMarks[`${question.questionId}-${index}`]}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Fetch and apply the original marking scheme from Test Questions"
                  >
                    {loadingOriginalMarks[`${question.questionId}-${index}`] ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Use Assigned Marking Scheme</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 ml-4">
                {/* Reorder buttons */}
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                
                <GripVertical className="w-4 h-4 text-gray-400" />
                
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === questions.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Remove button */}
                <button
                  onClick={() => onRemove(index)}
                  className="p-1 text-red-400 hover:text-red-600 mt-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
