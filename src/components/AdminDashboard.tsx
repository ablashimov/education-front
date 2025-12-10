import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { UserManagement } from './admin/UserManagement';
import { TrainingGroupsAdmin } from './admin/TrainingGroupsAdmin';
import { ExamResultsAdmin } from './admin/ExamResultsAdmin';
import { Forum } from './admin/Forum';
import { ForumTopicDetail } from './admin/ForumTopicDetail';
import { ForumNewTopic } from './admin/ForumNewTopic';
import { TrainingGroupDetail } from './TrainingGroupDetail';
import { MyTrainingGroups } from './user/MyTrainingGroups';
import { MyExams } from './user/MyExams';
import { MyExamResults } from './user/MyExamResults';
import { GroupView } from './user/GroupView';
import { ModuleView } from './user/ModuleView';
import { LessonView } from './user/LessonView';
import { ExamView } from './user/ExamView';
import { ExamAttempt } from './user/ExamAttempt';
import { ExamResultDetail } from './user/ExamResultDetail';
import { LogOut, Users, BookOpen, ClipboardList, User, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import type { AuthUser } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';

interface AdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

type View =
  | { type: 'users' }
  | { type: 'groups' }
  | { type: 'group-detail'; groupId: string }
  | { type: 'results' }
  | { type: 'forum' }
  | { type: 'forum-topic'; topicId: string }
  | { type: 'forum-new-topic' }
  | { type: 'my-groups' }
  | { type: 'my-group'; groupId: number }
  | { type: 'my-module'; groupId: number; moduleId: number }
  | { type: 'my-lesson'; groupId: number; moduleId: number; lessonId: number }
  | { type: 'my-exams' }
  | { type: 'my-exam'; groupId: number; assignmentId: number; groupName?: string }
  | { type: 'my-exam-attempt'; groupId: number; assignmentId: number; attemptId?: number; examInstanceId?: number; groupName?: string }
  | { type: 'my-results' }
  | { type: 'my-result-detail'; resultId: string };

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const params = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'users' | 'groups' | 'results' | 'forum' | 'my-trainings'>('users');
  const [currentView, setCurrentView] = useState<View>({ type: 'users' });
  const [myTrainingsExpanded, setMyTrainingsExpanded] = useState(false);

  // Parse URL params to determine current view
  useEffect(() => {
    const { groupId, moduleId, lessonId, examId, attemptId, resultId } = params;
    const pathname = window.location.pathname;

    if (resultId) {
      setActiveSection('my-trainings');
      setCurrentView({ type: 'my-result-detail', resultId });
    } else if (examId && attemptId) {
      setActiveSection('my-trainings');
      setCurrentView({
        type: 'my-exam-attempt',
        assignmentId: Number(examId),
        attemptId: Number(attemptId),
        groupId: 0, // Will be determined by component
        examInstanceId: 0, // Will be determined by finding the correct instance from attempt data
      });
    } else if (examId) {
      setActiveSection('my-trainings');
      setCurrentView({
        type: 'my-exam',
        assignmentId: Number(examId),
        groupId: 0, // Will be determined by component
      });
    } else if (groupId && moduleId && lessonId) {
      setActiveSection('my-trainings');
      setCurrentView({
        type: 'my-lesson',
        groupId: Number(groupId),
        moduleId: Number(moduleId),
        lessonId: Number(lessonId),
      });
    } else if (groupId && moduleId) {
      setActiveSection('my-trainings');
      setCurrentView({
        type: 'my-module',
        groupId: Number(groupId),
        moduleId: Number(moduleId),
      });
    } else if (groupId && pathname.startsWith('/admins/groups/')) {
      setActiveSection('groups');
      setCurrentView({ type: 'group-detail', groupId });
    } else if (groupId) {
      setActiveSection('my-trainings');
      setCurrentView({ type: 'my-group', groupId: Number(groupId) });
    } else {
      // Determine section from pathname
      if (pathname.startsWith('/admins/my-')) {
        setActiveSection('my-trainings');
        if (pathname.startsWith('/admins/my-results')) {
          setCurrentView({ type: 'my-results' });
        } else if (pathname.startsWith('/admins/my-exams')) {
          setCurrentView({ type: 'my-exams' });
        } else {
          setCurrentView({ type: 'my-groups' });
        }
      } else if (pathname.startsWith('/admins/results')) {
        setActiveSection('results');
        setCurrentView({ type: 'results' });
      } else if (pathname.startsWith('/admins/forum')) {
        setActiveSection('forum');
        if (pathname.startsWith('/admins/forum/new')) {
          setCurrentView({ type: 'forum-new-topic' });
        } else if (pathname.match(/\/admins\/forum\/topics\/(\d+)/)) {
          const topicId = pathname.match(/\/admins\/forum\/topics\/(\d+)/)?.[1];
          setCurrentView({ type: 'forum-topic', topicId: topicId || '' });
        } else {
          setCurrentView({ type: 'forum' });
        }
      } else if (pathname.startsWith('/admins/groups')) {
        setActiveSection('groups');
        setCurrentView({ type: 'groups' });
      } else {
        setActiveSection('users');
        setCurrentView({ type: 'users' });
      }
    }
  }, [params]);

  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);

    // Reset view based on section
    if (section === 'users') {
      navigate('/');
    } else if (section === 'groups') {
      navigate('/');
    } else if (section === 'results') {
      navigate('/');
    } else if (section === 'my-trainings') {
      navigate('/');
      setMyTrainingsExpanded(true);
    }
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'users':
        return <UserManagement />;
      case 'groups':
        return <TrainingGroupsAdmin organizationId={String(user.organizationId || '')} onGroupClick={(groupId) => {
          navigate(`/admins/groups/${groupId}`);
        }} />;
      case 'group-detail':
        return <TrainingGroupDetail groupId={params.groupId || ''} />;
      case 'results':
        return <ExamResultsAdmin />;
      case 'forum':
        return <Forum
          organizationId={String(user.organizationId || '')}
          currentUserId={String(user.id)}
          onTopicClick={(topicId) => navigate(`/admins/forum/topics/${topicId}`)}
          onNewTopicClick={() => navigate('/admins/forum/new')}
        />;
      case 'forum-topic':
        return <ForumTopicDetail
          topicId={currentView.topicId}
          currentUserId={String(user.id)}
          onBack={() => navigate('/admins/forum')}
        />;
      case 'forum-new-topic':
        return <ForumNewTopic
          organizationId={String(user.organizationId || '')}
          currentUserId={String(user.id)}
          onBack={() => navigate('/admins/forum')}
          onSubmit={(topicId) => navigate(`/admins/forum/topics/${topicId}`)}
        />;
      case 'my-groups':
        return (
          <MyTrainingGroups
            onGroupClick={(groupId) => navigate(`/admins/my-groups/${groupId}`)}
            onNavigateToGroup={(groupId) => navigate(`/admins/my-groups/${groupId}`)}
          />
        );
      case 'my-group':
        return (
          <GroupView
            groupId={currentView.groupId}
            onNavigateToGroups={() => navigate('/')}
            onModuleClick={(moduleId) =>
              navigate(`/admins/my-groups/${currentView.groupId}/modules/${moduleId}`)
            }
            onExamClick={(examId) =>
              navigate(`/admins/my-exams/${examId}`)
            }
            onNavigateToModule={(moduleId) =>
              navigate(`/admins/my-groups/${currentView.groupId}/modules/${moduleId}`)
            }
          />
        );
      case 'my-module':
        return (
          <ModuleView
            groupId={currentView.groupId}
            moduleId={currentView.moduleId}
            onNavigateToGroups={() => navigate('/')}
            onNavigateToGroup={() => navigate(`/admins/my-groups/${currentView.groupId}`)}
            onLessonClick={(lessonId) =>
              navigate(`/admins/my-groups/${currentView.groupId}/modules/${currentView.moduleId}/lessons/${lessonId}`)
            }
            onNavigateToLesson={(lessonId) =>
              navigate(`/admins/my-groups/${currentView.groupId}/modules/${currentView.moduleId}/lessons/${lessonId}`)
            }
          />
        );
      case 'my-lesson':
        return (
          <LessonView
            groupId={currentView.groupId}
            moduleId={currentView.moduleId}
            lessonId={currentView.lessonId}
            onNavigateToGroups={() => navigate('/')}
            onNavigateToGroup={() => navigate(`/admins/groups/${currentView.groupId}`)}
            onNavigateToModule={() =>
              navigate(`/admins/groups/${currentView.groupId}/modules/${currentView.moduleId}`)
            }
          />
        );
      case 'my-exams':
        return (
          <MyExams
            onExamClick={({ assignmentId, groupId, groupName }) =>
              navigate(`/admins/my-exams/${assignmentId}`)
            }
          />
        );
      case 'my-exam':
        return (
          <ExamView
            groupId={currentView.groupId}
            assignmentId={currentView.assignmentId}
            groupName={currentView.groupName}
            onStartAttempt={(examInstanceId: number) => {
              navigate(`/admins/my-exams/${currentView.assignmentId}/attempt/${examInstanceId}`);
            }}
            onViewResults={() =>
              navigate(`/admins/my-results/${currentView.assignmentId}`)
            }
          />
        );
      case 'my-exam-attempt':
        return (
          <ExamAttempt
            attemptId={
              currentView.attemptId !== undefined
                ? String(currentView.attemptId)
                : undefined
            }
            examInstanceId={currentView.examInstanceId || currentView.attemptId || 0}
            onComplete={() =>
              navigate(`/admins/my-exams/${currentView.assignmentId}`)
            }
          />
        );
      case 'my-results':
        return <MyExamResults userId={String(user.id)} onResultClick={(assignmentId) => navigate(`/admins/my-results/${assignmentId}`)} />;
      case 'my-result-detail':
        return <ExamResultDetail assignmentId={parseInt(currentView.resultId)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1>Кабінет адміна</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActiveSection('users');
              navigate('/admins/users');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Users className="w-5 h-5" />
            <span>Користувачі</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('groups');
              navigate('/admins/groups');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'groups' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Групи навчання</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('results');
              navigate('/admins/results');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'results' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Результати екзаменів</span>
          </button>

          <button
            onClick={() => {
              setActiveSection('forum');
              navigate('/admins/forum');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'forum' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Форум</span>
          </button>

          <div>
            <button
              onClick={() => {
                setMyTrainingsExpanded(!myTrainingsExpanded);
                if (!myTrainingsExpanded) {
                  setActiveSection('my-trainings');
                  navigate('/admins/my-groups');
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeSection === 'my-trainings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <span>Моє навчання</span>
              </div>
              {myTrainingsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {myTrainingsExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => {
                    setActiveSection('my-trainings');
                    setCurrentView({ type: 'my-groups' });
                    navigate('/admins/my-groups');
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${currentView.type.startsWith('my-group') || currentView.type.startsWith('my-module') || currentView.type.startsWith('my-lesson')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Мої групи навчання</span>
                </button>

                <button
                  onClick={() => {
                    setActiveSection('my-trainings');
                    setCurrentView({ type: 'my-exams' });
                    navigate('/admins/my-exams');
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${currentView.type.startsWith('my-exam')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Заплановані екзамени</span>
                </button>

                <button
                  onClick={() => {
                    setActiveSection('my-trainings');
                    setCurrentView({ type: 'my-results' });
                    navigate('/admins/my-results');
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${currentView.type === 'my-results' || currentView.type === 'my-result-detail'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span>Результати</span>
                </button>
              </div>
            )}
          </div>
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
          <Badge variant="secondary" className="w-full justify-center mb-2">Адмін організації</Badge>
          <Button variant="outline" onClick={onLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
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
