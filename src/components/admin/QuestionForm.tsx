import React, { useState, useEffect, memo } from 'react';
import { QuestionBase, QuestionType, ExamType, DiffBand, PartialScheme } from '../../types';
import { useChapter } from '../../contexts/ChapterContext';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from './Button';
import AutoGenerationButtons from './AutoGenerationButtons';
import LatexRefinementButton from './LatexRefinementButton';
import ImageUploader from './ImageUploader';
import SkillTagsMultiSelect from './SkillTagsMultiSelect';
import { usePermissions } from '../../hooks/usePermissions';
import { withComputedFields, defaultMarks } from '../../utils/testQuestionDefaults';
import { ensureSkillTags } from '../../utils/skills';

// Updated: Removed detailedAnswer field from form

interface QuestionFormProps {
  question?: QuestionBase;
  onSubmit: (question: Omit<QuestionBase, 'id'>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  collectionName?: string; // To detect if this is Test Questions
}

function QuestionForm({ question, onSubmit, onClose, isOpen, collectionName }: QuestionFormProps) {
  const { selectedChapter } = useChapter();
  const { canUseAI } = usePermissions();
  const isTestQuestion = collectionName === 'Test-Questions';
  
  const [formData, setFormData] = useState<Omit<QuestionBase, 'id'>>({
    type: 'MCQ' as QuestionType,
    title: '',
    skillTag: '',
    skillTags: [],
    questionText: '',
    chapter: '', // Will be auto-populated from selected chapter
    imageUrl: '',
    difficulty: 5,
    exam: 'JEE Main' as ExamType,
    choices: ['', ''],
    answerIndex: 0,
    answerIndices: [],
    range: { min: 0, max: 100 },
    // Test Question specific fields
    ...(isTestQuestion && {
      marksCorrect: 4,
      marksWrong: -1,
      timeSuggestedSec: 120,
      optionShuffle: true,
      status: 'ACTIVE' as const,
      partialScheme: { mode: 'none' } as PartialScheme
    })
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [marksTouched, setMarksTouched] = useState(false);

  useEffect(() => {
    if (question) {
      // Get skill tags with fallback from legacy skillTag
      const skillTags = question.skillTags && question.skillTags.length 
        ? question.skillTags 
        : (question.skillTag ? [question.skillTag] : []);
      
      setFormData({
        type: question.type || 'MCQ',
        title: question.title || '',
        skillTag: question.skillTag || '',
        skillTags: skillTags,
        questionText: question.questionText || '',
        chapter: question.chapter || '',
        imageUrl: question.imageUrl || '',
        difficulty: question.difficulty || 5,
        exam: question.exam || 'JEE Main',
        choices: question.choices || ['', ''],
        answerIndex: question.answerIndex || 0,
        answerIndices: question.answerIndices || [],
        range: question.range || { min: 0, max: 100 },
        // Test Question specific fields
        ...(isTestQuestion && {
          marksCorrect: question.marksCorrect ?? 4,
          marksWrong: question.marksWrong ?? -1,
          timeSuggestedSec: question.timeSuggestedSec ?? 120,
          optionShuffle: question.optionShuffle ?? true,
          status: question.status ?? 'ACTIVE',
          partialScheme: question.partialScheme ?? { mode: 'none' }
        })
      });
    } else {
      // Reset form for new question
      const defaultMarksValues = isTestQuestion ? defaultMarks('JEE Main', 'MCQ') : {};
      setFormData({
        type: 'MCQ' as QuestionType,
        title: '',
        skillTag: '',
        skillTags: [],
        questionText: '',
        chapter: '',
        imageUrl: '',
        difficulty: 5,
        exam: 'JEE Main' as ExamType,
        choices: ['', ''],
        answerIndex: 0,
        answerIndices: [],
        range: { min: 0, max: 100 },
        // Test Question specific fields
        ...(isTestQuestion && {
          marksCorrect: defaultMarksValues.correct,
          marksWrong: defaultMarksValues.wrong,
          timeSuggestedSec: 120,
          optionShuffle: true,
          status: 'ACTIVE' as const,
          partialScheme: { mode: 'none' } as PartialScheme
        })
      });
    }
    // Clear errors when question changes
    setErrors({});
    setMarksTouched(false);
  }, [question, isTestQuestion]);

  // Reactive marks update for Test Questions when exam or type changes
  useEffect(() => {
    if (isTestQuestion && !marksTouched && !question) {
      const newMarks = defaultMarks(formData.exam || 'JEE Main', formData.type || 'MCQ');
      setFormData(prev => ({
        ...prev,
        marksCorrect: newMarks.correct,
        marksWrong: newMarks.wrong
      }));
    }
  }, [formData.exam, formData.type, isTestQuestion, marksTouched, question]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.skillTags || formData.skillTags.length === 0) newErrors.skillTags = 'At least one skill tag is required';

    if (!formData.questionText.trim()) newErrors.questionText = 'Question text is required';

    if (formData.difficulty < 1 || formData.difficulty > 10) newErrors.difficulty = 'Difficulty must be between 1 and 10';

    if (formData.type === 'MCQ' || formData.type === 'MultipleAnswer') {
      if (!formData.choices || formData.choices.length < 2) {
        newErrors.choices = 'At least 2 choices are required';
      } else if (formData.choices.some(choice => !choice.trim())) {
        newErrors.choices = 'All choices must have content';
      }

      if (formData.type === 'MCQ' && (formData.answerIndex === undefined || formData.answerIndex < 0)) {
        newErrors.answerIndex = 'One answer must be selected';
      }

      if (formData.type === 'MultipleAnswer' && (!formData.answerIndices || formData.answerIndices.length === 0)) {
        newErrors.answerIndices = 'At least one answer must be selected';
      }
    }

    if (formData.type === 'Numerical') {
      if (!formData.range || formData.range.min > formData.range.max) {
        newErrors.range = 'Min value must be less than or equal to max value';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Form data before cleaning:', JSON.stringify(formData, null, 2));
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setSubmitting(true);
    try {
      // Normalize skill tags and prepare data
      const normalizedSkills = ensureSkillTags({ skillTags: formData.skillTags });
      
      // Clean the data and remove any undefined values
      const cleanedData: any = {
        type: formData.type || 'MCQ',
        title: formData.title || '',
        skillTag: normalizedSkills.skillTag,      // legacy single tag
        skillTags: normalizedSkills.skillTags,    // canonical array
        questionText: formData.questionText || '',
        chapter: selectedChapter?.name || formData.chapter || '',
        imageUrl: formData.imageUrl || '',
        difficulty: formData.difficulty || 5,
        exam: formData.exam || 'JEE Main',
        choices: formData.choices || [],
        answerIndex: formData.answerIndex || 0,
        answerIndices: formData.answerIndices || [],
        range: formData.range || { min: 0, max: 100 }
      };

      // Include Test Question specific fields if this is a Test Question
      if (isTestQuestion) {
        cleanedData.marksCorrect = formData.marksCorrect;
        cleanedData.marksWrong = formData.marksWrong;
        cleanedData.timeSuggestedSec = formData.timeSuggestedSec;
        cleanedData.optionShuffle = formData.optionShuffle;
        cleanedData.status = formData.status;
        cleanedData.partialScheme = formData.partialScheme;
      }

      // Filter out any remaining undefined values
      let finalData = Object.fromEntries(
        Object.entries(cleanedData).filter(([_, value]) => value !== undefined)
      ) as Omit<QuestionBase, 'id'>;

      // Apply computed fields for Test Questions
      if (isTestQuestion) {
        finalData = withComputedFields(finalData);
        // Remove numerical field if it exists
        if ('numerical' in finalData) {
          delete (finalData as any).numerical;
        }
      }

      console.log('Cleaned final data:', JSON.stringify(finalData, null, 2));
      await onSubmit(finalData);
      console.log('Form submitted successfully');
      onClose(); // Close the form on success
    } catch (error) {
      console.error('Failed to submit question:', error);
      alert('Failed to create question. Please try again. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const addChoice = () => {
    if (formData.choices && formData.choices.length < 6) {
      setFormData(prev => ({
        ...prev,
        choices: [...(prev.choices || []), '']
      }));
    }
  };

  const removeChoice = (index: number) => {
    if (formData.choices && formData.choices.length > 2) {
      const newChoices = formData.choices.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        choices: newChoices,
        answerIndex: prev.answerIndex && prev.answerIndex >= index ? Math.max(0, prev.answerIndex - 1) : prev.answerIndex,
        answerIndices: prev.answerIndices?.filter(i => i !== index).map(i => i > index ? i - 1 : i) || []
      }));
    }
  };

  const updateChoice = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices?.map((choice, i) => i === index ? value : choice) || []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] relative" style={{ zIndex: 10000, overflowY: 'auto', overflowX: 'visible' }}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {question ? 'Edit Question' : 'Create New Question'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" style={{ paddingBottom: '120px' }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as QuestionType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MCQ">Multiple Choice (Single Answer)</option>
              <option value="MultipleAnswer">Multiple Choice (Multiple Answers)</option>
              <option value="Numerical">Numerical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter question title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <SkillTagsMultiSelect
              source="global"
              chapterId={selectedChapter?.id}
              value={formData.skillTags}
              onChange={(skillTags) => setFormData(prev => ({ ...prev, skillTags }))}
              label="Skill Tags"
              placeholder="Search all chapters…"
              disabled={submitting}
            />
            {errors.skillTags && <p className="mt-1 text-sm text-red-600">{errors.skillTags}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
              rows={5}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.questionText ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your question with LaTeX mathematical notation..."
            />
            {errors.questionText && <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>}
          </div>

          {/* AI LaTeX Refinement Section */}
          {formData.questionText && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                  🔧 LaTeX Refinement & Content Generation
                </h3>
                <LatexRefinementButton
                  content={formData.questionText}
                  contentType="question"
                  onContentRefined={(refinedContent) => 
                    setFormData(prev => ({ ...prev, questionText: refinedContent }))
                  }
                  disabled={submitting || !canUseAI}
                />
              </div>
            </div>
          )}

          {/* AI Auto-Generation Section */}
          {formData.questionText && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <AutoGenerationButtons
                questionText={formData.questionText}
                questionType={formData.type}
                exam={formData.exam}
                onSkillTagGenerated={(skillTag) => setFormData(prev => ({ ...prev, skillTag }))}
                onSkillTagsGenerated={(skillTags) => setFormData(prev => ({ 
                  ...prev, 
                  skillTags: Array.from(new Set([...prev.skillTags, ...skillTags]))
                }))}
                onTitleGenerated={(title) => setFormData(prev => ({ ...prev, title }))}
                onDifficultyGenerated={(difficulty) => setFormData(prev => ({ ...prev, difficulty }))}
                onAllGenerated={(data) => setFormData(prev => ({
                  ...prev,
                  skillTag: data.skillTag,
                  skillTags: Array.from(new Set([...prev.skillTags, ...data.skillTags])),
                  title: data.title,
                  difficulty: data.difficulty
                }))}
                disabled={submitting || !canUseAI}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image (Optional)
            </label>
            <ImageUploader
              value={formData.imageUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              disabled={submitting}
            />
            {errors.imageUrl && <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 1 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.difficulty ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.difficulty && <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>}
            </div>

            <div style={{ position: 'relative', zIndex: 1000 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam
              </label>
              <div className="relative">
                <select
                  value={formData.exam}
                  onChange={(e) => setFormData(prev => ({ ...prev, exam: e.target.value as ExamType }))}
                  className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer ${
                    errors.exam ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{ 
                    position: 'relative',
                    zIndex: 1001
                  }}
                >
                  <option value="JEE Main">JEE Main</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="NEET">NEET</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.exam && <p className="mt-1 text-sm text-red-600">{errors.exam}</p>}
            </div>
          </div>

          {(formData.type === 'MCQ' || formData.type === 'MultipleAnswer') && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Choices
                </label>
                <button
                  type="button"
                  onClick={addChoice}
                  disabled={formData.choices && formData.choices.length >= 6}
                  className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Choice
                </button>
              </div>
              
              {formData.choices?.map((choice, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  {formData.type === 'MCQ' ? (
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.answerIndex === index}
                      onChange={() => setFormData(prev => ({ ...prev, answerIndex: index }))}
                      className="text-blue-600"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={formData.answerIndices?.includes(index) || false}
                      onChange={(e) => {
                        const indices = formData.answerIndices || [];
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, answerIndices: [...indices, index] }));
                        } else {
                          setFormData(prev => ({ ...prev, answerIndices: indices.filter(i => i !== index) }));
                        }
                      }}
                      className="text-blue-600"
                    />
                  )}
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => updateChoice(index, e.target.value)}
                    placeholder={`Choice ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.choices && formData.choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {errors.choices && <p className="mt-1 text-sm text-red-600">{errors.choices}</p>}
              {errors.answerIndex && <p className="mt-1 text-sm text-red-600">{errors.answerIndex}</p>}
              {errors.answerIndices && <p className="mt-1 text-sm text-red-600">{errors.answerIndices}</p>}
            </div>
          )}

          {formData.type === 'Numerical' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Range
              </label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Min Value</label>
                  <input
                    type="number"
                    value={formData.range?.min || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      range: { ...prev.range!, min: parseFloat(e.target.value) || 0 } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Max Value</label>
                  <input
                    type="number"
                    value={formData.range?.max || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      range: { ...prev.range!, max: parseFloat(e.target.value) || 0 } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {errors.range && <p className="mt-1 text-sm text-red-600">{errors.range}</p>}
            </div>
          )}

          {/* Test Question specific fields */}
          {isTestQuestion && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Test Question Settings</h3>
              </div>

              {/* Marks section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marks for Correct Answer
                  </label>
                  <input
                    type="number"
                    value={formData.marksCorrect || 0}
                    onChange={(e) => {
                      setMarksTouched(true);
                      setFormData(prev => ({ ...prev, marksCorrect: parseFloat(e.target.value) || 0 }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marks for Wrong Answer
                  </label>
                  <input
                    type="number"
                    value={formData.marksWrong || 0}
                    onChange={(e) => {
                      setMarksTouched(true);
                      setFormData(prev => ({ ...prev, marksWrong: parseFloat(e.target.value) || 0 }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Suggested (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.timeSuggestedSec || 120}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeSuggestedSec: parseInt(e.target.value) || 120 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'RETIRED' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>

              {/* Option Shuffle for MCQ types */}
              {(formData.type === 'MCQ' || formData.type === 'MultipleAnswer') && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.optionShuffle ?? true}
                      onChange={(e) => setFormData(prev => ({ ...prev, optionShuffle: e.target.checked }))}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Shuffle answer choices during test
                    </span>
                  </label>
                </div>
              )}

              {/* Partial Scoring for Multiple Answer */}
              {formData.type === 'MultipleAnswer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partial Scoring Scheme
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="partialScheme"
                        checked={(formData.partialScheme as PartialScheme)?.mode === 'none'}
                        onChange={() => setFormData(prev => ({ ...prev, partialScheme: { mode: 'none' } }))}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">No partial marks</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="partialScheme"
                        checked={(formData.partialScheme as PartialScheme)?.mode === 'allCorrectOrZero'}
                        onChange={() => setFormData(prev => ({ ...prev, partialScheme: { mode: 'allCorrectOrZero' } }))}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">All correct or zero</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="partialScheme"
                        checked={(formData.partialScheme as PartialScheme)?.mode === 'perOption'}
                        onChange={() => setFormData(prev => ({ ...prev, partialScheme: { mode: 'perOption', perOptionMarks: 1 } }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Per correct option:</span>
                      <input
                        type="number"
                        value={(formData.partialScheme as any)?.perOptionMarks || 1}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          partialScheme: { mode: 'perOption', perOptionMarks: parseFloat(e.target.value) || 1 } 
                        }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.5"
                        disabled={(formData.partialScheme as PartialScheme)?.mode !== 'perOption'}
                      />
                      <span className="text-sm text-gray-700">marks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="partialScheme"
                        checked={(formData.partialScheme as PartialScheme)?.mode === 'negativePerWrong'}
                        onChange={() => setFormData(prev => ({ ...prev, partialScheme: { mode: 'negativePerWrong', perWrong: -0.5 } }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Negative per wrong:</span>
                      <input
                        type="number"
                        value={(formData.partialScheme as any)?.perWrong || -0.5}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          partialScheme: { mode: 'negativePerWrong', perWrong: parseFloat(e.target.value) || -0.5 } 
                        }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.5"
                        disabled={(formData.partialScheme as PartialScheme)?.mode !== 'negativePerWrong'}
                      />
                      <span className="text-sm text-gray-700">marks</span>
                    </div>
                  </div>
                </div>
              )}


            </>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              variant="primary"
            >
              {question ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MemoizedQuestionForm = memo(QuestionForm);
export default MemoizedQuestionForm;