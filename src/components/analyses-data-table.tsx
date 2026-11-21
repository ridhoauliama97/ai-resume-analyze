'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type PaginationState,
  type SortingState,
  type Table as TanStackTable,
} from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BandBadge } from '@/components/band-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { DeleteAnalysisButton } from '@/components/delete-analysis-button';
import { formatDateId, formatDateTimeId, formatScore } from '@/lib/format';
import type { AdminAnalysisRow } from '@/lib/types';

const PAGE_SIZES = [10, 25, 50, 100];

const searchFilter: FilterFn<AdminAnalysisRow> = (row, _columnId, value) => {
  const needle = String(value ?? '').trim().toLowerCase();
  return needle.length === 0 || row.original.searchText.includes(needle);
};

type SortableColumn = {
  getCanSort: () => boolean;
  getIsSorted: () => false | 'asc' | 'desc';
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
};

function ColumnHeader({
  column,
  children,
}: {
  column: SortableColumn;
  children: ReactNode;
}) {
  if (!column.getCanSort()) {
    return <span className="px-2">{children}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-8"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUpIcon data-icon="inline-end" aria-hidden="true" />
      ) : sorted === 'desc' ? (
        <ArrowDownIcon data-icon="inline-end" aria-hidden="true" />
      ) : (
        <ArrowUpDownIcon data-icon="inline-end" aria-hidden="true" />
      )}
    </Button>
  );
}

function columnClass(columnId: string): string | undefined {
  if (columnId === 'createdAt') {
    return 'hidden sm:table-cell';
  }
  if (columnId === 'targetPosition') {
    return 'hidden md:table-cell';
  }
  if (columnId === 'band') {
    return 'hidden sm:table-cell';
  }
  if (columnId === 'datasetConsent') {
    return 'hidden lg:table-cell';
  }
  return undefined;
}

function SelectAllCheckbox({ table }: { table: TanStackTable<AdminAnalysisRow> }) {
  const rows = table.getFilteredRowModel().rows;
  const allSelected = rows.length > 0 && rows.every((row) => row.getIsSelected());
  const someSelected = !allSelected && rows.some((row) => row.getIsSelected());

  return (
    <Checkbox
      aria-label="Pilih semua hasil"
      checked={allSelected}
      indeterminate={someSelected}
      onCheckedChange={(checked) => {
        const nextSelection = { ...table.getState().rowSelection };

        for (const row of rows) {
          if (checked === true) {
            nextSelection[row.id] = true;
          } else {
            delete nextSelection[row.id];
          }
        }

        table.setRowSelection(nextSelection);
      }}
    />
  );
}

export function AnalysesDataTable({ data }: { data: AdminAnalysisRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<AdminAnalysisRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => <SelectAllCheckbox table={table} />,
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Pilih ${row.original.fileName}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'fileName',
        header: ({ column }) => (
          <ColumnHeader column={column}>Berkas</ColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <FileTextIcon aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                className="block max-w-[120px] truncate font-medium sm:max-w-[260px]"
                title={row.original.fileName}
              >
                {row.original.fileName}
              </span>
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
                #{row.original.id.slice(0, 8)}
              </span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <ColumnHeader column={column}>Tanggal</ColumnHeader>
        ),
        cell: ({ row }) => (
          <span
            className="text-muted-foreground"
            title={formatDateTimeId(row.original.createdAt)}
          >
            {formatDateId(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'targetPosition',
        header: ({ column }) => (
          <ColumnHeader column={column}>Posisi</ColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.targetPosition || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'overallScore',
        header: ({ column }) => (
          <ColumnHeader column={column}>Skor</ColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatScore(row.original.overallScore)}</span>
        ),
      },
      {
        accessorKey: 'band',
        header: () => <span className="px-2">Band</span>,
        cell: ({ row }) => <BandBadge band={row.original.band} />,
        enableSorting: false,
      },
      {
        accessorKey: 'datasetConsent',
        header: () => <span className="px-2">Dataset</span>,
        cell: ({ row }) => (
          <Badge variant={row.original.datasetConsent ? 'secondary' : 'outline'}>
            {row.original.datasetConsent ? 'Ya' : 'Tidak'}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/analyses/${row.original.id}`} />}
            >
              Lihat
            </Button>
            <DeleteAnalysisButton analysisId={row.original.id} compact admin />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  );

  // TanStack Table returns non-memoizable functions, so the React Compiler skips it.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: searchFilter,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.getState().pagination;
  const from = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(filteredCount, (pageIndex + 1) * pageSize);

  function onSearch(value: string) {
    setGlobalFilter(value);
    table.resetRowSelection();
    table.setPageIndex(0);
  }

  async function onBulkDelete() {
    const ids = selectedRows.map((row) => row.original.id);

    if (ids.length === 0) {
      return;
    }

    setBulkPending(true);
    setBulkError(null);

    try {
      const deleted = await toast.promise(
        (async () => {
          const response = await fetch('/api/admin/analyses', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          });
          const payload = (await response.json().catch(() => null)) as
            | { deleted?: number; error?: { message?: string } }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error?.message ?? 'Analisis gagal dihapus.');
          }

          if (typeof payload?.deleted !== 'number') {
            throw new Error('Respons hapus tidak valid.');
          }

          return payload.deleted;
        })(),
        {
          loading: `Menghapus ${ids.length} analisis...`,
          success: (count) => `${count} analisis dihapus.`,
          error: (cause) =>
            cause instanceof Error ? cause.message : 'Analisis gagal dihapus.',
        },
      );

      setBulkOpen(false);
      table.resetRowSelection();
      router.refresh();
      return deleted;
    } catch (cause) {
      setBulkError(
        cause instanceof Error ? cause.message : 'Analisis gagal dihapus.',
      );
    } finally {
      setBulkPending(false);
    }
  }

  if (data.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Belum ada analisis</EmptyTitle>
          <EmptyDescription>
            Analisis user akan muncul di sini setelah ada yang mengunggah resume.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={globalFilter}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Cari berkas, posisi, atau ID..."
            aria-label="Cari analisa"
            className="pl-8"
          />
        </div>

        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} dipilih
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" aria-hidden="true" />
              Hapus {selectedCount} data
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => table.resetRowSelection()}
              aria-label="Batalkan pilihan"
            >
              <XIcon data-icon="inline-start" aria-hidden="true" />
              Batal
            </Button>
          </div>
        ) : null}
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Tidak ada hasil</EmptyTitle>
            <EmptyDescription>
              Tidak ada analisis yang cocok dengan pencarian &quot;{globalFilter}&quot;.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={columnClass(header.column.id)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={columnClass(cell.column.id)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {from}–{to} dari {filteredCount}
          </span>
          <span aria-hidden="true">·</span>
          <label htmlFor="page-size" className="whitespace-nowrap">
            Baris
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value) {
                table.setPageSize(Number(value));
              }
            }}
          >
            <SelectTrigger id="page-size" size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Pagination
          aria-label="Navigasi halaman"
          className="mx-0 w-auto justify-start sm:justify-end"
        >
          <PaginationContent>
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
                Sebelumnya
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm text-muted-foreground tabular-nums">
                Halaman {pageIndex + 1} dari {Math.max(1, pageCount)}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Berikutnya
                <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Hapus {selectedCount} analisis terpilih?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Analisis, rekomendasi, feedback, dan berkas asli akan dihapus
              permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bulkError ? (
            <p role="alert" className="text-sm text-destructive">
              {bulkError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={onBulkDelete}
              disabled={bulkPending}
            >
              {bulkPending ? 'Menghapus...' : 'Hapus semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
