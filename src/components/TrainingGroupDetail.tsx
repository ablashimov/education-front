import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { BookOpen, Users, Calendar, Send, CheckCircle, Clock, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { getAvailableGroupById, fetchGroupAvailableUsers, createGroupInvite, fetchGroupInvites, deleteGroupInvite } from '@/services/groups';
import type { BackendUser, BackendUserGroupInvite } from '@/types/backend';

interface EnrolledUser {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  status: 'pending' | 'approved' | 'rejected';
  progress?: number;
}

interface OrgUser {
  id: string;
  name: string;
  email: string;
  isEnrolled: boolean;
}

interface TrainingGroup {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  enrollmentStatus: 'none' | 'pending' | 'approved';
  enrolledUsers: EnrolledUser[];
}

interface TrainingGroupDetailProps {
  groupId: string;
}

export function TrainingGroupDetail({ groupId }: TrainingGroupDetailProps) {
  const queryClient = useQueryClient();

  const { data: group, isLoading: isGroupLoading, error: groupError } = useQuery({
    queryKey: ['available-group', groupId],
    queryFn: () => getAvailableGroupById(groupId),
    enabled: !!groupId,
  });

  const { data: availableUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['available-users', groupId],
    queryFn: () => fetchGroupAvailableUsers(Number(groupId)),
    enabled: !!groupId,
  });

  const { data: invitesResponse, isLoading: isInvitesLoading } = useQuery({
    queryKey: ['group-invites', groupId],
    queryFn: () => fetchGroupInvites(Number(groupId)),
    enabled: !!groupId,
  });

  const invites = invitesResponse?.data || [];

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [requestSent, setRequestSent] = useState(false);

  const createInviteMutation = useMutation({
    mutationFn: (userId: number) => createGroupInvite(Number(groupId), userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites', groupId] });
      queryClient.invalidateQueries({ queryKey: ['available-users', groupId] });
      setSelectedUsers([]);
      setRequestSent(true);
      setTimeout(() => setRequestSent(false), 3000);
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: (inviteId: number) => deleteGroupInvite(Number(groupId), inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites', groupId] });
      queryClient.invalidateQueries({ queryKey: ['available-users', groupId] });
    },
  });

  const handleToggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmitRequest = () => {
    selectedUsers.forEach(userId => {
      createInviteMutation.mutate(userId);
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge variant="default">Затверджено</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary">На розгляді</Badge>;
    }
    return <Badge variant="destructive">Відхилено</Badge>;
  };

  const getGroupStatusBadge = () => {
    return <Badge variant="outline">Доступна для подачі</Badge>;
  };

  if (isGroupLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="w-12 h-12 rounded-lg" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити інформацію про групу. {groupError instanceof Error ? groupError.message : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Інформація про групу */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </div>
            {getGroupStatusBadge()}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">Період навчання</div>
                <div>{group.start_date} - {group.end_date}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">Учасники</div>
                <div>{invites.length} / ∞</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Заповненість</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                0%
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Подані користувачі */}
      <Card>
        <CardHeader>
          <CardTitle>Подані користувачі ({invites.length})</CardTitle>
          <CardDescription>
            Користувачі вашої організації, які подані або зараховані на цей курс
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInvitesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="py-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : invites.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ім'я</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Дата подання</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Прогрес</TableHead>
                    <TableHead className="w-[100px]">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite: BackendUserGroupInvite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.user?.name ?? 'Невідомий користувач'}</TableCell>
                      <TableCell>{invite.user?.email ?? ''}</TableCell>
                      <TableCell>{invite.invited_at ? new Date(invite.invited_at).toLocaleDateString('uk-UA') : ''}</TableCell>
                      <TableCell>
                        {invite.accepted_at ? (
                          <Badge variant="default">Затверджено</Badge>
                        ) : (
                          <Badge variant="secondary">На розгляді</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {invite.accepted_at ? (
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: '0%' }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">0%</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInviteMutation.mutate(invite.id)}
                          disabled={deleteInviteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Ви ще не подали жодного користувача на цей курс</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Додати нових користувачів */}
      <Card>
        <CardHeader>
          <CardTitle>Додати користувачів на курс</CardTitle>
          <CardDescription>
            Виберіть користувачів вашої організації для подачі на навчання
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requestSent ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Заявку надіслано! Очікуйте підтвердження адміністратора системи.
              </AlertDescription>
            </Alert>
          ) : isUsersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : availableUsers.length > 0 ? (
            <>
              <div className="border rounded-lg mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedUsers.length === availableUsers.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(availableUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Ім'я</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableUsers.map((user: BackendUser) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleToggleUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button
                onClick={handleSubmitRequest}
                disabled={selectedUsers.length === 0 || createInviteMutation.isPending}
                className="w-full"
              >
                {createInviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Надсилання...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Надіслати заявку ({selectedUsers.length})
                  </>
                )}
              </Button>

              {createInviteMutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Не вдалося надіслати запрошення. Спробуйте пізніше.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Всі користувачі вашої організації вже подані на цей курс</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
