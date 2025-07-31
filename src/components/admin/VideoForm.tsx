import React, { useState, useEffect, memo } from 'react';
import { ChapterVideo } from '../../types';
import { X } from 'lucide-react';
import Button from './Button';

interface VideoFormProps {
  video?: ChapterVideo;
  onSubmit: (video: Omit<ChapterVideo, 'id'>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

function VideoForm({ video, onSubmit, onClose, isOpen }: VideoFormProps) {
  const [formData, setFormData] = useState<Omit<ChapterVideo, 'id'>>({
    title: '',
    description: '',
    skillTag: '',
    storagePath: '',
    thumbnailPath: '',
    durationSec: 0,
    difficulty: 5,
    order: 0,
    prereq: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description,
        skillTag: video.skillTag,
        storagePath: video.storagePath,
        thumbnailPath: video.thumbnailPath,
        durationSec: video.durationSec,
        difficulty: video.difficulty || 5,
        order: video.order,
        prereq: video.prereq || ''
      });
    }
  }, [video]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.skillTag.trim()) newErrors.skillTag = 'Skill tag is required';
    if (!formData.storagePath.trim()) newErrors.storagePath = 'Storage path is required';
    if (!formData.thumbnailPath.trim()) newErrors.thumbnailPath = 'Thumbnail path is required';
    if (formData.durationSec <= 0) newErrors.durationSec = 'Duration must be greater than 0';
    if (formData.order < 0) newErrors.order = 'Order must be 0 or greater';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit video:', error);
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
            {video ? 'Edit Video' : 'Create New Video'}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Path
              </label>
              <input
                type="text"
                value={formData.storagePath}
                onChange={(e) => setFormData(prev => ({ ...prev, storagePath: e.target.value }))}
                placeholder="path/to/video.mp4"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.storagePath ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.storagePath && <p className="mt-1 text-sm text-red-600">{errors.storagePath}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Path
              </label>
              <input
                type="text"
                value={formData.thumbnailPath}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnailPath: e.target.value }))}
                placeholder="path/to/thumbnail.jpg"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.thumbnailPath ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.thumbnailPath && <p className="mt-1 text-sm text-red-600">{errors.thumbnailPath}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                value={formData.durationSec}
                onChange={(e) => setFormData(prev => ({ ...prev, durationSec: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.durationSec ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.durationSec && <p className="mt-1 text-sm text-red-600">{errors.durationSec}</p>}
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.order ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.order && <p className="mt-1 text-sm text-red-600">{errors.order}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prerequisite (Optional)
              </label>
              <input
                type="text"
                value={formData.prereq || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, prereq: e.target.value }))}
                placeholder="Previous video title or ID"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.prereq ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.prereq && <p className="mt-1 text-sm text-red-600">{errors.prereq}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <input
              type="text"
              value={formData.prereq}
              onChange={(e) => setFormData(prev => ({ ...prev, prereq: e.target.value }))}
              placeholder="Other video ID or text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {video ? 'Update Video' : 'Create Video'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(VideoForm);