import React from 'react';

interface DifficultyBadgeProps {
  band: 'easy' | 'moderate' | 'tough';
  className?: string;
}

export default function DifficultyBadge({ band, className = '' }: DifficultyBadgeProps) {
  const getBadgeStyle = (band: string) => {
    switch (band) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'tough':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeLabel = (band: string) => {
    switch (band) {
      case 'easy':
        return 'Easy';
      case 'moderate':
        return 'Moderate';
      case 'tough':
        return 'Tough';
      default:
        return band;
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeStyle(band)} ${className}`}>
      {getBadgeLabel(band)}
    </span>
  );
}




