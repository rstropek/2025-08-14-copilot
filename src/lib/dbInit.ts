import { SQLiteCustomerDB } from './dbUtils';
import { existsSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'customer.db');

export async function initializeDatabase(): Promise<void> {
  const customerDB = new SQLiteCustomerDB(DB_PATH);
  
  try {
    console.log('🔧 Initializing database...');
    
    // Connect to database
    await customerDB.connect();
    
    // Create the customers table
    await customerDB.createCustomerTable();
    
    // Check if database already has data
    const existingCustomers = await customerDB.getAllCustomers();
    
    if (existingCustomers.length === 0) {
      console.log('📊 Database is empty, filling with sample data...');
      await customerDB.fillWithSampleData();
      console.log('✅ Database filled with 70 sample customers');
    } else {
      console.log(`✅ Database already contains ${existingCustomers.length} customers`);
    }
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await customerDB.close();
  }
}