import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

export type TestQuestionLite = {
  id: string;
  chapterId: string;
  refPath: string;
  title?: string;
  type: 'MCQ'|'MultipleAnswer'|'Numerical';
  skillTags: string[];
  difficulty?: number;
  difficultyBand?: 'easy'|'moderate'|'tough';
  marksCorrect?: number | null;
  marksWrong?: number | null;
  timeSuggestedSec?: number | null;
  status?: string;
  questionText?: string;
  exam?: string;
};

export async function fetchTestQuestionsAcrossChapters(filters: {
  chapters?: string[];
  tags?: string[];
  types?: Array<'MCQ'|'MultipleAnswer'|'Numerical'>;
  exam?: 'JEE Main'|'JEE Advanced'|'NEET';
  status?: string; // 'ACTIVE'
  searchText?: string;
}): Promise<TestQuestionLite[]> {
  const chaptersSnap = await getDocs(collection(db, 'Chapters'));
  const chapterIds = chaptersSnap.docs.map(d => d.id);
  const targetChapters = (filters.chapters?.length ? filters.chapters : chapterIds);

  const results: TestQuestionLite[] = [];
  await Promise.all(targetChapters.map(async (chapterId) => {
    try {
      const chapterDoc = chaptersSnap.docs.find(d => d.id === chapterId);
      if (!chapterDoc) return;
      
      const chapterData = chapterDoc.data();
      const chapterName = chapterData.name || chapterData.slug || chapterId;
      const col = collection(db, 'Chapters', chapterId, `${chapterName}-Test-Questions`);
      
      // build simple client-side filtered list (since we can't do multi-collection group queries)
      const snap = await getDocs(col);
      snap.docs.forEach(d => {
        const x = d.data() as any;
        if (filters.exam && x.exam !== filters.exam) return;
        if (filters.types?.length && !filters.types.includes(x.type)) return;
        if (filters.status && x.status !== filters.status) return;
        
        const skillTags = Array.isArray(x.skillTags) ? x.skillTags : (x.skillTag ? [x.skillTag] : []);
        if (filters.tags?.length) {
          const hit = skillTags.some((t: string) => filters.tags!.includes(t));
          if (!hit) return;
        }
        
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          const titleMatch = (x.title || '').toLowerCase().includes(searchLower);
          const questionMatch = (x.questionText || '').toLowerCase().includes(searchLower);
          const tagMatch = skillTags.some((tag: string) => tag.toLowerCase().includes(searchLower));
          if (!titleMatch && !questionMatch && !tagMatch) return;
        }
        
        // Map difficulty to band
        const difficultyBand = mapDifficultyToBand(x.difficulty);
        
        results.push({
          id: d.id,
          chapterId,
          refPath: `Chapters/${chapterId}/${chapterName}-Test-Questions/${d.id}`,
          title: x.title ?? '',
          questionText: x.questionText ?? '',
          type: x.type,
          skillTags,
          difficulty: x.difficulty,
          difficultyBand,
          marksCorrect: x.marksCorrect ?? null,
          marksWrong: x.marksWrong ?? null,
          timeSuggestedSec: x.timeSuggestedSec ?? null,
          status: x.status,
          exam: x.exam,
        });
      });
    } catch (error) {
      console.warn(`Failed to fetch questions from chapter ${chapterId}:`, error);
    }
  }));
  
  return results;
}

function mapDifficultyToBand(difficulty?: number): 'easy' | 'moderate' | 'tough' {
  if (difficulty == null) return 'moderate';
  if (difficulty <= 3) return 'easy';
  if (difficulty <= 7) return 'moderate';
  return 'tough';
}









