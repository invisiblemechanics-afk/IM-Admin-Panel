import React, { useState, memo } from 'react';
import { QuestionBase } from '../../types';
import { useChapterCollection } from '../../hooks/useChapterFirestore';
import { Plus, Edit, Trash2, Layers, RefreshCw } from 'lucide-react';
import QuestionForm from './QuestionForm';
import SlidesEditor from './SlidesEditor';
import Button from './Button';
import { usePermissions } from '../../hooks/usePermissions';
import { collection, query, getDocs, writeBatch, orderBy, limit, startAfter, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import { withComputedFields } from '../../utils/testQuestionDefaults';
import { backfillSkillTagsForChapter } from '../../utils/backfillSkillTags';
import { getDisplaySkillTags } from '../../utils/skills';

interface QuestionsManagerProps {
  title: string;
  collectionName: string;
}

const LoadingSkeleton = () => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="animate-pulse">
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border-t px-6 py-4">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
function QuestionsManager({ title, collectionName }: QuestionsManagerProps) {
  // Use chapter-based collection hook
  const { data: questions, loading, error, createItem, updateItem, deleteItem, selectedChapter } = useChapterCollection<QuestionBase>(collectionName);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBase | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [backfillingSkillTags, setBackfillingSkillTags] = useState(false);
  
  // Check user permissions
  const { canDelete, canCreate, canUpdate } = usePermissions();
  
  const isTestQuestion = collectionName === 'Test-Questions';

  const handleBackfillTestQuestionFields = async () => {
    if (!selectedChapter || !isTestQuestion) return;

    setBackfilling(true);
    try {
      const chapterName = selectedChapter.name || selectedChapter.slug;
      const collectionPath = `Chapters/${selectedChapter.id}/${chapterName}-${collectionName}`;
      const col = collection(db, collectionPath);
      
      let last: any = null;
      let total = 0;

      while (true) {
        const q = last
          ? query(col, orderBy('createdAt', 'asc'), startAfter(last), limit(400))
          : query(col, orderBy('createdAt', 'asc'), limit(400));

        const snap = await getDocs(q);
        if (snap.empty) break;

        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          const data = d.data() as any;
          const computed = withComputedFields({
            exam: data.exam || 'JEE Main',
            type: data.type || 'MCQ',
            difficulty: data.difficulty || 5,
            difficultyBand: data.difficultyBand,
            marksCorrect: data.marksCorrect,
            marksWrong: data.marksWrong,
            timeSuggestedSec: data.timeSuggestedSec,
            optionShuffle: data.optionShuffle,
            partialScheme: data.partialScheme,
            status: data.status,
          });
          // Remove numerical field if it exists
          if ('numerical' in computed) {
            delete (computed as any).numerical;
          }
          batch.update(d.ref, { ...computed, updatedAt: serverTimestamp() });
        });
        await batch.commit();

        total += snap.size;
        last = snap.docs[snap.docs.length - 1];
        if (snap.size < 400) break;
      }

      alert(`Successfully backfilled ${total} test questions in ${chapterName} chapter`);
    } catch (error) {
      console.error('Backfill error:', error);
      alert('Failed to backfill questions. Please try again.');
    } finally {
      setBackfilling(false);
    }
  };

  const handleCleanupNumericalFields = async () => {
    if (!selectedChapter || !isTestQuestion) return;

    setCleaningUp(true);
    try {
      const chapterName = selectedChapter.name || selectedChapter.slug;
      const collectionPath = `Chapters/${selectedChapter.id}/${chapterName}-${collectionName}`;
      const col = collection(db, collectionPath);
      
      const snap = await getDocs(query(col));
      if (snap.empty) {
        alert('No questions found to clean up.');
        return;
      }

      const batch = writeBatch(db);
      let cleanedCount = 0;
      
      snap.docs.forEach(d => {
        const data = d.data() as any;
        if (data.numerical != null) {
          batch.update(d.ref, { numerical: deleteField(), updatedAt: serverTimestamp() });
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        await batch.commit();
        alert(`Removed 'numerical' field from ${cleanedCount} existing questions.`);
      } else {
        alert('No questions with numerical field found.');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Failed to cleanup numerical fields. Please try again.');
    } finally {
      setCleaningUp(false);
    }
  };

  const handleBackfillSkillTags = async () => {
    if (!selectedChapter) return;

    setBackfillingSkillTags(true);
    try {
      const chapterName = selectedChapter.name || selectedChapter.slug;
      const updated = await backfillSkillTagsForChapter(selectedChapter.id, chapterName);
      
      if (updated > 0) {
        alert(`Successfully backfilled skillTags for ${updated} questions across all collections in ${chapterName} chapter`);
      } else {
        alert('No questions needed skillTags backfill.');
      }
    } catch (error) {
      console.error('Backfill skill tags error:', error);
      alert('Failed to backfill skill tags. Please try again.');
    } finally {
      setBackfillingSkillTags(false);
    }
  };

  const handleCreate = () => {
    setSelectedQuestion(null);
    setIsFormOpen(true);
  };

  const handleEdit = (question: QuestionBase) => {
    setSelectedQuestion(question);
    setIsFormOpen(true);
  };

  const handleSubmit = async (questionData: Omit<QuestionBase, 'id'>) => {
    console.log('QuestionsManager handleSubmit called with:', JSON.stringify(questionData, null, 2));
    try {
      let questionId;
      if (selectedQuestion) {
        console.log('Updating existing question:', selectedQuestion.id);
        await updateItem(selectedQuestion.id, questionData);
        questionId = selectedQuestion.id;
      } else {
        console.log('Creating new question');
        questionId = await createItem(questionData);
      }
      console.log('Operation successful, result:', questionId);
      
      // Close form and reset state after successful submission
      setIsFormOpen(false);
      setSelectedQuestion(null);
      console.log('Form closed and state reset');
      
      // Open slides editor after creating/updating
      setEditingQuestionId(questionId);
    } catch (error) {
      console.error('Error submitting question:', error);
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleEditSlides = (questionId: string) => {
    setEditingQuestionId(questionId);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('You do not have permission to delete questions.');
      return;
    }
    if (confirm('Are you sure you want to delete this question?')) {
      console.log('Deleting question:', id);
      await deleteItem(id);
    }
  };

  if (editingQuestionId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setEditingQuestionId(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to {title}
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {questions.find(q => q.id === editingQuestionId)?.title || 'Answer Slides'}
            </h1>
          </div>
        </div>
        <SlidesEditor 
          questionId={editingQuestionId} 
          collectionSuffix={collectionName}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <Button
            onClick={handleCreate}
            icon={Plus}
            variant="primary"
          >
            Create New
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <strong>Connection Error:</strong> {error}
          </div>
          <div className="text-red-600 text-sm mt-2">
            Please check your Firebase configuration in src/firebase.ts
          </div>
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-300 px-4 py-3 rounded text-yellow-800">
          <h3 className="font-medium mb-1">No Chapter Selected</h3>
          <p className="text-sm">Please select a chapter from the dropdown above to manage questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="flex space-x-3">
          <Button
            onClick={handleBackfillSkillTags}
            icon={RefreshCw}
            variant="secondary"
            loading={backfillingSkillTags}
            disabled={!selectedChapter || backfillingSkillTags || backfilling || cleaningUp}
          >
            Backfill Skill Tags
          </Button>
          {isTestQuestion && (
            <>
              <Button
                onClick={handleBackfillTestQuestionFields}
                icon={RefreshCw}
                variant="secondary"
                loading={backfilling}
                disabled={!selectedChapter || backfilling || cleaningUp || backfillingSkillTags}
              >
                Backfill Fields
              </Button>
              <Button
                onClick={handleCleanupNumericalFields}
                icon={Trash2}
                variant="secondary"
                loading={cleaningUp}
                disabled={!selectedChapter || backfilling || cleaningUp || backfillingSkillTags}
              >
                Cleanup Numerical
              </Button>
            </>
          )}
          <Button
            onClick={handleCreate}
            icon={Plus}
            variant="primary"
            disabled={!selectedChapter || !canCreate}
          >
            Create New
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '80px'}}>
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                Skill Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '35%'}}>
                Question
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%', minWidth: '150px'}}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map((question) => (
              <tr key={question.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  {question.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium break-words">
                    {question.title || 'No Title'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center gap-1 flex-wrap max-w-[260px]">
                    {(() => {
                      const tags = getDisplaySkillTags(question);
                      return (
                        <>
                          {tags.slice(0, 2).map(tag => (
                            <span key={tag} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{tags.length - 2}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    question.type === 'MCQ' ? 'bg-green-100 text-green-800' :
                    question.type === 'MultipleAnswer' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {question.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-[520px]">
                    <p className="clamp-2 text-sm leading-5 text-gray-700" title={question.questionText}>
                      {question.questionText}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{minWidth: '150px'}}>
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={() => handleEditSlides(question.id)}
                      variant="secondary"
                      size="sm"
                      icon={Layers}
                      className="p-2"
                      title="Edit Answer Slides"
                    >
                      <span className="sr-only">Edit Answer Slides</span>
                    </Button>
                    <Button
                      onClick={() => handleEdit(question)}
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                      className="p-2"
                    >
                      <span className="sr-only">Edit</span>
                    </Button>
                    {canDelete && (
                      <Button
                        onClick={() => handleDelete(question.id)}
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        className="p-2"
                      >
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {questions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No questions found</div>
            <Button
              onClick={handleCreate}
              icon={Plus}
              variant="primary"
              className="mt-4"
            >
              Create your first question
            </Button>
          </div>
        )}
      </div>

              <QuestionForm
          question={selectedQuestion}
          onSubmit={handleSubmit}
          onClose={() => setIsFormOpen(false)}
          isOpen={isFormOpen}
          collectionName={collectionName}
        />
    </div>
  );
}

export default memo(QuestionsManager);