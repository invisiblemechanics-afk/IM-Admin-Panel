import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import Button from './Button';
import { refineLatexContent } from '../../utils/openaiService';

interface LatexRefinementButtonProps {
  content: string;
  contentType: 'theory' | 'question';
  onContentRefined: (refined: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function LatexRefinementButton({
  content,
  contentType,
  onContentRefined,
  disabled = false,
  className = '',
}: LatexRefinementButtonProps) {
  const [loading, setLoading] = useState(false);
  const apiAvailable = Boolean(import.meta.env.VITE_OPENAI_API_KEY);

  const handleRefine = async () => {
    if (!content || disabled) return;
    setLoading(true);
    try {
      const refined = await refineLatexContent(content, contentType);
      onContentRefined(refined || content);
    } catch (error) {
      console.error('Latex refinement failed:', error);
      // Fallback: keep original content
      onContentRefined(content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleRefine}
          disabled={disabled || loading}
          loading={loading}
          variant="secondary"
          icon={Wand2}
        >
          Refine LaTeX{!apiAvailable ? ' (offline)' : ''}
        </Button>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
      </div>
      {!apiAvailable && (
        <div className="mt-1 text-xs text-gray-500">
          AI key not configured. Using safe fallback; content will be returned as-is.
        </div>
      )}
    </div>
  );
}


