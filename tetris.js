const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
context.scale(30, 30); // 1 block = 30px

const arena = createMatrix(10, 20);

const colors = [
  null,
  "#FF0D72",
  "#0DC2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF",
];

const blockImage = new Image();
blockImage.src = "block.png"; // ブロックに使う画像を配置してパスを調整
let blockReady = false;

// ゲームオーバーフラグ
let gameOver = false;
blockImage.onload = () => {
  blockReady = true;
};

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  switch (type) {
    case "T":
      return [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];
    case "O":
      return [
        [2, 2],
        [2, 2],
      ];
    case "L":
      return [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
      ];
    case "J":
      return [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
      ];
    case "I":
      return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    case "S":
      return [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
      ];
    case "Z":
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ];
  }
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach((row) => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  const pieces = "ILJOTSZ";
  player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  if (collide(arena, player)) {
    gameOver = true;
    return;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function arenaSweep() {
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += 10;
  }
}

function draw() {
  if (gameOver) {
    // スケールを一時解除してキャンバス全体を覆う
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    if (blockReady) {
      context.drawImage(blockImage, 0, 0, canvas.width, canvas.height);
    } else {
      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.restore();
    return;
  }
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        if (blockReady) {
        context.drawImage(blockImage, x + offset.x, y + offset.y, 1, 1);
      } else {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
      }
    });
  });
}

let dropCounter = 0;
let dropInterval = 500; // 2x 速さ
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (!gameOver && dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

function updateScore() {
  document.getElementById("score").innerText = "Score: " + player.score;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    playerMove(-1);
  } else if (event.key === "ArrowRight") {
    playerMove(1);
  } else if (event.key === "ArrowDown") {
    playerDrop();
  } else if (event.key === "q" || event.key === "Q") {
    playerRotate(-1);
  } else if (event.key === "w" || event.key === "W") {
    playerRotate(1);
  }
});

// モバイル／タッチコントロール
const bindBtn = (id, action) => {
  const el = document.getElementById(id);
  if (!el) return;
  const handler = (e) => {
    e.preventDefault();
    action();
  };
  ["click", "touchstart"].forEach((evt) => el.addEventListener(evt, handler));
};

bindBtn("btn-left", () => playerMove(-1));
bindBtn("btn-right", () => playerMove(1));
bindBtn("btn-down", playerDrop);
bindBtn("btn-rot-l", () => playerRotate(-1));
bindBtn("btn-rot-r", () => playerRotate(1));

// ---- スワイプ & タップジェスチャー ----
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
  touchStartTime = Date.now();
});

canvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const SWIPE_THRESHOLD = 40; // px

  if (absX > absY && absX > SWIPE_THRESHOLD) {
    // 横スワイプ
    if (dx < 0) playerMove(-1);
    else playerMove(1);
    return;
  }
  if (absY > absX && dy > SWIPE_THRESHOLD) {
    // 下スワイプで即落下
    playerDrop();
    return;
  }
  // タップ(短時間&小移動)で回転
  if (dt < 250 && absX < 15 && absY < 15) {
    playerRotate(1);
  }
});

playerReset();
updateScore();
update();
