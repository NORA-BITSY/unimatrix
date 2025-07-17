/**
 * Generate unique identifiers
 */
export declare class IdGenerator {
    static nanoid(size?: number): string;
    static shortId(): string;
    static uuid(): string;
    static correlationId(): string;
    static requestId(): string;
}
/**
 * Date and time utilities
 */
export declare class DateHelper {
    static format(date: Date | string, pattern?: string): string;
    static isValidDate(date: any): boolean;
    static toISOString(date: Date | string): string;
    static now(): string;
    static timestamp(): number;
}
/**
 * Object manipulation utilities
 */
export declare class ObjectHelper {
    static deepClone<T>(obj: T): T;
    static pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
    static omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
    static isEmpty(obj: any): boolean;
    static merge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T;
}
/**
 * String manipulation utilities
 */
export declare class StringHelper {
    static camelCase(str: string): string;
    static kebabCase(str: string): string;
    static snakeCase(str: string): string;
    static capitalize(str: string): string;
    static truncate(str: string, length: number, suffix?: string): string;
    static sanitize(str: string): string;
    static slug(str: string): string;
}
/**
 * Array utilities
 */
export declare class ArrayHelper {
    static unique<T>(arr: T[]): T[];
    static chunk<T>(arr: T[], size: number): T[][];
    static shuffle<T>(arr: T[]): T[];
    static groupBy<T, K extends keyof T>(arr: T[], key: K): Record<string, T[]>;
}
/**
 * Performance utilities
 */
export declare class PerformanceHelper {
    static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
    static throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => ReturnType<T> | void;
    static retry<T>(fn: () => Promise<T>, maxAttempts?: number, delay?: number): Promise<T>;
    static timeout<T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T>;
}
/**
 * Environment utilities
 */
export declare class EnvHelper {
    static isDevelopment(): boolean;
    static isProduction(): boolean;
    static isTest(): boolean;
    static getEnv(key: string, defaultValue?: string): string;
    static getEnvNumber(key: string, defaultValue?: number): number;
    static getEnvBoolean(key: string, defaultValue?: boolean): boolean;
}
//# sourceMappingURL=helpers.d.ts.map