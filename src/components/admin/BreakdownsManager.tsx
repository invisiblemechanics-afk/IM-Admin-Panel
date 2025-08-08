import React, { useState, memo } from 'react';
import { Breakdown } from '../../types';
import { useChapterCollection } from '../../hooks/useChapterFirestore';
import { Plus, Edit, Trash2, Layers } from 'lucide-react';
import BreakdownForm from './BreakdownForm';
import SlidesEditor from './SlidesEditor';
import Button from './Button';

const LoadingSkeleton = () => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="animate-pulse">
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border-t px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
function BreakdownsManager() {
  const { data: breakdowns, loading, error, createItem, updateItem, deleteItem, selectedChapter } = useChapterCollection<Breakdown>('Breakdowns');
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBreakdownId, setEditingBreakdownId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedBreakdown(null);
    setIsFormOpen(true);
  };

  const handleEdit = (breakdown: Breakdown) => {
    setSelectedBreakdown(breakdown);
    setIsFormOpen(true);
  };

  const handleSubmit = async (breakdownData: Omit<Breakdown, 'id'>) => {
    let breakdownId;
    if (selectedBreakdown) {
      await updateItem(selectedBreakdown.id, breakdownData);
      breakdownId = selectedBreakdown.id;
    } else {
      breakdownId = await createItem(breakdownData);
    }
    
    // Open slides editor after creating/updating
    setEditingBreakdownId(breakdownId);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this breakdown? This will also delete all associated slides.')) {
      await deleteItem(id);
    }
  };

  const handleEditSlides = (breakdownId: string) => {
    setEditingBreakdownId(breakdownId);
  };

  if (editingBreakdownId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setEditingBreakdownId(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Breakdowns
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {breakdowns.find(b => b.id === editingBreakdownId)?.title}
            </h1>
          </div>
        </div>
        <SlidesEditor breakdownId={editingBreakdownId} collectionSuffix="Breakdowns" />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Breakdowns</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Breakdowns</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Breakdowns</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-300 px-4 py-3 rounded text-yellow-800">
          <h3 className="font-medium mb-1">No Chapter Selected</h3>
          <p className="text-sm">Please select a chapter from the dropdown above to manage breakdowns.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Breakdowns</h1>
        <Button
          onClick={handleCreate}
          icon={Plus}
          variant="primary"
          disabled={!selectedChapter}
        >
          Create New
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chapter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skill Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {breakdowns.map((breakdown) => (
              <tr key={breakdown.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Layers className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{breakdown.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{breakdown.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {breakdown.chapterId}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {(
                      (breakdown as any).skillTags && (breakdown as any).skillTags.length > 0
                        ? (breakdown as any).skillTags
                        : [breakdown.skillTag].filter(Boolean)
                    ).map((tag: string) => (
                      <span key={tag} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    breakdown.type === 'MCQ' ? 'bg-green-100 text-green-800' :
                    breakdown.type === 'MultipleAnswer' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {breakdown.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    onClick={() => handleEditSlides(breakdown.id)}
                    variant="secondary"
                    size="sm"
                    icon={Layers}
                    className="mr-2 p-2"
                    title="Edit Slides"
                  >
                    <span className="sr-only">Edit Slides</span>
                  </Button>
                  <Button
                    onClick={() => handleEdit(breakdown)}
                    variant="secondary"
                    size="sm"
                    icon={Edit}
                    className="mr-2 p-2"
                  >
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    onClick={() => handleDelete(breakdown.id)}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    className="p-2"
                  >
                    <span className="sr-only">Delete</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {breakdowns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No breakdowns found</div>
            <Button
              onClick={handleCreate}
              icon={Plus}
              variant="primary"
              className="mt-4"
            >
              Create your first breakdown
            </Button>
          </div>
        )}
      </div>

      <BreakdownForm
        breakdown={selectedBreakdown}
        onSubmit={handleSubmit}
        onClose={() => setIsFormOpen(false)}
        isOpen={isFormOpen}
      />
    </div>
  );
}

export default memo(BreakdownsManager);