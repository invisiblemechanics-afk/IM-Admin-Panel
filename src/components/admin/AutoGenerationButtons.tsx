import React, { useState } from 'react';
import { Sparkles, Brain, Target, Zap, Loader2 } from 'lucide-react';
import { generateSkillTag, generateTitle, generateDifficulty, generateAll, AutoGenerationRequest } from '../../utils/openaiService';
import { useChapter } from '../../contexts/ChapterContext';

interface AutoGenerationButtonsProps {
  questionText: string;
  questionType?: 'MCQ' | 'MultipleAnswer' | 'Numerical';
  exam?: 'JEE Main' | 'JEE Advanced' | 'NEET';
  onSkillTagGenerated?: (skillTag: string) => void;
  onTitleGenerated?: (title: string) => void;
  onDifficultyGenerated?: (difficulty: number) => void;
  onAllGenerated?: (data: { skillTag: string; title: string; difficulty: number }) => void;
  disabled?: boolean;
  className?: string;
}

export default function AutoGenerationButtons({
  questionText,
  questionType,
  exam,
  onSkillTagGenerated,
  onTitleGenerated,
  onDifficultyGenerated,
  onAllGenerated,
  disabled = false,
  className = ''
}: AutoGenerationButtonsProps) {
  const { selectedChapter } = useChapter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = questionText.trim().length > 10;
  
  // Debug: Log environment variables
  React.useEffect(() => {
    console.log('=== Environment Variables Debug ===');
    console.log('VITE_OPENAI_API_KEY exists:', !!import.meta.env.VITE_OPENAI_API_KEY);
    console.log('VITE_OPENAI_API_KEY value:', import.meta.env.VITE_OPENAI_API_KEY ? `${import.meta.env.VITE_OPENAI_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
    console.log('All VITE vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    console.log('import.meta.env:', import.meta.env);
    console.log('====================================');
  }, []);

  const generateRequest = (): AutoGenerationRequest => ({
    questionText,
    chapter: selectedChapter?.name,
    availableSkillTags: selectedChapter?.skillTags || [],
    questionType,
    exam,
  });

  const handleError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    const message = error.message || `Failed to ${action}`;
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleGenerateSkillTag = async () => {
    if (!canGenerate || disabled) return;
    
    setLoading('skillTag');
    setError(null);
    try {
      const skillTag = await generateSkillTag(generateRequest());
      onSkillTagGenerated?.(skillTag);
    } catch (error) {
      handleError(error, 'generate skill tag');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateTitle = async () => {
    if (!canGenerate || disabled) return;
    
    setLoading('title');
    setError(null);
    try {
      const title = await generateTitle(generateRequest());
      onTitleGenerated?.(title);
    } catch (error) {
      handleError(error, 'generate title');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateDifficulty = async () => {
    if (!canGenerate || disabled) return;
    
    setLoading('difficulty');
    setError(null);
    try {
      const difficulty = await generateDifficulty(generateRequest());
      onDifficultyGenerated?.(difficulty);
    } catch (error) {
      handleError(error, 'generate difficulty');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!canGenerate || disabled) return;
    
    setLoading('all');
    setError(null);
    try {
      const result = await generateAll(generateRequest());
      onAllGenerated?.({
        skillTag: result.skillTag || '',
        title: result.title || '',
        difficulty: result.difficulty || 5
      });
    } catch (error) {
      handleError(error, 'generate all suggestions');
    } finally {
      setLoading(null);
    }
  };

  const buttonClass = "inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 border border-transparent rounded-md hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* AI Generation Status */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span>AI-Powered Auto-Generation with ChatGPT 4o mini</span>
        {selectedChapter && (
          <span className="text-xs text-gray-500">
            ({selectedChapter.skillTags?.length || 0} available skill tags)
          </span>
        )}
      </div>

      {/* Individual Generation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={handleGenerateSkillTag}
          disabled={!canGenerate || disabled || loading === 'skillTag'}
          className={buttonClass}
          title="Auto-generate skill tag from available chapter tags"
        >
          {loading === 'skillTag' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          Auto Skill Tag
        </button>

        <button
          onClick={handleGenerateTitle}
          disabled={!canGenerate || disabled || loading === 'title'}
          className={buttonClass}
          title="Auto-generate descriptive title"
        >
          {loading === 'title' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Auto Title
        </button>

        <button
          onClick={handleGenerateDifficulty}
          disabled={!canGenerate || disabled || loading === 'difficulty'}
          className={buttonClass}
          title="Auto-generate difficulty rating (1-10)"
        >
          {loading === 'difficulty' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Target className="w-4 h-4 mr-2" />
          )}
          Auto Difficulty
        </button>
      </div>

      {/* Generate All Button */}
      <button
        onClick={handleGenerateAll}
        disabled={!canGenerate || disabled || loading === 'all'}
        className={`w-full ${buttonClass} from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500`}
        title="Auto-generate skill tag, title, and difficulty all at once"
      >
        {loading === 'all' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Zap className="w-4 h-4 mr-2" />
        )}
        🤖 Generate All with AI
      </button>

      {/* Helper Text */}
      {!canGenerate && (
        <p className="text-xs text-gray-500 text-center">
          Enter question text (minimum 10 characters) to enable AI generation
        </p>
      )}
    </div>
  );
}