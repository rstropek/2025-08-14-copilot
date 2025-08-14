import { NextRequest, NextResponse } from 'next/server';
import { SQLiteCustomerDB, Customer } from '@/lib/dbUtils';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'customer.db');

// Generate next customer number
async function generateCustomerNumber(): Promise<string> {
  const customerDB = new SQLiteCustomerDB(DB_PATH);
  
  try {
    await customerDB.connect();
    const customers = await customerDB.getAllCustomers();
    
    // Find the highest customer number
    let maxNumber = 0;
    for (const customer of customers) {
      const match = customer.customer_number.match(/CUST(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Return next number
    return `CUST${(maxNumber + 1).toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating customer number:', error);
    throw error;
  } finally {
    await customerDB.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, email, city, country, age, balance } = body;
    
    if (!name || !email || !age) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and age are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate age
    if (typeof age !== 'number' || age < 1 || age > 150) {
      return NextResponse.json(
        { error: 'Age must be a number between 1 and 150' },
        { status: 400 }
      );
    }

    // Validate balance if provided
    if (balance !== undefined && (typeof balance !== 'number' || balance < 0)) {
      return NextResponse.json(
        { error: 'Balance must be a positive number' },
        { status: 400 }
      );
    }

    const customerDB = new SQLiteCustomerDB(DB_PATH);
    
    try {
      await customerDB.connect();
      
      // Generate customer number
      const customer_number = await generateCustomerNumber();
      
      // Create customer object
      const newCustomer: Omit<Customer, 'id' | 'created_at'> = {
        customer_number,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        city: city?.trim() || '',
        country: country?.trim() || '',
        age,
        balance: balance || 0
      };
      
      // Check if email already exists
      const existingCustomer = await customerDB.getAllCustomers();
      const emailExists = existingCustomer.some(c => c.email === newCustomer.email);
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      
      // Add customer
      const customerId = await customerDB.addCustomer(newCustomer);
      
      // Get the created customer
      const createdCustomer = await customerDB.getCustomerById(customerId);
      
      return NextResponse.json(
        { 
          message: 'Customer created successfully',
          customer: createdCustomer
        },
        { status: 201 }
      );
      
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        }
        if (error.message.includes('customer_number')) {
          return NextResponse.json(
            { error: 'Customer number already exists' },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    } finally {
      await customerDB.close();
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
