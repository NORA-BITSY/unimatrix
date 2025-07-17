import 'dotenv/config';
export interface Config {
    port: number;
    host: string;
    nodeEnv: string;
    isDevelopment: () => boolean;
    isProduction: () => boolean;
    database: {
        url: string;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cors: {
        origins: string[];
    };
    rateLimit: {
        max: number;
        timeWindow: string;
    };
}
export declare const config: Config;
//# sourceMappingURL=index.d.ts.map