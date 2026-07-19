import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Frontend socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Frontend socket disconnected');
});

export default socket;