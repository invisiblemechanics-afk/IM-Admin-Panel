import React from 'react';

interface TypeChipsProps {
  type: 'MCQ' | 'MultipleAnswer' | 'Numerical';
  className?: string;
}

export default function TypeChips({ type, className = '' }: TypeChipsProps) {
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'MCQ':
        return 'bg-green-100 text-green-800';
      case 'MultipleAnswer':
        return 'bg-yellow-100 text-yellow-800';
      case 'Numerical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MCQ':
        return 'MCQ';
      case 'MultipleAnswer':
        return 'Multiple';
      case 'Numerical':
        return 'Numerical';
      default:
        return type;
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeStyle(type)} ${className}`}>
      {getTypeLabel(type)}
    </span>
  );
}









