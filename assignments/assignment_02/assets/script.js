const CELL_SIZE = 30;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 15;

// skin  pacman
const AVATAR_COLORS = [
  { name: "Giallo Classico", color: "#FFD700", glow: "#FFA500" },
  { name: "Neon Rosa",       color: "#FF1493", glow: "#FF69B4" },
  { name: "Cyber Blu",       color: "#00FFFF", glow: "#0080FF" },
  { name: "Verde Acido",     color: "#00FF00", glow: "#39FF14" },
  { name: "Viola Elettrico", color: "#BF00FF", glow: "#8B00FF" }
];

// timer per restard
const RESTART_SECONDS = 5;

// suoni
const suonoStart    = new Audio("assets/audio/audio_pacman_gamestart.mp3");
const suonoPlaying  = new Audio("assets/audio/audio_pacman_playing.mp3");
const suonoGameOver = new Audio("assets/audio/audio_pacman_gameover.mp3");

// volume 
suonoStart.volume    = 0.8;
suonoPlaying.volume  = 0.5;
suonoGameOver.volume = 0.9;

// la musica di gioco gira in loop
suonoPlaying.loop = true;

let volumeOn = true;

// gestione ol on off
function riproduciSuono(audio) {
  if (!volumeOn || !audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function avviaMusicaGioco() {
  if (!volumeOn) return;
  suonoPlaying.currentTime = 0;
  suonoPlaying.play().catch(() => {});
}

function fermaMusicaGioco() {
  suonoPlaying.pause();
}

function fermaTuttiISuoni() {
  suonoStart.pause();
  suonoGameOver.pause();
  suonoPlaying.pause();
}

// musica starte e playing 
suonoStart.addEventListener("ended", () => {

  if (gameState === "playing" && volumeOn) {
    avviaMusicaGioco();
  }
});

// gioco

let gameState = "menu";
let selectedAvatarIndex = null;      

let pacman = { x: 7, y: 7, direction: "right" };
let score = 0;
let maze = null;
let dots = [];
let ghosts = [];
let ghostIntervalId = null;
let pacmanMoveInterval = null;


let menuScreen, gameScreen;
let boardEl;
let scoreEl, finalScoreEl;
let volumeBtn;

// pann. game over
let schermoGameover, bottoneRigioca, bottoneMenu;
let secondiRestartSpan;

// autorestart timer
let restartCountdownId = null;
let restartSeconds = RESTART_SECONDS;

// elementi din.
let pacmanEl = null;
let ghostEls = [];

// maze + pallini


function createMaze() {
  const m = Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));

  // Bordi
  for (let i = 0; i < GRID_HEIGHT; i++) {
    m[i][0] = 1;
    m[i][GRID_WIDTH - 1] = 1;
  }
  for (let j = 0; j < GRID_WIDTH; j++) {
    m[0][j] = 1;
    m[GRID_HEIGHT - 1][j] = 1;
  }

  // ostacoli labirinto e baord 
  const obstacles = [
    [2, 2], [2, 3], [2, 4],
    [2, 10], [2, 11], [2, 12],
    [5, 5], [5, 6], [5, 7], [5, 8], [5, 9],
    [8, 2], [8, 3], [8, 4],
    [8, 10], [8, 11], [8, 12],
    [11, 5], [11, 6], [11, 7], [11, 8], [11, 9],
    [5, 2], [11, 2], [5, 12], [11, 12]
  ];

  obstacles.forEach(([y, x]) => {
    if (y < GRID_HEIGHT && x < GRID_WIDTH) {
      m[y][x] = 1;
    }
  });

  return m;
}

function initializeDots() {
  const newDots = [];
  for (let y = 1; y < GRID_HEIGHT - 1; y++) {
    for (let x = 1; x < GRID_WIDTH - 1; x++) {
      if (maze[y][x] === 0) {
        newDots.push({ x, y });
      }
    }
  }
  dots = newDots;
}

// togliere pallino mangiato
function removeDotElement(x, y) {
  const selector = `.dot[data-x="${x}"][data-y="${y}"]`;
  const el = boardEl.querySelector(selector);
  if (el) el.remove();
}

