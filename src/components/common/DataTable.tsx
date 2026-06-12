import React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((row: T) => string);
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyText = '暂无数据',
  rowKey = 'id' as keyof T,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    const key = row[rowKey];
    return key ? String(key) : `row-${index}`;
  };

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(row);
    }
    const value = row[column.key as keyof T];
    return value !== undefined && value !== null ? String(value) : '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-slate-700/50', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/50 border-b border-slate-700/50">
            {columns.map((column, idx) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  idx === 0 && 'pl-6',
                  idx === columns.length - 1 && 'pr-6',
                  column.width && `w-[${column.width}]`
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-slate-700/30',
                rowIndex % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/40'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-slate-300',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    colIndex === 0 && 'pl-6',
                    colIndex === columns.length - 1 && 'pr-6'
                  )}
                >
                  {getCellValue(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
