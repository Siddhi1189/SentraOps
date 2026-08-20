import type React from 'react';
import styles from './Table.module.css';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  responsive?: boolean;
}

export function Table({ responsive = false, className, children, ...props }: TableProps) {
  return (
    <div className={`${styles.tableWrapper} ${responsive ? styles.responsiveStacked : ''}`}>
      <table className={`${styles.table} ${className || ''}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={`${styles.header} ${className || ''}`} {...props}>
      {children}
    </thead>
  );
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export function TableRow({ interactive = false, className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={`${styles.row} ${interactive ? styles.rowInteractive : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  as?: 'td' | 'th';
  dataLabel?: string;
}

export function TableCell({ as: Component = 'td', dataLabel, className, children, ...props }: TableCellProps) {
  const isHeader = Component === 'th';
  return (
    <Component
      className={`${isHeader ? styles.headerCell : styles.cell} ${className || ''}`}
      data-label={dataLabel}
      {...props}
    >
      {children}
    </Component>
  );
}

export interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function TablePagination({ page, limit, total, onPageChange }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className={styles.paginationFooter}>
      <div>
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{total}</strong> entries
      </div>
      <div className={styles.paginationControls}>
        <button
          type="button"
          className={styles.paginationButton}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous Page"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={styles.paginationButton}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next Page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
