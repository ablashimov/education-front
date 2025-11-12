import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { UserPlus, Trash2, Search, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { createUser, deleteUser, fetchUser, fetchUsers } from '@/services/users';
import type { FetchUsersResult } from '@/services/users';
import type { BackendUser } from '@/types/backend';

const perPage = 10;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('uk-UA').format(new Date(value));
  } catch (error) {
    return value;
  }
};

const getPrimaryRole = (user: BackendUser) => user.roles?.[0]?.title || user.roles?.[0]?.name || '—';

type SortField = 'name' | 'email' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', rank: '' });

  const queryClient = useQueryClient();
  const usersQueryKey = ['users', page, perPage, debouncedSearchQuery, sortField, sortDirection] as const;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<FetchUsersResult>({
    queryKey: usersQueryKey,
    queryFn: () => fetchUsers({
      page,
      perPage,
      filter: debouncedSearchQuery.trim() ? { name: debouncedSearchQuery.trim() } : undefined,
      sort: sortDirection === 'desc' ? `-${sortField}` : sortField,
    }),
    placeholderData: (previousData) => previousData,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', rank: '' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const {
    data: selectedUser,
    isLoading: isLoadingUser,
    isError: isUserError,
    error: userError,
  } = useQuery({
    queryKey: ['users', selectedUserId],
    queryFn: () => fetchUser(selectedUserId!),
    enabled: selectedUserId !== null && isViewDialogOpen,
  });

  const users = usersResponse?.users ?? [];

  const meta = usersResponse?.meta;
  const totalPages = meta ? Math.max(meta.last_page, 1) : 1;

  const handleSubmitNewUser = async () => {
    await createUserMutation.mutateAsync({
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      password: newUser.password,
      rank: newUser.rank.trim(),
    });
  };

  const handleDeleteUser = async (id: number) => {
    await deleteUserMutation.mutateAsync(id);
  };

  const handleOpenUser = (id: number) => {
    setSelectedUserId(id);
    setIsViewDialogOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Управління користувачами</CardTitle>
              <CardDescription>
                Створюйте та керуйте користувачами вашої організації
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Додати користувача
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Створити нового користувача</DialogTitle>
                  <DialogDescription>
                    Користувач отримає email з інструкціями для входу
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ім'я</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Введіть ім'я користувача"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Мінімум 6 символів"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rank">Звання / посада</Label>
                    <Input
                      id="rank"
                      value={newUser.rank}
                      onChange={(e) => setNewUser({ ...newUser, rank: e.target.value })}
                      placeholder="Наприклад, інструктор"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitNewUser}
                    className="w-full"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Створення...
                      </>
                    ) : (
                      'Створити користувача'
                    )}
                  </Button>
                  {createUserMutation.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Не вдалося створити користувача. Перевірте дані та спробуйте ще раз.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Пошук користувачів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Не вдалося завантажити користувачів. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((__, inner) => (
                      <Skeleton key={inner} className="h-5 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('name')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Ім'я
                        {getSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('email')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Email
                        {getSortIcon('email')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('name')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Роль
                        {getSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('email')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Статус email
                        {getSortIcon('email')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('created_at')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Створено
                        {getSortIcon('created_at')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[140px]">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getPrimaryRole(user)}</TableCell>
                      <TableCell>
                        {user.email_verified_at ? (
                          <Badge variant="default">Підтверджено</Badge>
                        ) : (
                          <Badge variant="secondary">Очікує підтвердження</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenUser(user.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                        >
                          {deleteUserMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!users.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        Користувачів не знайдено.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 text-sm text-muted-foreground">
            <div>
              Сторінка {page} з {totalPages}
              {isFetching && <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin" />}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
                Попередня
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta ? page >= meta.last_page : true}
                onClick={() => setPage((prev) => (meta ? Math.min(prev + 1, meta.last_page) : prev))}
              >
                Наступна
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Інформація про користувача</DialogTitle>
          </DialogHeader>
          {isLoadingUser ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ) : isUserError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Не вдалося завантажити користувача.{' '}
                {userError instanceof Error ? userError.message : 'Спробуйте ще раз пізніше.'}
              </AlertDescription>
            </Alert>
          ) : selectedUser ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Ім'я:</span> {selectedUser.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {selectedUser.email}
              </div>
              <div>
                <span className="font-medium">Звання:</span> {selectedUser.rank ?? '—'}
              </div>
              <div>
                <span className="font-medium">Ролі:</span>{' '}
                {selectedUser.roles?.length
                  ? selectedUser.roles.map((role) => role.title || role.name).join(', ')
                  : '—'}
              </div>
              <div>
                <span className="font-medium">Створено:</span> {formatDate(selectedUser.created_at)}
              </div>
              <div>
                <span className="font-medium">Статус email:</span>{' '}
                {selectedUser.email_verified_at ? 'Підтверджено' : 'Очікує підтвердження'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Оберіть користувача зі списку.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
