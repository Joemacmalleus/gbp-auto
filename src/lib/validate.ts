/**
 * Input validation utility for API routes.
 * Validates required fields, types, and string lengths.
 * Returns structured error responses.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate that a required field exists and is not empty
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === "") {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate that a field is a string
 */
export function validateString(
  value: unknown,
  fieldName: string
): ValidationError | null {
  if (typeof value !== "string") {
    return { field: fieldName, message: `${fieldName} must be a string` };
  }
  return null;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationError | null {
  if (minLength && value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters`,
    };
  }
  if (maxLength && value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at most ${maxLength} characters`,
    };
  }
  return null;
}

/**
 * Validate that a field is a number
 */
export function validateNumber(
  value: unknown,
  fieldName: string
): ValidationError | null {
  if (typeof value !== "number" || isNaN(value)) {
    return { field: fieldName, message: `${fieldName} must be a number` };
  }
  return null;
}

/**
 * Validate that a field is an integer
 */
export function validateInteger(
  value: unknown,
  fieldName: string
): ValidationError | null {
  const numError = validateNumber(value, fieldName);
  if (numError) return numError;
  if (!Number.isInteger(value)) {
    return { field: fieldName, message: `${fieldName} must be an integer` };
  }
  return null;
}

/**
 * Validate that a field is one of allowed values
 */
export function validateEnum<T>(
  value: unknown,
  fieldName: string,
  allowedValues: T[]
): ValidationError | null {
  if (!allowedValues.includes(value as T)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    };
  }
  return null;
}

/**
 * Validate JSON request body with multiple fields
 */
export function validateRequestBody(
  data: unknown,
  validators: {
    field: string;
    validate: (value: unknown) => ValidationError | null;
  }[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: [{ field: "body", message: "Request body must be a JSON object" }],
    };
  }

  for (const { field, validate } of validators) {
    const value = (data as Record<string, unknown>)[field];
    const error = validate(value);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
