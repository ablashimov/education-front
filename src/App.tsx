import { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom-v5-compat';
import { LoginPage } from './components/LoginPage';
import { EmailVerificationPage } from './components/EmailVerificationPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { ExamView } from './components/user/ExamView';
import { ExamAttempt } from './components/user/ExamAttempt';
import { useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const { user, isLoading, hasTriedRestore, login, logout, refreshUser } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await login(email, password);
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Не вдалося виконати вхід. Спробуйте ще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailVerified = async () => {
    try {
      await refreshUser();
    } catch (error) {
      // Якщо користувач ще не підтвердив email, залишаємося на сторінці перевірки
    }
  };

  const isEmailVerified = useMemo(() => user?.emailVerifiedAt != null, [user?.emailVerifiedAt]);

  if (isLoading && !hasTriedRestore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Завантаження...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage onLogin={handleLogin} isSubmitting={isSubmitting} errorMessage={authError} />
    );
  }

  if (user && !isEmailVerified) {
    return (
      <EmailVerificationPage
        email={user.email}
        onVerified={handleEmailVerified}
      />
    );
  }

  return (
    <>
      <Toaster />
      <AppRoutes user={user} onLogout={logout} />
    </>
  );

}

function AppRoutes({ user, onLogout }: { user: any, onLogout: () => void }) {
  const params = useParams();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route
          path="/"
          element={
            user?.role === 'admin' ? (
              <AdminDashboard onLogout={onLogout} user={user} />
            ) : (
              <UserDashboard onLogout={onLogout} user={user} />
            )
          }
        />
        {/* User Dashboard Routes - only for non-admin users */}
        {user?.role !== 'admin' && (
          <>
            <Route path="/groups" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/groups/:groupId" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/groups/:groupId/modules/:moduleId" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/groups/:groupId/modules/:moduleId/lessons/:lessonId" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/exams" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/exams/:examId" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/exams/:examId/attempt/:attemptId" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/exams/:examId/results" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/results" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/results/:resultId" element={
              <UserDashboard onLogout={onLogout} user={user} />
            } />
          </>
        )}
        {/* Admin Dashboard Routes - only for admin users */}
        {user?.role === 'admin' && (
          <>
            <Route path="/admins/users" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/groups" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/groups/:groupId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/groups/:groupId/modules/:moduleId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/groups/:groupId/modules/:moduleId/lessons/:lessonId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/exams/:examId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/exams/:examId/attempt/:attemptId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/results" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/results/:resultId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            {/* Admin "My Training" routes - same as user routes but with admin prefix */}
            <Route path="/admins/my-groups" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-groups/:groupId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-groups/:groupId/modules/:moduleId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-groups/:groupId/modules/:moduleId/lessons/:lessonId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-exams" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-exams/:examId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-exams/:examId/attempt/:attemptId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-results" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/my-results/:resultId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            {/* Forum routes */}
            <Route path="/admins/forum" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/forum/topics/:topicId" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
            <Route path="/admins/forum/new" element={
              <AdminDashboard onLogout={onLogout} user={user} />
            } />
          </>
        )}
        {/* Legacy routes for backward compatibility */}
        <Route path="/groups/:groupId/exams/:examId" element={
          <ExamViewWrapper navigate={navigate} params={params} />
        } />
        <Route path="/groups/:groupId/exams/:examId/attempt/:attemptId" element={
          <ExamAttemptWrapper navigate={navigate} params={params} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function ExamViewWrapper({ navigate, params }: { navigate: any, params: any }) {
  return (
    <ExamView
      groupId={Number(params.groupId)}
      assignmentId={Number(params.examId)}
      onStartAttempt={(attemptId: number) =>
        navigate(`/groups/${params.groupId}/exams/${params.examId}/attempt/${attemptId}`)
      }
      onViewResults={() =>
        navigate(`/groups/${params.groupId}/exams/${params.examId}/results`)
      }
    />
  );
}

function ExamAttemptWrapper({ navigate, params }: { navigate: any, params: any }) {
  return (
    <ExamAttempt
      examInstanceId={Number(params.attemptId)}
      onComplete={() =>
        navigate(`/groups/${params.groupId}/exams/${params.examId}`)
      }
    />
  );
}
