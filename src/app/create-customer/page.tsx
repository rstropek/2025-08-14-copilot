'use client';

import CustomerForm from '@/components/CustomerForm';
import { Customer } from '@/lib/dbUtils';
import { useState } from 'react';
import Link from 'next/link';

export default function CreateCustomerPage() {
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

  const handleSuccess = (customer: Customer) => {
    setCreatedCustomer(customer);
  };

  const handleCreateAnother = () => {
    setCreatedCustomer(null);
  };

  return (
    <div className="page-container">
      <div className="header">
        <h1>Customer Management</h1>
        <nav>
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/browse/customers" className="nav-link">Browse Customers</Link>
          <Link href="/browse-client/customers" className="nav-link">Browse Customers (Client)</Link>
        </nav>
      </div>

      <main>
        {createdCustomer ? (
          <div className="success-container">
            <h2>Customer Created Successfully!</h2>
            <div className="customer-details">
              <h3>Customer Details:</h3>
              <p><strong>Customer Number:</strong> {createdCustomer.customer_number}</p>
              <p><strong>Name:</strong> {createdCustomer.name}</p>
              <p><strong>Email:</strong> {createdCustomer.email}</p>
              <p><strong>Age:</strong> {createdCustomer.age}</p>
              {createdCustomer.city && <p><strong>City:</strong> {createdCustomer.city}</p>}
              {createdCustomer.country && <p><strong>Country:</strong> {createdCustomer.country}</p>}
              <p><strong>Balance:</strong> ${createdCustomer.balance?.toFixed(2) || '0.00'}</p>
              {createdCustomer.created_at && (
                <p><strong>Created:</strong> {new Date(createdCustomer.created_at).toLocaleString()}</p>
              )}
            </div>
            <div className="actions">
              <button onClick={handleCreateAnother} className="create-another-button">
                Create Another Customer
              </button>
              <Link href="/browse/customers" className="view-customers-button">
                View All Customers
              </Link>
            </div>
          </div>
        ) : (
          <CustomerForm onSuccess={handleSuccess} />
        )}
      </main>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .header {
          background: #343a40;
          color: white;
          padding: 20px;
          margin-bottom: 30px;
        }

        .header h1 {
          margin: 0 0 15px 0;
          text-align: center;
        }

        nav {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .nav-link {
          color: #adb5bd;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        main {
          padding: 0 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .success-container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .success-container h2 {
          color: #28a745;
          margin-bottom: 20px;
        }

        .customer-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: left;
        }

        .customer-details h3 {
          margin-top: 0;
          color: #343a40;
        }

        .customer-details p {
          margin: 8px 0;
          color: #6c757d;
        }

        .customer-details strong {
          color: #343a40;
        }

        .actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 25px;
          flex-wrap: wrap;
        }

        .create-another-button, .view-customers-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
        }

        .create-another-button {
          background: #007bff;
          color: white;
        }

        .create-another-button:hover {
          background: #0056b3;
        }

        .view-customers-button {
          background: #28a745;
          color: white;
        }

        .view-customers-button:hover {
          background: #1e7e34;
        }

        @media (max-width: 768px) {
          .header {
            padding: 15px;
          }

          nav {
            gap: 10px;
          }

          .nav-link {
            padding: 6px 12px;
            font-size: 14px;
          }

          main {
            padding: 0 15px;
          }

          .actions {
            flex-direction: column;
            align-items: center;
          }

          .create-another-button, .view-customers-button {
            width: 200px;
          }
        }
      `}</style>
    </div>
  );
}
