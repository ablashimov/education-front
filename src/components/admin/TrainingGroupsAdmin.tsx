import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BookOpen, Users, Calendar, ChevronRight, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { fetchAvailableGroups } from '@/services/groups';
import type { BackendGroup } from '@/types/backend';

interface TrainingGroup {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  status: 'available' | 'pending' | 'approved' | 'full';
  enrollmentStatus?: 'none' | 'pending' | 'approved';
}

interface TrainingGroupsAdminProps {
  organizationId: string;
  onGroupClick: (groupId: string) => void;
}

export function TrainingGroupsAdmin({ organizationId, onGroupClick }: TrainingGroupsAdminProps) {
  const {
    data: groupsResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['available-groups'],
    queryFn: () => fetchAvailableGroups(),
  });

  const groups = groupsResponse?.data || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl mb-2">Доступні групи навчання</h2>
          <p className="text-gray-600">Переглядайте доступні курси та подавайте користувачів на навчання</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl mb-2">Доступні групи навчання</h2>
          <p className="text-gray-600">Переглядайте доступні курси та подавайте користувачів на навчання</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити доступні групи. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (group: TrainingGroup) => {
    if (group.enrollmentStatus === 'approved') {
      return <Badge variant="default">Затверджено</Badge>;
    }
    if (group.enrollmentStatus === 'pending') {
      return <Badge variant="secondary">На розгляді</Badge>;
    }
    if (group.enrolled >= group.capacity) {
      return <Badge variant="destructive">Заповнено</Badge>;
    }
    return <Badge variant="outline">Доступна</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Доступні групи навчання</h2>
        <p className="text-gray-600">Переглядайте доступні курси та подавайте користувачів на навчання</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group: BackendGroup) => (
          <Card
            key={group.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onGroupClick(group.id.toString())}
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <div className="flex justify-between items-start">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <Badge variant="outline">Доступна</Badge>
              </div>
              <CardTitle className="mt-2">{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{group.start_date} - {group.end_date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>0 / ∞ учасників</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: '0%' }}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">Подати користувачів</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
