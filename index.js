const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const port = 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//hashmap of all connected clients
const clients = {};
const games = {};
const maxPlayers = 2;
const playersColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple'];
const dataTickRate = 60;

io.on('connect', (socket) => {
  const clientId = guid();
  console.log(`Client ${clientId} connected`);

  const payload = {
    clientId: clientId,
    message: 'Welcome to the game',
  };

  socket.emit('init', payload);

  socket.on('create', (result) => {
    console.log('create: ', result);
    const gameId = guid();
    games[gameId] = {
      id: gameId,
      positions: {},
      clients: [],
      winner: null,
      finished: false,
      started: false,
      startedAt: null,
      finishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const payload = {
      game: games[gameId],
    };

    socket.emit('create', payload);
  });

  socket.on('join', (result) => {
    console.log('join: ', result);
    const gameId = result.gameId;
    const game = games[gameId];
    const clientId = result.clientId;

    if (game.clients.length >= maxPlayers) {
      return;
    }
    const color = playersColors[game.clients.length];
    game.clients.push({
      clientId: clientId,
      color: color,
      player: game.clients.length,
    });

    // if (game.clients.length === maxPlayers || game.payload?.clients.length === maxPlayers) {
    //   updateGameState();
    // }
    updateGameState();

    const payload = {
      game: game,
    };

    socket.emit('join', payload);
  });

  socket.on('play', (result) => {
    const gameId = result.gameId;
    const x = result.x;
    const y = result.y;

    let state = games[gameId].state;
    if (!state) {
      state = {};
      for (let i = 0; i < maxPlayers; i++) {
        state[i] = {
          x: 0,
          y: 0,
        };
      }
    }

    state[result.player].x = x;
    state[result.player].y = y;
    games[gameId].state = state;
    console.log('play: ', result);
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    console.log('disconnected');
  });
});

const updateGameState = () => {
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payload = {
      game: game,
    };

    io.emit('update', payload);
  }

  setTimeout(updateGameState, 1000 / dataTickRate);
};

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

const guid = () => {
  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  );
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
