/**
 * Input Validation and Sanitization Utilities
 * 
 * Provides comprehensive input validation and sanitization for all analysis tools
 */

import DOMPurify from 'dompurify';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedValue?: any;
}

// Validation rules interface
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
  sanitizer?: (value: any) => any;
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  noScripts: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  xssPatterns: /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed)/gi
};

// Sanitization functions
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Sanitize text input for analysis
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(ValidationPatterns.noScripts, '') // Remove script tags
      .replace(ValidationPatterns.xssPatterns, '') // Remove XSS patterns
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
  }

  /**
   * Sanitize SQL-like input to prevent injection
   */
  static sanitizeSqlInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/['"`;\\]/g, '') // Remove dangerous SQL characters
      .replace(ValidationPatterns.sqlInjection, '') // Remove SQL keywords
      .trim();
  }

  /**
   * Sanitize file names
   */
  static sanitizeFileName(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
      .replace(/_{2,}/g, '_') // Replace multiple underscores
      .substring(0, 255) // Limit length
      .trim();
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') return '';
    
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any, options: { min?: number; max?: number; integer?: boolean } = {}): number | null {
    const num = Number(input);
    
    if (isNaN(num) || !isFinite(num)) return null;
    
    let sanitized = num;
    
    if (options.integer) {
      sanitized = Math.floor(sanitized);
    }
    
    if (options.min !== undefined) {
      sanitized = Math.max(sanitized, options.min);
    }
    
    if (options.max !== undefined) {
      sanitized = Math.min(sanitized, options.max);
    }
    
    return sanitized;
  }
}

// Validation functions
export class InputValidator {
  /**
   * Validate text input for NLP analysis
   */
  static validateNlpText(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('Text input is required');
      return { isValid: false, errors, warnings };
    }
    
    const sanitized = InputSanitizer.sanitizeText(input);
    
    if (sanitized.length < 10) {
      errors.push('Text must be at least 10 characters long');
    }
    
    if (sanitized.length > 50000) {
      errors.push('Text must be less than 50,000 characters');
    }
    
    if (sanitized.length > 10000) {
      warnings.push('Large text may take longer to process');
    }
    
    // Check for potential issues
    if (ValidationPatterns.noScripts.test(input)) {
      warnings.push('Script tags detected and removed');
    }
    
    if (ValidationPatterns.xssPatterns.test(input)) {
      warnings.push('Potentially dangerous content detected and sanitized');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate image file for analysis
   */
  static validateImageFile(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!file) {
      errors.push('Image file is required');
      return { isValid: false, errors, warnings };
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      warnings.push('Large files may take longer to process');
    }
    
    // Sanitize file name
    const sanitizedName = InputSanitizer.sanitizeFileName(file.name);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitizedName
    };
  }

  /**
   * Validate URL input
   */
  static validateUrl(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('URL is required');
      return { isValid: false, errors, warnings };
    }
    
    const sanitized = InputSanitizer.sanitizeUrl(input);
    
    if (!sanitized) {
      errors.push('Invalid URL format');
    }
    
    if (!ValidationPatterns.url.test(sanitized)) {
      errors.push('URL must start with http:// or https://');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate keyword input
   */
  static validateKeyword(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('Keyword is required');
      return { isValid: false, errors, warnings };
    }
    
    const sanitized = InputSanitizer.sanitizeText(input);
    
    if (sanitized.length < 2) {
      errors.push('Keyword must be at least 2 characters long');
    }
    
    if (sanitized.length > 100) {
      errors.push('Keyword must be less than 100 characters');
    }
    
    if (!ValidationPatterns.alphanumericWithSpaces.test(sanitized)) {
      errors.push('Keyword can only contain letters, numbers, and spaces');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate export parameters
   */
  static validateExportParams(params: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!params || typeof params !== 'object') {
      errors.push('Export parameters are required');
      return { isValid: false, errors, warnings };
    }
    
    const sanitized: any = {};
    
    // Validate format
    const allowedFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (params.format && !allowedFormats.includes(params.format)) {
      errors.push('Invalid export format');
    } else {
      sanitized.format = params.format || 'json';
    }
    
    // Validate limit
    if (params.limit !== undefined) {
      const limit = InputSanitizer.sanitizeNumber(params.limit, { min: 1, max: 10000, integer: true });
      if (limit === null) {
        errors.push('Invalid limit value');
      } else {
        sanitized.limit = limit;
        if (limit > 5000) {
          warnings.push('Large exports may take longer to generate');
        }
      }
    }
    
    // Validate date range
    if (params.startDate) {
      const startDate = new Date(params.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date');
      } else {
        sanitized.startDate = startDate.toISOString();
      }
    }
    
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date');
      } else {
        sanitized.endDate = endDate.toISOString();
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitized
    };
  }

  /**
   * Generic field validation
   */
  static validateField(value: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedValue = value;
    
    // Apply sanitizer if provided
    if (rules.sanitizer) {
      sanitizedValue = rules.sanitizer(value);
    }
    
    // Required validation
    if (rules.required && (!sanitizedValue || sanitizedValue.toString().trim() === '')) {
      errors.push('This field is required');
      return { isValid: false, errors, warnings };
    }
    
    // Skip other validations if value is empty and not required
    if (!sanitizedValue && !rules.required) {
      return { isValid: true, errors, warnings, sanitizedValue };
    }
    
    const stringValue = sanitizedValue.toString();
    
    // Length validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }
    
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors.push('Invalid format');
    }
    
    // Custom validation
    if (rules.customValidator) {
      const customError = rules.customValidator(sanitizedValue);
      if (customError) {
        errors.push(customError);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue
    };
  }
}

