import { DatabaseError, ValidationError, NotFoundError } from './errors';

export function handleDatabaseError(error: unknown): never {
  // MySQL error codes
  const mysqlError = error as any;

  if (mysqlError?.code === 'ER_DUP_ENTRY') {
    // Extract field name from error message
    const match = mysqlError.message.match(/for key '(.+?)'/);
    const field = match ? match[1] : 'field';
    throw new ValidationError(`${field} already exists`);
  }

  if (mysqlError?.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new ValidationError('Referenced record does not exist');
  }

  if (mysqlError?.code === 'ER_ROW_IS_REFERENCED_2') {
    throw new ValidationError('Cannot delete: record is being used');
  }

  if (mysqlError?.code === 'ER_BAD_FIELD_ERROR') {
    throw new DatabaseError('Invalid database field', error);
  }

  if (mysqlError?.code === 'ER_PARSE_ERROR') {
    throw new DatabaseError('Database query error', error);
  }

  // Generic database error
  throw new DatabaseError(
    'Database operation failed',
    error,
    mysqlError?.code
  );
}

