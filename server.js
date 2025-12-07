import mongoose from 'mongoose';
import app from './index.js';
import config from './src/config/config.js';
import { initRedisClient, disconnectRedis } from './src/config/redis.js';
import chalk from 'chalk';

// Banner printer
const printBanner = (title, color = chalk.green.bold) => {
    const line = '########################################';
    console.log(color(line));
    console.log(color(`###   ${title.padEnd(28)}###`));
    console.log(color(line));
};

let server;

// Initialize Redis and MongoDB, then start server
const startServer = async () => {
    try {
        // Connect to Redis
        await initRedisClient();
        printBanner('✅ Redis connected and running!', chalk.blueBright.bold);
        
        // Connect to MongoDB
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        printBanner('✅ Payment MongoDB connected successfully!', chalk.cyanBright.bold);
        printBanner(`${config.mongoose.url}`, chalk.cyanBright.bold);

        // Start server
        server = app.listen(config.port, () => {
            printBanner(
                `🚀 Payment Service running on port ${config.port} in ${config.env} mode`,
                chalk.magenta.bold
            );
        });
    } catch (err) {
        printBanner(`❌ Failed to start server: ${err.message}`, chalk.red.bold);
        process.exit(1);
    }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
    printBanner('⏹️  Shutting down gracefully...', chalk.yellow.bold);
    
    if (server) {
        server.close(async () => {
            await mongoose.disconnect();
            await disconnectRedis();
            printBanner('✅ Server shut down successfully', chalk.green.bold);
            process.exit(0);
        });
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

export { server };
