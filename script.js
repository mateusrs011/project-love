const canvas = document.getElementById("sceneCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const music = document.getElementById("bgMusic");
const typedTextEl = document.getElementById("typedText");
const timerEl = document.getElementById("loveTimer");
const messageBox = document.getElementById("messageBox");
const timerBox = document.getElementById("timerBox");
const dogImg = document.getElementById("dogImg");

let width = 0;
let height = 0;
let animationId = null;
let started = false;
let typingStarted = false;
let uiShown = false;

const loveStartDate = new Date("2026-04-15T00:00:00");

const message = `Para o amor da minha vida:

Desde o momento em que te conheci,
eu me encantei.
Foi só olhar nos seus lindos olhinhos
que me apaixonei.

O seu jeito alegre de ser
me enche de felicidade,
e a cada conversa com você,
eu tenho mais certeza
de que esse sentimento é de verdade.

— Te adoro, meu amor 💛`;

const palette = [
  "#ff2f7d",
  "#ff4f90",
  "#ff6ea4",
  "#ff8eb8",
  "#ffb0cc",
  "#ffd84d",
  "#ffb347",
  "#ff8d63",
  "#fff5ef"
];

const state = {
  groundY: 0,
  progress: 0,
  phase: "idle",
  treeShiftX: 0
};

const seed = {
  x: 0,
  y: -20,
  r: 6,
  vy: 0,
  gravity: 0.22,
  active: false,
  landed: false
};

const tree = {
  trunkX: 0,
  trunkBaseY: 0,
  trunkMaxHeight: 0,
  trunkBottomWidth: 0,
  trunkTopWidth: 0,
  topY: 0
};

let branches = [];
let canopyHearts = [];
let fallingHearts = [];

// HELPERS
function random(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function quadraticPoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
  };
}

// TIMER
function updateTimer() {
  const now = new Date();
  let diff = now - loveStartDate;
  if (diff < 0) diff = 0;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  timerEl.innerHTML = `
    <span class="timer-number">${days}</span> <span class="timer-unit">Dias</span>
    <span class="timer-number">${hours}</span> <span class="timer-unit">Horas</span>
    <span class="timer-number">${minutes}</span> <span class="timer-unit">Minutos</span>
    <span class="timer-number">${seconds}</span> <span class="timer-unit">Segundos</span>
  `;
}

setInterval(updateTimer, 1000);
updateTimer();

