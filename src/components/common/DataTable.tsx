import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';

export type Column<T> = {
    header: string;
    accessorKey?: keyof T; // For simple access
    cell?: (item: T) => ReactNode; // For custom rendering
    sortable?: boolean;
    sortKey?: string; // If different from accessorKey
    className?: string;
};

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;

    // Pagination
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isFetching?: boolean;

    // Sorting
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (field: string) => void;

    // Search
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    searchPlaceholder?: string;

    // Filters
    filters?: ReactNode;
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    isLoading,
    isError,
    errorMessage,
    page,
    totalPages,
    onPageChange,
    isFetching,
    sortField,
    sortDirection,
    onSort,
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters,
}: DataTableProps<T>) {

    const handleSort = (field: string) => {
        if (onSort) {
            onSort(field);
        }
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-2" />;
        return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center w-full">
                {onSearchChange && (
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                )}
                {filters && <div className="flex gap-2 w-full sm:w-auto">{filters}</div>}
            </div>

            {isError && (
                <Alert variant="destructive">
                    <AlertDescription>
                        {errorMessage || 'Failed to load data. Please try again.'}
                    </AlertDescription>
                </Alert>
            )}

            <div className="border rounded-lg">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-5 gap-4">
                                {Array.from({ length: columns.length }).map((__, inner) => (
                                    <Skeleton key={inner} className="h-5 w-full" />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col, index) => (
                                    <TableHead key={index} className={col.className}>
                                        {col.sortable && onSort ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort(col.sortKey || (col.accessorKey as string))}
                                                className="h-auto p-0 font-semibold hover:bg-transparent flex items-center"
                                            >
                                                {col.header}
                                                {getSortIcon(col.sortKey || (col.accessorKey as string))}
                                            </Button>
                                        ) : (
                                            col.header
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        {columns.map((col, index) => (
                                            <TableCell key={index} className={col.className}>
                                                {col.cell
                                                    ? col.cell(item)
                                                    : (col.accessorKey ? String(item[col.accessorKey]) : null)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-8">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 text-sm text-muted-foreground">
                <div>
                    Page {page} of {totalPages}
                    {isFetching && <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin" />}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => onPageChange(Math.max(page - 1, 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(Math.min(page + 1, totalPages))}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
