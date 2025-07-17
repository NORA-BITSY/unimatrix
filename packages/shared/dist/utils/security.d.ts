/**
 * Security utilities for authentication, authorization, and data protection
 */
export declare class SecurityHelper {
    /**
     * Generate a secure random token
     */
    static generateToken(length?: number): string;
    /**
     * Generate a secure API key
     */
    static generateApiKey(prefix?: string): string;
    /**
     * Create a hash-based message authentication code (HMAC)
     */
    static createHMAC(data: string, secret: string): string;
    /**
     * Verify HMAC signature
     */
    static verifyHMAC(data: string, signature: string, secret: string): boolean;
    /**
     * Generate a secure password hash
     */
    static hashPassword(password: string, salt?: string): {
        hash: string;
        salt: string;
    };
    /**
     * Verify password against hash
     */
    static verifyPassword(password: string, hash: string, salt: string): boolean;
    /**
     * Sanitize user input to prevent XSS
     */
    static sanitizeInput(input: string): string;
    /**
     * Validate and sanitize SQL input to prevent SQL injection
     */
    static sanitizeSqlInput(input: string): string;
    /**
     * Generate Content Security Policy header
     */
    static generateCSPHeader(options?: {
        defaultSrc?: string[];
        scriptSrc?: string[];
        styleSrc?: string[];
        imgSrc?: string[];
        connectSrc?: string[];
        fontSrc?: string[];
        objectSrc?: string[];
        mediaSrc?: string[];
        frameSrc?: string[];
    }): string;
    /**
     * Check if string contains potentially malicious patterns
     */
    static containsMaliciousPatterns(input: string): boolean;
    /**
     * Validate file upload security
     */
    static validateFileUpload(file: {
        originalname: string;
        mimetype: string;
        size: number;
    }, options?: {
        maxSize?: number;
        allowedMimeTypes?: string[];
        allowedExtensions?: string[];
    }): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Generate secure headers for HTTP responses
     */
    static getSecurityHeaders(): Record<string, string>;
    /**
     * Rate limiting key generator
     */
    static generateRateLimitKey(identifier: string, endpoint: string, window?: string): string;
    /**
     * Mask sensitive data for logging
     */
    static maskSensitiveData(data: any, sensitiveFields?: string[]): any;
}
/**
 * Permission-based access control utilities
 */
export declare class PermissionChecker {
    /**
     * Check if user has required permission
     */
    static hasPermission(userPermissions: string[], requiredPermission: string | string[]): boolean;
    /**
     * Check if user has any of the required permissions
     */
    static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean;
    /**
     * Check if user has role
     */
    static hasRole(userRoles: string[], requiredRole: string | string[]): boolean;
    /**
     * Check if user has any of the required roles
     */
    static hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean;
    /**
     * Check resource ownership
     */
    static isResourceOwner(userId: string, resourceOwnerId: string): boolean;
    /**
     * Check if user can access resource based on ownership or permissions
     */
    static canAccessResource(userId: string, resourceOwnerId: string, userPermissions: string[], requiredPermissions: string[]): boolean;
}
/**
 * Input validation and sanitization
 */
export declare class InputValidator {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean;
    /**
     * Validate phone number format
     */
    static isValidPhone(phone: string): boolean;
    /**
     * Validate URL format
     */
    static isValidUrl(url: string): boolean;
    /**
     * Validate UUID format
     */
    static isValidUuid(uuid: string): boolean;
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password: string): {
        valid: boolean;
        score: number;
        feedback: string[];
    };
    /**
     * Sanitize HTML input
     */
    static sanitizeHtml(html: string): string;
}
//# sourceMappingURL=security.d.ts.map