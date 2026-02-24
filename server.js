import app from './index.js';
import config from './src/config/config.js';
import chalk from 'chalk';

// Banner printer
const printBanner = (title, color = chalk.green.bold) => {
    const line = '########################################';
    console.log(color(line));
    console.log(color(`###   ${title.padEnd(28)}###`));
    console.log(color(line));
};

let server;

// Start server
const startServer = async () => {
    try {
        // Start server
        server = app.listen(config.port, () => {
            printBanner(
                `🚀 Server running on port ${config.port} in ${config.env} mode`,
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
            printBanner('✅ Server shut down successfully', chalk.green.bold);
            process.exit(0);
        });
    }
};

// Handle SIGTERM and SIGINT
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();
