import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { UserPlus, Trash2, Eye, Loader2, Filter } from 'lucide-react';
import { createUser, deleteUser, fetchUser, fetchUsers } from '@/services/users';
import type { FetchUsersResult } from '@/services/users';
import type { BackendUser } from '@/types/backend';
import { DataTable, type Column } from '../common/DataTable';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

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

  // Filters
  const [filterEmail, setFilterEmail] = useState('');
  const [debouncedFilterEmail, setDebouncedFilterEmail] = useState('');

  const queryClient = useQueryClient();
  const usersQueryKey = ['users', page, perPage, debouncedSearchQuery, debouncedFilterEmail, sortField, sortDirection] as const;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce filter email
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterEmail(filterEmail);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterEmail]);

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
      filter: {
        name: debouncedSearchQuery.trim() || undefined,
        email: debouncedFilterEmail.trim() || undefined,
      },
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

  const handleSort = (field: string) => {
    const f = field as SortField;
    if (sortField === f) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(f);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const columns: Column<BackendUser>[] = [
    { header: "Ім'я", accessorKey: 'name', sortable: true },
    { header: "Email", accessorKey: 'email', sortable: true },
    { header: "Роль", cell: (user) => getPrimaryRole(user) },
    {
      header: "Статус email",
      cell: (user) => user.email_verified_at ? <Badge variant="default">Підтверджено</Badge> : <Badge variant="secondary">Очікує підтвердження</Badge>
    },
    { header: "Створено", accessorKey: 'created_at', cell: (user) => formatDate(user.created_at), sortable: true },
    {
      header: "Дії",
      cell: (user) => (
        <div className="flex items-center gap-2">
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
        </div>
      )
    }
  ];

  const filters = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Фільтри
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              placeholder="Filter by email..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

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
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            isError={isError}
            errorMessage={error instanceof Error ? error.message : undefined}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isFetching={isFetching}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Пошук користувачів..."
            filters={filters}
          />
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
