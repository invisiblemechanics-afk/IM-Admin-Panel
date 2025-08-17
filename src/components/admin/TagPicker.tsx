import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

interface TagPickerProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function TagPicker({ selected, onChange, placeholder = 'Add skill tag...', className = '' }: TagPickerProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, 'Chapters'));
        const set = new Set<string>();
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          (data.skillTags || []).forEach((t: string) => set.add(String(t)));
        });
        setAllTags(Array.from(set).sort());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const available = useMemo(
    () => allTags.filter(t => !selected.includes(t) && t.toLowerCase().includes(query.toLowerCase())),
    [allTags, selected, query]
  );

  const addTag = (tag: string) => {
    const next = Array.from(new Set([...selected, tag]));
    onChange(next);
    setQuery('');
  };

  const removeTag = (tag: string) => {
    onChange(selected.filter(t => t !== tag));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {selected.map(tag => (
          <span key={tag} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-blue-700 hover:text-blue-900">×</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {query && available.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-44 overflow-auto bg-white border border-gray-200 rounded-md shadow">
            {available.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
      {!loading && allTags.length === 0 && (
        <div className="text-xs text-gray-500">No default skill tags found in Firestore `Chapters`.</div>
      )}
    </div>
  );
}












