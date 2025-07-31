import React, { useState, memo } from 'react';
import { BreakdownSlide, QuestionType } from '../../types';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from './Button';

interface SlideFormProps {
  slide?: BreakdownSlide;
  onSubmit: (slide: Omit<BreakdownSlide, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  slideType: 'theory' | 'question';
}

function SlideForm({ slide, onSubmit, onClose, isOpen, slideType }: SlideFormProps) {
  const [formData, setFormData] = useState(() => {
    if (slide) {
      return slide;
    }
    
    const baseData = {
      kind: slideType,
      title: '',
      content: '',
      imageUrl: '',
      hint: ''
    };

    if (slideType === 'question') {
      return {
        ...baseData,
        kind: 'question' as const,
        type: 'MCQ' as QuestionType,
        skillTag: '',
        questionText: '',
        detailedAnswer: '',
        choices: ['', ''],
        answerIndex: 0,
        answerIndices: []
      };
    }

    return {
      ...baseData,
      kind: 'theory' as const
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';

    if (formData.kind === 'question') {
      const questionSlide = formData as any;
      if (!questionSlide.skillTag?.trim()) newErrors.skillTag = 'Skill tag is required';
      if (!questionSlide.questionText?.trim()) newErrors.questionText = 'Question text is required';
      if (!questionSlide.detailedAnswer?.trim()) newErrors.detailedAnswer = 'Detailed answer is required';

      if (questionSlide.type === 'MCQ' || questionSlide.type === 'MultipleAnswer') {
        if (!questionSlide.choices || questionSlide.choices.length < 2) {
          newErrors.choices = 'At least 2 choices are required';
        } else if (questionSlide.choices.some((choice: string) => !choice.trim())) {
          newErrors.choices = 'All choices must have content';
        }

        if (questionSlide.type === 'MCQ' && (questionSlide.answerIndex === undefined || questionSlide.answerIndex < 0)) {
          newErrors.answerIndex = 'One answer must be selected';
        }

        if (questionSlide.type === 'MultipleAnswer' && (!questionSlide.answerIndices || questionSlide.answerIndices.length === 0)) {
          newErrors.answerIndices = 'At least one answer must be selected';
        }
      }

      if (questionSlide.type === 'Numerical') {
        if (!questionSlide.range || questionSlide.range.min > questionSlide.range.max) {
          newErrors.range = 'Min value must be less than or equal to max value';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const { id, createdAt, updatedAt, ...slideData } = formData as any;
      await onSubmit(slideData);
      onClose();
    } catch (error) {
      console.error('Failed to submit slide:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addChoice = () => {
    if (formData.kind === 'question') {
      const questionSlide = formData as any;
      if (questionSlide.choices && questionSlide.choices.length < 6) {
        setFormData(prev => ({
          ...prev,
          choices: [...(prev as any).choices, '']
        }));
      }
    }
  };

  const removeChoice = (index: number) => {
    if (formData.kind === 'question') {
      const questionSlide = formData as any;
      if (questionSlide.choices && questionSlide.choices.length > 2) {
        const newChoices = questionSlide.choices.filter((_: any, i: number) => i !== index);
        setFormData(prev => ({
          ...prev,
          choices: newChoices,
          answerIndex: (prev as any).answerIndex >= index ? Math.max(0, (prev as any).answerIndex - 1) : (prev as any).answerIndex,
          answerIndices: (prev as any).answerIndices?.filter((i: number) => i !== index).map((i: number) => i > index ? i - 1 : i) || []
        }));
      }
    }
  };

  const updateChoice = (index: number, value: string) => {
    if (formData.kind === 'question') {
      setFormData(prev => ({
        ...prev,
        choices: (prev as any).choices?.map((choice: string, i: number) => i === index ? value : choice) || []
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {slide ? 'Edit' : 'Create New'} {slideType === 'theory' ? 'Theory' : 'Question'} Slide
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="text"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hint (Optional)
              </label>
              <input
                type="text"
                value={formData.hint || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formData.kind === 'question' && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Question Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={(formData as any).type}
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
                    Skill Tag
                  </label>
                  <input
                    type="text"
                    value={(formData as any).skillTag || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, skillTag: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.skillTag ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.skillTag && <p className="mt-1 text-sm text-red-600">{errors.skillTag}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text
                </label>
                <textarea
                  value={(formData as any).questionText || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.questionText ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.questionText && <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Answer
                </label>
                <textarea
                  value={(formData as any).detailedAnswer || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, detailedAnswer: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.detailedAnswer ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.detailedAnswer && <p className="mt-1 text-sm text-red-600">{errors.detailedAnswer}</p>}
              </div>

              {((formData as any).type === 'MCQ' || (formData as any).type === 'MultipleAnswer') && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Answer Choices
                    </label>
                    <button
                      type="button"
                      onClick={addChoice}
                      disabled={(formData as any).choices && (formData as any).choices.length >= 6}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Choice
                    </button>
                  </div>
                  
                  {(formData as any).choices?.map((choice: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      {(formData as any).type === 'MCQ' ? (
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={(formData as any).answerIndex === index}
                          onChange={() => setFormData(prev => ({ ...prev, answerIndex: index }))}
                          className="text-blue-600"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={(formData as any).answerIndices?.includes(index) || false}
                          onChange={(e) => {
                            const indices = (formData as any).answerIndices || [];
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, answerIndices: [...indices, index] }));
                            } else {
                              setFormData(prev => ({ ...prev, answerIndices: indices.filter((i: number) => i !== index) }));
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
                      {(formData as any).choices && (formData as any).choices.length > 2 && (
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

              {(formData as any).type === 'Numerical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Range
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Min Value</label>
                      <input
                        type="number"
                        value={(formData as any).range?.min || 0}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          range: { ...(prev as any).range, min: parseFloat(e.target.value) || 0 } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Max Value</label>
                      <input
                        type="number"
                        value={(formData as any).range?.max || 0}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          range: { ...(prev as any).range, max: parseFloat(e.target.value) || 0 } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {errors.range && <p className="mt-1 text-sm text-red-600">{errors.range}</p>}
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
              {slide ? 'Update Slide' : 'Create Slide'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(SlideForm);