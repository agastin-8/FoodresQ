import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

import pool from './db.js';
import { initSocketIO } from './socket.js';
import authRoutes from './routes/auth.js';
import listingsRoutes from './routes/listings.js';
import donationsRoutes from './routes/donations.js';
import trackingRoutes from './routes/tracking.js';
import tripsRoutes from './routes/trips.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initSocketIO(server);
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbRes.rows[0].now,
      version: '1.0.0',
    });
  } catch (err) {
    res.status(500).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/users', usersRoutes);

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 FoodResQ / FoodLink Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time GPS tracking`);
});
