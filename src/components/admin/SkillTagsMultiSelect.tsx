import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAllSkillTags, SkillTagOption } from '../../lib/useAllSkillTags';

type Props = {
  // If source is "global", we ignore chapterId and show tags from all chapters.
  source?: 'global' | 'chapter';
  chapterId?: string;
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function SkillTagsMultiSelect({
  source = 'global',
  chapterId,
  value,
  onChange,
  label = 'Skill Tags',
  placeholder = 'Search tags…',
  disabled = false,
}: Props) {
  const [allTags, setAllTags] = useState<SkillTagOption[]>([]);
  const [query, setQuery] = useState('');

  const { tags: globalTags } = useAllSkillTags();

  useEffect(() => {
    let cancelled = false;

    async function loadChapterTags() {
      if (!chapterId) return setAllTags([]);
      const snap = await getDoc(doc(db, 'Chapters', chapterId));
      const arr: string[] = Array.isArray(snap.data()?.skillTags) ? snap.data()!.skillTags : [];
      const chapterName = (snap.data()?.name as string) ?? chapterId;
      const opts = arr.map((t) => ({ value: t, label: t, chapterId, chapterName }));
      if (!cancelled) setAllTags(opts);
    }

    if (source === 'global') setAllTags(globalTags);
    else loadChapterTags();

    return () => { cancelled = true; };
  }, [source, chapterId, globalTags]);

  const filtered = useMemo(
    () =>
      allTags.filter((t) =>
        t.label.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [allTags, query]
  );

  const toggle = (tag: string) => {
    if (disabled) return;
    const set = new Set(value);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    onChange(Array.from(set));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-gray-500 font-normal">(choose one or more)</span>
      </label>
      
      <input
        type="text"
        placeholder={placeholder}
        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        value={query}
        onChange={e => setQuery(e.target.value)}
        disabled={disabled}
      />
      
      <div className="max-h-44 overflow-auto border border-gray-300 rounded-md p-2 bg-gray-50">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {filtered.map((opt) => {
              const selected = value.includes(opt.value);
              return (
                <button
                  key={`${opt.value}__${opt.chapterId}`}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  disabled={disabled}
                  className={`text-left px-2 py-1 rounded text-sm border transition-colors ${
                    selected 
                      ? 'bg-blue-100 border-blue-300 text-blue-800' 
                      : 'border-gray-200 hover:bg-gray-100 disabled:hover:bg-gray-50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={`From: ${opt.chapterName}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{opt.label}</span>
                    {source === 'global' && (
                      <span className="text-[10px] text-gray-500">[{opt.chapterName}]</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 p-2">No tags found</div>
        )}
      </div>

      {/* Selected tags chips */}
      {value.length > 0 && (
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">Selected tags:</div>
          <div className="flex flex-wrap gap-2">
            {value.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-200 px-3 py-1 text-sm text-blue-800"
              >
                {tag}
                {!disabled && (
                  <button 
                    type="button" 
                    onClick={() => toggle(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
