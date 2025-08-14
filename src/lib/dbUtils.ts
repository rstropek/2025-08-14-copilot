import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

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

export type Product = {
  id?: number;
  product_code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock_quantity: number;
  supplier: string;
  created_at?: string;
}

export class SQLiteDatabase {
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
   * Creates the products table if it doesn't exist
   */
  async createProductTable(): Promise<void> {
    const db = this.ensureConnected();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        supplier TEXT,
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
    
    const sampleCustomers: Omit<Customer, 'id' | 'created_at'>[] = [
      {
        customer_number: 'CUST001',
        name: 'John Smith',
        email: 'john.smith@email.com',
        city: 'New York',
        country: 'USA',
        age: 35,
        balance: 2500.75
      },
      {
        customer_number: 'CUST002',
        name: 'Emma Johnson',
        email: 'emma.johnson@email.com',
        city: 'Los Angeles',
        country: 'USA',
        age: 28,
        balance: 1850.00
      },
      {
        customer_number: 'CUST003',
        name: 'Michael Brown',
        email: 'michael.brown@email.com',
        city: 'London',
        country: 'UK',
        age: 42,
        balance: 3200.50
      },
      {
        customer_number: 'CUST004',
        name: 'Sarah Davis',
        email: 'sarah.davis@email.com',
        city: 'Berlin',
        country: 'Germany',
        age: 31,
        balance: 980.25
      },
      {
        customer_number: 'CUST005',
        name: 'David Wilson',
        email: 'david.wilson@email.com',
        city: 'Chicago',
        country: 'USA',
        age: 39,
        balance: 4100.00
      }
    ];

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
   * Removes all existing product data and inserts sample data
   */
  async fillProductsWithSampleData(): Promise<void> {
    const db = this.ensureConnected();
    
    const sampleProducts: Omit<Product, 'id' | 'created_at'>[] = [
      {
        product_code: 'PROD001',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality noise-cancelling wireless headphones with 30-hour battery life',
        category: 'Electronics',
        price: 199.99,
        stock_quantity: 50,
        supplier: 'AudioTech Solutions'
      },
      {
        product_code: 'PROD002',
        name: 'Ergonomic Office Chair',
        description: 'Adjustable ergonomic office chair with lumbar support and mesh back',
        category: 'Furniture',
        price: 299.99,
        stock_quantity: 25,
        supplier: 'ComfortSeating Inc'
      },
      {
        product_code: 'PROD003',
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated stainless steel water bottle, 32oz capacity, keeps drinks cold for 24 hours',
        category: 'Home & Garden',
        price: 34.99,
        stock_quantity: 100,
        supplier: 'HydroLife Products'
      },
      {
        product_code: 'PROD004',
        name: 'Mechanical Gaming Keyboard',
        description: 'RGB backlit mechanical keyboard with blue switches, perfect for gaming',
        category: 'Electronics',
        price: 149.99,
        stock_quantity: 30,
        supplier: 'GameTech Hardware'
      },
      {
        product_code: 'PROD005',
        name: 'Organic Cotton T-Shirt',
        description: 'Soft, breathable organic cotton t-shirt available in multiple colors',
        category: 'Clothing',
        price: 24.99,
        stock_quantity: 75,
        supplier: 'EcoWear Fashion'
      }
    ];

    try {
      // Use transaction for atomicity
      await db.exec('BEGIN TRANSACTION');

      // Clear existing data
      await db.run('DELETE FROM products');

      // Add sample products using the existing method
      for (const product of sampleProducts) {
        await this.addProduct(product);
      }

      await db.exec('COMMIT');
    } catch (error) {
      await db.exec('ROLLBACK');
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

  // ================== PRODUCT METHODS ==================

  /**
   * Get all products
   */
  async getAllProducts(): Promise<Product[]> {
    const db = this.ensureConnected();
    
    try {
      return await db.all<Product[]>('SELECT * FROM products ORDER BY created_at DESC');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<Product | undefined> {
    const db = this.ensureConnected();
    
    try {
      return await db.get<Product>('SELECT * FROM products WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product by product code
   */
  async getProductByCode(productCode: string): Promise<Product | undefined> {
    const db = this.ensureConnected();
    
    try {
      return await db.get<Product>('SELECT * FROM products WHERE product_code = ?', [productCode]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a new product
   */
  async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<number> {
    const db = this.ensureConnected();
    
    try {
      const result = await db.run(`
        INSERT INTO products (
          product_code, name, description, category, price, stock_quantity, supplier
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        product.product_code,
        product.name,
        product.description,
        product.category,
        product.price,
        product.stock_quantity,
        product.supplier
      ]);

      return result.lastID!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(id: number, updates: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<boolean> {
    const db = this.ensureConnected();
    
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = Object.values(updates);

    try {
      const result = await db.run(`
        UPDATE products 
        SET ${setClause}
        WHERE id = ?
      `, [...values, id]);

      return result.changes! > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete product by ID
   */
  async deleteProduct(id: number): Promise<boolean> {
    const db = this.ensureConnected();
    
    try {
      const result = await db.run('DELETE FROM products WHERE id = ?', [id]);
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
