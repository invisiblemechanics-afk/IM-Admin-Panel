import React from 'react';

interface TagChipsProps {
  tags: string[];
  maxVisible?: number;
  className?: string;
}

export default function TagChips({ tags, maxVisible = 2, className = '' }: TagChipsProps) {
  if (!tags || tags.length === 0) {
    return <span className="text-xs text-gray-400">No tags</span>;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
        >
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500 font-medium">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}









