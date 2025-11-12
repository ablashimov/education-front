import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Clock, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { fetchMyGroups } from '@/services/groups';
import { fetchAllAssignedExams, fetchAllExamStatuses } from '@/services/exams';
import type { BackendExamAssignment, BackendExamResultStatus, BackendGroup } from '@/types/backend';

type LocalExamStatus = 'assigned' | 'in_work' | 'passed' | 'not_passed' | 'checking';

interface StatusDictionary {
  bySlug: Record<string, BackendExamResultStatus>;
  passedSlug: string | null;
  inWorkSlug: string | null;
  assignedSlug: string | null;
  notPassedSlug: string | null;
  checkingSlug: string | null;
}

interface MyExamsProps {
  onExamClick: (params: {
    assignmentId: number;
    groupId: number;
    groupName: string;
  }) => void;
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

interface ViewExam {
  assignment: BackendExamAssignment;
  group: BackendGroup;
  status: LocalExamStatus;
  statusSlug: string | null;
  statusLabel: string;
  badgeVariant: BadgeVariant;
  isActionable: boolean;
  isAvailable: boolean;
  isFuture: boolean;
  attemptsLeft: number;
  startDateLabel: string | null;
  timeLabel: string | null;
  durationMinutes: number | null;
  passingScore: number;
  availabilityMessage: string | null;
}

const formatDate = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const formatTime = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const flattenStatuses = (statuses: BackendExamResultStatus[]): StatusDictionary => {
  const dictionary: StatusDictionary = {
    bySlug: {},
    passedSlug: null,
    inWorkSlug: null,
    assignedSlug: null,
    notPassedSlug: null,
    checkingSlug: null,
  };

  statuses.forEach((status) => {
    dictionary.bySlug[status.slug] = status;

    switch (status.slug) {
      case 'passed':
        dictionary.passedSlug = status.slug;
        break;
      case 'in_work':
        dictionary.inWorkSlug = status.slug;
        break;
      case 'assigned':
        dictionary.assignedSlug = status.slug;
        break;
      case 'not_passed':
        dictionary.notPassedSlug = status.slug;
        break;
      case 'checking':
        dictionary.checkingSlug = status.slug;
        break;
      default:
        break;
    }
  });

  return dictionary;
};

const determineLocalStatus = (
  assignment: BackendExamAssignment,
  attemptsLeft: number,
  statusDictionary: StatusDictionary,
): LocalExamStatus => {
  const resultSlug = assignment.result?.slug ?? null;

  if (resultSlug != null) {
    if (resultSlug === statusDictionary.passedSlug) {
      return 'passed';
    }

    if (resultSlug === statusDictionary.notPassedSlug) {
      return 'not_passed';
    }

    if (resultSlug === statusDictionary.inWorkSlug) {
      return 'in_work';
    }

    if (resultSlug === statusDictionary.assignedSlug) {
      return 'assigned';
    }

    if (resultSlug === statusDictionary.checkingSlug) {
      return 'checking';
    }
  }

  // Default to assigned if no result yet
  return 'assigned';
};

const resolveExamStatus = (
  assignment: BackendExamAssignment,
  attemptsLeft: number,
  statusDictionary: StatusDictionary,
) => {
  const localStatus = determineLocalStatus(assignment, attemptsLeft, statusDictionary);
  const fallbackLabels: Record<LocalExamStatus, string> = {
    assigned: 'Призначений',
    in_work: 'В роботі',
    passed: 'Здано',
    not_passed: 'Не зданий',
    checking: 'Триває перевірка',
  };
  const badgeVariants: Record<LocalExamStatus, BadgeVariant> = {
    assigned: 'secondary',
    in_work: 'default',
    passed: 'outline',
    not_passed: 'destructive',
    checking: 'secondary',
  };

  let statusSlug = assignment.result?.slug ?? null;
  if (!statusSlug) {
    switch (localStatus) {
      case 'in_work':
        statusSlug = statusDictionary.inWorkSlug;
        break;
      case 'assigned':
        statusSlug = statusDictionary.assignedSlug;
        break;
      case 'passed':
        statusSlug = statusDictionary.passedSlug;
        break;
      case 'not_passed':
        statusSlug = statusDictionary.notPassedSlug;
        break;
      case 'checking':
        statusSlug = statusDictionary.checkingSlug;
        break;
      default:
        statusSlug = null;
        break;
    }
  }

  const statusLabel = statusSlug ? statusDictionary.bySlug[statusSlug]?.name ?? fallbackLabels[localStatus] : fallbackLabels[localStatus];

  const actionableSlugs = [statusDictionary.assignedSlug, statusDictionary.inWorkSlug].filter((slug): slug is string => !!slug);
  const isAvailable = statusSlug ? statusSlug === statusDictionary.inWorkSlug : localStatus === 'in_work';
  const isActionable = statusSlug ? actionableSlugs.includes(statusSlug) : localStatus === 'in_work' || localStatus === 'assigned';

  return {
    localStatus,
    statusSlug,
    statusLabel,
    badgeVariant: badgeVariants[localStatus],
    isAvailable,
    isActionable,
  };
};

export function MyExams({ onExamClick }: MyExamsProps) {
  const {
    data: examsResponse,
    isLoading: isExamsLoading,
    isError: isExamsError,
    error: examsError,
  } = useQuery({
    queryKey: ['assigned-exams'],
    queryFn: () => fetchAllAssignedExams(),
  });

  const assignments = useMemo(() => examsResponse ?? [], [examsResponse]);

  // For now, we'll need to get groups separately to maintain compatibility
  const {
    data: groupsResponse,
    isLoading: isGroupsLoading,
  } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => fetchMyGroups(),
  });

  const groups = useMemo(() => groupsResponse?.data ?? [], [groupsResponse]);

  // Create a map of group ID to group for easy lookup
  const groupMap = useMemo(() => {
    const map = new Map<number, BackendGroup>();
    groups.forEach(group => map.set(group.id, group));
    return map;
  }, [groups]);


  const {
    data: statusesResponse,
    isLoading: isStatusesLoading,
  } = useQuery({
    queryKey: ['exam-statuses'],
    queryFn: () => fetchAllExamStatuses(),
  });

  const statuses = useMemo(() => statusesResponse ?? [], [statusesResponse]);

  const isLoading = isExamsLoading || isGroupsLoading || isStatusesLoading;
  const hasError = isExamsError;
  const errorMessage = useMemo(() => {
    if (isExamsError && examsError instanceof Error) {
      return examsError.message;
    }
    return 'Спробуйте пізніше.';
  }, [examsError, isExamsError]);

  const viewExams = useMemo<ViewExam[]>(() => {
    if (!assignments.length || !groups.length || !statuses.length) return [];

    const statusDictionary = flattenStatuses(statuses);

    return assignments.map((assignment) => {
      const group = groupMap.get(assignment.group_id ?? 0);

      if (!group) return null;

      const attempts = assignment.instances?.length ?? 0;
      const attemptsLeft = Math.max(assignment.attempts_allowed - attempts, 0);
      const resolvedStatus = resolveExamStatus(assignment, attemptsLeft, statusDictionary);
      const exam = assignment.exam;

      let passingScoreValue: number | null = null;
      if (exam?.config && typeof exam.config === 'object') {
        const config = exam.config as Record<string, unknown>;
        const candidate = config.passing_score ?? config.passingScore;
        const numeric = typeof candidate === 'number' ? candidate : Number(candidate);
        if (Number.isFinite(numeric)) {
          passingScoreValue = Number(numeric);
        }
      }

      const duration = exam?.time_limit ?? null;
      const now = new Date();
      const startDate = assignment.start_at ? new Date(assignment.start_at) : null;
      const isFuture = startDate ? startDate > now : false;

      let availabilityMessage: string | null = null;
      if (isFuture && startDate) {
        availabilityMessage = `Доступний з ${startDate.toLocaleString('uk-UA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      }

      return {
        assignment,
        group,
        status: resolvedStatus.localStatus,
        statusSlug: resolvedStatus.statusSlug,
        statusLabel: resolvedStatus.statusLabel,
        badgeVariant: resolvedStatus.badgeVariant,
        isActionable: resolvedStatus.isActionable && !isFuture,
        isAvailable: resolvedStatus.isAvailable && !isFuture,
        isFuture,
        attemptsLeft,
        startDateLabel: formatDate(assignment.start_at),
        timeLabel: formatTime(assignment.start_at),
        durationMinutes: duration,
        passingScore: passingScoreValue ?? 0,
        availabilityMessage,
      } satisfies ViewExam;
    }).filter((exam): exam is ViewExam => exam !== null);
  }, [assignments, groups, groupMap, statuses]);

  const statusPriority: Record<LocalExamStatus, number> = {
    in_work: 0,
    assigned: 1,
    checking: 2,
    passed: 3,
    not_passed: 4,
  };

  const orderedExams = useMemo(() => {
    return [...viewExams].sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const aStart = a.assignment.start_at ? new Date(a.assignment.start_at).getTime() : Number.POSITIVE_INFINITY;
      const bStart = b.assignment.start_at ? new Date(b.assignment.start_at).getTime() : Number.POSITIVE_INFINITY;

      return aStart - bStart;
    });
  }, [viewExams]);

  const hasAvailableExam = viewExams.some((exam) => exam.isAvailable);
  const getStatusBadge = (exam: ViewExam) => {
    return <Badge variant={exam.badgeVariant}>{exam.statusLabel}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Заплановані екзамени</h2>
        <p className="text-gray-600">Перегляньте екзамени, призначені для ваших груп</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasError && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити екзамени. {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {hasAvailableExam && !isLoading && !hasError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            У вас є доступний екзамен для здачі. Не забудьте пройти його вчасно!
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && orderedExams.length === 0 && !hasError && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Немає запланованих екзаменів</p>
        </div>
      )}

      <div className="space-y-4">
        {orderedExams.map((exam: ViewExam) => {
          const { assignment, group } = exam;
          const examDetails = assignment.exam;

          return (
            <Card
              key={`${group.id}-${assignment.id}`}
              className={`${exam.isAvailable ? 'border-indigo-200 bg-indigo-50' : ''} ${exam.isFuture ? 'opacity-75' : ''} hover:shadow-md ${exam.isFuture ? 'cursor-not-allowed' : 'cursor-pointer'} transition-shadow`}
              onClick={() => {
                if (!exam.isFuture) {
                  onExamClick({
                    assignmentId: assignment.id,
                    groupId: group.id,
                    groupName: group.name,
                  });
                }
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <CardTitle>{examDetails?.title ?? 'Екзамен без назви'}</CardTitle>
                    </div>
                    <CardDescription>
                      {group.name}
                      {assignment.is_control ? ' • Контрольний' : ''}
                    </CardDescription>
                  </div>
                  {getStatusBadge(exam)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-gray-600">Дата екзамену</div>
                      <div>
                        {exam.startDateLabel ?? 'Не вказано'}
                        {exam.timeLabel ? ` о ${exam.timeLabel}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-gray-600">Тривалість</div>
                      <div>{exam.durationMinutes ? `${exam.durationMinutes} хвилин` : 'Не вказано'}</div>
                    </div>
                  </div>
                </div>

                {exam.isFuture ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Clock className="w-4 h-4" />
                      <span>Екзамен буде доступний з {exam.availabilityMessage?.replace('Доступний з ', '') || 'невідомої дати'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="text-sm">
                      <span className="text-gray-600">Прохідний бал:</span>
                      <span className="ml-2">{exam.passingScore || '—'}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Залишилось спроб:</span>
                      <span className="ml-2">{exam.attemptsLeft}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
