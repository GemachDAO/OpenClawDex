/**
 * Table Component
 * Data table with sorting and pagination
 */

import type { TableProps } from '@/lib/catalog';
import { useState } from 'react';

interface TableComponentProps {
  element: { props: TableProps };
  onAction?: (action: unknown) => void;
}

function formatCellValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value));
    case 'percent':
      const num = Number(value);
      return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value));
    case 'date':
      return new Date(String(value)).toLocaleDateString();
    default:
      return String(value);
  }
}

export function Table({ element, onAction }: TableComponentProps) {
  const {
    columns,
    data,
    emptyMessage = 'No data available',
    sortable = false,
    selectable = false,
    pagination,
    onRowClick,
    compact = false,
    striped = false,
  } = element.props;

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(pagination?.currentPage ?? 1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sort data
  let sortedData = [...data];
  if (sortColumn) {
    sortedData.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Paginate data
  let paginatedData = sortedData;
  let totalPages = 1;
  if (pagination) {
    totalPages = Math.ceil(sortedData.length / pagination.pageSize);
    const start = (currentPage - 1) * pagination.pageSize;
    paginatedData = sortedData.slice(start, start + pagination.pageSize);
  }

  // Handle row selection
  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, i) => i)));
    }
  };

  // Handle row click
  const handleRowClick = (row: Record<string, unknown>) => {
    if (onRowClick && onAction) {
      onAction({ ...onRowClick, rowData: row });
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            {selectable && (
              <th className={`${compact ? 'px-2 py-2' : 'px-4 py-3'} text-left`}>
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length}
                  onChange={toggleAllSelection}
                  className="rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={column.key}
                className={`
                  ${compact ? 'px-2 py-2' : 'px-4 py-3'} 
                  text-${column.align || 'left'} 
                  text-xs font-medium text-zinc-400 uppercase tracking-wider
                  ${sortable && column.sortable !== false ? 'cursor-pointer hover:text-zinc-200' : ''}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {sortable && sortColumn === column.key && (
                    <span className="text-violet-400">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {paginatedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                ${striped && rowIndex % 2 === 1 ? 'bg-zinc-900/30' : ''}
                ${onRowClick ? 'cursor-pointer hover:bg-zinc-800/50' : ''}
                ${selectedRows.has(rowIndex) ? 'bg-violet-900/20' : ''}
                transition-colors
              `}
              onClick={() => handleRowClick(row)}
            >
              {selectable && (
                <td className={`${compact ? 'px-2 py-2' : 'px-4 py-3'}`}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleRowSelection(rowIndex);
                    }}
                    className="rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                  />
                </td>
              )}
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`
                    ${compact ? 'px-2 py-2' : 'px-4 py-3'} 
                    text-${column.align || 'left'} 
                    text-sm text-zinc-200
                  `}
                >
                  {column.type === 'badge' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
                      {String(row[column.key])}
                    </span>
                  ) : (
                    formatCellValue(row[column.key], column.type)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
          <span className="text-sm text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
