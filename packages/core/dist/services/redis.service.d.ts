export declare class RedisService {
    private static isInitialized;
    static initialize(): Promise<void>;
    static disconnect(): Promise<void>;
    static healthCheck(): Promise<boolean>;
    static get initialized(): boolean;
}
//# sourceMappingURL=redis.service.d.ts.map