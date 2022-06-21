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

let mousePos = {
  x: 0,
  y: 0,
};

const map = (value, minA, maxA, minB, maxB) => {
  return (
    (1 - (value - minA) / (maxA - minA)) * minB +
    ((value - minA) / (maxA - minA)) * maxB
  );
};

class Segment {
  constructor(x, y, length, angle, alpha, radius) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.angle = angle;
    this.parent = null;
    this.alpha = alpha;
    this.radius = radius;
    this.spaceBetweenSegments = 5;
  }

  getEndX() {
    return this.x + Math.cos(this.angle) * this.length;
  }

  getEndY() {
    return this.y + Math.sin(this.angle) * this.length;
  }

  display() {
    ctx.strokeStyle = `rgba(255,255,255, ${this.alpha})`;
    ctx.lineWidth = this.radius;
    ctx.beginPath();
    ctx.arc(this.getEndX(), this.getEndY(), this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  setAlpha(a) {
    this.alpha = a;
  }

  setRadius(r) {
    this.radius = r;
  }

  heading(x, y) {
    let dx = x - this.x,
      dy = y - this.y;
    this.angle = Math.atan2(dy, dx);
  }

  drag(x, y) {
    this.heading(x, y);
    this.x =
      x - Math.cos(this.angle) * (this.length + this.spaceBetweenSegments);
    this.y =
      y - Math.sin(this.angle) * (this.length + this.spaceBetweenSegments);
    if (this.parent) {
      this.parent.drag(this.x, this.y);
    }
  }
}

class SegmentSystem {
  constructor(x, y, apple) {
    this.x = x;
    this.y = y;
    this.segments = [];
    this.lastSegment = null;
    this.eventClick();
    this.applePos = {
      x: apple.x,
      y: apple.y,
    };
    this.mousePos = {
      x: 0,
      y: 0,
    };
  }

  addSegment(length, alpha, radius) {
    let segment = new Segment(0, 0, length, 0, alpha, radius);
    if (this.lastSegment) {
      segment.x = this.lastSegment.getEndX();
      segment.y = this.lastSegment.getEndY();
      segment.parent = this.lastSegment;
    } else {
      segment.x = this.x;
      segment.y = this.y;
    }
    this.segments.push(segment);
    this.lastSegment = segment;
  }

  removeSegment() {
    this.segments.length > 1 ? this.segments.splice(0, 1) : null;
    this.adjustSegments();
  }

  relocateApple(apple) {
    this.applePos = {
      x: apple.x,
      y: apple.y,
    };
  }

  display() {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.applePos.x, this.applePos.y, 20, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].display();
    }
  }

  drag(x, y) {
    this.lastSegment.drag(x, y);
  }

  listener(x, y) {
    this.mousePos = {
      x,
      y,
    };
    this.drag(this.mousePos.x, this.mousePos.y);
  }

  adjustSegments() {
    let mappedAlpha, mappedWidth;
    for (let i = 0; i < this.segments.length; i++) {
      mappedAlpha = map(i, 0, this.segments.length, 0.1, 1);
      mappedWidth = map(i, 0, this.segments.length, 10, 20);
      this.segments[i].setAlpha(mappedAlpha);
      this.segments[i].setRadius(mappedWidth);
    }
  }

  eventClick() {
    window.addEventListener('click', (e) => {
      if (e.altKey === true) {
        this.removeSegment();
      } else {
        this.addSegment(segmentLength, 0.9, this.lastSegment.lineWidth);
        this.drag(e.clientX, e.clientY);
        this.adjustSegments();
      }
    });
  }
}

class SnakeGame {
  constructor(noOfPlayers) {
    this.noOfPlayers = noOfPlayers;
    this.snakes = [];
    this.segmentsNo = 15;
    this.segmentLength = 20;
    this.applePos = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    };
    this.appleEaten = false;
    this.init();
  }

  addSegments() {
    this.snakes.forEach((snake) => {
      let mappedAlpha, mappedWidth;
      for (let i = 0; i < this.segmentsNo; i++) {
        mappedAlpha = map(i, 0, this.segmentsNo, 0.1, 1);
        mappedWidth = map(i, 0, this.segmentsNo, 10, 20);
        snake.addSegment(this.segmentLength, mappedAlpha, mappedWidth);
      }
    });
  }

  removeSegments() {
    this.snakes.forEach((snake) => {
      snake.removeSegment();
    });
  }

  listeners(positions) {
    this.snakes.forEach((snake, key) => {
      if (positions[key]) {
        snake.listener(positions[key].x, positions[key].y);
      }
    });
  }

  relocateApple() {
    this.applePos = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    };
  }

  checkCollision(snake, apple) {
    if (
      snake.mousePos.x >= apple.x - 20 &&
      snake.mousePos.x <= apple.x + 20 &&
      snake.mousePos.y >= apple.y - 20 &&
      snake.mousePos.y <= apple.y + 20
    ) {
      return true;
    }
    return false;
  }

  display() {
    this.snakes.forEach((snake) => {
      snake.display();
      if (this.checkCollision(snake, this.applePos)) {
        this.appleEaten = true;
        snake.addSegment(this.segmentLength, 0.9, snake.lastSegment.lineWidth);
        snake.adjustSegments();
      }
    });
    if (this.appleEaten) {
      this.appleEaten = false;
      this.relocateApple();
      this.snakes.forEach((snake) => {
        snake.relocateApple(this.applePos);
      });
    }
  }

  init() {
    for (let i = 0; i < this.noOfPlayers; i++) {
      const segSystem = new SegmentSystem(
        canvas.width / 2,
        -100,
        this.applePos
      );
      this.snakes.push(segSystem);
    }
    this.addSegments();
  }
}

const socket = io();

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 800;
canvas.style.boxShadow = 'inset 0 0 10px #000';
canvas.style.marginTop = '24px';
divBoard.appendChild(canvas);

window.addEventListener('resize', () => {
  socket.emit('screenSize', {
    width: window.innerWidth,
    height: window.innerHeight,
  });
});

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

  socket.emit('screenSize', {
    width: window.innerWidth,
    height: window.innerHeight,
  });
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
  const numberOfPlayers = 2;
  const snakeGame = new SnakeGame(numberOfPlayers);

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
    mousePos.y = e.clientY - canvas.offsetTop;
    const payload = {
      gameId: gameId,
      player: player,
      x: mousePos.x,
      y: mousePos.y,
    };
    socket.emit('play', payload);
  });

  let fpsInterval, startTime, now, then, elapsed;

  const startAnimating = (fps) => {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
  };

  let shrinkTimer = 0;

  const animate = (a) => {
    requestAnimationFrame(animate);
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snakeGame.display();
      snakeGame.listeners(playersData);

      if (shrinkTimer % 100 === 0) {
        snakeGame.removeSegments();
      }
      shrinkTimer += 0.5;
    }
  };

  startAnimating(60);
});

socket.on('update', (payload) => {
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

socket.on('screenSize', (payload) => {
  console.log('screenSize', payload);
  // const game = payload.game;
});
