const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const GAME_W = 900;
const GAME_H = 500;
const GROUND_Y = 400;

const PLAYER_X = 100;
const PLAYER_W = 30;
const PLAYER_H = 50;
const PLAYER_DUCK_H = 25;

const GRAVITY = 0.8;
const JUMP_FORCE = 14;

const BASE_SPEED = 4;
const SPEED_INCREASE = 0.001;
const MIN_SPEED = 3;
const MAX_SPEED = 14;

const OBSTACLE_MIN_INTERVAL = 40;
const OBSTACLE_START_INTERVAL = 100;

const SPIKE_W = 30;
const SPIKE_H = 50;
const BAR_W = 60;
const BAR_TOP_OFFSET = 50;
const BAR_BOTTOM_OFFSET = 15;

canvas.width = GAME_W;
canvas.height = GAME_H;

let player, state, frameCount, obstacles, speed, obstacleTimer, score, groundMarkings;
const keys = { left: false, right: false, up: false, down: false, space: false };

function init() {
  player = {
    x: PLAYER_X,
    y: GROUND_Y - PLAYER_H,
    vy: 0,
    onGround: true,
    ducking: false,
    width: PLAYER_W,
    height: PLAYER_H,
  };
  state = 'start';
  frameCount = 0;
  obstacles = [];
  speed = BASE_SPEED;
  obstacleTimer = 0;
  score = 0;
  groundMarkings = [];
  for (let i = 0; i < 20; i++) {
    groundMarkings.push(i * 80);
  }
}

function spawnObstacle() {
  const type = Math.random() < 0.5 ? 'spike' : 'bar';
  if (type === 'spike') {
    obstacles.push({
      x: GAME_W + 50,
      type: 'spike',
      width: SPIKE_W,
      height: SPIKE_H,
      y: GROUND_Y - SPIKE_H,
    });
  } else {
    const barTop = GROUND_Y - BAR_TOP_OFFSET - 10;
    obstacles.push({
      x: GAME_W + 50,
      type: 'bar',
      width: BAR_W,
      topY: barTop,
      bottomY: barTop + BAR_TOP_OFFSET - BAR_BOTTOM_OFFSET - 10,
    });
  }
}

function reset() {
  init();
  state = 'playing';
}

function getPlayerHitbox() {
  if (player.ducking) {
    return { x: player.x, y: GROUND_Y - PLAYER_DUCK_H, w: PLAYER_W, h: PLAYER_DUCK_H };
  }
  return { x: player.x, y: player.y, w: PLAYER_W, h: PLAYER_H };
}

function checkCollision(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + (b.h || b.bottomY - b.topY) && a.y + a.h > b.y;
}

function update() {
  frameCount++;

  if (state === 'start') {
    if (keys.space) {
      state = 'playing';
      keys.space = false;
    }
    return;
  }

  if (state === 'dead') {
    if (keys.space) {
      reset();
      keys.space = false;
    }
    return;
  }

  if (keys.left) player.x = Math.max(20, player.x - 3);
  if (keys.right) player.x = Math.min(GAME_W - PLAYER_W - 20, player.x + 3);

  player.ducking = keys.down;
  player.height = player.ducking ? PLAYER_DUCK_H : PLAYER_H;
  player.y = player.ducking ? GROUND_Y - PLAYER_DUCK_H : (player.onGround ? GROUND_Y - PLAYER_H : player.y);

  if ((keys.space || keys.up) && player.onGround) {
    player.vy = -JUMP_FORCE;
    player.onGround = false;
  }

  if (!player.onGround) {
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= GROUND_Y - PLAYER_H) {
      player.y = GROUND_Y - PLAYER_H;
      player.vy = 0;
      player.onGround = true;
    }
  }

  speed = Math.min(MAX_SPEED, BASE_SPEED + frameCount * SPEED_INCREASE);

  groundMarkings = groundMarkings.map(m => {
    m -= speed;
    if (m < -40) m += 20 * 80;
    return m;
  });

  obstacles.forEach(o => {
    o.x -= speed;
  });
  obstacles = obstacles.filter(o => o.x + (o.width || o.w) > -20);

  obstacleTimer++;
  const interval = Math.max(OBSTACLE_MIN_INTERVAL, OBSTACLE_START_INTERVAL - frameCount * 0.2);
  if (obstacleTimer >= interval) {
    obstacleTimer = 0;
    spawnObstacle();
  }

  const hitbox = getPlayerHitbox();
  for (const o of obstacles) {
    let oBox;
    if (o.type === 'spike') {
      oBox = { x: o.x, y: o.y, w: o.width, h: o.height };
    } else {
      oBox = { x: o.x, y: o.topY, w: o.width, h: o.bottomY - o.topY };
    }
    if (checkCollision(hitbox, oBox)) {
      state = 'dead';
      return;
    }
  }

  score = Math.floor(frameCount * speed / 60);
}

function draw() {
  ctx.fillStyle = '#f0f4f8';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(0, GROUND_Y, GAME_W, GAME_H - GROUND_Y);

  ctx.fillStyle = '#60a5fa';
  for (const m of groundMarkings) {
    if (m > 0 && m < GAME_W) {
      ctx.fillRect(m, GROUND_Y, 4, 12);
    }
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 20, 30);
  ctx.fillText('Speed: ' + speed.toFixed(1), 20, 50);

  if (state === 'start') {
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('RUNNER', GAME_W / 2, GAME_H * 0.32);
    ctx.fillStyle = '#1e293b';
    ctx.font = '18px Courier New';
    ctx.fillText('SPACE to start', GAME_W / 2, GAME_H * 0.42);
    ctx.font = '14px Courier New';
    ctx.fillText('SPACE / W = jump  |  DOWN = duck', GAME_W / 2, GAME_H * 0.48);
    return;
  }

  const pY = player.ducking ? GROUND_Y - PLAYER_DUCK_H : player.y;
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(player.x, pY, PLAYER_W, player.height);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(player.x + 3, pY + 3, PLAYER_W - 6, player.height - 6);

  for (const o of obstacles) {
    if (o.type === 'spike') {
      ctx.fillStyle = '#e23b3b';
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(o.x + 4, o.y + 6, o.width - 8, o.height - 6);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(o.x, o.topY, o.width, o.bottomY - o.topY);
      ctx.fillStyle = '#334155';
      ctx.fillRect(o.x + 3, o.topY + 3, o.width - 6, (o.bottomY - o.topY) - 6);
    }
  }

  if (state === 'dead') {
    ctx.fillStyle = 'rgba(240,244,248,0.9)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.fillStyle = '#e23b3b';
    ctx.font = 'bold 42px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_W / 2, GAME_H * 0.35);
    ctx.fillStyle = '#2563eb';
    ctx.font = '24px Courier New';
    ctx.fillText('Score: ' + score, GAME_W / 2, GAME_H * 0.45);
    ctx.fillStyle = '#1e293b';
    ctx.font = '18px Courier New';
    ctx.fillText('SPACE to restart', GAME_W / 2, GAME_H * 0.55);
    return;
  }
}

init();

document.addEventListener('keydown', (e) => {
  e.preventDefault();
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.space = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.space = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
