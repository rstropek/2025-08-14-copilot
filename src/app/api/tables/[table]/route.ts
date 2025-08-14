import { NextRequest, NextResponse } from 'next/server';
import { SQLiteCustomerDB } from '@/lib/dbUtils';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'customer.db');

// Whitelist of allowed table names
const ALLOWED_TABLES = ['customers'];

// Page size for pagination
const DEFAULT_PAGE_SIZE = 10;

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
  totalRecords: number;
} {
  const totalPages = Math.ceil(data.length / pageSize);
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    paginatedData: data.slice(startIndex, endIndex),
    totalPages,
    currentPage: validPage,
    totalRecords: data.length,
  };
}

function getColumnNames(data: Record<string, any>[]): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]);
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE.toString(), 10);

    // Check if table is allowed
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: 'Table not found or not allowed' },
        { status: 404 }
      );
    }

    // Get table data
    const data = await getTableData(table);
    
    // If no data, return empty result
    if (data.length === 0) {
      return NextResponse.json({
        table,
        columns: [],
        columnTypes: {},
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalRecords: 0,
          pageSize,
        },
      });
    }

    // Analyze data
    const columns = getColumnNames(data);
    const columnTypes = analyzeColumnTypes(data);
    
    // Format datetime values in the data
    const formattedData = data.map(row => {
      const formattedRow = { ...row };
      for (const column of columns) {
        if (columnTypes[column] === 'datetime' && row[column]) {
          try {
            formattedRow[column] = formatDateTime(row[column]);
          } catch (error) {
            // If formatting fails, use original value
            formattedRow[column] = row[column];
          }
        }
      }
      return formattedRow;
    });
    
    // Paginate data
    const { paginatedData, totalPages, currentPage, totalRecords } = paginateData(
      formattedData, 
      page, 
      pageSize
    );

    return NextResponse.json({
      table,
      columns,
      columnTypes,
      data: paginatedData,
      pagination: {
        currentPage,
        totalPages,
        totalRecords,
        pageSize,
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
