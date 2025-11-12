import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Trophy, Calendar, CheckCircle, XCircle, Eye, TrendingUp, TrendingDown, Minus, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { BackendExamAssignment } from '@/types/backend';
import { fetchResults, type FetchResultsResult } from '@/services/results';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface ExamConfig {
  show_results: boolean;
  passing_score: number;
  randomize_questions: boolean;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  attempts_allowed: number;
  time_limit: number;
  config: ExamConfig;
  created_at: string;
  updated_at: string;
}

interface Result {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface ExamAssignment {
  id: number;
  attempts_allowed: number;
  is_control: boolean;
  start_at: string;
  end_at: string;
  group_id: number;
  exam: Exam;
  result: Result;
  group: Group;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: ExamAssignment[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

interface MyExamResultsProps {
  userId: string;
  onResultClick?: (assignmentId: number) => void;
}

const perPage = 10;

interface GroupBlockProps {
  groupId: number;
  groupName: string;
  assignments: BackendExamAssignment[];
  onResultClick?: (assignmentId: number) => void;
}

interface ExamResult {
  id: string;
  examName: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'passed' | 'failed';
  completedAt: string;
  timeSpent: number;
  attemptNumber: number;
  instanceId: number;
}

interface GroupResults {
  groupId: number;
  groupName: string;
  totalExams: number;
  passedExams: number;
  averageScore: number;
  results: ExamResult[];
}

function GroupBlock({ groupId, groupName, assignments, onResultClick }: GroupBlockProps) {
  // Функція для обчислення відсотку
  const calculatePercentage = (score: number, totalQuestions: number): number => {
    if (totalQuestions === 0) return 0;
    return Math.round((score / totalQuestions) * 100);
  };

  // Функція для форматування дати
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Функція для форматування часу виконання
  const formatElapsedTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs} сек`;
    return `${minutes} хв ${secs} сек`;
  };

  // Функція для отримання іконки результату
  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    }
    if (percentage >= 60) {
      return <Minus className="w-5 h-5 text-yellow-500" />;
    }
    return <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  return (
    <Card key={groupId} onClick={() => onResultClick && onResultClick(assignments[0]?.id)} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{groupName}</CardTitle>
            <CardDescription>
              {assignments.filter(a => a.result?.slug === 'passed').length} з {assignments.length} екзаменів здано
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl">
              {assignments.length > 0 ?
                Math.round(assignments.reduce((acc, a) => {
                  const lastInstance = a.instances?.[a.instances.length - 1];
                  if (lastInstance && lastInstance.attempt) {
                    const percentage = calculatePercentage(
                      lastInstance.attempt.score ?? 0,
                      lastInstance.attempt.answers?.length ?? 0
                    );
                    return acc + percentage;
                  }
                  return acc;
                }, 0) / assignments.length) : 0}%
            </div>
            <div className="text-sm text-gray-500">Середній бал</div>
          </div>
        </div>
        <Progress value={(assignments.filter(a => a.result?.slug === 'passed').length / assignments.length) * 100} className="mt-4" />
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-sm text-muted-foreground">Немає екзаменів для відображення</div>
        ) : (
          <Accordion type="single" collapsible>
            <AccordionItem value="results">
              <AccordionTrigger>
                Переглянути детальні результати ({assignments.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 mt-2">
                  {assignments.map((assignment) => {
                    // Беремо останню спробу для відображення
                    const lastInstance = assignment.instances?.[assignment.instances.length - 1];
                    const lastAttempt = lastInstance?.attempt;

                    if (!lastAttempt) return null;

                    const totalQuestions = lastAttempt.answers?.length ?? 0;
                    const percentage = calculatePercentage(lastAttempt.score ?? 0, totalQuestions);
                    const isPassed = assignment.result?.slug === 'passed';

                    return (
                      <Card key={assignment.id} onClick={() => onResultClick && onResultClick(assignment.id)} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                <h4>{assignment.exam?.title || 'Екзамен'}</h4>
                                <Badge
                                  variant={isPassed ? "default" : "destructive"}
                                  className="flex items-center gap-1"
                                >
                                  {isPassed ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      {assignment.result?.name || 'Здано'}
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      {assignment.result?.name || 'Не здано'}
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                Використано спроб: {assignment.instances?.length ?? 0} з {assignment.attempts_allowed}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              {getScoreIcon(percentage)}
                              <div>
                                <div className="text-xl">{lastAttempt.score}</div>
                                <div className="text-sm text-gray-500">з {totalQuestions}</div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Результат</span>
                                <span>{percentage}% (Прохідний: {String(assignment.exam?.config?.passing_score ?? 70)}%)</span>
                              </div>
                              <Progress value={percentage} />
                            </div>
                          </div>

                          {/* Відображення всіх спроб */}
                          {assignment.instances && assignment.instances.length > 1 && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm mb-2">Історія спроб:</div>
                              <div className="space-y-1">
                                {assignment.instances.map((instance) => {
                                  const instancePercentage = calculatePercentage(
                                    instance.attempt?.score ?? 0,
                                    instance.attempt?.answers?.length ?? 0
                                  );
                                  return (
                                    <div key={instance.id} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">
                                        Спроба {instance.attempt_number}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {instance.attempt?.score ?? 0}/{instance.attempt?.answers?.length ?? 0}
                                        </span>
                                        <Badge
                                          variant={instancePercentage >= Number(assignment.exam?.config?.passing_score ?? 70) ? "default" : "secondary"}
                                        >
                                          {instancePercentage}%
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <div>
                                  <div className="text-gray-600">Остання спроба</div>
                                  <div>{lastAttempt.submitted_at ? formatDate(lastAttempt.submitted_at) : '—'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <div>
                                  <div className="text-gray-600">Час виконання</div>
                                  <div>{lastAttempt.elapsed_seconds ? formatElapsedTime(lastAttempt.elapsed_seconds) : '—'}</div>
                                </div>
                              </div>
                            </div>
                            {onResultClick && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onResultClick && onResultClick(assignment.id)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Детальніше
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

export function MyExamResults({ userId, onResultClick }: MyExamResultsProps) {
  const [page, setPage] = useState(1);

  const { data: response, isLoading, isError, isFetching } = useQuery<FetchResultsResult>({
    queryKey: ['results', 'me', page, perPage],
    queryFn: () => fetchResults({ page, perPage }),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  const assignments = response?.assignments ?? [];
  const meta = response?.meta;

  const groupedAssignments = useMemo(() => {
    const grouped = assignments.reduce((acc, assignment) => {
      const groupId = assignment.group?.id?.toString() ?? '0';
      if (!acc[groupId]) {
        acc[groupId] = {
          group: assignment.group!,
          assignments: []
        };
      }
      acc[groupId].assignments.push(assignment);
      return acc;
    }, {} as Record<string, { group: any; assignments: any[] }>);
    return grouped;
  }, [assignments]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError || !assignments) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">Не вдалося завантажити результати. Спробуйте пізніше.</p>
      </div>
    );
  }

  // Функція для форматування дати
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Обчислюємо загальну статистику
  const totalExams = meta?.total ?? assignments.length;
  const passedExams = assignments.filter(a => a.result?.slug === 'passed').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Результати екзаменів</h2>
        <p className="text-gray-600">Історія ваших результатів згрупована по курсах</p>
      </div>

      {/* Загальна статистика */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Здано екзаменів</CardDescription>
            <CardTitle className="text-3xl text-green-600">{passedExams} / {totalExams}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Успішність</CardDescription>
            <CardTitle className="text-3xl text-indigo-600">
              {totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Результати по групах */}
      <div className="space-y-4">
        {Object.values(groupedAssignments).map(({ group, assignments: groupAssignments }) => {
          const groupPassed = groupAssignments.filter(a => a.result?.slug === 'passed').length;
          const groupTotal = groupAssignments.length;

          return (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{group.name}</CardTitle>
                    <CardDescription>
                      {group.description}
                    </CardDescription>
                  </div>
                  <Badge variant={groupPassed === groupTotal ? "default" : "secondary"}>
                    {groupPassed} з {groupTotal} здано
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupAssignments.map((assignment) => {
                    const isPassed = assignment.result?.slug === 'passed';
                    const lastInstance = assignment.instances?.[assignment.instances.length - 1];

                    return (
                      <Card
                        key={assignment.id}
                        className={`${isPassed ? 'border-green-200' : 'border-gray-200'} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => onResultClick && onResultClick(assignment.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                <h4>{assignment.exam?.title || 'Екзамен'}</h4>
                                <Badge
                                  variant={isPassed ? "default" : "destructive"}
                                  className="flex items-center gap-1"
                                >
                                  {isPassed ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      {assignment.result?.name || 'Результат'}
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      {assignment.result?.name || 'Результат'}
                                    </>
                                  )}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <div className="text-gray-600">Початок</div>
                                    <div>{formatDate(assignment.start_at)}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <div className="text-gray-600">Завершення</div>
                                    <div>{formatDate(assignment.end_at)}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="text-sm text-gray-600">
                                Дозволено спроб: {assignment.attempts_allowed}
                                {assignment.is_control && (
                                  <Badge variant="outline" className="ml-2">Контрольний</Badge>
                                )}
                              </div>
                            </div>
                            {onResultClick && lastInstance && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResultClick && onResultClick(assignment.id);
                                }}
                                className="ml-4"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Детальніше
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-between items-center pt-4 text-sm text-muted-foreground">
          <div>
            Сторінка {meta.current_page} з {meta.last_page}
            {isFetching && <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin" />}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Попередня
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((prev) => Math.min(prev + 1, meta.last_page))}
            >
              Наступна
            </Button>
          </div>
        </div>
      )}

      {/* Якщо немає результатів */}
      {assignments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl mb-2">Результатів поки немає</h3>
            <p className="text-gray-600">
              Коли ви здасте екзамени, тут з'явиться історія ваших результатів
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
