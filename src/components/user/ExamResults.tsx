import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, CheckCircle, Clock as ClockIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useMemo } from 'react';
import { listExamInstances } from '@/services/exams';
import { differenceInMinutes, isBefore } from 'date-fns';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { BackendExamInstance } from '@/types/backend';

interface ExamResultsProps {
  groupId: number;
  assignedExamId: number;
}

export function ExamResults({ groupId, assignedExamId }: ExamResultsProps) {
  const { 
    data: examInstances = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<BackendExamInstance[]>({
    queryKey: ['examInstances', groupId, assignedExamId],
    queryFn: () => listExamInstances(groupId, assignedExamId),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Log the data when it's loaded
  useEffect(() => {
    console.log('ExamResults mounted with:', { groupId, assignedExamId });
    if (examInstances.length > 0) {
      console.log('Fetched exam instances:', examInstances);
    }
    return () => {
      console.log('ExamResults unmounting');
    };
  }, [groupId, assignedExamId, examInstances]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!examInstances?.length) return null;
    
    const completedExams = examInstances.filter(exam => exam.end_at);
    const lastAttempt = [...examInstances].sort((a, b) => 
      new Date(b.start_at || 0).getTime() - new Date(a.start_at || 0).getTime()
    )[0];
    
    return {
      totalAttempts: examInstances.length,
      completedAttempts: completedExams.length,
      lastAttemptDate: lastAttempt?.end_at ? format(new Date(lastAttempt.end_at), 'dd.MM.yyyy HH:mm') : null,
    };
  }, [examInstances]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">
          Не вдалося завантажити результати: {error instanceof Error ? error.message : 'Невідома помилка'}
        </p>
      </div>
    );
  }

  if (!examInstances || examInstances.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium">Результати тестування</h3>
          <p className="text-muted-foreground mt-1">Ви ще не проходили це тестування</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Статистика тестування</h3>
            <p className="text-sm text-muted-foreground">
              {stats?.totalAttempts} спроб, з них завершено: {stats?.completedAttempts}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Оновити
          </Button>
        </div>
        
        {stats?.lastAttemptDate && (
          <div className="mt-4 text-sm text-muted-foreground">
            Остання спроба: {stats.lastAttemptDate}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Мої спроби</h3>
      {examInstances.map((instance) => (
        <Card key={instance.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">
                Спроба від {instance.start_at ? format(new Date(instance.start_at), 'dd MMMM yyyy', { locale: uk }) : 'Невідомо'}
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {instance.start_at
                    ? format(new Date(instance.start_at), 'HH:mm')
                    : 'Не розпочато'}
                </span>
              </div>
            </div>
            {instance.end_at ? (
              <Badge
                variant={
                  instance.end_at ? 'default' : 'outline'
                }
                className="gap-1"
              >
                {instance.end_at ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Завершено</span>
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4" />
                    <span>В процесі</span>
                  </>
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <span>В процесі</span>
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Бали</p>
                <p className="text-lg font-semibold">
                  {instance.end_at ? (
                    <span className="text-green-600">Завершено</span>
                  ) : (
                    <span className="text-yellow-600">В процесі</span>
                  )}
                </p>
              </div>
              {instance.assignment?.exam?.time_limit && (
                <div>
                  <p className="text-sm text-muted-foreground">Час на тест</p>
                  <p className="text-lg font-semibold">
                    {instance.assignment.exam.time_limit} хв
                    {instance.start_at && instance.end_at && (
                      <span className="text-sm text-muted-foreground block">
                        Витрачено: {differenceInMinutes(
                          new Date(instance.end_at),
                          new Date(instance.start_at)
                        )} хв
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
            {instance.end_at && (
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {instance.start_at && instance.end_at && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Витрачено часу: {
                        (() => {
                          try {
                            const start = new Date(instance.start_at);
                            const end = new Date(instance.end_at);

                            if (isBefore(end, start)) {
                              return 'Невірний часовий проміжок';
                            }

                            const minutes = differenceInMinutes(end, start);
                            return minutes > 0 ? `${minutes} хв` : 'Менше хвилини';
                          } catch (e) {
                            console.error('Помилка обчислення часу:', e);
                            return 'Невідомо';
                          }
                        })()
                      }
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Завершено: {format(new Date(instance.end_at), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