// pannello menu gioco

function showScreen(name) {
  if (!menuScreen || !gameScreen) return;

  menuScreen.classList.toggle("screen--hidden", name !== "menu");
  gameScreen.classList.toggle("screen--hidden", name !== "playing");

  gameState = name;

  // no musica playing fuori dal fioco
  if (name !== "playing") {
    fermaMusicaGioco();
  }
}

// board

function clearBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = "";
  pacmanEl = null;
  ghostEls = [];
}

function renderBoard() {
  if (!maze || !boardEl) return;

  clearBoard();

  // muri labirinto
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (maze[y][x] === 1) {
        const wall = document.createElement("div");
        wall.className = "cell cell-wall";
        wall.style.left = x * CELL_SIZE + "px";
        wall.style.top = y * CELL_SIZE + "px";
        wall.style.width = CELL_SIZE + "px";
        wall.style.height = CELL_SIZE + "px";
        boardEl.appendChild(wall);
      }
    }
  }

  // pallini
  dots.forEach((dot) => {
    const dotEl = document.createElement("div");
    dotEl.className = "dot";
    dotEl.dataset.x = dot.x;
    dotEl.dataset.y = dot.y;
    dotEl.style.width = "6px";
    dotEl.style.height = "6px";
    dotEl.style.left = dot.x * CELL_SIZE + CELL_SIZE / 2 - 3 + "px";
    dotEl.style.top = dot.y * CELL_SIZE + CELL_SIZE / 2 - 3 + "px";
    boardEl.appendChild(dotEl);
  });

  // fantasmi mov.
  ghosts.forEach((ghost) => {
    const ghostEl = document.createElement("div");
    ghostEl.className = "ghost";
    ghostEl.style.width = CELL_SIZE - 6 + "px";
    ghostEl.style.height = CELL_SIZE - 6 + "px";
    ghostEl.style.backgroundImage = `url(${ghost.img})`;
    ghostEl.style.backgroundSize = "contain";
    ghostEl.style.backgroundRepeat = "no-repeat";
    ghostEl.style.backgroundPosition = "center";

    boardEl.appendChild(ghostEl);
    ghostEls.push(ghostEl);
  });

  // cerchio pacmna
  pacmanEl = document.createElement("div");
  pacmanEl.className = "pacman";
  pacmanEl.style.width = CELL_SIZE - 6 + "px";
  pacmanEl.style.height = CELL_SIZE - 6 + "px";
  boardEl.appendChild(pacmanEl);

  updateDynamicPositions();
}

// posizione e movimento personaggi 

function updateDynamicPositions() {
  if (!pacmanEl) return;

  
  pacmanEl.style.left = pacman.x * CELL_SIZE + 3 + "px";
  pacmanEl.style.top  = pacman.y * CELL_SIZE + 3 + "px";

  // colore skin..
  const skin = AVATAR_COLORS[selectedAvatarIndex] || AVATAR_COLORS[0];
  pacmanEl.style.backgroundColor = skin.color;
  pacmanEl.style.boxShadow = `0 0 15px ${skin.glow}`;

  // rotazione e movimento strano
  let rotation = 0;
  if (pacman.direction === "left") rotation = 180;
  else if (pacman.direction === "up") rotation = -90;
  else if (pacman.direction === "down") rotation = 90;
  pacmanEl.style.transform = `rotate(${rotation}deg)`;

  // fantasma
  ghosts.forEach((ghost, i) => {
    const el = ghostEls[i];
    if (!el) return;
    el.style.left = ghost.x * CELL_SIZE + 3 + "px";
    el.style.top  = ghost.y * CELL_SIZE + 3 + "px";
  });
}

// sviluppo del gioco

function updateHUD() {
  if (!scoreEl) return;
  scoreEl.textContent = score;
}

function resetGhosts() {
  ghosts = [
    { x: 3,  y: 3,  img: "assets/image/fantasma_rosso.png" },
    { x: 11, y: 3,  img: "assets/image/fantasma_rosa.png" },
    { x: 3,  y: 11, img: "assets/image/fantasma_azzurro.png" },
    { x: 11, y: 11, img: "assets/image/fantasma_arancione.png" }
  ];
}

