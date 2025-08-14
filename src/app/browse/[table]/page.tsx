import { notFound } from 'next/navigation';
import { SQLiteCustomerDB } from '@/lib/dbUtils';
import path from 'path';
import styles from './page.module.css';

const DB_PATH = path.join(process.cwd(), 'customer.db');

// Whitelist of allowed table names
const ALLOWED_TABLES = ['customers'];

// Page size for pagination
const PAGE_SIZE = 10;

interface TableBrowserProps {
  params: {
    table: string;
  };
  searchParams: {
    page?: string;
  };
}

async function getTableData(tableName: string): Promise<Record<string, any>[]> {
  const customerDB = new SQLiteCustomerDB(DB_PATH);
  
  try {
    await customerDB.connect();
    const data = await customerDB.getAllRows<Record<string, any>>(tableName);
    return data;
  } catch (error) {
    console.error('Error fetching table data:', error);
    throw error;
  } finally {
    await customerDB.close();
  }
}

function getColumnNames(data: Record<string, any>[]): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]);
}

function paginateData<T>(data: T[], page: number, pageSize: number): {
  paginatedData: T[];
  totalPages: number;
  currentPage: number;
} {
  const totalPages = Math.ceil(data.length / pageSize);
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    paginatedData: data.slice(startIndex, endIndex),
    totalPages,
    currentPage: validPage,
  };
}

export default async function TableBrowserPage({ params, searchParams }: TableBrowserProps) {
  const { table } = params;
  const currentPage = parseInt(searchParams.page || '1', 10);

  // Check if table is allowed
  if (!ALLOWED_TABLES.includes(table)) {
    notFound();
  }

  let data: Record<string, any>[];
  try {
    data = await getTableData(table);
  } catch (error) {
    return (
      <div className={styles.container}>
        <h1>Table Browser: {table}</h1>
        <div className={styles.error}>
          Error loading table data. Please try again later.
        </div>
      </div>
    );
  }

  const columns = getColumnNames(data);
  const { paginatedData, totalPages, currentPage: validPage } = paginateData(data, currentPage, PAGE_SIZE);

  if (data.length === 0) {
    return (
      <div className={styles.container}>
        <h1>Table Browser: {table}</h1>
        <div className={styles.noData}>
          No data found in table "{table}".
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Table Browser: {table}</h1>
      
      <div className={styles.info}>
        Showing {paginatedData.length} of {data.length} records (Page {validPage} of {totalPages})
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
            <div key={column} className={styles.header}>
              {column}
            </div>
          ))}
          
          {/* Data rows */}
          {paginatedData.map((row, rowIndex) => 
            columns.map((column) => (
              <div key={`${rowIndex}-${column}`} className={styles.cell}>
                {row[column]?.toString() || ''}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {validPage > 1 && (
            <a 
              href={`/browse/${table}?page=${validPage - 1}`}
              className={styles.pageLink}
            >
              Previous
            </a>
          )}
          
          <span className={styles.pageInfo}>
            Page {validPage} of {totalPages}
          </span>
          
          {validPage < totalPages && (
            <a 
              href={`/browse/${table}?page=${validPage + 1}`}
              className={styles.pageLink}
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}