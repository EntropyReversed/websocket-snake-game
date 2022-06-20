const http = require('http');
const app = require('express')();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(9091, () => {
  console.log('Server started at port 9091');
});

const webSocketServer = require('websocket').server;

const httpServer = http.createServer();
const port = 9090;
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

//hashmap of all connected clients
const clients = {};
const games = {};
const maxPlayers = 2;
const playersColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple'];
const dataTickRate = 60;

const wsServer = new webSocketServer({
  httpServer: httpServer,
});

wsServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);

  connection.on('open', () => {
    console.log('Connection opened');
  });
  connection.on('close', () => {
    console.log('Connection closed');
  });

  connection.on('message', (message) => {
    const result = JSON.parse(message.utf8Data);

    if (result.method === 'create') {
      const clientId = result.clientId;
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
        method: 'create',
        game: games[gameId],
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payload));
    }

    if (result.method === 'join' || result.payload?.method === 'join') {
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
        method: 'join',
        game: game,
      };
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(
          JSON.stringify({
            payload,
          })
        );
      });
    }

    if (result.method === 'play') {
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
    }
  });

  //generate new client id
  const clientId = guid();
  console.log(`Client ${clientId} connected`);
  clients[clientId] = {
    connection: connection,
  };

  const payload = {
    method: 'connect',
    clientId: clientId,
    message: 'Welcome to the game',
  };

  connection.send(JSON.stringify(payload));
});

const updateGameState = () => {
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payload = {
      method: 'update',
      game: game,
    };
    game.clients.forEach((c) => {
      clients[c.clientId].connection.send(JSON.stringify(payload));
    });
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
