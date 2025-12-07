import { createClient } from 'redis';
import logger from './logger.js';
import config from './config.js';

let redisClient;

const initRedisClient = async () => {
    try {
        const redisConfig = config.redis;

        // Configure client options
        let clientOptions = {
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection limit exceeded');
                        return new Error('Redis max retries exceeded');
                    }
                    return retries * 100;
                },
            },
        };

        // Prefer REDIS_URL if available, otherwise build from host/port
        if (redisConfig.url && redisConfig.url !== 'undefined') {
            clientOptions.url = redisConfig.url;
        } else {
            // Use host and port config
            clientOptions.socket.host = redisConfig.host || 'localhost';
            clientOptions.socket.port = redisConfig.port || 6379;
            
            // Add password only if provided and not empty and not the default string
            if (redisConfig.password && 
                redisConfig.password.trim() && 
                redisConfig.password !== 'undefined') {
                clientOptions.password = redisConfig.password;
            }
        }

        redisClient = createClient(clientOptions);

        redisClient.on('error', (err) => {
            logger.error(`Redis Client Error: ${err.message}`);
        });

        redisClient.on('connect', () => {
            logger.info('Redis Client connected');
        });

        redisClient.on('ready', () => {
            logger.info('Redis Client ready');
        });

        redisClient.on('reconnecting', () => {
            logger.warn('Redis Client reconnecting');
        });

        await redisClient.connect();
        logger.info('Redis client initialized successfully');

        return redisClient;
    } catch (err) {
        logger.error(`Failed to initialize Redis client: ${err.message}`);
        throw err;
    }
};

const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call initRedisClient first.');
    }
    return redisClient;
};

const disconnectRedis = async () => {
    if (redisClient) {
        try {
            await redisClient.quit();
            logger.info('Redis client disconnected');
        } catch (err) {
            // Client already closed, log and continue
            if (err.message === 'The client is closed') {
                logger.info('Redis client already closed');
            } else {
                logger.error(`Error disconnecting Redis: ${err.message}`);
            }
        }
    }
};

export { initRedisClient, getRedisClient, disconnectRedis };
