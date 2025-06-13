import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose'; // Import mongoose
import routesModule from './routes/index.js'; // Ensure .js extension

// Enable Mongoose debug mode
mongoose.set('debug', true);

const mainRoutes = routesModule; // In ES modules, the default export is directly the module itself if correctly exported

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the backend API!' });
});

// API routes
if (mainRoutes) {
  app.use('/api', mainRoutes); // Use the extracted router
} else {
  console.error("Failed to load main routes. mainRoutes is undefined. Check module exports in routes/index.js and ensure it's using ES Module 'export default router;'");
  // Optionally, you could prevent the app from starting or throw an error
}

// Error handling middleware (basic example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app; 