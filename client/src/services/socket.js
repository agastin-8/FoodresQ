import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Get or initialize the Socket.IO singleton instance
 */
export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('foodlink_token');
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('📡 Connected to FoodLink Live Tracking Socket Server');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection warning (will retry):', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }
  return socket;
}

/**
 * Connect the socket with the latest token
 */
export function connectSocket() {
  const s = getSocket();
  const token = localStorage.getItem('foodlink_token');
  s.auth = { token };
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect socket cleanly
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a donation tracking channel
 */
export function joinTrackingRoom(donationId) {
  const s = connectSocket();
  s.emit('join-tracking', donationId);
}

/**
 * Leave a donation tracking channel
 */
export function leaveTrackingRoom(donationId) {
  if (socket && socket.connected) {
    socket.emit('leave-tracking', donationId);
  }
}

/**
 * Emit real-time GPS coordinates
 */
export function emitGpsUpdate({ donationId, lat, lng, accuracy, heading, speed }) {
  const s = connectSocket();
  s.emit('gps-update', { donationId, lat, lng, accuracy, heading, speed });
}

/**
 * Stop GPS sharing
 */
export function emitGpsStop(donationId) {
  if (socket && socket.connected) {
    socket.emit('gps-stop', { donationId });
  }
}
