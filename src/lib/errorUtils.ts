import { AxiosError } from 'axios';

/**
 * Structure of Laravel validation errors
 */
export interface ValidationErrors {
    [field: string]: string[];
}

/**
 * Laravel error response structure
 */
interface LaravelErrorResponse {
    message: string;
    errors?: ValidationErrors;
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
    public errors: ValidationErrors;

    constructor(message: string, errors: ValidationErrors) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * Extract validation errors from an Axios error response
 * @param error - The error object from axios
 * @returns ValidationErrors object or null if not a validation error
 */
export function extractValidationErrors(error: unknown): ValidationErrors | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    // Check if it's an AxiosError with response
    const axiosError = error as AxiosError<LaravelErrorResponse>;

    if (axiosError.response?.status === 422 && axiosError.response?.data?.errors) {
        return axiosError.response.data.errors;
    }

    // Check if it's already a ValidationError
    if (error instanceof ValidationError) {
        return error.errors;
    }

    return null;
}

/**
 * Get the first error message for a specific field
 * @param errors - ValidationErrors object
 * @param field - Field name
 * @returns First error message or undefined
 */
export function getFirstError(errors: ValidationErrors | null, field: string): string | undefined {
    if (!errors || !errors[field] || errors[field].length === 0) {
        return undefined;
    }
    return errors[field][0];
}

/**
 * Get all error messages for a specific field
 * @param errors - ValidationErrors object
 * @param field - Field name
 * @returns Array of error messages
 */
export function getFieldErrors(errors: ValidationErrors | null, field: string): string[] {
    if (!errors || !errors[field]) {
        return [];
    }
    return errors[field];
}

/**
 * Format validation errors into a single string message
 * @param errors - ValidationErrors object
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ValidationErrors | null): string {
    if (!errors) {
        return 'Validation failed';
    }

    const messages: string[] = [];
    for (const [field, fieldErrors] of Object.entries(errors)) {
        fieldErrors.forEach(error => {
            messages.push(error);
        });
    }

    return messages.join(' ');
}

/**
 * Check if an error is a validation error
 * @param error - Error object
 * @returns True if it's a validation error
 */
export function isValidationError(error: unknown): boolean {
    return extractValidationErrors(error) !== null;
}

/**
 * Handle API errors and throw appropriate error types
 * @param error - Error from API call
 * @param defaultMessage - Default error message if not a validation error
 */
export function handleApiError(error: unknown, defaultMessage: string): never {
    const validationErrors = extractValidationErrors(error);

    if (validationErrors) {
        const axiosError = error as AxiosError<LaravelErrorResponse>;
        const message = axiosError.response?.data?.message || 'Validation failed';
        throw new ValidationError(message, validationErrors);
    }

    // If it's an axios error with a message
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || defaultMessage;
        throw new Error(message);
    }

    // Generic error
    if (error instanceof Error) {
        throw error;
    }

    throw new Error(defaultMessage);
}
