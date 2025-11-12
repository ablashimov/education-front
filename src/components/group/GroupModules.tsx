import { useQuery } from '@tanstack/react-query';
import { getGroupModules, type Module } from '@/services/courses';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleCard } from '@/components/ModuleCard';

export function GroupModules({ groupId }: { groupId: number }) {
  const { data: modules, isLoading } = useQuery<Module[]>({
    queryKey: ['group', groupId, 'modules'],
    queryFn: () => getGroupModules(groupId),
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

  if (!modules?.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Немає доступних модулів
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules?.map((module: Module) => (
        <ModuleCard key={module.id} module={module} groupId={groupId} />
      ))}
    </div>
  );
}
