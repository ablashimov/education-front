import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BookOpen, CheckCircle, Lock, ChevronRight, ClipboardList, Calendar, Clock, AlertCircle, PlayCircle } from 'lucide-react';
import { getGroupById, fetchGroupModules } from '@/services/groups';
import { fetchGroupAssignedExams } from '@/services/exams';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import type { BackendExamAssignment } from '@/types/backend';

interface GroupViewProps {
  groupId: number;
  onNavigateToGroups?: () => void;
  onModuleClick: (moduleId: number) => void;
  onExamClick: (examId: number) => void;
  onNavigateToModule?: (moduleId: number) => void;
}

export function GroupView({ groupId, onModuleClick, onNavigateToGroups, onExamClick, onNavigateToModule }: GroupViewProps) {
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
    data: modules,
    isLoading: isModulesLoading,
    isError: isModulesError,
    error: modulesError,
  } = useQuery({
    queryKey: ['group', groupId, 'modules'],
    queryFn: () => fetchGroupModules(groupId),
    enabled: Number.isFinite(groupId),
  });

  const {
    data: exams,
    isLoading: isExamsLoading,
    isError: isExamsError,
    error: examsError,
  } = useQuery({
    queryKey: ['group', groupId, 'exams'],
    queryFn: () => fetchGroupAssignedExams(groupId),
    enabled: Number.isFinite(groupId),
  });

  const isLoading = isGroupLoading || isModulesLoading || isExamsLoading;

  const moduleList = useMemo(() => modules ?? [], [modules]);
  const examList = useMemo(() => exams ?? [], [exams]);

  // Calculate group progress based on modules
  const groupProgress = useMemo(() => {
    if (!moduleList.length) return 0;
    // For now, assume progress is 0 since we don't have completion data
    // In a real implementation, this would be calculated from lesson completion
    return 0;
  }, [moduleList]);

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
            <BreadcrumbPage>{group?.name ?? 'Група'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          {isGroupLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : group ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{group.name}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
                <Badge variant={groupProgress === 100 ? 'default' : 'secondary'}>
                  {groupProgress}% завершено
                </Badge>
              </div>

              <div className="mt-6">
                <Progress value={groupProgress} className="h-3" />
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Дані групи недоступні.</div>
          )}
        </CardHeader>
      </Card>

      {(isGroupError || isModulesError || isExamsError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити інформацію про групу.{' '}
            {groupError instanceof Error
              ? groupError.message
              : modulesError instanceof Error
                ? modulesError.message
                : examsError instanceof Error
                  ? examsError.message
                  : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="flex w-full gap-2">
          <TabsTrigger value="modules" className="flex items-center gap-2 whitespace-nowrap flex-1 bg-white border">
            <BookOpen className="w-4 h-4" />
            Модулі курсу ({moduleList.length})
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2 whitespace-nowrap flex-1 bg-white border">
            <ClipboardList className="w-4 h-4" />
            Екзамени ({examList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && moduleList.length === 0 && !isModulesError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Для цієї групи поки що немає модулів.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {moduleList.map((module) => (
              <Card
                key={module.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigateToModule ? onNavigateToModule(module.id) : onModuleClick(module.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <span>{module.order}</span>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                          {module.settings?.description != null && (
                            <CardDescription>{coerceToString(module.settings.description)}</CardDescription>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            0/{module.lessons?.length ?? 0} уроків пройдено
                          </span>
                          <span>0%</span>
                        </div>
                        <Progress value={0} />
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && examList.length === 0 && !isExamsError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Для цієї групи поки що немає екзаменів.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {examList.map((exam: BackendExamAssignment) => {
              const isActive = exam.start_at && exam.end_at &&
                new Date() >= new Date(exam.start_at) &&
                new Date() <= new Date(exam.end_at);

              const getExamStatusBadge = () => {
                if (exam.result?.slug === 'passed') {
                  return <Badge variant="default">Здано</Badge>;
                }
                if (exam.result?.slug === 'failed') {
                  return <Badge variant="destructive">Не здано</Badge>;
                }
                if (isActive) {
                  return <Badge variant="default" className="bg-green-600">Доступний</Badge>;
                }
                if (exam.start_at && new Date() < new Date(exam.start_at)) {
                  return <Badge variant="secondary">Заплановано</Badge>;
                }
                return <Badge variant="destructive">Пропущено</Badge>;
              };

              return (
                <Card key={exam.id} className={isActive ? 'border-green-200 bg-green-50/50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ClipboardList className="w-5 h-5 text-indigo-600" />
                          <CardTitle className="text-lg">{exam.exam?.title}</CardTitle>
                          {getExamStatusBadge()}
                        </div>
                        <CardDescription>{exam.exam?.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-gray-600">Початок</div>
                          <div>{exam.start_at ? new Date(exam.start_at).toLocaleDateString('uk-UA') : 'Не вказано'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-gray-600">Закінчення</div>
                          <div>{exam.end_at ? new Date(exam.end_at).toLocaleDateString('uk-UA') : 'Не вказано'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="grid grid-cols-3 gap-4 text-sm flex-1">
                        <div>
                          <span className="text-gray-600">Спроб:</span>
                          <span className="ml-2">{exam.attempts_allowed}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Час:</span>
                          <span className="ml-2">{exam.exam?.time_limit ? `${exam.exam.time_limit} хв` : 'Не обмежено'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Прохідний бал:</span>
                          <span className="ml-2">Не вказано</span>
                        </div>
                      </div>
                    </div>

                    {exam.attempt && exam.attempt.score !== null && (
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-sm">
                          <span className="text-gray-600">Останній результат:</span>
                          <span className="ml-2">{exam.attempt.score}%</span>
                        </div>
                      </div>
                    )}

                    {isActive ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg border border-green-200">
                          <AlertCircle className="w-4 h-4 text-green-700" />
                          <span className="text-sm text-green-700">
                            Екзамен доступний для здачі! Ви можете розпочати його прямо зараз.
                          </span>
                        </div>
                        <Button onClick={() => onExamClick(exam.id)} className="w-full bg-green-600 hover:bg-green-700">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Перейти до екзамену
                        </Button>
                      </div>
                    ) : exam.result?.slug === 'passed' ? (
                      <Button onClick={() => onExamClick(exam.id)} variant="outline" className="w-full">
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Переглянути результати
                      </Button>
                    ) : exam.start_at && new Date() < new Date(exam.start_at) ? (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Clock className="w-4 h-4" />
                          <span>
                            Екзамен буде доступний з {new Date(exam.start_at).toLocaleDateString('uk-UA')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>Термін здачі екзамену минув</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
