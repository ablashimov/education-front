import { useQuery } from '@tanstack/react-query';
import { fetchGroupAssignedExams } from '@/services/exams';
import type { BackendExamAssignment } from '@/types/backend';
import { Skeleton } from '@/components/ui/skeleton';
import { ExamCard } from '@/components/ExamCard';

export function GroupExams({ groupId }: { groupId: number }) {
  const { data: exams, isLoading } = useQuery<BackendExamAssignment[]>({
    queryKey: ['group', groupId, 'exams'],
    queryFn: () => fetchGroupAssignedExams(groupId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!exams?.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Немає запланованих екзаменів
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={{
            id: exam.id,
            title: exam.exam?.title || 'Без назви',
            description: exam.exam?.description || undefined,
            duration: exam.exam?.time_limit || 0,
            start_date: exam.start_at || null,
            end_date: exam.end_at || null,
            // TODO: Add is_active check when available in the API
            status: 'active'
          }}
          groupId={groupId}
        />
      ))}
    </div>
  );
}
