// Script to initialize chapters with skillTags
// Run this in the browser console or create a button to trigger it

import { initializeChapters } from './initializeChapters';

export async function runChapterInitialization() {
  try {
    console.log('🚀 Starting chapter initialization with skillTags...');
    await initializeChapters();
    console.log('✅ Chapter initialization completed successfully!');
    console.log('📊 All 13 physics chapters with skillTags have been stored in Firebase');
    console.log('🤖 These skillTags are now available for OpenAI GPT auto-tagging');
    return true;
  } catch (error) {
    console.error('❌ Chapter initialization failed:', error);
    return false;
  }
}

// Global function for browser console access
(window as any).initializePhysicsChapters = runChapterInitialization;

console.log('💡 To initialize chapters, run: initializePhysicsChapters()');