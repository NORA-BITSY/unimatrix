import { createHash, randomBytes, timingSafeEqual } from 'crypto';
/**
 * Security utilities for authentication, authorization, and data protection
 */
export class SecurityHelper {
    /**
     * Generate a secure random token
     */
    static generateToken(length = 32) {
        return randomBytes(length).toString('hex');
    }
    /**
     * Generate a secure API key
     */
    static generateApiKey(prefix = 'umx') {
        const random = randomBytes(24).toString('hex');
        return `${prefix}_${random}`;
    }
    /**
     * Create a hash-based message authentication code (HMAC)
     */
    static createHMAC(data, secret) {
        return createHash('sha256').update(data + secret).digest('hex');
    }
    /**
     * Verify HMAC signature
     */
    static verifyHMAC(data, signature, secret) {
        const expectedSignature = this.createHMAC(data, secret);
        // Use timing-safe comparison to prevent timing attacks
        if (signature.length !== expectedSignature.length) {
            return false;
        }
        return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    /**
     * Generate a secure password hash
     */
    static hashPassword(password, salt) {
        const passwordSalt = salt || randomBytes(16).toString('hex');
        const hash = createHash('sha256').update(password + passwordSalt).digest('hex');
        return { hash, salt: passwordSalt };
    }
    /**
     * Verify password against hash
     */
    static verifyPassword(password, hash, salt) {
        const { hash: computedHash } = this.hashPassword(password, salt);
        return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    }
    /**
     * Sanitize user input to prevent XSS
     */
    static sanitizeInput(input) {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    /**
     * Validate and sanitize SQL input to prevent SQL injection
     */
    static sanitizeSqlInput(input) {
        return input
            .replace(/['";\\]/g, '')
            .replace(/--/g, '')
            .replace(/\/\*/g, '')
            .replace(/\*\//g, '')
            .replace(/xp_/gi, '')
            .replace(/sp_/gi, '');
    }
    /**
     * Generate Content Security Policy header
     */
    static generateCSPHeader(options = {}) {
        const directives = [];
        if (options.defaultSrc) {
            directives.push(`default-src ${options.defaultSrc.join(' ')}`);
        }
        if (options.scriptSrc) {
            directives.push(`script-src ${options.scriptSrc.join(' ')}`);
        }
        if (options.styleSrc) {
            directives.push(`style-src ${options.styleSrc.join(' ')}`);
        }
        if (options.imgSrc) {
            directives.push(`img-src ${options.imgSrc.join(' ')}`);
        }
        if (options.connectSrc) {
            directives.push(`connect-src ${options.connectSrc.join(' ')}`);
        }
        if (options.fontSrc) {
            directives.push(`font-src ${options.fontSrc.join(' ')}`);
        }
        if (options.objectSrc) {
            directives.push(`object-src ${options.objectSrc.join(' ')}`);
        }
        if (options.mediaSrc) {
            directives.push(`media-src ${options.mediaSrc.join(' ')}`);
        }
        if (options.frameSrc) {
            directives.push(`frame-src ${options.frameSrc.join(' ')}`);
        }
        return directives.join('; ');
    }
    /**
     * Check if string contains potentially malicious patterns
     */
    static containsMaliciousPatterns(input) {
        const maliciousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /expression\s*\(/gi,
            /@import/gi,
            /url\s*\(/gi,
        ];
        return maliciousPatterns.some(pattern => pattern.test(input));
    }
    /**
     * Validate file upload security
     */
    static validateFileUpload(file, options = {}) {
        const errors = [];
        // Check file size
        if (options.maxSize && file.size > options.maxSize) {
            errors.push(`File size exceeds maximum allowed size of ${options.maxSize} bytes`);
        }
        // Check MIME type
        if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
            errors.push(`File type ${file.mimetype} is not allowed`);
        }
        // Check file extension
        if (options.allowedExtensions) {
            const extension = file.originalname.toLowerCase().split('.').pop();
            if (!extension || !options.allowedExtensions.includes(`.${extension}`)) {
                errors.push(`File extension .${extension} is not allowed`);
            }
        }
        // Check for double extensions (e.g., file.txt.exe)
        const doubleExtensionPattern = /\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;
        if (doubleExtensionPattern.test(file.originalname)) {
            errors.push('Files with double extensions are not allowed');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Generate secure headers for HTTP responses
     */
    static getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        };
    }
    /**
     * Rate limiting key generator
     */
    static generateRateLimitKey(identifier, endpoint, window = '1h') {
        return `rate_limit:${identifier}:${endpoint}:${window}`;
    }
    /**
     * Mask sensitive data for logging
     */
    static maskSensitiveData(data, sensitiveFields = []) {
        const defaultSensitiveFields = [
            'password',
            'token',
            'secret',
            'key',
            'authorization',
            'cookie',
            'session',
            'credit_card',
            'ssn',
            'email',
            'phone',
        ];
        const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
        if (typeof data === 'string') {
            return data.replace(/./g, '*');
        }
        if (Array.isArray(data)) {
            return data.map(item => this.maskSensitiveData(item, sensitiveFields));
        }
        if (typeof data === 'object' && data !== null) {
            const masked = {};
            for (const [key, value] of Object.entries(data)) {
                const isSecretive = allSensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()));
                if (isSecretive) {
                    masked[key] = typeof value === 'string' ? value.replace(/./g, '*') : '[REDACTED]';
                }
                else {
                    masked[key] = this.maskSensitiveData(value, sensitiveFields);
                }
            }
            return masked;
        }
        return data;
    }
}
/**
 * Permission-based access control utilities
 */
export class PermissionChecker {
    /**
     * Check if user has required permission
     */
    static hasPermission(userPermissions, requiredPermission) {
        if (Array.isArray(requiredPermission)) {
            return requiredPermission.every(permission => userPermissions.includes(permission));
        }
        return userPermissions.includes(requiredPermission);
    }
    /**
     * Check if user has any of the required permissions
     */
    static hasAnyPermission(userPermissions, requiredPermissions) {
        return requiredPermissions.some(permission => userPermissions.includes(permission));
    }
    /**
     * Check if user has role
     */
    static hasRole(userRoles, requiredRole) {
        if (Array.isArray(requiredRole)) {
            return requiredRole.every(role => userRoles.includes(role));
        }
        return userRoles.includes(requiredRole);
    }
    /**
     * Check if user has any of the required roles
     */
    static hasAnyRole(userRoles, requiredRoles) {
        return requiredRoles.some(role => userRoles.includes(role));
    }
    /**
     * Check resource ownership
     */
    static isResourceOwner(userId, resourceOwnerId) {
        return userId === resourceOwnerId;
    }
    /**
     * Check if user can access resource based on ownership or permissions
     */
    static canAccessResource(userId, resourceOwnerId, userPermissions, requiredPermissions) {
        // Check if user is owner
        if (this.isResourceOwner(userId, resourceOwnerId)) {
            return true;
        }
        // Check if user has required permissions
        return this.hasPermission(userPermissions, requiredPermissions);
    }
}
/**
 * Input validation and sanitization
 */
export class InputValidator {
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate phone number format
     */
    static isValidPhone(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/\s|-/g, ''));
    }
    /**
     * Validate URL format
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Validate UUID format
     */
    static isValidUuid(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
        if (password.length >= 8) {
            score += 1;
        }
        else {
            feedback.push('Password must be at least 8 characters long');
        }
        if (/[a-z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain lowercase letters');
        }
        if (/[A-Z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain uppercase letters');
        }
        if (/\d/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain numbers');
        }
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain special characters');
        }
        return {
            valid: score >= 4,
            score,
            feedback,
        };
    }
    /**
     * Sanitize HTML input
     */
    static sanitizeHtml(html) {
        return html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/<object[^>]*>.*?<\/object>/gi, '')
            .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/javascript:/gi, '');
    }
}
//# sourceMappingURL=security.js.map