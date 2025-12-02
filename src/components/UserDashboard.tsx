import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MyTrainingGroups } from './user/MyTrainingGroups';
import { MyExams } from './user/MyExams';
import { ArrowLeft } from 'lucide-react';
import { MyExamResults } from './user/MyExamResults';
import { GroupView } from './user/GroupView';
import { ModuleView } from './user/ModuleView';
import { LessonView } from './user/LessonView';
import { ExamView } from './user/ExamView';
import { ExamAttempt } from './user/ExamAttempt';
import { ExamResultView } from './user/ExamResultView';
import { ExamResultDetail } from './user/ExamResultDetail';
import { ExamDetails } from './user/ExamDetails';
import { LogOut, BookOpen, ClipboardCheck, Trophy, ChevronRight } from 'lucide-react';
import type { AuthUser } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';

interface UserDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

type View =
  | { type: 'groups' }
  | { type: 'group'; groupId: number }
  | { type: 'module'; groupId: number; moduleId: number }
  | { type: 'lesson'; groupId: number; moduleId: number; lessonId: number }
  | { type: 'exams' }
  | { type: 'exam'; groupId: number; assignmentId: number; groupName?: string }
  | { type: 'exam-attempt'; groupId: number; assignmentId: number; attemptId?: number; examInstanceId?: number; groupName?: string }
  | { type: 'exam-result-view'; groupId: number; assignmentId: number; attemptId: string; examInstanceId: number; groupName?: string }
  | { type: 'exam-details'; groupId: number; assignmentId: number; groupName?: string }
  | { type: 'results' }
  | { type: 'result-detail'; resultId: number };

