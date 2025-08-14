import { notFound } from 'next/navigation';
import TableBrowserClient from './TableBrowserClient';

// Whitelist of allowed table names
const ALLOWED_TABLES = ['customers'];

interface TableBrowserClientPageProps {
  params: {
    table: string;
  };
}

export default function TableBrowserClientPage({ params }: TableBrowserClientPageProps) {
  const { table } = params;

  // Check if table is allowed
  if (!ALLOWED_TABLES.includes(table)) {
    notFound();
  }

  return <TableBrowserClient table={table} />;
}
