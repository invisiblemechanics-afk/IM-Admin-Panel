# Admin Panel

A comprehensive admin panel for managing educational content with Firebase integration.

## Features

- Chapter-based content organization
- Question management (Diagnostic, Practice, Test)
- Video management (Theory content)
- Breakdown and slides management
- Real-time updates with Firestore
- Responsive UI with Tailwind CSS

## Setup

1. Install dependencies:
```bash
cd project
npm install
```

2. Configure Firebase:
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration values

3. Update Firestore Security Rules:
   - Go to Firebase Console > Firestore > Rules
   - Copy the rules from `firestore.rules`
   - Click "Publish"

4. Start development server:
```bash
npm run dev
```

## Firebase Structure

The app uses a hierarchical structure where all content is organized under chapters:

```
/chapters/{chapterSlug}/
  ├─ {chapterSlug}-Diagnostic-Questions/
  ├─ {chapterSlug}-Practice-Questions/
  ├─ {chapterSlug}-Test-Questions/
  ├─ {chapterSlug}-Theory/              (videos)
  └─ {chapterSlug}-Breakdowns/
      └─ {breakdownId}/slides/
```

### Chapter Document Schema

```typescript
{
  name: string,           // "Kinematics"
  slug: string,           // "kinematics"
  subject: string,        // "Physics"
  questionCountDiagnostic: number,
  questionCountPractice: number,
  questionCountTest: number,
  questionCountBreakdowns: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Usage

1. **Select a Chapter**: Use the dropdown at the top of the admin panel to select which chapter you want to manage.

2. **Create Content**: Click "Create New" in any section to add new questions, videos, or breakdowns.

3. **Edit/Delete**: Use the action buttons in the table to edit or delete existing content.

4. **Manage Slides**: Click the slides icon on any breakdown to manage its slides.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies

- React 18 with TypeScript
- Vite for build tooling
- Firebase (Firestore & Storage)
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons