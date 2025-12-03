import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle, Clock, Trophy, Award, Target, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchResultDetail } from '@/services/results';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import type { BackendExamAssignment } from '@/types/backend';

interface Answer {
  id: number;
  exam_attempt_id: number;
  question_id: number;
  answer: string;
  is_correct: boolean | null;
  graded_by: number | null;
  created_at: string;
  updated_at: string;
}

interface Attempt {
  id: number;
  exam_instance_id: number;
  started_at: string;
  submitted_at: string;
  elapsed_seconds: number;
  score: number;
  answers: Answer[];
  created_at: string;
  updated_at: string;
}

interface Instance {
  id: number;
  assignment_id: number;
  user_id: number;
  attempt_number: number;
  start_at: string | null;
  end_at: string | null;
  attempt: Attempt;
  created_at: string;
  updated_at: string;
}

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



interface ExamResultDetailProps {
  assignmentId: number;
  instanceId?: number;
}

export function ExamResultDetail({ assignmentId, instanceId }: ExamResultDetailProps) {
  const {
    data: assignment,
    isLoading,
    isError,
    error,
  } = useQuery<BackendExamAssignment>({
    queryKey: ['result-detail', assignmentId],
    queryFn: () => fetchResultDetail(assignmentId.toString()),
    enabled: !!assignmentId,
  });

  // Знаходимо поточну instance
  // Сортуємо спроби по кількості правильних відповідей (спочатку найкраща)
  const instances = assignment?.instances || [];
  const sortedInstances = [...instances].sort((a, b) => {
    const scoreA = a.attempt?.score ?? 0;
    const scoreB = b.attempt?.score ?? 0;
    return scoreB - scoreA; // Спочатку найбільший бал
  });

  const initialInstanceIndex = instanceId ? sortedInstances.findIndex(i => i.id === instanceId) : 0;
  const currentInstanceIndex = initialInstanceIndex >= 0 ? initialInstanceIndex : 0;

  // State for navigating between attempts
  const [selectedInstanceIndex, setSelectedInstanceIndex] = useState(currentInstanceIndex);

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

  if (isError || !assignment) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">
          Не вдалося завантажити деталі результату. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
        </p>
      </div>
    );
  }



  const currentInstance = instances[selectedInstanceIndex];
  if (!currentInstance) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Спробу не знайдено</p>
        </div>
      </div>
    );
  }

  const attempt = currentInstance.attempt;
  if (!attempt) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Спробу не знайдено</p>
        </div>
      </div>
    );
  }

  // Navigation functions
  const goToPreviousAttempt = () => {
    if (selectedInstanceIndex > 0) {
      setSelectedInstanceIndex(selectedInstanceIndex - 1);
    }
  };

  const goToNextAttempt = () => {
    if (selectedInstanceIndex < sortedInstances.length - 1) {
      setSelectedInstanceIndex(selectedInstanceIndex + 1);
    }
  };

  const totalQuestions = attempt.answers?.length ?? 0;
  const correctAnswers = attempt.answers?.filter(a => a.is_correct === true).length ?? 0;
  const incorrectAnswers = attempt.answers?.filter(a => a.is_correct === false).length ?? 0;
  const pendingAnswers = attempt.answers?.filter(a => a.is_correct === null).length ?? 0;
  const percentage = Math.round(((attempt.score ?? 0) / totalQuestions) * 100);
  const isPassed = assignment.result?.slug === 'passed';

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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours} год ${minutes} хв ${secs} сек`;
    }
    if (minutes > 0) {
      return `${minutes} хв ${secs} сек`;
    }
    return `${secs} сек`;
  };

  // Дані для кругової діаграми
  const pieData = [
    { name: 'Правильні', value: correctAnswers, color: '#22c55e' },
    { name: 'Неправильні', value: incorrectAnswers, color: '#ef4444' },
    ...(pendingAnswers > 0 ? [{ name: 'Очікує перевірки', value: pendingAnswers, color: '#9ca3af' }] : [])
  ];

  // Дані для порівняння спроб
  const attemptsComparisonData = sortedInstances.map(instance => ({
    attempt: `Спроба ${instance.attempt_number}`,
    percentage: Math.round(((instance.attempt?.score ?? 0) / (instance.attempt?.answers?.length ?? 1)) * 100),
    score: instance.attempt?.score ?? 0,
    total: instance.attempt?.answers?.length ?? 0
  }));

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>{assignment.group?.name}</span>
          <span>→</span>
          <span>{assignment.exam?.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl mb-2">Детальні результати екзамену</h2>
            <p className="text-gray-600">Спроба {currentInstance.attempt_number} • {attempt.submitted_at ? formatDate(attempt.submitted_at) : '—'}</p>
          </div>
          {sortedInstances.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousAttempt}
                disabled={selectedInstanceIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Попередня
              </Button>
              <span className="text-sm text-gray-600">
                {selectedInstanceIndex + 1} з {sortedInstances.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextAttempt}
                disabled={selectedInstanceIndex === sortedInstances.length - 1}
              >
                Наступна
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Загальний результат */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isPassed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                {isPassed ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl mb-1">
                  {assignment.result?.name}
                </CardTitle>
                <p className="text-gray-600">
                  {attempt.score ?? 0} з {totalQuestions} правильних відповідей
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {percentage}%
              </div>
              <div className="text-sm text-gray-500">Ваш результат</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Прогрес</span>
              <span>{percentage}% (Прохідний бал: {(assignment.exam?.config as any)?.passing_score ?? 70}%)</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <div className="text-xl">{percentage}%</div>
              <div className="text-sm text-gray-600">Результат</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-600">Правильно</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <div className="text-xl text-red-600">{incorrectAnswers}</div>
              <div className="text-sm text-gray-600">Неправильно</div>
            </div>
            {pendingAnswers > 0 && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <div className="text-xl text-gray-600">{pendingAnswers}</div>
                <div className="text-sm text-gray-600">Очікує перевірки</div>
              </div>
            )}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl text-blue-600">{Math.floor((attempt.elapsed_seconds ?? 0) / 60)}</div>
              <div className="text-sm text-gray-600">Хвилин</div>
            </div>
          </div>

          {/* Додаткова інформація */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Статус екзамену</div>
                <Badge variant={isPassed ? "default" : "destructive"}>
                  {assignment.result?.name}
                </Badge>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Час виконання</div>
                <div>{formatElapsedTime(attempt.elapsed_seconds ?? 0)}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Початок</div>
                <div>{attempt.started_at ? formatDate(attempt.started_at) : '—'}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Завершення</div>
                <div>{attempt.submitted_at ? formatDate(attempt.submitted_at) : '—'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Аналітика */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Розподіл відповідей */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Розподіл відповідей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Відповіді",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-64"
            >
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: { name: string; value: number; percent: number }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl text-green-600">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Правильних відповідей</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl text-red-600">{incorrectAnswers}</div>
                <div className="text-sm text-gray-600">Помилок</div>
              </div>
              {pendingAnswers > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl text-gray-600">{pendingAnswers}</div>
                  <div className="text-sm text-gray-600">Очікує перевірки</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Порівняння спроб */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Порівняння спроб
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                percentage: {
                  label: "Результат",
                  color: "#6366f1",
                },
              }}
              className="h-64"
            >
              <BarChart data={attemptsComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="attempt" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="percentage" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {attemptsComparisonData.map((data, index) => {
                const isCurrentAttempt = index + 1 === currentInstance.attempt_number;
                return (
                  <div
                    key={data.attempt}
                    className={`flex items-center justify-between text-sm p-2 rounded ${isCurrentAttempt ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                  >
                    <span className={isCurrentAttempt ? '' : 'text-gray-600'}>{data.attempt}</span>
                    <div className="flex items-center gap-2">
                      <span>{data.score}/{data.total}</span>
                      <Badge variant="secondary">
                        {data.percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Детальний перегляд питань */}
      <Card>
        <CardHeader>
          <CardTitle>Детальний перегляд відповідей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attempt.answers?.map((answer, index) => {
              const getAnswerStyle = () => {
                if (answer.is_correct === true) return 'border-green-200 bg-green-50/50';
                if (answer.is_correct === false) return 'border-red-200 bg-red-50/50';
                return 'border-gray-200 bg-gray-50/50';
              };

              const getIconStyle = () => {
                if (answer.is_correct === true) return 'bg-green-100 text-green-600';
                if (answer.is_correct === false) return 'bg-red-100 text-red-600';
                return 'bg-gray-100 text-gray-600';
              };

              const getAnswerBoxStyle = () => {
                if (answer.is_correct === true) return 'bg-green-100 border border-green-200';
                if (answer.is_correct === false) return 'bg-red-100 border border-red-200';
                return 'bg-gray-100 border border-gray-200';
              };

              return (
                <Card
                  key={answer.id}
                  className={getAnswerStyle()}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyle()}`}>
                        {answer.is_correct === true ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : answer.is_correct === false ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4>Питання {index + 1}</h4>
                          <Badge variant="outline" className="text-xs">
                            ID: {answer.question_id}
                          </Badge>
                          {answer.is_correct === null && (
                            <Badge variant="secondary" className="text-xs">
                              Очікує перевірки
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className={`p-3 rounded-lg ${getAnswerBoxStyle()}`}>
                            <div className="text-sm text-gray-600 mb-1">Ваша відповідь:</div>
                            <div>{answer.answer}</div>
                          </div>

                          {answer.graded_by && (
                            <div className="text-sm text-gray-500">
                              Перевірено викладачем (ID: {answer.graded_by})
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