function checkCollision() {
  return ghosts.some((ghost) => ghost.x === pacman.x && ghost.y === pacman.y);
}

// timer autorestart

function fermaTimerAutoRestart() {
  if (restartCountdownId) {
    clearInterval(restartCountdownId);
    restartCountdownId = null;
  }
}

function avviaTimerAutoRestart() {
  fermaTimerAutoRestart();
  restartSeconds = RESTART_SECONDS;

  if (secondiRestartSpan) {
    secondiRestartSpan.textContent = restartSeconds;
  }

  restartCountdownId = setInterval(() => {
    restartSeconds--;

    if (secondiRestartSpan) {
      secondiRestartSpan.textContent = restartSeconds;
    }

    if (restartSeconds <= 0) {
      fermaTimerAutoRestart();
      startGame(selectedAvatarIndex);
    }
  }, 1000);
}

function gestisciCollisione() {
  if (gameState !== "playing") return;
  if (!checkCollision()) return;

  // Ferma movimento
  if (pacmanMoveInterval) {
    clearInterval(pacmanMoveInterval);
    pacmanMoveInterval = null;
  }
  stopGhosts();

  // stop musica pla
  fermaMusicaGioco();

  //start supono game over
  riproduciSuono(suonoGameOver);

  // pann. game over
  if (finalScoreEl) {
    finalScoreEl.textContent = score;
  }
  if (schermoGameover) {
    schermoGameover.classList.remove("nascosto");
  }

  // timer autorestart
  avviaTimerAutoRestart();

  gameState = "gameover";
}

// movumento casuale dei fantasmi 
function moveGhosts() {
  const directions = ["up", "down", "left", "right"];

  ghosts = ghosts.map((ghost) => {
    const validMoves = directions.filter((dir) => {
      let newX = ghost.x;
      let newY = ghost.y;

      if (dir === "up") newY--;
      else if (dir === "down") newY++;
      else if (dir === "left") newX--;
      else if (dir === "right") newX++;

      return maze[newY] && maze[newY][newX] === 0;
    });

    if (validMoves.length > 0) {
      const randomDir =
        validMoves[Math.floor(Math.random() * validMoves.length)];
      let newX = ghost.x;
      let newY = ghost.y;

      if (randomDir === "up") newY--;
      else if (randomDir === "down") newY++;
      else if (randomDir === "left") newX--;
      else if (randomDir === "right") newX++;

      return { ...ghost, x: newX, y: newY };
    }
    return ghost;
  });

  updateDynamicPositions();
  gestisciCollisione();
}

function startGhosts() {
  stopGhosts();
  ghostIntervalId = setInterval(moveGhosts, 220);
}

function stopGhosts() {
  if (ghostIntervalId) {
    clearInterval(ghostIntervalId);
    ghostIntervalId = null;
  }
}

// movimento pacman

function tryMovePacman() {
  let newX = pacman.x;
  let newY = pacman.y;

  if (pacman.direction === "up") newY--;
  else if (pacman.direction === "down") newY++;
  else if (pacman.direction === "left") newX--;
  else if (pacman.direction === "right") newX++;

  // blocchi al mov.
  if (!maze[newY] || maze[newY][newX] !== 0) {
    return;
  }

  pacman.x = newX;
  pacman.y = newY;

  // mangiare pallno
  const dotIndex = dots.findIndex((dot) => dot.x === newX && dot.y === newY);
  if (dotIndex !== -1) {
    const eaten = dots[dotIndex];
    dots.splice(dotIndex, 1);
    removeDotElement(eaten.x, eaten.y);
    score += 10;
    updateHUD();

    if (dots.length === 0) {
      alert("Livello completato! 🎉");
      initializeDots();
      renderBoard();
    }
  }

  updateDynamicPositions();
  gestisciCollisione();
}

function startPacmanAutoMove() {
  if (pacmanMoveInterval) return;

  pacmanMoveInterval = setInterval(() => {
    if (gameState !== "playing") return;
    tryMovePacman();
  }, 140);
}

