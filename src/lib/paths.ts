import { collection } from 'firebase/firestore';
import { db } from '../firebase'; // your existing init

export const slidesCol = (
  chapterId: string,
  breakdownId: string
) => collection(db, 'Chapters', chapterId, `${chapterId}-Breakdowns`, breakdownId, 'Slides');









