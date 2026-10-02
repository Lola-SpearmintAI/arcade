const games = [
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    description: 'Fly through the pipes. Fast. Deadly. One spacebar. Don\'t die.',
    controls: 'SPACE to jump',
    url: 'flappy-bird/index.html'
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Classic snake. Eat the food. Don\'t hit a wall or yourself. Arrow keys.',
    controls: 'ARROWS to move',
    url: 'snake/index.html'
  },
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'Smash blue bricks with a bouncing ball. Paddle at the bottom. Mouse or arrows.',
    controls: 'MOUSE/ARROWS + SPACE',
    url: 'breakout/index.html'
  },
  {
    id: 'asteroids',
    name: 'Asteroid Dodge',
    description: 'Dodge asteroids in space. ← → rotate, ↑ thrust, SPACE shoot. Survive.',
    controls: '← → ↑ SPACE',
    url: 'asteroids/index.html'
  },
];

function renderGames() {
  const grid = document.getElementById('game-grid');
  const count = document.getElementById('game-count');

  games.forEach(game => {
    const card = document.createElement('a');
    card.href = game.url;
    card.className = 'game-card';
    card.innerHTML = `
      <span class="play-badge">play ▶</span>
      <h2>${game.name}</h2>
      <p class="description">${game.description}</p>
      <span class="controls">${game.controls}</span>
    `;
    grid.appendChild(card);
  });

  if (count) {
    count.textContent = games.length;
  }
}

document.addEventListener('DOMContentLoaded', renderGames);