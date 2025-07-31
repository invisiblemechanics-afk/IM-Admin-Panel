import React from 'react';
import { useChapter } from '../../contexts/ChapterContext';
import { ChevronDown } from 'lucide-react';

export default function ChapterSelector() {
  const { chapters, selectedChapter, loading, error, selectChapter } = useChapter();

  if (loading) {
    return (
      <div className="mb-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md w-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md px-4 py-3 text-yellow-700">
          No chapters found. Please create a chapter first.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Chapter
      </label>
      <div className="relative">
        <select
          value={selectedChapter?.id ? String(selectedChapter.id) : ''}
          onChange={(e) => {
            const chapter = chapters.find(ch => String(ch.id) === e.target.value);
            if (chapter) {
              console.log('Selected chapter in ChapterSelector:', { id: chapter.id, slug: chapter.slug, name: chapter.name });
              selectChapter(chapter);
            }
          }}
          className="block w-full md:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
        >
          <option value="">Select a chapter...</option>
          {chapters.map((chapter) => (
            <option key={String(chapter.id)} value={String(chapter.id)}>
              {String(chapter.name || 'Unnamed')} ({String(chapter.subject || 'No Subject')})
            </option>
          ))}
        </select>
      </div>
      {selectedChapter && (
        <div className="mt-2 text-sm text-gray-600">
          Chapter slug: <code className="bg-gray-100 px-1 py-0.5 rounded">{String(selectedChapter.slug || 'no-slug')}</code>
        </div>
      )}
    </div>
  );
}