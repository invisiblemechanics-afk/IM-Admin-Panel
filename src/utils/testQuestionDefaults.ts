import type { DiffBand, ExamType, QuestionType, QuestionBase } from '../types';

export function bandFromDifficulty(d: number): DiffBand {
  if (d <= 3) return 'easy';
  if (d <= 7) return 'moderate';
  return 'tough';
}

export function defaultMarks(exam: ExamType, type: QuestionType) {
  // Feel free to tweak these; they are editable in UI.
  if (exam === 'JEE Advanced') {
    // generic safe default; many adv sections vary
    return { correct: 3, wrong: 0 };
  }
  // JEE Main / NEET
  return { correct: 4, wrong: type === 'Numerical' ? 0 : -1 };
}

export function withComputedFields<T extends Partial<QuestionBase>>(q: T): T {
  const difficulty = q.difficulty ?? 5;
  const exam = (q.exam ?? 'JEE Main') as ExamType;
  const type = (q.type ?? 'MCQ') as QuestionType;
  const { correct, wrong } = defaultMarks(exam, type);
  
  return {
    ...q,
    difficultyBand: q.difficultyBand ?? bandFromDifficulty(difficulty),
    marksCorrect: q.marksCorrect ?? correct,
    marksWrong: q.marksWrong ?? wrong,
    timeSuggestedSec: q.timeSuggestedSec ?? 120,
    optionShuffle: q.optionShuffle ?? true,
    status: q.status ?? 'ACTIVE',
    partialScheme: q.partialScheme ?? { mode: 'none' },
  } as T;
}
