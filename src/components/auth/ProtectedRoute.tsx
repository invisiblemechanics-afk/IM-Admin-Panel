import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isAuthorizedAdmin } from '../../config/adminUsers';
import LoginForm from './LoginForm';
import UnauthorizedAccess from './UnauthorizedAccess';
import LoadingSpinner from '../LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={() => {}} />;
  }

  // Check if user is authorized admin
  if (!isAuthorizedAdmin(user.uid)) {
    return <UnauthorizedAccess />;
  }

  return <>{children}</>;
}
