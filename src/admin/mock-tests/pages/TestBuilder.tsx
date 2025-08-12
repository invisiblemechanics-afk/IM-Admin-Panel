import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Eye } from 'lucide-react';
import type { TestMeta, TestItem, ExamType, Chapter } from '../../../types';
import { createTest, updateTest, getTest, getTestItems, upsertTestItems } from '../data/mockTestApi';
import { fetchTestQuestionsAcrossChapters, type TestQuestionLite } from '../data/fetchTestQuestionsAcrossChapters';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import BuilderStepper from '../components/BuilderStepper';
import TypeChips from '../components/TypeChips';
import DifficultyBadge from '../components/DifficultyBadge';
import TagChips from '../components/TagChips';
import SelectedQuestions from '../components/SelectedQuestions';

const STEPS = [
  { title: 'Basics', description: 'Test details' },
  { title: 'Questions', description: 'Pick questions' },
  { title: 'Review', description: 'Review & publish' },
];

export default function TestBuilder() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(testId);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [testMeta, setTestMeta] = useState<Partial<TestMeta>>({
    name: '',
    description: '',
    exam: 'JEE Main',
    durationSec: 3600, // 1 hour default
    status: 'DRAFT',
    shuffleQuestions: false,
    shuffleOptions: false,
    marksCorrectDefault: null,
    marksWrongDefault: null,
    syllabusChapters: [],
    counts: {
      totalQuestions: 0,
      byType: { MCQ: 0, MultipleAnswer: 0, Numerical: 0 },
      byDifficulty: { easy: 0, moderate: 0, tough: 0 },
      totalMarks: 0,
    },
  });

  const [selectedQuestions, setSelectedQuestions] = useState<(TestItem & { title?: string })[]>([]);
  
  // Data for step 2
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<TestQuestionLite[]>([]);
  const [filters, setFilters] = useState({
    chapters: [] as string[],
    tags: [] as string[],
    types: [] as Array<'MCQ' | 'MultipleAnswer' | 'Numerical'>,
    searchText: '',
  });

  // Load existing test data if editing
  useEffect(() => {
    if (isEditing && testId) {
      loadTestData();
    }
  }, [isEditing, testId]);

  // Load chapters
  useEffect(() => {
    loadChapters();
  }, []);

  const loadTestData = async () => {
    if (!testId) return;
    
    try {
      setLoading(true);
      const [meta, items] = await Promise.all([
        getTest(testId),
        getTestItems(testId)
      ]);

      setTestMeta(meta);
      
      // Convert TestItems to include titles by fetching question data
      const questionsWithTitles = await Promise.all(
        items.map(async (item) => {
          try {
            // For now, we'll use the questionId as title
            // In a real implementation, you might want to fetch the actual question data
            return {
              ...item,
              title: `Question ${item.questionId.slice(0, 8)}...`,
            };
          } catch {
            return {
              ...item,
              title: 'Unknown Question',
            };
          }
        })
      );
      
      setSelectedQuestions(questionsWithTitles);
    } catch (err) {
      console.error('Failed to load test data:', err);
      setError('Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async () => {
    try {
      const snap = await getDocs(collection(db, 'Chapters'));
      const chaptersList = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as Chapter));
      setChapters(chaptersList);
    } catch (err) {
      console.error('Failed to load chapters:', err);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questions = await fetchTestQuestionsAcrossChapters({
        chapters: filters.chapters.length > 0 ? filters.chapters : undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        types: filters.types.length > 0 ? filters.types : undefined,
        exam: testMeta.exam as ExamType,
        status: 'ACTIVE',
        searchText: filters.searchText || undefined,
      });
      setAvailableQuestions(questions);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2) {
      loadQuestions();
    }
  }, [currentStep, filters, testMeta.exam]);

  const computeCounts = (questions: (TestItem & { title?: string })[]) => {
    const counts = {
      totalQuestions: questions.length,
      byType: { MCQ: 0, MultipleAnswer: 0, Numerical: 0 },
      byDifficulty: { easy: 0, moderate: 0, tough: 0 },
      totalMarks: 0,
    };

    questions.forEach(q => {
      counts.byType[q.type]++;
      if (q.difficultyBand) {
        counts.byDifficulty[q.difficultyBand]++;
      }
      const marks = q.marksCorrect ?? testMeta.marksCorrectDefault ?? 4;
      counts.totalMarks! += marks;
    });

    return counts;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddQuestion = (question: TestQuestionLite) => {
    const newItem: TestItem & { title?: string } = {
      order: selectedQuestions.length,
      refPath: question.refPath,
      chapterId: question.chapterId,
      questionId: question.id,
      type: question.type,
      skillTags: question.skillTags,
      difficulty: question.difficulty,
      difficultyBand: question.difficultyBand,
      marksCorrect: question.marksCorrect,
      marksWrong: question.marksWrong,
      timeSuggestedSec: question.timeSuggestedSec,
      title: question.title,
    };

    setSelectedQuestions([...selectedQuestions, newItem]);
  };

  const handleReorderQuestions = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...selectedQuestions];
    const [removed] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, removed);
    setSelectedQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    setSelectedQuestions(selectedQuestions.filter((_, i) => i !== index));
  };

  const handleUpdateQuestionMarks = (
    index: number, 
    marksCorrect?: number | null, 
    marksWrong?: number | null
  ) => {
    const newQuestions = [...selectedQuestions];
    newQuestions[index] = {
      ...newQuestions[index],
      marksCorrect,
      marksWrong,
    };
    setSelectedQuestions(newQuestions);
  };

  const handleSave = async (shouldPublish = false) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      
      const counts = computeCounts(selectedQuestions);
      const syllabusChapters = testMeta.syllabusChapters || [];
      const allSkillTags = Array.from(new Set(selectedQuestions.flatMap(q => q.skillTags)));
      
      const finalMeta: Partial<TestMeta> = {
        ...testMeta,
        status: shouldPublish ? 'PUBLISHED' : 'DRAFT',
        counts,
        syllabusChapters,
        skillTags: allSkillTags, // Auto-collected from selected questions
      };

      let savedTestId: string;
      
      if (isEditing && testId) {
        await updateTest(testId, finalMeta);
        savedTestId = testId;
      } else {
        savedTestId = await createTest(finalMeta, user.uid);
      }

      // Save questions
      await upsertTestItems(savedTestId, selectedQuestions);

      navigate('/admin/mock-tests');
    } catch (err) {
      console.error('Failed to save test:', err);
      setError('Failed to save test');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return testMeta.name && 
               testMeta.name.trim().length > 0 && 
               testMeta.syllabusChapters && 
               testMeta.syllabusChapters.length > 0;
      case 2:
        return selectedQuestions.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Name *
        </label>
        <input
          type="text"
          value={testMeta.name || ''}
          onChange={(e) => setTestMeta({ ...testMeta, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter test name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={testMeta.description || ''}
          onChange={(e) => setTestMeta({ ...testMeta, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter test description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Type
          </label>
          <select
            value={testMeta.exam}
            onChange={(e) => setTestMeta({ ...testMeta, exam: e.target.value as ExamType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="JEE Main">JEE Main</option>
            <option value="JEE Advanced">JEE Advanced</option>
            <option value="NEET">NEET</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={Math.floor((testMeta.durationSec || 0) / 60)}
            onChange={(e) => setTestMeta({ ...testMeta, durationSec: Number(e.target.value) * 60 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="shuffleQuestions"
            checked={testMeta.shuffleQuestions || false}
            onChange={(e) => setTestMeta({ ...testMeta, shuffleQuestions: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="shuffleQuestions" className="ml-2 text-sm text-gray-700">
            Shuffle Questions
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="shuffleOptions"
            checked={testMeta.shuffleOptions || false}
            onChange={(e) => setTestMeta({ ...testMeta, shuffleOptions: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="shuffleOptions" className="ml-2 text-sm text-gray-700">
            Shuffle Options
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Marks (Correct)
          </label>
          <input
            type="number"
            value={testMeta.marksCorrectDefault || ''}
            onChange={(e) => setTestMeta({ 
              ...testMeta, 
              marksCorrectDefault: e.target.value ? Number(e.target.value) : null 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Use per-question marks"
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank to use per-question marks</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Marks (Wrong)
          </label>
          <input
            type="number"
            value={testMeta.marksWrongDefault || ''}
            onChange={(e) => setTestMeta({ 
              ...testMeta, 
              marksWrongDefault: e.target.value ? Number(e.target.value) : null 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Use per-question marks"
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank to use per-question marks</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chapters *
          <span className="text-xs text-gray-500 ml-1">(Required for test syllabus)</span>
        </label>
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
          {chapters.map((chapter) => (
            <label key={chapter.id} className="flex items-center">
              <input
                type="checkbox"
                checked={testMeta.syllabusChapters?.includes(chapter.id) || false}
                onChange={(e) => {
                  const current = testMeta.syllabusChapters || [];
                  const updated = e.target.checked
                    ? [...current, chapter.id]
                    : current.filter(id => id !== chapter.id);
                  setTestMeta({ ...testMeta, syllabusChapters: updated });
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{chapter.name || chapter.title}</span>
            </label>
          ))}
        </div>
        {(!testMeta.syllabusChapters || testMeta.syllabusChapters.length === 0) && (
          <p className="text-xs text-red-500 mt-1">Please select at least one chapter for the test syllabus</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="grid grid-cols-3 gap-6">
      {/* Filters and Questions Library */}
      <div className="col-span-2 space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Question Library</h3>
          
          {/* Filters */}
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Search questions..."
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.types.includes('MCQ')}
                  onChange={(e) => {
                    const types = e.target.checked 
                      ? [...filters.types, 'MCQ']
                      : filters.types.filter(t => t !== 'MCQ');
                    setFilters({ ...filters, types });
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">MCQ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.types.includes('MultipleAnswer')}
                  onChange={(e) => {
                    const types = e.target.checked 
                      ? [...filters.types, 'MultipleAnswer']
                      : filters.types.filter(t => t !== 'MultipleAnswer');
                    setFilters({ ...filters, types });
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Multiple</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.types.includes('Numerical')}
                  onChange={(e) => {
                    const types = e.target.checked 
                      ? [...filters.types, 'Numerical']
                      : filters.types.filter(t => t !== 'Numerical');
                    setFilters({ ...filters, types });
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">Numerical</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading questions...</div>
          ) : availableQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No questions found</div>
          ) : (
            availableQuestions.map((question) => {
              const isSelected = selectedQuestions.some(sq => sq.questionId === question.id);
              return (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
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
                    </div>

                    <button
                      onClick={() => handleAddQuestion(question)}
                      disabled={isSelected}
                      className={`ml-4 px-3 py-1 text-sm font-medium rounded ${
                        isSelected 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSelected ? 'Added' : 'Add'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Questions Panel */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <SelectedQuestions
          questions={selectedQuestions}
          onReorder={handleReorderQuestions}
          onRemove={handleRemoveQuestion}
          onUpdateMarks={handleUpdateQuestionMarks}
          marksCorrectDefault={testMeta.marksCorrectDefault}
          marksWrongDefault={testMeta.marksWrongDefault}
        />

        {selectedQuestions.length > 0 && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="text-sm font-medium mb-2">Summary</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Total: {selectedQuestions.length} questions</div>
              <div>MCQ: {selectedQuestions.filter(q => q.type === 'MCQ').length}</div>
              <div>Multiple: {selectedQuestions.filter(q => q.type === 'MultipleAnswer').length}</div>
              <div>Numerical: {selectedQuestions.filter(q => q.type === 'Numerical').length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const counts = computeCounts(selectedQuestions);
    const autoCollectedSkillTags = Array.from(new Set(selectedQuestions.flatMap(q => q.skillTags)));
    const selectedChapterNames = testMeta.syllabusChapters?.map(chapterId => {
      const chapter = chapters.find(c => c.id === chapterId);
      return chapter?.name || chapter?.title || chapterId;
    }) || [];
    
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Test Summary</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name:</dt>
                  <dd className="text-gray-900">{testMeta.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Exam:</dt>
                  <dd className="text-gray-900">{testMeta.exam}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Duration:</dt>
                  <dd className="text-gray-900">{Math.floor((testMeta.durationSec || 0) / 60)} minutes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total Questions:</dt>
                  <dd className="text-gray-900">{counts.totalQuestions}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total Marks:</dt>
                  <dd className="text-gray-900">{counts.totalMarks}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Question Distribution</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">MCQ:</dt>
                  <dd className="text-gray-900">{counts.byType.MCQ}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Multiple Answer:</dt>
                  <dd className="text-gray-900">{counts.byType.MultipleAnswer}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Numerical:</dt>
                  <dd className="text-gray-900">{counts.byType.Numerical}</dd>
                </div>
              </dl>
              
              <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">Difficulty Distribution</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Easy:</dt>
                  <dd className="text-gray-900">{counts.byDifficulty.easy}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Moderate:</dt>
                  <dd className="text-gray-900">{counts.byDifficulty.moderate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tough:</dt>
                  <dd className="text-gray-900">{counts.byDifficulty.tough}</dd>
                </div>
              </dl>
            </div>
          </div>

          {testMeta.description && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{testMeta.description}</p>
            </div>
          )}

          {/* Syllabus Chapters */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Test Syllabus</h4>
            <div className="flex flex-wrap gap-2">
              {selectedChapterNames.map((chapterName) => (
                <span
                  key={chapterName}
                  className="inline-flex px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                >
                  {chapterName}
                </span>
              ))}
            </div>
          </div>

          {/* Auto-collected Skill Tags */}
          {autoCollectedSkillTags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Skill Tags 
                <span className="text-xs text-gray-500 ml-1">(Auto-collected from questions)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {autoCollectedSkillTags.slice(0, 10).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {autoCollectedSkillTags.length > 10 && (
                  <span className="text-xs text-gray-500 font-medium">
                    +{autoCollectedSkillTags.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </button>
          
          <button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Publish Test
          </button>
        </div>
      </div>
    );
  };

  if (loading && currentStep === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BuilderStepper currentStep={currentStep} steps={STEPS} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/mock-tests')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Test' : 'Create New Test'}
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          {currentStep < 3 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!validateStep() || loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
