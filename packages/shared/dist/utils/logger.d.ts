import winston from 'winston';
export declare const logger: winston.Logger;
export declare class Logger {
    private context;
    constructor(context: string);
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
}
//# sourceMappingURL=logger.d.ts.map