export declare class DatabaseService {
    private static isInitialized;
    static initialize(): Promise<void>;
    static disconnect(): Promise<void>;
    static healthCheck(): Promise<boolean>;
    static get initialized(): boolean;
}
//# sourceMappingURL=database.service.d.ts.map