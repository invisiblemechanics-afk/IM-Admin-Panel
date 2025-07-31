import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Sample chapters to initialize
const sampleChapters = [
  {
    name: 'Kinematics',
    slug: 'kinematics',
    subject: 'Physics',
    questionCountDiagnostic: 0,
    questionCountPractice: 0,
    questionCountTest: 0,
    questionCountBreakdowns: 0
  },
  {
    name: 'Laws of Motion',
    slug: 'laws-of-motion',
    subject: 'Physics',
    questionCountDiagnostic: 0,
    questionCountPractice: 0,
    questionCountTest: 0,
    questionCountBreakdowns: 0
  },
  {
    name: 'Work, Energy and Power',
    slug: 'work-energy-and-power',
    subject: 'Physics',
    questionCountDiagnostic: 0,
    questionCountPractice: 0,
    questionCountTest: 0,
    questionCountBreakdowns: 0
  },
  {
    name: 'Thermodynamics',
    slug: 'thermodynamics',
    subject: 'Physics',
    questionCountDiagnostic: 0,
    questionCountPractice: 0,
    questionCountTest: 0,
    questionCountBreakdowns: 0
  },
  {
    name: 'Gravitation',
    slug: 'gravitation',
    subject: 'Physics',
    questionCountDiagnostic: 0,
    questionCountPractice: 0,
    questionCountTest: 0,
    questionCountBreakdowns: 0
  }
];

export async function initializeChapters() {
  console.log('Initializing chapters...');
  
  for (const chapter of sampleChapters) {
    try {
      const chapterRef = doc(db, 'chapters', chapter.slug);
      await setDoc(chapterRef, {
        ...chapter,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      console.log(`✓ Initialized chapter: ${chapter.name}`);
    } catch (error) {
      console.error(`✗ Failed to initialize chapter ${chapter.name}:`, error);
    }
  }
  
  console.log('Chapter initialization complete!');
}

// Run this function to initialize chapters
// You can call this from the browser console or create a button in the UI
// initializeChapters();