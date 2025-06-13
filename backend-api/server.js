import 'dotenv/config'; // More idiomatic ES module way to load dotenv
import app from './src/app.js';
import { connectMasterDB, closeAllConnections } from './src/config/db.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectMasterDB(); // Connect to the user_db or a generic admin DB first
    console.log('Master database connected successfully.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and DB connections');
  try {
    await closeAllConnections();
    console.log('All database connections closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}); 