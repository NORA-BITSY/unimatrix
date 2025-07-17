import { format as formatDate, parseISO, isValid } from 'date-fns';
/**
 * Generate unique identifiers
 */
export class IdGenerator {
    static nanoid(size = 21) {
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let id = '';
        const bytes = crypto.getRandomValues(new Uint8Array(size));
        for (let i = 0; i < size; i++) {
            id += alphabet[bytes[i] % alphabet.length];
        }
        return id;
    }
    static shortId() {
        return this.nanoid(8);
    }
    static uuid() {
        return crypto.randomUUID();
    }
    static correlationId() {
        return `corr_${this.nanoid(16)}`;
    }
    static requestId() {
        return `req_${this.nanoid(12)}`;
    }
}
/**
 * Date and time utilities
 */
export class DateHelper {
    static format(date, pattern = 'yyyy-MM-dd HH:mm:ss') {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return formatDate(dateObj, pattern);
    }
    static isValidDate(date) {
        if (date instanceof Date) {
            return isValid(date);
        }
        if (typeof date === 'string') {
            return isValid(parseISO(date));
        }
        return false;
    }
    static toISOString(date) {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return dateObj.toISOString();
    }
    static now() {
        return new Date().toISOString();
    }
    static timestamp() {
        return Date.now();
    }
}
/**
 * Object manipulation utilities
 */
export class ObjectHelper {
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object')
            return obj;
        if (obj instanceof Date)
            return new Date(obj.getTime());
        if (Array.isArray(obj))
            return obj.map(item => this.deepClone(item));
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
    static pick(obj, keys) {
        const result = {};
        for (const key of keys) {
            if (key in obj) {
                result[key] = obj[key];
            }
        }
        return result;
    }
    static omit(obj, keys) {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && !keys.includes(key)) {
                result[key] = obj[key];
            }
        }
        return result;
    }
    static isEmpty(obj) {
        if (obj === null || obj === undefined)
            return true;
        if (Array.isArray(obj))
            return obj.length === 0;
        if (typeof obj === 'object')
            return Object.keys(obj).length === 0;
        if (typeof obj === 'string')
            return obj.trim().length === 0;
        return false;
    }
    static merge(target, ...sources) {
        return Object.assign({}, target, ...sources);
    }
}
/**
 * String manipulation utilities
 */
export class StringHelper {
    static camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }
    static kebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    static snakeCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    }
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    static truncate(str, length, suffix = '...') {
        if (str.length <= length)
            return str;
        return str.slice(0, length - suffix.length) + suffix;
    }
    static sanitize(str) {
        return str.replace(/[<>\"'&]/g, (match) => {
            const escape = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;',
            };
            return escape[match];
        });
    }
    static slug(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
/**
 * Array utilities
 */
export class ArrayHelper {
    static unique(arr) {
        return [...new Set(arr)];
    }
    static chunk(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
    static shuffle(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    static groupBy(arr, key) {
        return arr.reduce((groups, item) => {
            const groupKey = String(item[key]);
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    }
}
/**
 * Performance utilities
 */
export class PerformanceHelper {
    static debounce(func, wait) {
        let timeout = null;
        return (...args) => {
            if (timeout)
                clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    static throttle(func, wait) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= wait) {
                lastCall = now;
                return func(...args);
            }
        };
    }
    static async retry(fn, maxAttempts = 3, delay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxAttempts)
                    break;
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
        throw lastError;
    }
    static async timeout(promise, ms, errorMessage = 'Operation timed out') {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(errorMessage)), ms);
        });
        return Promise.race([promise, timeoutPromise]);
    }
}
/**
 * Environment utilities
 */
export class EnvHelper {
    static isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }
    static isProduction() {
        return process.env.NODE_ENV === 'production';
    }
    static isTest() {
        return process.env.NODE_ENV === 'test';
    }
    static getEnv(key, defaultValue) {
        return process.env[key] ?? defaultValue ?? '';
    }
    static getEnvNumber(key, defaultValue = 0) {
        const value = process.env[key];
        if (!value)
            return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    static getEnvBoolean(key, defaultValue = false) {
        const value = process.env[key];
        if (!value)
            return defaultValue;
        return value.toLowerCase() === 'true';
    }
}
//# sourceMappingURL=helpers.js.map