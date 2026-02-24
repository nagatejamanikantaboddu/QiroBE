import express from 'express'
import helmet from 'helmet';
import cors from 'cors'
import config from './src/config/config.js'
import morgan from './src/config/morgan.js'

const app = express();

if (config.env !== 'test') {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());
app.options('*', cors());

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', message: 'Server is running' });
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not found' });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ error: message });
});

export default app;