import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { SQLiteDatabase, Customer, Product } from './dbUtils';

describe('SQLiteDatabase Tests', () => {
  let db: SQLiteDatabase;

  beforeAll(async () => {
    // Use in-memory database for testing
    db = new SQLiteDatabase(':memory:');
    await db.connect();
    await db.createCustomerTable();
    await db.createProductTable();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Customer functionality', () => {
    it('should create and populate customers table with sample data', async () => {
      await db.fillWithSampleData();
      const customers = await db.getAllCustomers();
      
      expect(customers).toHaveLength(5);
      expect(customers[0]).toHaveProperty('customer_number');
      expect(customers[0]).toHaveProperty('name');
      expect(customers[0]).toHaveProperty('email');
      expect(customers[0]).toHaveProperty('balance');
    });

    it('should retrieve customer by ID', async () => {
      const customers = await db.getAllCustomers();
      const firstCustomer = customers[0];
      
      const retrievedCustomer = await db.getCustomerById(firstCustomer.id!);
      expect(retrievedCustomer).toBeDefined();
      expect(retrievedCustomer!.name).toBe(firstCustomer.name);
    });

    it('should retrieve customer by customer number', async () => {
      const customer = await db.getCustomerByNumber('CUST001');
      expect(customer).toBeDefined();
      expect(customer!.name).toBe('John Smith');
      expect(customer!.email).toBe('john.smith@email.com');
    });
  });

  describe('Product functionality', () => {
    it('should create and populate products table with sample data', async () => {
      await db.fillProductsWithSampleData();
      const products = await db.getAllProducts();
      
      expect(products).toHaveLength(5);
      expect(products[0]).toHaveProperty('product_code');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('description');
      expect(products[0]).toHaveProperty('category');
      expect(products[0]).toHaveProperty('price');
      expect(products[0]).toHaveProperty('stock_quantity');
      expect(products[0]).toHaveProperty('supplier');
    });

    it('should retrieve product by ID', async () => {
      const products = await db.getAllProducts();
      const firstProduct = products[0];
      
      const retrievedProduct = await db.getProductById(firstProduct.id!);
      expect(retrievedProduct).toBeDefined();
      expect(retrievedProduct!.name).toBe(firstProduct.name);
    });

    it('should retrieve product by product code', async () => {
      const product = await db.getProductByCode('PROD001');
      expect(product).toBeDefined();
      expect(product!.name).toBe('Wireless Bluetooth Headphones');
      expect(product!.category).toBe('Electronics');
      expect(product!.price).toBe(199.99);
    });

    it('should add a new product', async () => {
      const newProduct: Omit<Product, 'id' | 'created_at'> = {
        product_code: 'PROD006',
        name: 'Test Product',
        description: 'A test product for unit testing',
        category: 'Test',
        price: 99.99,
        stock_quantity: 10,
        supplier: 'Test Supplier'
      };

      const productId = await db.addProduct(newProduct);
      expect(productId).toBeGreaterThan(0);

      const retrievedProduct = await db.getProductById(productId);
      expect(retrievedProduct).toBeDefined();
      expect(retrievedProduct!.name).toBe('Test Product');
    });

    it('should update an existing product', async () => {
      const product = await db.getProductByCode('PROD006');
      expect(product).toBeDefined();

      const updated = await db.updateProduct(product!.id!, {
        price: 79.99,
        stock_quantity: 15
      });

      expect(updated).toBe(true);

      const updatedProduct = await db.getProductById(product!.id!);
      expect(updatedProduct!.price).toBe(79.99);
      expect(updatedProduct!.stock_quantity).toBe(15);
    });

    it('should delete a product', async () => {
      const product = await db.getProductByCode('PROD006');
      expect(product).toBeDefined();

      const deleted = await db.deleteProduct(product!.id!);
      expect(deleted).toBe(true);

      const deletedProduct = await db.getProductById(product!.id!);
      expect(deletedProduct).toBeUndefined();
    });

    it('should handle products by category', async () => {
      const products = await db.getAllProducts();
      const electronicsProducts = products.filter(p => p.category === 'Electronics');
      
      expect(electronicsProducts.length).toBeGreaterThan(0);
      expect(electronicsProducts.every(p => p.category === 'Electronics')).toBe(true);
    });
  });

  describe('Database integration', () => {
    it('should handle both customers and products in the same database', async () => {
      const customers = await db.getAllCustomers();
      const products = await db.getAllProducts();
      
      expect(customers.length).toBeGreaterThan(0);
      expect(products.length).toBeGreaterThan(0);
    });
  });
});
