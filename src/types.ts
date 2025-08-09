export type QuestionType = "Numerical" | "MCQ" | "MultipleAnswer";
export type ExamType = "JEE Main" | "JEE Advanced" | "NEET";

// Extended types for Test Questions
export type DiffBand = 'easy' | 'moderate' | 'tough';
export type PartialScheme = 
  | { mode: 'none' }
  | { mode: 'perOption'; perOptionMarks: number }
  | { mode: 'allCorrectOrZero' }
  | { mode: 'negativePerWrong'; perWrong: number };

// ALL three question collections share this:
export interface QuestionBase {
  id: string;             // Firestore doc ID
  type: QuestionType;
  title: string;
  skillTag?: string;      // legacy single tag for backward compatibility
  skillTags: string[];    // NEW canonical array of skill tags
  questionText: string;
  detailedAnswer?: string; // Made optional - removed from forms
  chapter: string;
  imageUrl?: string;
  difficulty: number;     // 1-10
  exam: ExamType;
  // MCQ & MultipleAnswer
  choices?: string[];
  answerIndex?: number;
  answerIndices?: number[];
  // Numerical
  range?: { min: number; max: number };

  // Extended fields for Test Questions (optional for backward compatibility)
  difficultyBand?: DiffBand;
  marksCorrect?: number;
  marksWrong?: number;
  timeSuggestedSec?: number;
  optionShuffle?: boolean;
  status?: 'ACTIVE' | 'RETIRED';
  
  // Only when type === 'MultipleAnswer'
  partialScheme?: PartialScheme;
  
  // Only when type === 'Numerical'
  numerical?: {
    precision?: number;
    tolerance?: number;
    unit?: string;
  };
}

// Chapter videos:
export interface ChapterVideo {
  id: string;
  title: string;
  description: string;
  skillTag: string;
  storagePath: string;    // e.g. Firebase Storage key
  thumbnailPath: string;
  durationSec: number;
  difficulty: number;     // 1-10
  prereq?: string;        // other video ID or text
  order: number;          // display order
}

// Slides interface with order field (optional for backward compatibility)
export interface Slide {
  id: string;
  title: string;
  content: string;
  kind: 'theory' | 'question';
  imageUrl?: string;
  order?: number;             // ← Optional for backward compatibility
  createdAt: any;
  updatedAt: any;
  // Optional fields for question slides
  hint?: string;
  type?: QuestionType;
  skillTag?: string;
  questionText?: string;
  detailedAnswer?: string;
  choices?: string[];
  answerIndex?: number;
  answerIndices?: number[];
  range?: { min: number; max: number };
}

// Keep BreakdownSlide as alias for backward compatibility
export type BreakdownSlide = Slide;

export interface Breakdown {
  id: string;
  title: string;
  description: string;
  chapterId: string;
  // Backward compatibility: legacy single tag
  skillTag?: string;
  // New: canonical multiple tags array
  skillTags: string[];
  type: QuestionType;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
  // Answer fields for the main breakdown question
  choices?: string[];
  answerIndex?: number;
  answerIndices?: number[];
  range?: { min: number; max: number };
}

export interface Chapter {
  id: string;
  title: string;
  name?: string;
  slug?: string;
  subject?: string;
  skillTags?: string[]; // SkillTags field added to existing chapters
  createdAt?: any;
  updatedAt?: any;
}