import { collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function backfillSkillTagsForChapter(chapterId: string, chapterName: string): Promise<number> {
  const colNames = [
    `${chapterName}-Practice-Questions`,
    `${chapterName}-Test-Questions`,
    `${chapterName}-Breakdowns`,
  ];

  let totalUpdated = 0;

  for (const colName of colNames) {
    try {
      const colRef = collection(db, 'Chapters', chapterId, colName);
      const snap = await getDocs(colRef);
      if (snap.empty) continue;

      const batch = writeBatch(db);
      let batchCount = 0;

      snap.docs.forEach(d => {
        const data = d.data() as any;
        // Only update if skillTags is missing or empty but skillTag exists
        if ((!data.skillTags || !Array.isArray(data.skillTags) || data.skillTags.length === 0) && data.skillTag) {
          const skillTags = [data.skillTag];
          batch.update(d.ref, { 
            skillTags, 
            updatedAt: serverTimestamp() 
          });
          batchCount++;
        }
      });

      if (batchCount > 0) {
        await batch.commit();
        totalUpdated += batchCount;
        console.log(`Updated ${batchCount} documents in ${colName}`);
      }
    } catch (error) {
      console.error(`Error processing collection ${colName}:`, error);
    }
  }

  return totalUpdated;
}









