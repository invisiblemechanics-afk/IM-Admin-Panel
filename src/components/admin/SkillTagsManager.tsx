import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search, Tag } from 'lucide-react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Chapter } from '../../types';
import Button from './Button';
import LoadingSpinner from '../LoadingSpinner';

interface SkillTagsManagerProps {}

export default function SkillTagsManager({}: SkillTagsManagerProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newSkillTag, setNewSkillTag] = useState('');

  // Load chapters from Firebase
  useEffect(() => {
    loadChapters();
  }, []);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const chaptersCollection = collection(db, 'Chapters');
      const snapshot = await getDocs(chaptersCollection);
      
      const chaptersData: Chapter[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];
      
      // Sort by name/title to maintain order, with null/undefined checks
      chaptersData.sort((a, b) => {
        const nameA = a.name || a.title || a.id || '';
        const nameB = b.name || b.title || b.id || '';
        return nameA.localeCompare(nameB);
      });
      
      setChapters(chaptersData);
      if (chaptersData.length > 0 && !selectedChapter) {
        setSelectedChapter(chaptersData[0]);
      }
    } catch (err) {
      console.error('Error loading chapters:', err);
      setError('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const updateChapterSkillTags = async (chapter: Chapter, newSkillTags: string[]) => {
    try {
      setSaving(true);
      const chapterRef = doc(db, 'Chapters', chapter.id);
      await updateDoc(chapterRef, {
        skillTags: newSkillTags,
        updatedAt: new Date()
      });
      
      // Update local state
      setChapters(prev => prev.map(c => 
        c.id === chapter.id 
          ? { ...c, skillTags: newSkillTags }
          : c
      ));
      
      if (selectedChapter?.id === chapter.id) {
        setSelectedChapter({ ...selectedChapter, skillTags: newSkillTags });
      }
    } catch (err) {
      console.error('Error updating skill tags:', err);
      setError('Failed to update skill tags');
    } finally {
      setSaving(false);
    }
  };

  const addSkillTag = () => {
    if (!selectedChapter || !newSkillTag.trim()) return;
    
    const skillTag = newSkillTag.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Check if tag already exists
    if (selectedChapter.skillTags?.includes(skillTag)) {
      setError('Skill tag already exists');
      return;
    }

    const newSkillTags = [...(selectedChapter.skillTags || []), skillTag];
    updateChapterSkillTags(selectedChapter, newSkillTags);
    setNewSkillTag('');
    setError(null);
  };

  const removeSkillTag = (index: number) => {
    if (!selectedChapter || !selectedChapter.skillTags) return;
    
    const newSkillTags = selectedChapter.skillTags.filter((_, i) => i !== index);
    updateChapterSkillTags(selectedChapter, newSkillTags);
  };

  const startEditing = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const saveEdit = () => {
    if (!selectedChapter || editingIndex === null || !selectedChapter.skillTags) return;
    
    const skillTag = editingValue.trim().toLowerCase().replace(/\s+/g, '-');
    if (!skillTag) return;
    
    // Check for duplicates (excluding current index)
    const existsInSkillTags = selectedChapter.skillTags.some((tag, i) => i !== editingIndex && tag === skillTag);
    
    if (existsInSkillTags) {
      setError('Skill tag already exists');
      return;
    }

    const newSkillTags = [...selectedChapter.skillTags];
    newSkillTags[editingIndex] = skillTag;
    
    updateChapterSkillTags(selectedChapter, newSkillTags);
    setEditingIndex(null);
    setEditingValue('');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  // Get skillTags from the chapter
  const allSkillTags = selectedChapter?.skillTags || [];
  
  const filteredSkillTags = allSkillTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Skill Tags Manager</h1>
        <div className="text-sm text-gray-600">
          Manage skill tags for OpenAI GPT auto-tagging
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Chapter Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Select Chapter</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedChapter?.id === chapter.id
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">Chapter {index + 1}</div>
              <div className="text-sm text-gray-600">{chapter.name || chapter.title || chapter.id}</div>
              <div className="text-xs text-gray-500 mt-1">
                {chapter.skillTags?.length || 0} skill tags
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedChapter && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {selectedChapter.name || selectedChapter.title || selectedChapter.id} - Skill Tags
            </h2>
            <div className="text-sm text-gray-600">
              {filteredSkillTags.length} skill tags
              {searchTerm && ` (filtered from ${allSkillTags.length})`}
            </div>
          </div>

          {/* Add New Skill Tag */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Add New Skill Tag</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSkillTag}
                onChange={(e) => setNewSkillTag(e.target.value)}
                placeholder="Enter new skill tag (e.g., 'Advanced Mechanics')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addSkillTag()}
              />
              <Button
                onClick={addSkillTag}
                icon={Plus}
                variant="primary"
                disabled={!newSkillTag.trim() || saving}
              >
                Add Tag
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Tags will be automatically formatted (lowercase, spaces replaced with hyphens)
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search skill tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Skill Tags List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSkillTags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No skill tags match your search' : 'No skill tags found'}
              </div>
            ) : (
              filteredSkillTags.map((skillTag, index) => {
                const originalIndex = selectedChapter.skillTags?.indexOf(skillTag) || -1;
                const isEditing = editingIndex === originalIndex;
                
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="p-1 text-green-600 hover:text-green-800"
                          disabled={saving}
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-mono text-sm">
                          {skillTag}
                        </span>
                        <button
                          onClick={() => startEditing(originalIndex, skillTag)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          disabled={saving}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSkillTag(originalIndex)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {saving && (
            <div className="flex items-center justify-center mt-4 p-4">
              <LoadingSpinner />
              <span className="ml-2 text-gray-600">Saving changes...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}