function handleKeyDown(e) {
  if (gameState !== "playing") return;

  let newDir = pacman.direction;

  if (e.key === "ArrowUp") newDir = "up";
  else if (e.key === "ArrowDown") newDir = "down";
  else if (e.key === "ArrowLeft") newDir = "left";
  else if (e.key === "ArrowRight") newDir = "right";
  else return;

  pacman.direction = newDir;

  if (!pacmanMoveInterval) {
    startPacmanAutoMove();
    tryMovePacman();
  }
}

// restart partita (rivedere)

function startGame(avatarIndex) {
  selectedAvatarIndex = avatarIndex;
  gameState = "playing";

  if (schermoGameover) {
    schermoGameover.classList.add("nascosto");
  }
  fermaTimerAutoRestart();

  pacman = { x: 7, y: 7, direction: "right" };
  score = 0;
  maze = createMaze();
  initializeDots();
  resetGhosts();
  updateHUD();

  if (pacmanMoveInterval) {
    clearInterval(pacmanMoveInterval);
    pacmanMoveInterval = null;
  }

  boardEl.style.width = GRID_WIDTH * CELL_SIZE + "px";
  boardEl.style.height = GRID_HEIGHT * CELL_SIZE + "px";

  renderBoard();
  showScreen("playing");
  startGhosts();

  // suono start game 
  riproduciSuono(suonoStart);
}

// inizializz. dom

document.addEventListener("DOMContentLoaded", function () {

  menuScreen = document.getElementById("menu-screen");
  gameScreen = document.getElementById("game-screen");

  // board e hud
  boardEl = document.getElementById("game-board");
  scoreEl = document.getElementById("score-value");

  // pann. game over
  schermoGameover = document.getElementById("schermo-gameover");
  finalScoreEl = document.getElementById("punteggio-finale");
  bottoneRigioca = document.getElementById("bottone-rigioca");
  bottoneMenu = document.getElementById("bottone-menu");
  secondiRestartSpan = document.getElementById("secondi-restart");

  // pulsante volume
  volumeBtn = document.getElementById("volume-btn");
  volumeBtn.addEventListener("click", () => {
    volumeOn = !volumeOn;
    volumeBtn.textContent = "VOLUME: " + (volumeOn ? "ON" : "OFF");

    if (!volumeOn) {
      fermaTuttiISuoni();
    } else {
      // volume mentre giochi 1!!!!1
      if (gameState === "playing" && suonoStart.ended) {
        avviaMusicaGioco();
      }
    }
  });

// selezione della skin durante il gioco e cambio 
const skinOptionEls = document.querySelectorAll(".skin-option");
skinOptionEls.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    selectedAvatarIndex = index;

    skinOptionEls.forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");

    updateDynamicPositions();
  });
});


  // bott. avatar menu iniz.
const avatarButtons = document.querySelectorAll(".avatar-button");
avatarButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    selectedAvatarIndex = index;

    // selezione bott avatar  nel +  css
    avatarButtons.forEach((b) => b.classList.remove("avatar-button--selected"));
    btn.classList.add("avatar-button--selected");
  });
});

  // bott. start GAME
  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (selectedAvatarIndex === null) return;
      startGame(selectedAvatarIndex);
    });
  }

  // BOt. game over
  if (bottoneRigioca) {
    bottoneRigioca.addEventListener("click", () => {
      if (selectedAvatarIndex === null) return;
      startGame(selectedAvatarIndex);
    });
  }

  if (bottoneMenu) {
    bottoneMenu.addEventListener("click", () => {
      stopGhosts();
      if (pacmanMoveInterval) {
        clearInterval(pacmanMoveInterval);
        pacmanMoveInterval = null;
      }
      fermaTimerAutoRestart();
      fermaMusicaGioco();
      if (schermoGameover) {
        schermoGameover.classList.add("nascosto");
      }
      showScreen("menu");
    });
  }

  // tastiera per movimento 
  window.addEventListener("keydown", handleKeyDown);

  // stato inziale (rivedere!)
  maze = createMaze();
  initializeDots();
  showScreen("menu");
});