// TEXTO
function typeText(text, speed = 30) {
  let i = 0;
  typedTextEl.textContent = "";

  function typing() {
    if (i < text.length) {
      typedTextEl.textContent += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}

// RESIZE / SETUP
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  setupScene();
  drawScene();
}

window.addEventListener("resize", resizeCanvas);

function setupScene() {
  state.groundY = height * 0.86;
  state.progress = 0;
  state.phase = "idle";
  state.treeShiftX = 0;

  seed.x = width * 0.5;
  seed.y = -20;
  seed.r = Math.max(5, Math.min(7, width * 0.01));
  seed.vy = 0;
  seed.active = false;
  seed.landed = false;

  tree.trunkX = width * 0.5;
  tree.trunkBaseY = state.groundY;
  tree.trunkMaxHeight = Math.min(height * 0.48, 420);
  tree.trunkBottomWidth = Math.max(46, width * 0.034);
  tree.trunkTopWidth = tree.trunkBottomWidth * 0.20;
  tree.topY = tree.trunkBaseY - tree.trunkMaxHeight;

  branches = createCurvedBranches();
  canopyHearts = createHeartCanopy();
  fallingHearts = [];

  typedTextEl.textContent = "";
  messageBox.classList.remove("show");
  timerBox.classList.remove("show");
  dogImg.classList.remove("show");

  typingStarted = false;
  uiShown = false;
}

function createCurvedBranches() {
  const x = tree.trunkX;
  const topY = tree.topY;

  return [
    {
      p0: { x: x - 4, y: topY + 120 },
      cp: { x: x - 18, y: topY + 80 },
      p1: { x: x - 70, y: topY + 44 },
      p2: { x: x - 128, y: topY + 30 },
      w: 12,
      start: 0.12,
      end: 0.28
    },
    {
      p0: { x: x + 4, y: topY + 120 },
      cp: { x: x + 18, y: topY + 80 },
      p1: { x: x + 72, y: topY + 44 },
      p2: { x: x + 132, y: topY + 28 },
      w: 12,
      start: 0.14,
      end: 0.30
    },
    {
      p0: { x: x - 6, y: topY + 82 },
      cp: { x: x - 44, y: topY + 34 },
      p1: { x: x - 110, y: topY - 10 },
      p2: { x: x - 182, y: topY - 36 },
      w: 7.5,
      start: 0.24,
      end: 0.42
    },
    {
      p0: { x: x + 6, y: topY + 80 },
      cp: { x: x + 44, y: topY + 32 },
      p1: { x: x + 112, y: topY - 12 },
      p2: { x: x + 186, y: topY - 38 },
      w: 7.5,
      start: 0.26,
      end: 0.44
    },
    {
      p0: { x: x, y: topY + 48 },
      cp: { x: x - 8, y: topY - 18 },
      p1: { x: x - 10, y: topY - 90 },
      p2: { x: x - 18, y: topY - 176 },
      w: 5.2,
      start: 0.34,
      end: 0.54
    },
    {
      p0: { x: x, y: topY + 46 },
      cp: { x: x + 8, y: topY - 16 },
      p1: { x: x + 10, y: topY - 92 },
      p2: { x: x + 20, y: topY - 182 },
      w: 5.2,
      start: 0.36,
      end: 0.56
    },
    {
      p0: { x: x - 96, y: topY + 4 },
      cp: { x: x - 128, y: topY - 8 },
      p1: { x: x - 176, y: topY - 44 },
      p2: { x: x - 228, y: topY - 94 },
      w: 3.6,
      start: 0.50,
      end: 0.68
    },
    {
      p0: { x: x + 100, y: topY + 2 },
      cp: { x: x + 132, y: topY - 10 },
      p1: { x: x + 180, y: topY - 46 },
      p2: { x: x + 232, y: topY - 98 },
      w: 3.6,
      start: 0.52,
      end: 0.70
    },
    {
      p0: { x: x - 34, y: topY - 58 },
      cp: { x: x - 44, y: topY - 108 },
      p1: { x: x - 62, y: topY - 172 },
      p2: { x: x - 90, y: topY - 242 },
      w: 2.6,
      start: 0.60,
      end: 0.80
    },
    {
      p0: { x: x + 36, y: topY - 60 },
      cp: { x: x + 46, y: topY - 110 },
      p1: { x: x + 64, y: topY - 176 },
      p2: { x: x + 94, y: topY - 248 },
      w: 2.6,
      start: 0.62,
      end: 0.82
    },
    {
      p0: { x: x - 154, y: topY - 28 },
      cp: { x: x - 188, y: topY - 42 },
      p1: { x: x - 228, y: topY - 64 },
      p2: { x: x - 260, y: topY - 82 },
      w: 1.8,
      start: 0.72,
      end: 0.90
    },
    {
      p0: { x: x + 158, y: topY - 30 },
      cp: { x: x + 192, y: topY - 44 },
      p1: { x: x + 232, y: topY - 66 },
      p2: { x: x + 264, y: topY - 84 },
      w: 1.8,
      start: 0.74,
      end: 0.92
    },
    {
      p0: { x: x - 66, y: topY - 164 },
      cp: { x: x - 72, y: topY - 198 },
      p1: { x: x - 82, y: topY - 232 },
      p2: { x: x - 92, y: topY - 268 },
      w: 1.6,
      start: 0.80,
      end: 0.96
    },
    {
      p0: { x: x + 70, y: topY - 168 },
      cp: { x: x + 76, y: topY - 202 },
      p1: { x: x + 86, y: topY - 236 },
      p2: { x: x + 98, y: topY - 272 },
      w: 1.6,
      start: 0.82,
      end: 0.98
    }
  ];
}

function isInsideHeart(nx, ny) {
  return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny <= 0;
}

function createHeartCanopy() {
  const list = [];
  const centerX = tree.trunkX;
  const centerY = tree.topY + 10;
  const maxHearts = 4200;

  while (list.length < maxHearts) {
    const rx = random(-440, 440);
    const ry = random(-400, 360);

    const nx = rx / 260;
    const ny = -ry / 235;

    if (isInsideHeart(nx, ny)) {
      list.push({
        x: centerX + rx,
        y: centerY + ry,
        size: random(9, 16),
        color: palette[Math.floor(random(0, palette.length))],
        appearAt: random(0.58, 1.52),
        driftX: random(-0.04, 0.04),
        driftY: random(-0.03, 0.03)
      });
    }
  }

  list.sort((a, b) => a.y - b.y);
  return list;
}

// DESENHO
function drawGround() {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, state.groundY);
  ctx.lineTo(width, state.groundY);
  ctx.strokeStyle = "#40342f";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawSeed() {
  if (!seed.active && !seed.landed) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, seed.r, 0, Math.PI * 2);
  ctx.fillStyle = "#43a047";
  ctx.fill();
  ctx.restore();
}

