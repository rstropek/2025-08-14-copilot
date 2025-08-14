'use client';

import { useState } from 'react';
import { Customer } from '@/lib/dbUtils';

interface CustomerFormProps {
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  email: string;
  city: string;
  country: string;
  age: string;
  balance: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  city?: string;
  country?: string;
  age?: string;
  balance?: string;
  general?: string;
}

export default function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    city: '',
    country: '',
    age: '',
    balance: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Age validation
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age, 10);
      if (isNaN(age) || age < 1 || age > 150) {
        newErrors.age = 'Age must be a number between 1 and 150';
      }
    }

    // Balance validation (optional field)
    if (formData.balance.trim()) {
      const balance = parseFloat(formData.balance);
      if (isNaN(balance) || balance < 0) {
        newErrors.balance = 'Balance must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Clear general error
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: undefined
      }));
    }

    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        age: parseInt(formData.age, 10),
        balance: formData.balance.trim() ? parseFloat(formData.balance) : 0
      };

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ general: result.error || 'Failed to create customer' });
        return;
      }

      setSuccessMessage('Customer created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        city: '',
        country: '',
        age: '',
        balance: ''
      });

      // Call success callback
      if (onSuccess && result.customer) {
        onSuccess(result.customer);
      }

    } catch (error) {
      console.error('Error creating customer:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      city: '',
      country: '',
      age: '',
      balance: ''
    });
    setErrors({});
    setSuccessMessage('');
    
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="customer-form">
      <h2>Create New Customer</h2>
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="error-message">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter customer name"
              disabled={isSubmitting}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="age">Age *</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className={errors.age ? 'error' : ''}
              placeholder="Enter age"
              min="1"
              max="150"
              disabled={isSubmitting}
            />
            {errors.age && <span className="field-error">{errors.age}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={errors.city ? 'error' : ''}
              placeholder="Enter city"
              disabled={isSubmitting}
            />
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className={errors.country ? 'error' : ''}
              placeholder="Enter country"
              disabled={isSubmitting}
            />
            {errors.country && <span className="field-error">{errors.country}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="balance">Balance</label>
            <input
              type="number"
              id="balance"
              name="balance"
              value={formData.balance}
              onChange={handleInputChange}
              className={errors.balance ? 'error' : ''}
              placeholder="Enter initial balance (optional)"
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
            {errors.balance && <span className="field-error">{errors.balance}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .customer-form {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .customer-form h2 {
          margin-bottom: 20px;
          color: #333;
          text-align: center;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #c3e6cb;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .form-group input.error {
          border-color: #dc3545;
        }

        .form-group input:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }

        .field-error {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .cancel-button, .submit-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .cancel-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .submit-button {
          background: #007bff;
          color: white;
        }

        .submit-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .cancel-button:disabled, .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .customer-form {
            max-width: 100%;
            padding: 15px;
            margin: 0 10px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .form-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .cancel-button, .submit-button {
            width: 100%;
            margin-bottom: 10px;
          }

          .cancel-button {
            order: 2;
            margin-bottom: 0;
          }

          .submit-button {
            order: 1;
          }
        }
      `}</style>
    </div>
  );
}
