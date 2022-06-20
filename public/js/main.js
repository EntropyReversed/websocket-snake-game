let clientId = null;
let gameId = null;
let playerColor = null;
let player = null;
const btnCreate = document.getElementById('btnCreate');
const btnJoin = document.getElementById('btnJoin');
const textGameId = document.getElementById('txtGameId');
const divPlayers = document.getElementById('divPlayers');
const divBoard = document.getElementById('divBoard');
let playersData = [];
let playersDataObj = {};

let mousePos = {
  x: 0,
  y: 0,
};

const socket = io();

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.7;
canvas.height = window.innerHeight * 0.7;
canvas.style.boxShadow = 'inset 0 0 10px #000';
canvas.style.marginTop = '24px';
divBoard.appendChild(canvas);

btnCreate.addEventListener('click', () => {
  const payload = {
    clientId: clientId,
  };

  // Emit create to server
  socket.emit('create', payload);
});

btnJoin.addEventListener('click', () => {
  if (gameId === null) {
    gameId = textGameId.value;
  }

  const payload = {
    clientId: clientId,
    gameId: gameId,
  };

  // Emit join to server
  socket.emit('join', payload);
});

socket.on('init', (payload) => {
  clientId = payload.clientId;
  console.log('init', payload);
  console.log('client id is set successfully ' + clientId);
});

socket.on('create', (payload) => {
  console.log('create', payload);
  gameId = payload.game.id;
  console.log('game successfully created with id ' + gameId);
  navigator.clipboard.writeText(gameId).then(
    function () {
      console.log('game id is copied to clipboard');
    },
    function () {
      console.log('clipboard write failed');
    }
  );
});

socket.on('join', (payload) => {
  console.log('join', payload);
  const game = payload.game;
  while (divPlayers.firstChild) {
    divPlayers.removeChild(divPlayers.firstChild);
  }

  game.clients.forEach((c) => {
    const divPlayer = document.createElement('div');
    divPlayer.style.width = '200px';
    divPlayer.style.background = c.color;
    divPlayer.textContent = `Player ${c.player + 1}`;
    divPlayers.appendChild(divPlayer);
    if (c.clientId === clientId) {
      playerColor = c.color;
      player = c.player;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    const payload = {
      gameId: gameId,
      player: player,
      x: mousePos.x,
      y: mousePos.y,
    };
    socket.emit('play', payload);
  });

  let stop = false;
  let frameCount = 0;
  let fps, fpsInterval, startTime, now, then, elapsed;

  const startAnimating = (fps) => {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
  };

  // let shrinkTimer = 0

  const animate = (a) => {
    requestAnimationFrame(animate);
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      playersData.forEach((p, pKey) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (pKey === player) {
          ctx.arc(
            mousePos.x - canvas.offsetLeft,
            mousePos.y - canvas.offsetTop,
            10,
            0,
            Math.PI * 2
          );
        } else {
          ctx.arc(
            p.x - canvas.offsetLeft,
            p.y - canvas.offsetTop,
            10,
            0,
            Math.PI * 2
          );
        }
        ctx.fill();
      });
      // segSystem.display()

      // if (shrinkTimer % 100 === 0) {
      //   segSystem.removeSegment()
      // }
      // shrinkTimer += 2;
    }
  };

  startAnimating(60);
});

socket.on('update', (payload) => {
  console.log('update', payload);
  const game = payload.game;
  playersData = [];
  game.clients.forEach((client) => {
    playersData.push({
      color: client.color,
      x: game.state[client.player].x,
      y: game.state[client.player].y,
    });
  });
});
