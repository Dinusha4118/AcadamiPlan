// backend/utils/websocket.js
import { Server } from 'socket.io';

const setupWebSocket = (server) => {
    const io = new Server(server, { cors: { origin: '*' } });

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('conflictDetected', (message) => {
            io.emit('newConflict', message);
        });

        socket.on('disconnect', () => console.log('Client disconnected'));
    });

    return io;
};

export default setupWebSocket;
