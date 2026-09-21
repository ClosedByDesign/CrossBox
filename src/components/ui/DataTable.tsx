import { useMemo, useState, type ReactNode } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { EmptyState } from './index';
import { Input } from './form';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Wert für Sortierung und Suche */
  value?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  /** Auf schmalen Screens ausblenden (die Kartenansicht zeigt trotzdem alles) */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  searchable?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  /** Kartenansicht auf Mobil statt horizontalem Scrollen */
  mobileCards?: boolean;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  searchPlaceholder = 'Suchen …',
  searchable = true,
  emptyTitle = 'Keine Einträge gefunden',
  emptyDescription,
  toolbar,
  initialSort,
  mobileCards = true,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let result = rows;
    if (term) {
      result = rows.filter((row) =>
        columns.some((col) => {
          const value = col.value?.(row);
          return value != null && String(value).toLowerCase().includes(term);
        }),
      );
    }
    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      if (column?.value) {
        result = [...result].sort((a, b) => {
          const av = column.value!(a);
          const bv = column.value!(b);
          const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'de');
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [rows, columns, query, sort]);

  const toggleSort = (key: string) => {
    setSort((current) =>
      current?.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  };

  return (
    <div>
      {(searchable || toolbar) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-[200px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Desktop: echte Tabelle */}
          <div className={cn('card overflow-x-auto', mobileCards && 'hidden md:block')}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted',
                        col.hideOnMobile && 'hidden lg:table-cell',
                        col.className,
                      )}
                    >
                      {col.sortable && col.value ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1 hover:text-ink"
                        >
                          {col.header}
                          <ArrowUpDown size={12} className={cn(sort?.key === col.key ? 'text-brand' : 'opacity-40')} />
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-line/70 last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-elevated/60',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-4 py-2.5 align-middle', col.hideOnMobile && 'hidden lg:table-cell', col.className)}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobil: Karten statt horizontalem Scrollen */}
          {mobileCards && (
            <ul className="flex flex-col gap-2 md:hidden">
              {filtered.map((row) => (
                <li
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('card p-3', onRowClick && 'cursor-pointer active:bg-elevated')}
                >
                  {columns.map((col, index) => (
                    <div
                      key={col.key}
                      className={cn('flex items-center justify-between gap-3 py-1', index === 0 && 'pb-2')}
                    >
                      {index === 0 ? (
                        <div className="font-semibold">{col.render(row)}</div>
                      ) : (
                        <>
                          <span className="text-xs uppercase tracking-wide text-muted">{col.header}</span>
                          <span className="text-right text-sm">{col.render(row)}</span>
                        </>
                      )}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">{filtered.length} Einträge</p>
        </>
      )}
    </div>
  );
}