// Form validation helper
export class FormValidator {
  private fields: Map<string, ValidationRule> = new Map();
  private values: Map<string, any> = new Map();
  
  /**
   * Add field validation rule
   */
  addField(name: string, rules: ValidationRule): this {
    this.fields.set(name, rules);
    return this;
  }
  
  /**
   * Set field value
   */
  setValue(name: string, value: any): this {
    this.values.set(name, value);
    return this;
  }
  
  /**
   * Validate all fields
   */
  validate(): { isValid: boolean; errors: Record<string, string[]>; sanitizedValues: Record<string, any> } {
    const errors: Record<string, string[]> = {};
    const sanitizedValues: Record<string, any> = {};
    let isValid = true;
    
    for (const [fieldName, rules] of this.fields) {
      const value = this.values.get(fieldName);
      const result = InputValidator.validateField(value, rules);
      
      if (!result.isValid) {
        errors[fieldName] = result.errors;
        isValid = false;
      }
      
      sanitizedValues[fieldName] = result.sanitizedValue;
    }
    
    return { isValid, errors, sanitizedValues };
  }
  
  /**
   * Validate single field
   */
  validateField(name: string): ValidationResult {
    const rules = this.fields.get(name);
    const value = this.values.get(name);
    
    if (!rules) {
      return { isValid: true, errors: [], warnings: [] };
    }
    
    return InputValidator.validateField(value, rules);
  }
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  /**
   * Check if request is allowed
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    let requests = this.requests.get(key) || [];
    
    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    requests.push(now);
    this.requests.set(key, requests);
    
    return true;
  }
  
  /**
   * Get remaining requests
   */
  getRemaining(key: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, maxRequests - validRequests.length);
  }
  
  /**
   * Clear requests for a key
   */
  clear(key: string): void {
    this.requests.delete(key);
  }
  
  /**
   * Clear all requests
   */
  clearAll(): void {
    this.requests.clear();
  }
}

// Export default instances
export const defaultRateLimiter = new RateLimiter();

// Validation presets for common use cases
export const ValidationPresets = {
  nlpAnalysis: {
    text: {
      required: true,
      minLength: 10,
      maxLength: 50000,
      sanitizer: InputSanitizer.sanitizeText
    }
  },
  
  imageAnalysis: {
    // File validation handled separately
  },
  
  keywordManagement: {
    keyword: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: ValidationPatterns.alphanumericWithSpaces,
      sanitizer: InputSanitizer.sanitizeText
    },
    description: {
      required: false,
      maxLength: 500,
      sanitizer: InputSanitizer.sanitizeText
    }
  },
  
  exportData: {
    format: {
      required: true,
      customValidator: (value: string) => {
        const allowed = ['json', 'csv', 'xlsx', 'pdf'];
        return allowed.includes(value) ? null : 'Invalid export format';
      }
    },
    limit: {
      required: false,
      customValidator: (value: any) => {
        const num = Number(value);
        if (isNaN(num) || num < 1 || num > 10000) {
          return 'Limit must be between 1 and 10,000';
        }
        return null;
      }
    }
  }
};