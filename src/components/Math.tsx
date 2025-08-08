import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathProps {
  children: string;
  block?: boolean;
  className?: string;
}

/**
 * Math component for rendering LaTeX with KaTeX
 * Automatically detects and renders LaTeX expressions
 */
export default function Math({ children, block = false, className = '' }: MathProps) {
  if (!children || typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }

  // Clean and prepare LaTeX content
  const cleanLatex = children.trim();

  // If it's explicitly a block math (contains align, equation, etc.)
  const isBlockMath = block || 
    cleanLatex.includes('\\begin{align}') ||
    cleanLatex.includes('\\begin{equation}') ||
    cleanLatex.includes('\\begin{gather}') ||
    cleanLatex.includes('\\begin{split}') ||
    cleanLatex.includes('\\begin{multline}') ||
    cleanLatex.includes('\\begin{cases}');

  try {
    if (isBlockMath) {
      return (
        <div className={`math-block ${className}`}>
          <BlockMath math={cleanLatex} />
        </div>
      );
    } else {
      return (
        <span className={`math-inline ${className}`}>
          <InlineMath math={cleanLatex} />
        </span>
      );
    }
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    // Fallback to raw text if LaTeX is invalid
    return (
      <span className={`math-error ${className}`} title="LaTeX rendering error">
        {children}
      </span>
    );
  }
}

/**
 * Component for rendering mixed text with LaTeX
 * Automatically detects $...$ and $$...$$ patterns
 */
interface MathTextProps {
  children: string;
  className?: string;
}

export function MathText({ children, className = '' }: MathTextProps) {
  if (!children || typeof children !== 'string') {
    return <div className={className}>{children}</div>;
  }

  // Split text by LaTeX delimiters
  const parts = children.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/);
  
  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block math
          const latex = part.slice(2, -2);
          return <Math key={index} block={true}>{latex}</Math>;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math
          const latex = part.slice(1, -1);
          return <Math key={index} block={false}>{latex}</Math>;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </div>
  );
}

/**
 * Hook for checking if text contains LaTeX
 */
export function useMathDetection(text: string): { hasInlineMath: boolean; hasBlockMath: boolean; hasMath: boolean } {
  const hasInlineMath = /\$[^$]+\$/.test(text) || text.includes('\\(') || text.includes('\\)');
  const hasBlockMath = /\$\$[\s\S]+\$\$/.test(text) || 
    text.includes('\\begin{') || 
    text.includes('\\[') || 
    text.includes('\\]');
  
  return {
    hasInlineMath,
    hasBlockMath,
    hasMath: hasInlineMath || hasBlockMath
  };
}