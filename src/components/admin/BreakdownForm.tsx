import React, { useState, useEffect, memo } from 'react';
import { Breakdown, QuestionType } from '../../types';
import { useChapter } from '../../contexts/ChapterContext';
import { X } from 'lucide-react';
import Button from './Button';

interface BreakdownFormProps {
  breakdown?: Breakdown;
  onSubmit: (breakdown: Omit<Breakdown, 'id'>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

function BreakdownForm({ breakdown, onSubmit, onClose, isOpen }: BreakdownFormProps) {
  const { selectedChapter } = useChapter();
  const [formData, setFormData] = useState<Omit<Breakdown, 'id'>>({
    title: '',
    description: '',
    chapterId: '', // Will be auto-populated from selected chapter
    skillTag: '',
    type: 'MCQ',
    createdAt: null,
    updatedAt: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (breakdown) {
      setFormData({
        title: breakdown.title,
        description: breakdown.description,
        chapterId: breakdown.chapterId,
        skillTag: breakdown.skillTag,
        type: breakdown.type,
        createdAt: breakdown.createdAt,
        updatedAt: breakdown.updatedAt
      });
    }
  }, [breakdown]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    if (!formData.skillTag.trim()) newErrors.skillTag = 'Skill tag is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Auto-populate chapterId from selected chapter
      const finalData = {
        ...formData,
        chapterId: selectedChapter?.name || formData.chapterId
      };
      await onSubmit(finalData);
      onClose();
    } catch (error) {
      console.error('Failed to submit breakdown:', error);
    } finally {
      setSubmitting(false);
    }
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
              Description
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



          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Tag
              </label>
              <input
                type="text"
                value={formData.skillTag}
                onChange={(e) => setFormData(prev => ({ ...prev, skillTag: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.skillTag ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.skillTag && <p className="mt-1 text-sm text-red-600">{errors.skillTag}</p>}
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