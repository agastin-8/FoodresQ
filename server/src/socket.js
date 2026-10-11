import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './db.js';

/**
 * Initialize Socket.IO on an HTTP server.
 * Handles real-time GPS coordinate broadcasting.
 */
export function initSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role})`);

    // Volunteer joins a donation tracking room
    socket.on('join-tracking', (donationId) => {
      const room = `donation-${donationId}`;
      socket.join(room);
      console.log(`📡 ${socket.user.name} joined tracking room: ${room}`);
    });

    // Volunteer leaves a tracking room
    socket.on('leave-tracking', (donationId) => {
      const room = `donation-${donationId}`;
      socket.leave(room);
      console.log(`📡 ${socket.user.name} left tracking room: ${room}`);
    });

    // Volunteer sends GPS location update
    socket.on('gps-update', async (data) => {
      const { donationId, lat, lng, accuracy, heading, speed } = data;

      if (lat == null || lng == null) return;

      try {
        // Store in database
        await pool.query(
          `INSERT INTO volunteer_location_logs
            (donation_id, volunteer_id, lat, lng, accuracy_meters, heading, speed)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [donationId || null, socket.user.id, lat, lng, accuracy || null, heading || null, speed || null]
        );

        // Update denormalized volunteer position on donation
        if (donationId) {
          await pool.query(
            `UPDATE donations SET
              volunteer_current_lat = $1,
              volunteer_current_lng = $2,
              volunteer_live_sharing = TRUE,
              volunteer_last_updated = NOW(),
              updated_at = NOW()
             WHERE id = $3`,
            [lat, lng, donationId]
          );
        }

        // Broadcast to all users watching this donation
        const room = `donation-${donationId}`;
        socket.to(room).emit('location-update', {
          donationId,
          volunteerId: socket.user.id,
          volunteerName: socket.user.name,
          lat,
          lng,
          accuracy,
          heading,
          speed,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Socket GPS update error:', err.message);
      }
    });

    // Volunteer stops sharing location
    socket.on('gps-stop', async (data) => {
      const { donationId } = data;
      if (donationId) {
        try {
          await pool.query(
            `UPDATE donations SET volunteer_live_sharing = FALSE, updated_at = NOW() WHERE id = $1`,
            [donationId]
          );
        } catch (err) {
          console.error('Socket GPS stop error:', err.message);
        }

        const room = `donation-${donationId}`;
        socket.to(room).emit('tracking-stopped', {
          donationId,
          volunteerId: socket.user.id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Status update notification broadcast
    socket.on('status-update', (data) => {
      const room = `donation-${data.donationId}`;
      socket.to(room).emit('status-changed', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
}