export function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const params = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'groups' | 'exams' | 'results'>('groups');
  const [currentView, setCurrentView] = useState<View>({ type: 'groups' });

  // Parse URL params to determine current view
  useEffect(() => {
    const { groupId, moduleId, lessonId, examId, attemptId, resultId } = params;
    const pathname = window.location.pathname;

    if (resultId) {
      setActiveSection('results');
      setCurrentView({ type: 'result-detail', resultId: Number(resultId) });
    } else if (examId && attemptId) {
      setActiveSection('exams');
      setCurrentView({
        type: 'exam-attempt',
        assignmentId: Number(examId),
        attemptId: Number(attemptId),
        groupId: 0, // Will be determined by ExamAttempt component
        examInstanceId: Number(attemptId), // Use attemptId as examInstanceId initially
      });
    } else if (examId) {
      setActiveSection('exams');
      setCurrentView({
        type: 'exam',
        assignmentId: Number(examId),
        groupId: 0, // Will be determined by ExamView component
      });
    } else if (groupId && moduleId && lessonId) {
      setActiveSection('groups');
      setCurrentView({
        type: 'lesson',
        groupId: Number(groupId),
        moduleId: Number(moduleId),
        lessonId: Number(lessonId),
      });
    } else if (groupId && moduleId) {
      setActiveSection('groups');
      setCurrentView({
        type: 'module',
        groupId: Number(groupId),
        moduleId: Number(moduleId),
      });
    } else if (groupId) {
      setActiveSection('groups');
      setCurrentView({ type: 'group', groupId: Number(groupId) });
    } else {
      // Determine section from pathname
      if (pathname.startsWith('/results')) {
        setActiveSection('results');
        setCurrentView({ type: 'results' });
      } else if (pathname.startsWith('/exams')) {
        setActiveSection('exams');
        setCurrentView({ type: 'exams' });
      } else {
        setActiveSection('groups');
        setCurrentView({ type: 'groups' });
      }
    }
  }, [params]);

  const renderBreadcrumbs = () => {
    const crumbs: { label: string; path: string }[] = [];

    if (currentView.type === 'group') {
      crumbs.push({ label: 'Мої групи', path: '/' });
      crumbs.push({ label: 'Перегляд групи', path: '' });
    } else if (currentView.type === 'module') {
      crumbs.push({ label: 'Мої групи', path: '/' });
      crumbs.push({ label: 'Група', path: `/groups/${currentView.groupId}` });
      crumbs.push({ label: 'Модуль', path: '' });
    } else if (currentView.type === 'lesson') {
      crumbs.push({ label: 'Мої групи', path: '/' });
      crumbs.push({ label: 'Група', path: `/groups/${currentView.groupId}` });
      crumbs.push({ label: 'Модуль', path: `/groups/${currentView.groupId}/modules/${currentView.moduleId}` });
      crumbs.push({ label: 'Урок', path: '' });
    } else if (currentView.type === 'exam') {
      crumbs.push({ label: 'Екзамени', path: '/' });
      crumbs.push({ label: currentView.groupName ?? 'Перегляд екзамену', path: '' });
    } else if (currentView.type === 'exam-attempt') {
      crumbs.push({ label: 'Екзамени', path: '/' });
      crumbs.push({
        label: currentView.groupName ?? 'Екзамен',
        path: `/exams/${currentView.assignmentId}`,
      });
      crumbs.push({ label: 'Спроба', path: '' });
    } else if (currentView.type === 'exam-result-view') {
      crumbs.push({ label: 'Екзамени', path: '/' });
      crumbs.push({
        label: currentView.groupName ?? 'Екзамен',
        path: `/exams/${currentView.assignmentId}`,
      });
      crumbs.push({ label: 'Результати спроби', path: '' });
    } else if (currentView.type === 'result-detail') {
      crumbs.push({ label: 'Результати', path: '/' });
      crumbs.push({ label: 'Детальні результати', path: '' });
    }

    if (crumbs.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4 text-sm">
        {crumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            {crumb.path ? (
              <button
                onClick={() => navigate(crumb.path)}
                className={`hover:text-indigo-600 ${index === crumbs.length - 1 ? 'text-gray-900' : 'text-gray-500'}`}
                disabled={index === crumbs.length - 1}
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-gray-900">{crumb.label}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'groups':
        return <MyTrainingGroups
          onGroupClick={(groupId) => navigate(`/groups/${groupId}`)}
          onNavigateToGroup={(groupId) => navigate(`/groups/${groupId}`)}
        />;
      case 'group':
        return (
          <GroupView
            groupId={currentView.groupId}
            onModuleClick={(moduleId) =>
              navigate(`/groups/${currentView.groupId}/modules/${moduleId}`)
            }
            onExamClick={(examId) =>
              navigate(`/exams/${examId}`)
            }
            onNavigateToModule={(moduleId) =>
              navigate(`/groups/${currentView.groupId}/modules/${moduleId}`)
            }
          />
        );
      case 'module':
        return (
          <ModuleView
            groupId={currentView.groupId}
            moduleId={currentView.moduleId}
            onLessonClick={(lessonId) =>
              navigate(`/groups/${currentView.groupId}/modules/${currentView.moduleId}/lessons/${lessonId}`)
            }
            onNavigateToLesson={(lessonId) =>
              navigate(`/groups/${currentView.groupId}/modules/${currentView.moduleId}/lessons/${lessonId}`)
            }
          />
        );
      case 'lesson':
        return <LessonView groupId={currentView.groupId} moduleId={currentView.moduleId} lessonId={currentView.lessonId} />;
      case 'exams':
        return (
          <MyExams
            onExamClick={({ assignmentId, groupId, groupName }) =>
              navigate(`/exams/${assignmentId}`)
            }
          />
        );
      case 'exam':
        return (
          <ExamView
            groupId={currentView.groupId}
            assignmentId={currentView.assignmentId}
            groupName={currentView.groupName}
            onStartAttempt={(examInstanceId: number) => {
              navigate(`/exams/${currentView.assignmentId}/attempt/${examInstanceId}`);
            }}
            onViewResults={() =>
              navigate(`/exams/${currentView.assignmentId}/results`)
            }
          />
        );

      case 'exam-details':
        return (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад до екзаменів
            </Button>
            <ExamDetails
              groupId={currentView.groupId}
              assignedExamId={currentView.assignmentId}
              groupName={currentView.groupName || ''}
              onBack={() => navigate('/')}
            />
          </div>
        );
      case 'exam-attempt':
        return (
          <ExamAttempt
            attemptId={
              currentView.attemptId !== undefined
                ? String(currentView.attemptId)
                : undefined
            }
            examInstanceId={currentView.examInstanceId || 0}
            onComplete={() =>
              navigate(`/exams/${currentView.assignmentId}`)
            }
          />
        );
      case 'exam-result-view':
        return (
          <ExamResultView
            attemptId={currentView.attemptId || currentView.examInstanceId?.toString() || ''}
            examInstanceId={currentView.examInstanceId}
            onComplete={() =>
              navigate(`/exams/${currentView.assignmentId}`)
            }
          />
        );
      case 'results':
        return <MyExamResults userId={String(user.id)} onResultClick={(resultId) => navigate(`/results/${resultId}`)} />;
      case 'result-detail':
        return <ExamResultDetail assignmentId={currentView.resultId} instanceId={0} />;
      default:
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1>Мій кабінет</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActiveSection('groups');
              navigate('/groups');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'groups' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Мої групи навчання</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('exams');
              navigate('/exams');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'exams' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span>Заплановані екзамени</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('results');
              navigate('/results');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'results' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Trophy className="w-5 h-5" />
            <span>Результати</span>
          </button>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {renderBreadcrumbs()}
          {renderContent()}
        </div>
      </main>

      {/* Notification Bell - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>
    </div>
  );
}
