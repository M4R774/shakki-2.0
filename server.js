const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Store active games
const activeGames = new Map();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle joining a game
    socket.on('joinGame', (gameId) => {
        if (!activeGames.has(gameId)) {
            activeGames.set(gameId, {
                players: new Set(),
                gameState: null
            });
        }
        
        const game = activeGames.get(gameId);
        game.players.add(socket.id);
        socket.join(gameId);
        
        // Notify others in the game
        io.to(gameId).emit('playerJoined', {
            playerId: socket.id,
            playerCount: game.players.size
        });
    });

    // Handle game moves
    socket.on('makeMove', (data) => {
        const { gameId, move } = data;
        if (activeGames.has(gameId)) {
            const game = activeGames.get(gameId);
            game.gameState = move;
            // Broadcast the move to all players in the game except sender
            socket.to(gameId).emit('moveMade', move);
        }
    });

    // Handle game state updates
    socket.on('updateGameState', (data) => {
        const { gameId, gameState } = data;
        if (activeGames.has(gameId)) {
            const game = activeGames.get(gameId);
            game.gameState = gameState;
            // Broadcast the new state to all players in the game except sender
            socket.to(gameId).emit('gameStateUpdated', gameState);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove player from all games they were in
        activeGames.forEach((game, gameId) => {
            if (game.players.has(socket.id)) {
                game.players.delete(socket.id);
                io.to(gameId).emit('playerLeft', {
                    playerId: socket.id,
                    playerCount: game.players.size
                });
                
                // Clean up empty games
                if (game.players.size === 0) {
                    activeGames.delete(gameId);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 