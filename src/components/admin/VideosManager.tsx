import React, { useState, memo } from 'react';
import { ChapterVideo } from '../../types';
import { useChapterCollection } from '../../hooks/useChapterFirestore';
import { Plus, Edit, Trash2, Play } from 'lucide-react';
import VideoForm from './VideoForm';
import Button from './Button';
import { usePermissions } from '../../hooks/usePermissions';

const LoadingSkeleton = () => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="animate-pulse">
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
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
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
function VideosManager() {
  const { data: videos, loading, error, createItem, updateItem, deleteItem, selectedChapter } = useChapterCollection<ChapterVideo>('Theory');
  const [selectedVideo, setSelectedVideo] = useState<ChapterVideo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Check user permissions
  const { canDelete, canCreate, canUpdate } = usePermissions();

  const handleCreate = () => {
    setSelectedVideo(null);
    setIsFormOpen(true);
  };

  const handleEdit = (video: ChapterVideo) => {
    setSelectedVideo(video);
    setIsFormOpen(true);
  };

  const handleSubmit = async (videoData: Omit<ChapterVideo, 'id'>) => {
    if (selectedVideo) {
      await updateItem(selectedVideo.id, videoData);
    } else {
      await createItem(videoData);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('You do not have permission to delete videos.');
      return;
    }
    if (confirm('Are you sure you want to delete this video?')) {
      await deleteItem(id);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Chapter Videos</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Chapter Videos</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Chapter Videos</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-300 px-4 py-3 rounded text-yellow-800">
          <h3 className="font-medium mb-1">No Chapter Selected</h3>
          <p className="text-sm">Please select a chapter from the dropdown above to manage videos.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Chapter Videos</h1>
        <Button
          onClick={handleCreate}
          icon={Plus}
          variant="primary"
          disabled={!selectedChapter || !canCreate}
        >
          Create New
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '40%'}}>
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>
                Skill Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>
                Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%', minWidth: '150px'}}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 break-words">{video.title}</div>
                      <div className="text-sm text-gray-500 truncate">{video.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {video.skillTag}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(video.durationSec)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {video.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{minWidth: '150px'}}>
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={() => handleEdit(video)}
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                      className="p-2"
                    >
                      <span className="sr-only">Edit</span>
                    </Button>
                    {canDelete && (
                      <Button
                        onClick={() => handleDelete(video.id)}
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

        {videos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No videos found</div>
            <Button
              onClick={handleCreate}
              icon={Plus}
              variant="primary"
              className="mt-4"
            >
              Create your first video
            </Button>
          </div>
        )}
      </div>

      <VideoForm
        video={selectedVideo}
        onSubmit={handleSubmit}
        onClose={() => setIsFormOpen(false)}
        isOpen={isFormOpen}
      />
    </div>
  );
}

export default memo(VideosManager);