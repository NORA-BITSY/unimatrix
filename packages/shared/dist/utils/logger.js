import winston from 'winston';
const logFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple())
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ],
});
export class Logger {
    context;
    constructor(context) {
        this.context = context;
    }
    debug(message, meta) {
        logger.debug(message, { context: this.context, ...meta });
    }
    info(message, meta) {
        logger.info(message, { context: this.context, ...meta });
    }
    warn(message, meta) {
        logger.warn(message, { context: this.context, ...meta });
    }
    error(message, error, meta) {
        logger.error(message, {
            context: this.context,
            error: error?.stack || error?.message,
            ...meta
        });
    }
}
//# sourceMappingURL=logger.js.map