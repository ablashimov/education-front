import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { BookOpen, Calendar, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { fetchMyGroups, fetchGroupModules } from '@/services/groups';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '../ui/breadcrumb';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import type { BackendGroup } from '@/types/backend';

type GroupStatus = 'in_progress' | 'future' | 'past';

interface MyTrainingGroupsProps {
  onGroupClick: (groupId: number) => void;
  onNavigateToGroup?: (groupId: number) => void;
}

export function MyTrainingGroups({ onGroupClick, onNavigateToGroup }: MyTrainingGroupsProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => fetchMyGroups(),
  });

  const groups = useMemo(() => data?.data ?? [], [data]);

  // Calculate progress and status for each group
  const groupsWithProgress = useMemo(() => {
    const now = new Date();

    return groups.map((group: BackendGroup) => {
      // For now, we'll show 0 progress since we don't have completion tracking yet
      // In a real implementation, this would be calculated from lesson completion data
      const progress = 0;
      const totalModules = group.course?.modules?.length ?? 0;
      const completedModules = 0; // This would be calculated from actual completion data

      // Determine status based on dates
      const startDate = new Date(group.start_date);
      const endDate = new Date(group.end_date);
      let status: GroupStatus = 'in_progress';

      if (now < startDate) {
        status = 'future';
      } else if (now > endDate) {
        status = 'past';
      }

      // Format dates
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('uk-UA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      return {
        ...group,
        progress,
        totalModules,
        completedModules,
        status,
        formattedStartDate: formatDate(group.start_date),
        formattedEndDate: formatDate(group.end_date),
      };
    });
  }, [groups]);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Мої групи навчання</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h2 className="text-2xl mb-2">Мої групи навчання</h2>
        <p className="text-gray-600">Курси, на які ви зараховані</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
                <Skeleton className="h-3 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити групи. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && groups.length === 0 && !isError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            У вас ще немає активних груп. Зверніться до адміністратора вашої організації.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {groupsWithProgress.map((group) => (
          <Card
            key={group.id}
            className={`hover:shadow-lg transition-shadow ${group.status === 'in_progress' ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
            onClick={() => {
              if (group.status === 'in_progress') {
                onNavigateToGroup ? onNavigateToGroup(group.id) : onGroupClick(group.id);
              }
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <CardTitle>{group.name}</CardTitle>
                  </div>
                  {group.description && <CardDescription>{group.description}</CardDescription>}
                </div>
                <Badge variant={
                  group.status === 'future' ? 'outline' :
                  group.status === 'past' ? 'secondary' :
                  group.progress === 100 ? 'default' : 'secondary'
                }>
                  {group.status === 'future' ? 'Майбутні' :
                   group.status === 'past' ? 'Минулі' :
                   group.progress === 100 ? 'Завершено' : 'В процесі'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                <Calendar className="w-4 h-4" />
                <span>{group.formattedStartDate} - {group.formattedEndDate}</span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Прогрес курсу</span>
                  <span>{group.progress}%</span>
                </div>
                <Progress value={group.progress} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{group.completedModules}/{group.totalModules} модулів завершено</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
