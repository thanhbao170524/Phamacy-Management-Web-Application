import { ValidationError } from './errors';

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validateMin(value: number, min: number, fieldName: string): void {
  if (value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
}

export function validateMax(value: number, max: number, fieldName: string): void {
  if (value > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }
}

export function validateDate(dateString: string, fieldName: string): void {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
}

export function validateFutureDate(dateString: string, fieldName: string): void {
  validateDate(dateString, fieldName);
  const date = new Date(dateString);
  if (date <= new Date()) {
    throw new ValidationError(`${fieldName} must be a future date`);
  }
}

// Medicine validation schema
export function validateMedicine(data: any): {
  name: string;
  description?: string;
  category_id: string;
  price: number;
  quantity: number;
  expiry_date: string;
  stock_alert: number;
  barcode?: string;
  manufacturer?: string;
} {
  const errors: Record<string, string[]> = {};

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.name = ['Name is required'];
  } else if (data.name.length > 255) {
    errors.name = ['Name must be less than 255 characters'];
  }

  // Category ID validation (accept string or number)
  if (data.category_id === undefined || data.category_id === null || data.category_id === '') {
    errors.category_id = ['Category is required'];
  } else if (typeof data.category_id !== 'string' && typeof data.category_id !== 'number') {
    errors.category_id = ['Category must be a valid ID'];
  }

  // Price validation
  const price = Number(data.price);
  if (isNaN(price) || price < 0) {
    errors.price = ['Price must be a positive number'];
  }

  // Quantity validation
  const quantity = Number(data.quantity);
  if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    errors.quantity = ['Quantity must be a non-negative integer'];
  }

  // Expiry date validation
  if (!data.expiry_date) {
    errors.expiry_date = ['Expiry date is required'];
  } else {
    try {
      validateDate(data.expiry_date, 'Expiry date');
    } catch (e) {
      errors.expiry_date = [e instanceof Error ? e.message : 'Invalid date format'];
    }
  }

  // Stock alert validation
  const stockAlert = Number(data.stock_alert);
  if (isNaN(stockAlert) || stockAlert < 0 || !Number.isInteger(stockAlert)) {
    errors.stock_alert = ['Stock alert must be a non-negative integer'];
  }

  // Barcode validation (optional)
  if (data.barcode && typeof data.barcode !== 'string') {
    errors.barcode = ['Barcode must be a string'];
  }

  // Manufacturer validation (optional)
  if (data.manufacturer && typeof data.manufacturer !== 'string') {
    errors.manufacturer = ['Manufacturer must be a string'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    name: data.name.trim(),
    description: data.description?.trim() || '',
    category_id: String(data.category_id), // Convert to string for consistency
    price,
    quantity,
    expiry_date: data.expiry_date,
    stock_alert: stockAlert,
    barcode: data.barcode?.trim() || null,
    manufacturer: data.manufacturer?.trim() || null,
  };
}

// Login validation
export function validateLogin(data: any): { email: string; password: string } {
  if (!data.email || typeof data.email !== 'string') {
    throw new ValidationError('Email is required');
  }

  if (!data.password || typeof data.password !== 'string') {
    throw new ValidationError('Password is required');
  }

  validateEmail(data.email);

  return {
    email: data.email.trim().toLowerCase(),
    password: data.password,
  };
}

