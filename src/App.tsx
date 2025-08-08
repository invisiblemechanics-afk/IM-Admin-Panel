import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import { ChapterProvider } from './contexts/ChapterContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const QuestionsManager = React.lazy(() => import('./components/admin/QuestionsManager'));
const VideosManager = React.lazy(() => import('./components/admin/VideosManager'));
const BreakdownsManager = React.lazy(() => import('./components/admin/BreakdownsManager'));
const SkillTagsManager = React.lazy(() => import('./components/admin/SkillTagsManager'));

import LoadingSpinner from './components/LoadingSpinner';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedRoute>
          <ChapterProvider>
            <Router basename={import.meta.env.BASE_URL}>
              <Routes>
                <Route path="/" element={<Navigate to="/admin/diagnostic" replace />} />
                <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/diagnostic" replace />} />
            <Route 
              path="diagnostic" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <QuestionsManager 
                    title="Diagnostic Questions" 
                    collectionName="Diagnostic-Questions" 
                  />
                </Suspense>
              } 
            />
            <Route 
              path="practice" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <QuestionsManager 
                    title="Practice Questions" 
                    collectionName="Practice-Questions" 
                  />
                </Suspense>
              } 
            />
            <Route 
              path="test" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <QuestionsManager 
                    title="Test Questions" 
                    collectionName="Test-Questions" 
                  />
                </Suspense>
              } 
            />
            <Route 
              path="videos" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <VideosManager />
                </Suspense>
              } 
            />
            <Route 
              path="breakdowns" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <BreakdownsManager />
                </Suspense>
              } 
            />
            <Route 
              path="skilltags" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <SkillTagsManager />
                </Suspense>
              } 
            />
            </Route>
              </Routes>
            </Router>
          </ChapterProvider>
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;