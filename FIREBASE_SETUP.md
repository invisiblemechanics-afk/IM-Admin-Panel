# Firebase Setup Instructions

## 1. Update Firestore Security Rules

Go to your Firebase Console > Firestore > Rules and replace your current rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chapters collection (root level)
    match /chapters/{chapterSlug} {
      allow read, write: if true;
    }
    
    // Chapter-scoped question collections
    match /chapters/{chapterSlug}/{chapterSlug}-Diagnostic-Questions/{document} {
      allow read, write: if true;
    }
    
    match /chapters/{chapterSlug}/{chapterSlug}-Practice-Questions/{document} {
      allow read, write: if true;
    }
    
    match /chapters/{chapterSlug}/{chapterSlug}-Test-Questions/{document} {
      allow read, write: if true;
    }
    
    // Chapter-scoped Theory (videos) collection
    match /chapters/{chapterSlug}/{chapterSlug}-Theory/{document} {
      allow read, write: if true;
    }
    
    // Chapter-scoped Breakdowns collection
    match /chapters/{chapterSlug}/{chapterSlug}-Breakdowns/{document} {
      allow read, write: if true;
    }
    
    // Slides subcollection under Breakdowns
    match /chapters/{chapterSlug}/{chapterSlug}-Breakdowns/{breakdownId}/slides/{slideId} {
      allow read, write: if true;
    }
  }
}
```

## 2. Initialize Sample Chapters

When you open the admin panel, you'll see a yellow notification box with an "Initialize Sample Chapters" button. Click it to create sample chapters.

## 3. Manual Chapter Creation (Alternative)

If the button doesn't work, manually create chapters in Firebase Console:

1. Go to Firestore Database
2. Create collection: `chapters`
3. Add documents with these IDs and data:

### Document ID: `kinematics`
```json
{
  "name": "Kinematics",
  "slug": "kinematics",
  "subject": "Physics",
  "questionCountDiagnostic": 0,
  "questionCountPractice": 0,
  "questionCountTest": 0,
  "questionCountBreakdowns": 0
}
```

### Document ID: `laws-of-motion`
```json
{
  "name": "Laws of Motion",
  "slug": "laws-of-motion",
  "subject": "Physics",
  "questionCountDiagnostic": 0,
  "questionCountPractice": 0,
  "questionCountTest": 0,
  "questionCountBreakdowns": 0
}
```

Repeat for other chapters as needed.

## 4. Test the Setup

1. Refresh the admin panel
2. Select a chapter from the dropdown
3. Try creating a new question
4. Check Firebase Console to see if it appears in the correct collection path:
   `/chapters/kinematics/kinematics-Diagnostic-Questions/`