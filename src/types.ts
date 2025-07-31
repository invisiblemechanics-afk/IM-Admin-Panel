export type QuestionType = "Numerical" | "MCQ" | "MultipleAnswer";
export type ExamType = "JEE Main" | "JEE Advanced" | "NEET";

// ALL three question collections share this:
export interface QuestionBase {
  id: string;             // Firestore doc ID
  type: QuestionType;
  skillTag: string;
  questionText: string;
  detailedAnswer: string;
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
      detailedAnswer: string;
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
  skillTag: string;
  type: QuestionType;
  createdAt: any;
  updatedAt: any;
}

export interface Chapter {
  id: string;
  title: string;
}