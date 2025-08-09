import React, { useState, useEffect, memo } from 'react';
import { Breakdown, QuestionType } from '../../types';
import { useChapter } from '../../contexts/ChapterContext';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from './Button';
import AutoGenerationButtons from './AutoGenerationButtons';
import SkillTagsMultiSelect from './SkillTagsMultiSelect';
import ImageUploader from './ImageUploader';
import { usePermissions } from '../../hooks/usePermissions';
import { ensureSkillTags } from '../../utils/skills';

interface BreakdownFormProps {
  breakdown?: Breakdown;
  onSubmit: (breakdown: Omit<Breakdown, 'id'>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

function BreakdownForm({ breakdown, onSubmit, onClose, isOpen }: BreakdownFormProps) {
  const { selectedChapter } = useChapter();
  const { canUseAI } = usePermissions();
  const [formData, setFormData] = useState<Omit<Breakdown, 'id'>>({
    title: '',
    description: '',
    chapterId: '', // Will be auto-populated from selected chapter
    skillTag: '',
    skillTags: [],
    type: 'MCQ',
    imageUrl: '',
    createdAt: null,
    updatedAt: null,
    choices: ['', ''],
    answerIndex: 0,
    answerIndices: [],
    range: { min: 0, max: 100 }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (breakdown) {
      // Get skill tags with fallback from legacy skillTag
      const skillTags = breakdown.skillTags && breakdown.skillTags.length 
        ? breakdown.skillTags 
        : (breakdown.skillTag ? [breakdown.skillTag] : []);
      
      setFormData({
        title: breakdown.title,
        description: breakdown.description,
        chapterId: breakdown.chapterId,
        skillTag: breakdown.skillTag || '',
        skillTags: skillTags,
        type: breakdown.type,
        imageUrl: breakdown.imageUrl || '',
        createdAt: breakdown.createdAt,
        updatedAt: breakdown.updatedAt,
        choices: breakdown.choices || ['', ''],
        answerIndex: breakdown.answerIndex || 0,
        answerIndices: breakdown.answerIndices || [],
        range: breakdown.range || { min: 0, max: 100 }
      });
    }
  }, [breakdown]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.skillTags || formData.skillTags.length === 0) {
      newErrors.skillTags = 'At least one skill tag is required';
    }

    // Validate answer fields based on question type
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
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Normalize skill tags
      const normalizedSkills = ensureSkillTags({ skillTags: formData.skillTags });
      
      // Auto-populate chapterId from selected chapter and include both skillTag and skillTags
      const finalData = {
        ...formData,
        chapterId: selectedChapter?.name || formData.chapterId,
        skillTag: normalizedSkills.skillTag,      // legacy single tag
        skillTags: normalizedSkills.skillTags     // canonical array
      };
      await onSubmit(finalData);
      onClose();
    } catch (error) {
      console.error('Failed to submit breakdown:', error);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {breakdown ? 'Edit Breakdown' : 'Create New Breakdown'}
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
              Question Text
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

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

          {/* Skill tags selection and generation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Tags
              </label>
              <SkillTagsMultiSelect
                source="global"
                chapterId={selectedChapter?.id}
                value={formData.skillTags || []}
                onChange={(skillTags) => setFormData(prev => ({ ...prev, skillTags }))}
                label="Skill Tags"
                placeholder="Search all chapters…"
                disabled={submitting}
              />
              {errors.skillTags && <p className="mt-1 text-sm text-red-600">{errors.skillTags}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
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
          </div>

          {/* AI helpers similar to Questions */}
          {formData.description && (
            <div className="space-y-3">
              <AutoGenerationButtons
                questionText={formData.description}
                questionType={formData.type}
                onSkillTagGenerated={(skillTag) => setFormData(prev => ({ ...prev, skillTag, skillTags: Array.from(new Set([...(prev.skillTags || []), skillTag])) }))}
                onSkillTagsGenerated={(skillTags) => setFormData(prev => ({ 
                  ...prev, 
                  skillTags: Array.from(new Set([...(prev.skillTags || []), ...skillTags]))
                }))}
                onTitleGenerated={(title) => setFormData(prev => ({ ...prev, title }))}
                onDifficultyGenerated={() => {}}
                onAllGenerated={(data) => setFormData(prev => ({ 
                  ...prev, 
                  title: data.title, 
                  skillTag: data.skillTag, 
                  skillTags: Array.from(new Set([...(prev.skillTags || []), ...data.skillTags])) 
                }))}
                disabled={!canUseAI}
              />
            </div>
          )}

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
              {breakdown ? 'Update Breakdown' : 'Create Breakdown'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(BreakdownForm);