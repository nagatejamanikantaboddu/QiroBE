import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';
import { fileURLToPath } from 'url';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define Joi schema for validation
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
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
};

export default config;