function drawTrunk(progress) {
  const p = clamp(progress / 0.40, 0, 1);
  if (p <= 0) return;

  const h = tree.trunkMaxHeight * easeOutCubic(p);
  const topY = tree.trunkBaseY - h;
  const sway = Math.sin(p * Math.PI * 0.9) * 10;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tree.trunkX - tree.trunkBottomWidth / 2, tree.trunkBaseY);

  ctx.quadraticCurveTo(
    tree.trunkX - tree.trunkBottomWidth * 0.24 + sway * 0.16,
    lerp(tree.trunkBaseY, topY, 0.56),
    tree.trunkX - tree.trunkTopWidth / 2 + sway,
    topY
  );

  ctx.lineTo(tree.trunkX + tree.trunkTopWidth / 2 + sway, topY);

  ctx.quadraticCurveTo(
    tree.trunkX + tree.trunkBottomWidth * 0.24 + sway * 0.16,
    lerp(tree.trunkBaseY, topY, 0.56),
    tree.trunkX + tree.trunkBottomWidth / 2,
    tree.trunkBaseY
  );

  ctx.closePath();
  ctx.fillStyle = "#12a28d";
  ctx.fill();
  ctx.restore();
}

function drawCurvedBranch(branch, progress) {
  const local = clamp((progress - branch.start) / (branch.end - branch.start), 0, 1);
  if (local <= 0) return;

  const eased = easeOutCubic(local);

  const q1 = quadraticPoint(branch.p0, branch.cp, branch.p1, eased);
  const q2 = quadraticPoint(branch.cp, branch.p1, branch.p2, eased);
  const end = {
    x: lerp(q1.x, q2.x, eased),
    y: lerp(q1.y, q2.y, eased)
  };

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(branch.p0.x, branch.p0.y);
  ctx.bezierCurveTo(
    branch.cp.x,
    branch.cp.y,
    branch.p1.x,
    branch.p1.y,
    end.x,
    end.y
  );
  ctx.strokeStyle = "#12a28d";
  ctx.lineWidth = branch.w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function drawMiniHeart(x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(size / 10, size / 10);

  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.bezierCurveTo(0, -1.5, -6, -1.5, -6, 3);
  ctx.bezierCurveTo(-6, 6.5, -2.5, 8.5, 0, 11);
  ctx.bezierCurveTo(2.5, 8.5, 6, 6.5, 6, 3);
  ctx.bezierCurveTo(6, -1.5, 0, -1.5, 0, 3);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

function drawCanopy(progress) {
  canopyHearts.forEach((heart) => {
    const local = clamp((progress - heart.appearAt) / 0.20, 0, 1);
    if (local <= 0) return;

    const alpha = easeInOutQuad(local);

    drawMiniHeart(
      heart.x + heart.driftX * local * 4,
      heart.y + heart.driftY * local * 4,
      heart.size,
      heart.color,
      alpha
    );
  });
}

function drawFallingHearts() {
  fallingHearts.forEach((heart) => {
    drawMiniHeart(heart.x, heart.y, heart.size, heart.color, heart.alpha);
  });
}

// UPDATE
function updateSeed() {
  if (!seed.active || seed.landed) return;

  seed.vy += seed.gravity;
  seed.y += seed.vy;

  if (seed.y + seed.r >= state.groundY) {
    seed.y = state.groundY - seed.r;
    seed.landed = true;
    seed.active = false;
    state.phase = "growing";
  }
}

function updateMainProgress() {
  if (state.phase !== "growing" && state.phase !== "finished") return;

  if (state.progress < 1.7) {
    state.progress += 0.0032;
  } else {
    state.progress = 1.7;
    state.phase = "finished";
  }

  if (state.progress > 1.46) {
    const move = clamp((state.progress - 1.46) / 0.18, 0, 1);
    state.treeShiftX = easeOutCubic(move) * (width * 0.22);
  }

  if (state.progress > 1.60 && !uiShown) {
    uiShown = true;
    messageBox.classList.add("show");
    timerBox.classList.add("show");
    dogImg.classList.add("show");

    if (!typingStarted) {
      typingStarted = true;
      typeText(message, 30);
    }
  }

  if (state.progress > 1.18 && Math.random() < 0.35) {
    const treeCenterX = tree.trunkX + state.treeShiftX;

    const leftColumnMinX = treeCenterX - 560;
    const leftColumnMaxX = treeCenterX - 260;

    const rightColumnMinX = treeCenterX + 260;
    const rightColumnMaxX = treeCenterX + 560;

    const topY = state.groundY - 640;
    const bottomY = state.groundY - 120;

    fallingHearts.push({
      x: random(leftColumnMinX, leftColumnMaxX),
      y: random(topY, bottomY),
      vx: random(-0.03, 0.03),
      vy: random(0.28, 0.55),
      alpha: 0.82,
      size: random(4.5, 6.5),
      color: palette[Math.floor(Math.random() * palette.length)]
    });

    fallingHearts.push({
      x: random(rightColumnMinX, rightColumnMaxX),
      y: random(topY, bottomY),
      vx: random(-0.03, 0.03),
      vy: random(0.28, 0.55),
      alpha: 0.82,
      size: random(4.5, 6.5),
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }
}

function updateFallingHearts() {
  fallingHearts.forEach((heart) => {
    heart.x += heart.vx;
    heart.y += heart.vy;
    heart.alpha -= 0.0042;
  });

  fallingHearts = fallingHearts.filter((heart) => heart.alpha > 0);
}

// CENA
function drawScene() {
  ctx.clearRect(0, 0, width, height);

  drawGround();

  ctx.save();
  ctx.translate(state.treeShiftX, 0);

  if (!seed.landed) {
    drawSeed();
  }

  drawTrunk(state.progress);
  branches.forEach((branch) => drawCurvedBranch(branch, state.progress));
  drawCanopy(state.progress);
  drawFallingHearts();

  ctx.restore();
}

function animate() {
  updateSeed();
  updateMainProgress();
  updateFallingHearts();
  drawScene();
  animationId = requestAnimationFrame(animate);
}

// START
startBtn.addEventListener("click", () => {
  if (started) return;
  started = true;

  music.currentTime = 10;
  music.play();

  startBtn.style.display = "none";
  seed.active = true;

  if (animationId) cancelAnimationFrame(animationId);
  animate();
});

resizeCanvas();