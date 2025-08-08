export type QuestionType = "Numerical" | "MCQ" | "MultipleAnswer";
export type ExamType = "JEE Main" | "JEE Advanced" | "NEET";

// ALL three question collections share this:
export interface QuestionBase {
  id: string;             // Firestore doc ID
  type: QuestionType;
  title: string;
  skillTag: string;
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

// Breakdowns & Slides:
export type BreakdownSlide = 
  | {
      kind: "theory";
      id: string;
      title: string;
      content: string;
      imageUrl?: string;
      hint?: string;
      createdAt: any;
      updatedAt: any;
    }
  | {
      kind: "question";
      id: string;
      title: string;
      content: string;
      imageUrl?: string;
      hint?: string;
      createdAt: any;
      updatedAt: any;
      // reuse question schema
      type: QuestionType;
      skillTag: string;
      questionText: string;
      detailedAnswer?: string; // Made optional - removed from forms
      choices?: string[];
      answerIndex?: number;
      answerIndices?: number[];
      range?: { min: number; max: number };
    };

export interface Breakdown {
  id: string;
  title: string;
  description: string;
  chapterId: string;
  // Backward compatibility: legacy single tag
  skillTag?: string;
  // New: support multiple tags (from any chapter)
  skillTags?: string[];
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