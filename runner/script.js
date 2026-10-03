const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const GAME_W = 900;
const GAME_H = 500;
const GROUND_Y = 400;

const PLAYER_X = 120;
const PLAYER_W = 30;
const PLAYER_H = 50;
const PLAYER_DUCK_H = 25;

const GRAVITY = 0.8;
const JUMP_FORCE = 15;

const BASE_SPEED = 6;
const SPEED_INCREASE = 0.002;
const MIN_SPEED = 5;
const MAX_SPEED = 16;

const OBSTACLE_MIN_INTERVAL = 35;
const OBSTACLE_START_INTERVAL = 90;

const SPIKE_W = 30;
const SPIKE_H = 50;
const BAR_W = 70;
const BAR_HEIGHT = 22;
const BAR_Y = GROUND_Y - 50;

canvas.width = GAME_W;
canvas.height = GAME_H;

let player, state, frameCount, obstacles, speed, obstacleTimer, score, groundMarkings;
let dustParticles;
const keys = { space: false, shift: false };

function init() {
  player = {
    x: PLAYER_X,
    y: GROUND_Y - PLAYER_H,
    vy: 0,
    onGround: true,
    ducking: false,
  };
  state = 'start';
  frameCount = 0;
  obstacles = [];
  speed = BASE_SPEED;
  obstacleTimer = 0;
  score = 0;
  groundMarkings = [];
  dustParticles = [];
  for (let i = 0; i < 20; i++) {
    groundMarkings.push(i * 90);
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
    });
  } else {
    obstacles.push({
      x: GAME_W + 50,
      type: 'bar',
      width: BAR_W,
    });
  }
}

function spawnDust(x, y) {
  if (frameCount % 8 !== 0) return;
  dustParticles.push({
    x: x,
    y: y,
    vx: -speed * 0.3 - Math.random() * 2,
    vy: -Math.random() * 2 - 0.5,
    life: 20 + Math.random() * 15,
    size: 2 + Math.random() * 3,
  });
}

function reset() {
  init();
  state = 'playing';
}

function getPlayerHitbox() {
  if (player.ducking) {
    return { x: player.x + 2, y: GROUND_Y - PLAYER_DUCK_H, w: PLAYER_W - 4, h: PLAYER_DUCK_H };
  }
  return { x: player.x + 2, y: player.y, w: PLAYER_W - 4, h: PLAYER_H };
}

function checkCollision(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
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

  player.ducking = keys.shift;

  if (keys.space && player.onGround) {
    player.vy = -JUMP_FORCE;
    player.onGround = false;
    spawnDust(player.x + PLAYER_W / 2, GROUND_Y);
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

  if (player.ducking) {
    player.y = GROUND_Y - PLAYER_DUCK_H;
  } else if (player.onGround) {
    player.y = GROUND_Y - PLAYER_H;
  }

  speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, BASE_SPEED + frameCount * SPEED_INCREASE));

  groundMarkings = groundMarkings.map(m => {
    m -= speed;
    if (m < -60) m += 20 * 90;
    return m;
  });

  obstacles.forEach(o => { o.x -= speed; });
  obstacles = obstacles.filter(o => o.x + o.width > -30);

  obstacleTimer++;
  const interval = Math.max(OBSTACLE_MIN_INTERVAL, OBSTACLE_START_INTERVAL - frameCount * 0.25);
  if (obstacleTimer >= interval) {
    obstacleTimer = 0;
    spawnObstacle();
  }

  dustParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  dustParticles = dustParticles.filter(p => p.life > 0);

  const hitbox = getPlayerHitbox();
  for (const o of obstacles) {
    let oBox;
    if (o.type === 'spike') {
      oBox = { x: o.x + 4, y: GROUND_Y - o.height, w: o.width - 8, h: o.height };
    } else {
      oBox = { x: o.x, y: o.y, w: o.width, h: BAR_HEIGHT };
    }
    if (checkCollision(hitbox, oBox)) {
      state = 'dead';
      return;
    }
  }

  score = Math.floor(frameCount * speed / 60);
}

function drawPlayer() {
  const py = player.y;
  const px = player.x;

  if (player.ducking) {
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(px, py, PLAYER_W, PLAYER_DUCK_H);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(px + 3, py + 3, PLAYER_W - 6, PLAYER_DUCK_H - 6);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(px + 8, py + 1, 4, 4);
    return;
  }

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(px + 5, py, 20, 32);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(px + 7, py + 2, 16, 26);

  const legOffset = player.onGround ? Math.sin(frameCount * 0.3) * 5 : 0;
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(px + 5, py + 32, 7, 18 + legOffset);
  ctx.fillRect(px + 18, py + 32, 7, 18 - legOffset);

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(px + 2, py - 4, 26, 8);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(px + 4, py - 2, 22, 4);

  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(px + 10, py - 8, 6, 6);
  ctx.fillStyle = '#fff';
  ctx.fillRect(px + 12, py - 6, 2, 2);
}

function draw() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, '#dbeafe');
  skyGrad.addColorStop(1, '#f0f4f8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GAME_W, GROUND_Y);

  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(0, GROUND_Y, GAME_W, GAME_H - GROUND_Y);

  ctx.fillStyle = '#93c5fd';
  for (const m of groundMarkings) {
    if (m > 0 && m < GAME_W) {
      ctx.fillRect(m, GROUND_Y, 4, 10);
    }
  }

  for (const p of dustParticles) {
    ctx.globalAlpha = p.life / 35;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 20, 25);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Courier New';
  ctx.fillText(Math.floor(speed) + ' px/f', 20, 42);

  if (state === 'start') {
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('RUNNER', GAME_W / 2, GAME_H * 0.3);
    ctx.fillStyle = '#1e293b';
    ctx.font = '20px Courier New';
    ctx.fillText('SPACE to jump  |  SHIFT to duck', GAME_W / 2, GAME_H * 0.4);
    ctx.font = '16px Courier New';
    ctx.fillText('SPACE to start', GAME_W / 2, GAME_H * 0.48);
    return;
  }

  for (const o of obstacles) {
    if (o.type === 'spike') {
      const spikeTop = GROUND_Y - o.height;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(o.x, GROUND_Y);
      ctx.lineTo(o.x + o.width / 2, spikeTop);
      ctx.lineTo(o.x + o.width, GROUND_Y);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(o.x + 6, GROUND_Y);
      ctx.lineTo(o.x + o.width / 2, spikeTop + 8);
      ctx.lineTo(o.x + o.width - 6, GROUND_Y);
      ctx.fill();
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(o.x, o.y, o.width, BAR_HEIGHT);
      ctx.fillStyle = '#334155';
      ctx.fillRect(o.x + 3, o.y + 4, o.width - 6, BAR_HEIGHT - 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(o.x, o.y, o.width, 4);
    }
  }

  drawPlayer();

  if (state === 'dead') {
    ctx.fillStyle = 'rgba(240,244,248,0.92)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_W / 2, GAME_H * 0.33);
    ctx.fillStyle = '#1e293b';
    ctx.font = '24px Courier New';
    ctx.fillText('Score: ' + score, GAME_W / 2, GAME_H * 0.43);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Courier New';
    ctx.fillText('SPACE to restart', GAME_W / 2, GAME_H * 0.52);
    return;
  }
}

init();

document.addEventListener('keydown', (e) => {
  e.preventDefault();
  if (e.code === 'Space') keys.space = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') keys.space = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
