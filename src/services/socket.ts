import { io, Socket } from 'socket.io-client';

// The API URL will be the same as the backend server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

let socket: Socket;

/**
 * Initialize socket connection
 */
export const initializeSocket = (): Socket => {
  socket = io(API_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5
  });
  
  socket.on('connect', () => {
    console.log('Connected to server socket');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
  });
  
  return socket;
};

/**
 * Get the socket instance
 */
export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Join a match room
 */
export const joinMatch = (userId: string, matchId: string): void => {
  const socket = getSocket();
  socket.emit('join-match', { userId, matchId });
};

/**
 * Leave a match room
 */
export const leaveMatch = (userId: string, matchId: string): void => {
  const socket = getSocket();
  socket.emit('leave-match', { userId, matchId });
};

/**
 * Send a message
 */
export const sendMessage = (userId: string, matchId: string, text: string, isPlayerA: boolean): void => {
  const socket = getSocket();
  socket.emit('send-message', { userId, matchId, text, isPlayerA });
};

/**
 * Add listener for new messages
 */
export const onNewMessage = (callback: (message: any) => void): () => void => {
  const socket = getSocket();
  socket.on('new-message', ({ message }) => {
    callback(message);
  });
  
  // Return unsubscribe function
  return () => {
    socket.off('new-message');
  };
};

/**
 * Add listener for match history
 */
export const onMatchHistory = (callback: (messages: any[]) => void): () => void => {
  const socket = getSocket();
  socket.on('match-history', ({ messages }) => {
    callback(messages);
  });
  
  // Return unsubscribe function
  return () => {
    socket.off('match-history');
  };
};

/**
 * Add listener for final message notification
 */
export const onFinalMessage = (callback: (data: { matchId: string, timeLimit: number }) => void): () => void => {
  const socket = getSocket();
  socket.on('final-message', (data) => {
    callback(data);
  });
  
  // Return unsubscribe function
  return () => {
    socket.off('final-message');
  };
}; 