const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');           // ✅ important line
const io = new Server(http);                        // ✅ define io here

app.use(express.static('public'));

let players = [];
let turn = 0;

io.on('connection', (socket) => {
  socket.on('joinGame', (name) => {
    if (players.length >= 2) {
      socket.emit('roomFull');
      return;
    }

    players.push({ id: socket.id, name });
    socket.emit('playerNumber', players.length);

    if (players.length === 2) {
      io.emit('startGame', {
        currentTurnId: players[turn].id,
        players,
      });
    }
  });

  socket.on('markNumber', ({ number }) => {
    io.emit('updateGrid', { number });
    turn = (turn + 1) % 2;
    io.emit('switchTurn', players[turn].id);
  });

  socket.on('win', (winnerId) => {
    io.emit('gameWon', winnerId);
    players = [];
    turn = 0;
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit('playerLeft');
    turn = 0;
  });
});

http.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
