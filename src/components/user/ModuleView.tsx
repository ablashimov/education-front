import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { BookOpen, CheckCircle, Lock, Play, ChevronRight, Video, FileText, Clock, AlertCircle } from 'lucide-react';
import { getGroupById, fetchGroupModule, fetchModuleLessons } from '@/services/groups';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

interface ModuleViewProps {
  groupId: number;
  moduleId: number;
  onLessonClick: (lessonId: number) => void;
  onNavigateToGroups?: () => void;
  onNavigateToGroup?: () => void;
  onNavigateToLesson?: (lessonId: number) => void;
}

const truncate = (value: string | null | undefined, length = 160) => {
  if (!value) return '';
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
};

export function ModuleView({
  groupId,
  moduleId,
  onLessonClick,
  onNavigateToGroups,
  onNavigateToGroup,
  onNavigateToLesson,
}: ModuleViewProps) {
  const coerceToString = (value: unknown) => {
    if (typeof value === 'string') {
      return value;
    }
    if (value == null) {
      return '';
    }
    return String(value);
  };

  const { 
    data: group, 
    isLoading: isGroupLoading, 
    isError: isGroupError,
    error: groupError,
  } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroupById(groupId),
    enabled: Number.isFinite(groupId),
  });

  const {
    data: module,
    isLoading: isModuleLoading,
    isError: isModuleError,
    error: moduleError,
  } = useQuery({
    queryKey: ['group', groupId, 'modules', moduleId],
    queryFn: () => fetchGroupModule(groupId, moduleId),
    enabled: Number.isFinite(groupId) && Number.isFinite(moduleId),
  });

  const {
    data: lessons,
    isLoading: isLessonsLoading,
    isError: isLessonsError,
    error: lessonsError,
  } = useQuery({
    queryKey: ['group', groupId, 'modules', moduleId, 'lessons'],
    queryFn: () => fetchModuleLessons(groupId, moduleId),
    enabled: Number.isFinite(groupId) && Number.isFinite(moduleId),
  });

  const isLoading = isModuleLoading || isLessonsLoading || isGroupLoading;

  const lessonList = useMemo(() => {
    if (lessons && lessons.length > 0) return lessons;
    return module?.lessons ?? [];
  }, [lessons, module]);

  // Calculate module progress
  const moduleProgress = useMemo(() => {
    if (!lessonList.length) return 0;
    // For now, assume progress is 0 since we don't have completion data
    return 0;
  }, [lessonList]);

  const getLessonIcon = (lesson: any) => {
    // For now, assume all lessons are available and not completed
    return <Play className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {onNavigateToGroups ? (
              <BreadcrumbLink
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateToGroups?.();
                }}
              >
                Мої групи навчання
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Мої групи навчання</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {onNavigateToGroup ? (
              <BreadcrumbLink
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateToGroup?.();
                }}
              >
                {group?.name ?? `Група #${groupId}`}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{group?.name ?? `Група #${groupId}`}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{module?.title ?? 'Модуль'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          {isModuleLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ) : module ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{module.title}</CardTitle>
                  {module.settings?.description != null && (
                    <CardDescription>{coerceToString(module.settings.description)}</CardDescription>
                  )}
                </div>
                <Badge variant={moduleProgress === 100 ? 'default' : 'secondary'}>
                  {moduleProgress}% завершено
                </Badge>
              </div>

              <div className="mt-6">
                <Progress value={moduleProgress} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">
                  0 з {lessonList.length} уроків завершено
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Дані модуля недоступні.</div>
          )}
        </CardHeader>
      </Card>

      {(isModuleError || isLessonsError || isGroupError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити інформацію про модуль.{' '}
            {moduleError instanceof Error
              ? moduleError.message
              : lessonsError instanceof Error
                ? lessonsError.message
                : groupError instanceof Error
                  ? groupError.message
                  : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h3 className="text-xl mb-4">Уроки модуля</h3>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && lessonList.length === 0 && !isLessonsError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Для цього модуля поки що немає уроків.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {lessonList.map((lesson) => (
            <Card
              key={lesson.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onNavigateToLesson ? onNavigateToLesson(lesson.id) : onLessonClick(lesson.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      {getLessonIcon(lesson)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4>{lesson.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {lesson.material ? truncate(typeof lesson.material === 'string' ? lesson.material : String(lesson.material)) : 'Опис відсутній'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>— хв</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
