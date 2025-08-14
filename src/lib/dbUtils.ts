import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { faker } from '@faker-js/faker';

export type Customer = {
  id?: number;
  customer_number: string;
  name: string;
  email: string;
  city: string;
  country: string;
  age: number;
  balance: number;
  created_at?: string;
}

export class SQLiteCustomerDB {
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

  constructor(private dbPath: string = ':memory:') {}

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
    } catch (error) {
      console.error('❌ Error connecting to database:', error);
      throw error;
    }
  }

  /**
   * Ensures database is connected
   */
  private ensureConnected(): Database<sqlite3.Database, sqlite3.Statement> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Creates the customers table if it doesn't exist
   */
  async createCustomerTable(): Promise<void> {
    const db = this.ensureConnected();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        city TEXT,
        country TEXT,
        age INTEGER NOT NULL,
        balance REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await db.exec(createTableSQL);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes all existing customer data and inserts sample data
   */
  async fillWithSampleData(): Promise<void> {
    const db = this.ensureConnected();
    
    // Generate 70 realistic customers using Faker.js
    const sampleCustomers: Omit<Customer, 'id' | 'created_at'>[] = [];
    
    for (let i = 1; i <= 70; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      sampleCustomers.push({
        customer_number: `CUST${i.toString().padStart(3, '0')}`,
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        city: faker.location.city(),
        country: faker.location.country(),
        age: faker.number.int({ min: 18, max: 80 }),
        balance: parseFloat(faker.finance.amount({ min: 100, max: 10000, dec: 2 }))
      });
    }

    try {
      // Use transaction for atomicity
      await db.exec('BEGIN TRANSACTION');

      // Clear existing data
      await db.run('DELETE FROM customers');

      // Add sample customers using the existing method
      for (const customer of sampleCustomers) {
        await this.addCustomer(customer);
      }

      await db.exec('COMMIT');
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Get all rows from a table with a given name
   */
  async getAllRows<T>(tableName: string): Promise<T[]> {
    const db = this.ensureConnected();

    try {
      return await db.all(`SELECT * FROM ${tableName}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all customers
   */
  async getAllCustomers(): Promise<Customer[]> {
    const db = this.ensureConnected();
    
    try {
      return await db.all<Customer[]>('SELECT * FROM customers ORDER BY created_at DESC');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: number): Promise<Customer | undefined> {
    const db = this.ensureConnected();
    
    try {
      return await db.get<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get customer by customer number
   */
  async getCustomerByNumber(customerNumber: string): Promise<Customer | undefined> {
    const db = this.ensureConnected();
    
    try {
      return await db.get<Customer>('SELECT * FROM customers WHERE customer_number = ?', [customerNumber]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a new customer
   */
  async addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<number> {
    const db = this.ensureConnected();
    
    try {
      const result = await db.run(`
        INSERT INTO customers (
          customer_number, name, email, city, country, age, balance
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        customer.customer_number,
        customer.name,
        customer.email,
        customer.city,
        customer.country,
        customer.age,
        customer.balance
      ]);

      return result.lastID!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(id: number, updates: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<boolean> {
    const db = this.ensureConnected();
    
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = Object.values(updates);

    try {
      const result = await db.run(`
        UPDATE customers 
        SET ${setClause}
        WHERE id = ?
      `, [...values, id]);

      return result.changes! > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete customer by ID
   */
  async deleteCustomer(id: number): Promise<boolean> {
    const db = this.ensureConnected();
    
    try {
      const result = await db.run('DELETE FROM customers WHERE id = ?', [id]);
      return result.changes! > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
      } catch (error) {
        throw error;
      }
    }
  }
}
