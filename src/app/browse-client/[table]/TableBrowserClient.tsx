'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

interface TableData {
  table: string;
  columns: string[];
  columnTypes: Record<string, 'numeric' | 'datetime' | 'text'>;
  data: Record<string, any>[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    pageSize: number;
  };
}

interface TableBrowserClientProps {
  table: string;
}

export default function TableBrowserClient({ table }: TableBrowserClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  useEffect(() => {
    const fetchTableData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('pageSize', pageSize.toString());

        const response = await fetch(`/api/tables/${table}?${params}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Table not found or not allowed');
          }
          throw new Error('Failed to fetch table data');
        }

        const data = await response.json();
        setTableData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [table, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    if (pageSize !== 10) {
      params.set('pageSize', pageSize.toString());
    } else {
      params.delete('pageSize');
    }
    router.push(`/browse-client/${table}?${params}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>Table Browser: {table}</h1>
        <div className={styles.loading}>Loading table data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1>Table Browser: {table}</h1>
        <div className={styles.error}>
          {error}
        </div>
      </div>
    );
  }

  if (!tableData || tableData.data.length === 0) {
    return (
      <div className={styles.container}>
        <h1>Table Browser: {table}</h1>
        <div className={styles.noData}>
          No data found in table "{table}".
        </div>
      </div>
    );
  }

  const { columns, columnTypes, data, pagination } = tableData;

  return (
    <div className={styles.container}>
      <h1>Table Browser: {table}</h1>
      
      <div className={styles.info}>
        Showing {data.length} of {pagination.totalRecords} records (Page {pagination.currentPage} of {pagination.totalPages})
        {pagination.pageSize !== 10 && <span> - Page size: {pagination.pageSize}</span>}
      </div>

      <div className={styles.tableContainer}>
        <div 
          className={styles.grid}
          style={{ 
            gridTemplateColumns: `repeat(${columns.length}, 1fr)` 
          }}
        >
          {/* Header row */}
          {columns.map((column) => (
            <div 
              key={column} 
              className={`${styles.header} ${columnTypes[column] === 'numeric' ? styles.rightAlign : ''}`}
            >
              {column}
            </div>
          ))}
          
          {/* Data rows */}
          {data.map((row, rowIndex) => 
            columns.map((column) => {
              const displayValue = row[column]?.toString() || '';
              
              return (
                <div 
                  key={`${rowIndex}-${column}`} 
                  className={`${styles.cell} ${columnTypes[column] === 'numeric' ? styles.rightAlign : ''}`}
                >
                  {displayValue}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          {pagination.currentPage > 1 && (
            <button 
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className={styles.pageLink}
            >
              Previous
            </button>
          )}
          
          <span className={styles.pageInfo}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          {pagination.currentPage < pagination.totalPages && (
            <button 
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className={styles.pageLink}
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
