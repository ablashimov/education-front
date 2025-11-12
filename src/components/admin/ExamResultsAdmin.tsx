import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Search, Clock, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { fetchResults, type FetchResultsResult } from '@/services/results';
import type { BackendExamAssignment } from '@/types/backend';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

type SortField = 'user.name' | 'user.email' | 'exam.title' | 'group.name' | 'end_at';
type SortDirection = 'asc' | 'desc';

const perPage = 10;

export function ExamResultsAdmin() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('end_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<BackendExamAssignment | null>(null);

  const { data: resultsResponse, isLoading, isError, isFetching } = useQuery<FetchResultsResult>({
    queryKey: ['results', page, perPage, debouncedSearchQuery, sortField, sortDirection],
    queryFn: () => fetchResults({
      page,
      perPage,
      all: true,
      filter: debouncedSearchQuery.trim() ? { name: debouncedSearchQuery.trim() } : undefined,
      sort: sortDirection === 'desc' ? `-${sortField}` : sortField,
    }),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  const assignments = resultsResponse?.assignments ?? [];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hooks must be called unconditionally in the same order on every render.
  // Therefore, compute memoized values before any early returns.
  const normalized = useMemo(() => {
    const safeAssignments = assignments || [];
    return safeAssignments.map((a) => {
      const userName = a.user?.name ?? '—';
      const userEmail = a.user?.email ?? '—';
      const courseName = a.group?.name ?? a.group?.course?.title ?? '—';
      const examName = a.exam?.title ?? '—';
      const statusSlug = a.result?.slug ?? 'unknown';
      const statusName = a.result?.name ?? '—';
      const completedAt = a.end_at;
      return {
        id: String(a.id),
        userName,
        userEmail,
        courseName,
        examName,
        statusSlug,
        statusName,
        completedAt,
        raw: a,
      };
    });
  }, [assignments]);

  const availableStatuses = useMemo(() => {
    const uniq = new Map<string, string>();
    normalized.forEach((r) => {
      if (r.statusSlug) uniq.set(r.statusSlug, r.statusName || r.statusSlug);
    });
    return Array.from(uniq.entries()).map(([slug, name]) => ({ slug, name }));
  }, [normalized]);

  const filteredResults = useMemo(() => {
    return normalized.filter((r) => {
      const matchesStatus = filterStatus === 'all' || r.statusSlug === filterStatus;
      return matchesStatus;
    });
  }, [normalized, filterStatus]);

  const getStatusBadge = (slug: string, name?: string) => {
    const label = name || slug;
    if (slug === 'passed' || slug === 'success' || slug === 'completed') return <Badge variant="default">{label}</Badge>;
    if (slug === 'failed' || slug === 'rejected') return <Badge variant="destructive">{label}</Badge>;
    if (slug === 'in_progress' || slug === 'pending' || slug === 'started') return <Badge variant="secondary">{label}</Badge>;
    return <Badge variant="outline">{label}</Badge>;
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

  const meta = resultsResponse?.meta;
  const totalPages = meta ? Math.max(meta.last_page, 1) : 1;

  const stats = {
    total: meta?.total ?? normalized.length,
    passed: normalized.filter(r => r.statusSlug === 'passed').length,
    failed: normalized.filter(r => r.statusSlug === 'failed').length,
  };

  // After all hooks are declared, handle loading and error UI.
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Результати екзаменів користувачів</CardTitle>
            <CardDescription>Завантаження…</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-6 bg-gray-100 rounded" />
              <div className="h-6 bg-gray-100 rounded" />
              <div className="h-6 bg-gray-100 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">Не вдалося завантажити результати. Спробуйте пізніше.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всього екзаменів</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Здано</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.passed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Не здано</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Результати екзаменів користувачів</CardTitle>
          <CardDescription>
            Перегляд успішності здачі екзаменів співробітників організації
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Пошук за користувачем або курсом..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі статуси</SelectItem>
                {availableStatuses.map((s) => (
                  <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Користувач</TableHead>
                  <TableHead>Курс</TableHead>
                  <TableHead>Екзамен</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('end_at')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Дата
                      {getSortIcon('end_at')}
                    </Button>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div>
                        <div>{result.userName}</div>
                        <div className="text-sm text-gray-500">{result.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{result.courseName}</TableCell>
                    <TableCell>{result.examName}</TableCell>
                    <TableCell>
                      {getStatusBadge(result.statusSlug, result.statusName)}
                    </TableCell>
                    <TableCell>{result.completedAt ? format(new Date(result.completedAt), 'dd.MM.yyyy, HH:mm', { locale: uk }) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(result.raw)}>
                        Детальніше
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selected && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Деталі результату</CardTitle>
                  <CardDescription>
                    {selected.user?.name ?? '—'} • {selected.user?.email ?? '—'} — {selected.group?.name ?? selected.group?.course?.title ?? '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {getStatusBadge(selected.result?.slug ?? 'unknown', selected.result?.name ?? undefined)}
                    <div className="text-sm text-gray-600">
                      Екзамен: <span className="font-medium">{selected.exam?.title ?? '—'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Вікно: {selected.start_at ? format(new Date(selected.start_at), 'dd.MM.yyyy, HH:mm', { locale: uk }) : '—'} — {selected.end_at ? format(new Date(selected.end_at), 'dd.MM.yyyy, HH:mm', { locale: uk }) : '—'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="font-medium">Спроби (інстанси)</div>
                    {(selected.instances ?? []).length === 0 ? (
                      <div className="text-sm text-gray-500">Немає спроб</div>
                    ) : (
                      <div className="border rounded-md divide-y">
                        {(selected.instances ?? []).map((inst) => (
                          <div key={inst.id} className="p-3 flex items-center justify-between gap-4">
                            <div className="text-sm">
                              <div className="font-medium">Спроба #{inst.attempt_number}</div>
                              <div className="text-gray-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  Початок: {inst.start_at ? format(new Date(inst.start_at), 'dd.MM.yyyy, HH:mm', { locale: uk }) : '—'}
                                </span>
                                <span>·</span>
                                <span>
                                  Кінець: {inst.end_at ? format(new Date(inst.end_at), 'dd.MM.yyyy, HH:mm', { locale: uk }) : '—'}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">
                              Статус: {inst.end_at ? 'Завершено' : 'В процесі'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selected.attempt && (
                    <div className="space-y-3 mt-6">
                      <div className="font-medium">Спроба перевірки</div>
                      <div className="border rounded-md divide-y">
                        <div className="p-3 flex items-center justify-between gap-4">
                          <div className="text-sm">
                            <div className="font-medium">Attempt ID: {selected.attempt.id}</div>
                            <div className="text-gray-600">
                              Подано: {selected.attempt.submitted_at ? format(new Date(selected.attempt.submitted_at), 'dd.MM.yyyy, HH:mm', { locale: uk }) : '—'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-700">Бал: {selected.attempt.score ?? '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <Button variant="outline" onClick={() => setSelected(null)}>Закрити</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
    </div>
  );
}
