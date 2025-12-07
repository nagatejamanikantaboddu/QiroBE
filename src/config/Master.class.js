import winston from 'winston';
import config from './config.js';
import APIError from './APIError.js';
const HttpStatusCodes = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
};
class Master {
    constructor() {
        // super()
        this.logger = winston.createLogger({
            level: config.env === 'development' ? 'debug' : 'info',
            format: winston.format.combine(
                this.enumerateErrorFormat(),
                config.env === 'development'
                    ? winston.format.colorize()
                    : winston.format.uncolorize(),
                winston.format.splat(),
                winston.format.printf(
                    ({ level, message }) => `${level}: ${message}`
                )
            ),
            transports: [
                new winston.transports.Console({
                    stderrLevels: ['error'],
                }),
            ],
        });

        this.HTTP_STATUS = HttpStatusCodes;
    }

    /**
     * Custom error format for Winston logger 📦
     */
    enumerateErrorFormat() {
        return winston.format((info) => {
            if (info instanceof Error) {
                Object.assign(info, { message: info.stack });
            }
            return info;
        })();
    }

    /**
     * Log an info message 🟢
     * @param {string} message
     */
    logInfo(message) {
        this.logger.info(message);
    }

    /**
     * Log an error message 🔴
     * @param {string} message
     */
    logError(message) {
        this.logger.error(message);
    }

    /**
     * Log a warning message 🟡
     * @param {string} message
     */
    logWarn(message) {
        this.logger.warn(message);
    }

    /**
     * Create a standardized API error response ⚠️
     * @param {number} statusCode
     * @param {string} description
     * @returns {APIError}
     */
    API_ERROR(statusCode, description) {
        return new APIError(statusCode, description);
    }

    /**
     * Generate a random unique ID (8 characters) 🔑
     * @returns {string}
     */
    generateUniqueId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let uniqueId = '';
        for (let i = 0; i < 8; i++) {
            uniqueId += chars[Math.floor(Math.random() * chars.length)];
        }
        return uniqueId;
    }
}

export default Master;
