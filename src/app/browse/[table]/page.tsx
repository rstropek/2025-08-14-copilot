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
    pageSize?: string;
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

// Function to determine if a value is numeric
function isNumeric(value: any): boolean {
  return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
}

// Function to determine if a value is a date/time
function isDateTime(value: any): boolean {
  if (!value) return false;
  const dateValue = new Date(value);
  return !isNaN(dateValue.getTime()) && (
    // Check if it looks like a timestamp or ISO date string
    typeof value === 'string' && (
      value.includes('-') || value.includes('T') || value.includes(':')
    )
  );
}

// Function to format date/time values as ISO 8601
function formatDateTime(value: any): string {
  const date = new Date(value);
  return date.toISOString();
}

// Function to analyze column types based on data
function analyzeColumnTypes(data: Record<string, any>[]): Record<string, 'numeric' | 'datetime' | 'text'> {
  const columnTypes: Record<string, 'numeric' | 'datetime' | 'text'> = {};
  
  if (data.length === 0) return columnTypes;
  
  const columns = Object.keys(data[0]);
  
  for (const column of columns) {
    // Sample a few rows to determine type
    const sampleValues = data.slice(0, Math.min(5, data.length)).map(row => row[column]);
    
    // Check if all sampled values are numeric
    const allNumeric = sampleValues.every(value => value === null || value === undefined || value === '' || isNumeric(value));
    
    // Check if all sampled values are date/time (only if not numeric)
    const allDateTime = !allNumeric && sampleValues.some(value => isDateTime(value));
    
    if (allNumeric) {
      columnTypes[column] = 'numeric';
    } else if (allDateTime) {
      columnTypes[column] = 'datetime';
    } else {
      columnTypes[column] = 'text';
    }
  }
  
  return columnTypes;
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
  const pageSize = parseInt(searchParams.pageSize || PAGE_SIZE.toString(), 10);

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
  const columnTypes = analyzeColumnTypes(data);
  const { paginatedData, totalPages, currentPage: validPage } = paginateData(data, currentPage, pageSize);

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
        {pageSize !== PAGE_SIZE && <span> - Page size: {pageSize}</span>}
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
          {paginatedData.map((row, rowIndex) => 
            columns.map((column) => {
              let displayValue = row[column]?.toString() || '';
              
              // Format datetime values
              if (columnTypes[column] === 'datetime' && row[column]) {
                try {
                  displayValue = formatDateTime(row[column]);
                } catch (error) {
                  // If formatting fails, use original value
                  displayValue = row[column]?.toString() || '';
                }
              }
              
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
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {validPage > 1 && (
            <a 
              href={`/browse/${table}?page=${validPage - 1}${pageSize !== PAGE_SIZE ? `&pageSize=${pageSize}` : ''}`}
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
              href={`/browse/${table}?page=${validPage + 1}${pageSize !== PAGE_SIZE ? `&pageSize=${pageSize}` : ''}`}
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