import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';
import { fileURLToPath } from 'url';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env.payment') });

// Define Joi schema for validation
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),

    MONGODB_URL: Joi.string().required(),

    JWT_SECRET: Joi.string().required(),
    TOKEN_EXPIRY: Joi.string().required(),
    SALT_ROUNDS: Joi.number().required(),

    AWS_REGION: Joi.string().optional(),
    AWS_ACCESS_KEY_ID: Joi.string().optional(),
    AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
    AWS_BUCKET_NAME: Joi.string().optional(),

    FAST_2_SMS_KEY: Joi.string().optional(),
    FAST_2_SMS_URL: Joi.string().uri().optional(),

    REDIS_URL: Joi.string().uri().required(),
    REDIS_PASSWORD: Joi.string().optional(),
    REDIS_HOST: Joi.string().optional(),
    REDIS_PORT: Joi.number().optional(),

    EMAIL_API_KEY: Joi.string().optional(),
    SENDER_EMAIL: Joi.string().email().optional(),
}).unknown();

// Validate .env
const { error, value: envVars } = envVarsSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

// Export config object
const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,

    mongoose: {
    url: envVars.MONGODB_URL,
        options: {},
    },

    saltRounds: envVars.SALT_ROUNDS,
    tokenExpiry: envVars.TOKEN_EXPIRY,
    JWT_SECRET: envVars.JWT_SECRET,

    jwt: {
        secret: envVars.JWT_SECRET,
    },

    AWS_REGION: envVars.AWS_REGION,
    AWS_ACCESS_KEY_ID: envVars.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: envVars.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: envVars.AWS_BUCKET_NAME,

    FAST_2_SMS_KEY: envVars.FAST_2_SMS_KEY,
    FAST_2_SMS_URL: envVars.FAST_2_SMS_URL,

    redis: {
        url: envVars.REDIS_URL,
        password: envVars.REDIS_PASSWORD,
        host: envVars.REDIS_HOST,
        port: envVars.REDIS_PORT,
    },

    EMAIL_API_KEY: envVars.EMAIL_API_KEY,
    SENDER_EMAIL: envVars.SENDER_EMAIL,
    razorpay: {
        key_id: envVars.RAZORPAY_KEY_ID,
        key_secret: envVars.RAZORPAY_KEY_SECRET,
    }
};

export default config;

