import type { AppConfig } from '../types/index.js';
export declare class Config {
    private static instance;
    private config;
    private constructor();
    static getInstance(): Config;
    private loadConfig;
    get<K extends keyof AppConfig>(key: K): AppConfig[K];
    getAll(): AppConfig;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isTest(): boolean;
}
export declare const config: Config;
//# sourceMappingURL=index.d.ts.map