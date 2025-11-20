// ================================
// CONFIGURAZIONE DI BASE
// ================================

const CELL_SIZE = 30;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 15;

// Skin disponibili per Pac-Man
const AVATAR_COLORS = [
  { name: "Giallo Classico", color: "#FFD700", glow: "#FFA500" },
  { name: "Neon Rosa",       color: "#FF1493", glow: "#FF69B4" },
  { name: "Cyber Blu",       color: "#00FFFF", glow: "#0080FF" },
  { name: "Verde Acido",     color: "#00FF00", glow: "#39FF14" },
  { name: "Viola Elettrico", color: "#BF00FF", glow: "#8B00FF" }
];

// Timer autorestart (in secondi)
const RESTART_SECONDS = 5;

// ---------------------
// SUONI (cartella: asset/audio/)
// ---------------------
const suonoStart    = new Audio("asset/audio/audio_pacman_gamestart.mp3");
const suonoPlaying  = new Audio("asset/audio/audio_pacman_playing.mp3");
const suonoGameOver = new Audio("asset/audio/audio_pacman_gameover.mp3");

// volume di base
suonoStart.volume    = 0.8;
suonoPlaying.volume  = 0.5;
suonoGameOver.volume = 0.9;

// la musica di gioco gira in loop
suonoPlaying.loop = true;

// stato volume
let volumeOn = true;

// helper per gestire il volume ON/OFF
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

// 👉 appena finisce il jingle di start, parte la musica di playing
suonoStart.addEventListener("ended", () => {
  // avvia la musica solo se siamo ancora in gioco
  if (gameState === "playing" && volumeOn) {
    avviaMusicaGioco();
  }
});

// ================================
// STATO DI GIOCO
// ================================

let gameState = "menu";
let selectedAvatarIndex = null;      // diventa un numero solo dopo la scelta

let pacman = { x: 7, y: 7, direction: "right" };
let score = 0;
let maze = null;
let dots = [];
let ghosts = [];
let ghostIntervalId = null;
let pacmanMoveInterval = null;

// Riferimenti DOM
let menuScreen, gameScreen;
let boardEl;
let scoreEl, finalScoreEl;
let volumeBtn;

// Pannello game over
let schermoGameover, bottoneRigioca, bottoneMenu;
let secondiRestartSpan;

// Timer autorestart
let restartCountdownId = null;
let restartSeconds = RESTART_SECONDS;

// Elementi dinamici
let pacmanEl = null;
let ghostEls = [];

// ================================
// MAZE + PALLINI
// ================================

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

  // Ostacoli interni (labirinto semplice)
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

// Rimuove il singolo pallino mangiato
function removeDotElement(x, y) {
  const selector = `.dot[data-x="${x}"][data-y="${y}"]`;
  const el = boardEl.querySelector(selector);
  if (el) el.remove();
}

// ================================
// SCHERMATE (MENU / GIOCO)
// ================================

function showScreen(name) {
  if (!menuScreen || !gameScreen) return;

  menuScreen.classList.toggle("screen--hidden", name !== "menu");
  gameScreen.classList.toggle("screen--hidden", name !== "playing");

  gameState = name;

  // sicurezza: fuori dal gioco niente musica di playing
  if (name !== "playing") {
    fermaMusicaGioco();
  }
}

// ================================
// RENDER BOARD + ENTITÀ
// ================================

function clearBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = "";
  pacmanEl = null;
  ghostEls = [];
}

function renderBoard() {
  if (!maze || !boardEl) return;

  clearBoard();

  // Muri
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

  // Pallini
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

  // Fantasmi
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

  // Pac-Man (cerchio in CSS)
  pacmanEl = document.createElement("div");
  pacmanEl.className = "pacman";
  pacmanEl.style.width = CELL_SIZE - 6 + "px";
  pacmanEl.style.height = CELL_SIZE - 6 + "px";
  boardEl.appendChild(pacmanEl);

  updateDynamicPositions();
}

// ================================
// POSIZIONI (PAC-MAN + FANTASMI)
// ================================

function updateDynamicPositions() {
  if (!pacmanEl) return;

  // Posizione Pac-Man
  pacmanEl.style.left = pacman.x * CELL_SIZE + 3 + "px";
  pacmanEl.style.top  = pacman.y * CELL_SIZE + 3 + "px";

  // Colore e glow in base alla skin
  const skin = AVATAR_COLORS[selectedAvatarIndex] || AVATAR_COLORS[0];
  pacmanEl.style.backgroundColor = skin.color;
  pacmanEl.style.boxShadow = `0 0 15px ${skin.glow}`;

  // Rotazione
  let rotation = 0;
  if (pacman.direction === "left") rotation = 180;
  else if (pacman.direction === "up") rotation = -90;
  else if (pacman.direction === "down") rotation = 90;
  pacmanEl.style.transform = `rotate(${rotation}deg)`;

  // Fantasmi
  ghosts.forEach((ghost, i) => {
    const el = ghostEls[i];
    if (!el) return;
    el.style.left = ghost.x * CELL_SIZE + 3 + "px";
    el.style.top  = ghost.y * CELL_SIZE + 3 + "px";
  });
}

// ================================
// LOGICA DI GIOCO
// ================================

function updateHUD() {
  if (!scoreEl) return;
  scoreEl.textContent = score;
}

function resetGhosts() {
  ghosts = [
    { x: 3,  y: 3,  img: "asset/fantasma_rosso.png" },
    { x: 11, y: 3,  img: "asset/fantasma_rosa.png" },
    { x: 3,  y: 11, img: "asset/fantasma_azzurro.png" },
    { x: 11, y: 11, img: "asset/fantasma_arancione.png" }
  ];
}

function checkCollision() {
  return ghosts.some((ghost) => ghost.x === pacman.x && ghost.y === pacman.y);
}

// --------------------
// Timer autorestart
// --------------------

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

  // 👉 ferma subito la musica di playing
  fermaMusicaGioco();

  // 👉 avvia subito il suono di game over
  riproduciSuono(suonoGameOver);

  // Mostra pannello GAME OVER
  if (finalScoreEl) {
    finalScoreEl.textContent = score;
  }
  if (schermoGameover) {
    schermoGameover.classList.remove("nascosto");
  }

  // Avvia timer autorestart
  avviaTimerAutoRestart();

  gameState = "gameover";
}

// Movimento casuale dei fantasmi
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

// ================================
// MOVIMENTO DI PAC-MAN
// ================================

function tryMovePacman() {
  let newX = pacman.x;
  let newY = pacman.y;

  if (pacman.direction === "up") newY--;
  else if (pacman.direction === "down") newY++;
  else if (pacman.direction === "left") newX--;
  else if (pacman.direction === "right") newX++;

  // Blocca sui muri o fuori mappa
  if (!maze[newY] || maze[newY][newX] !== 0) {
    return;
  }

  pacman.x = newX;
  pacman.y = newY;

  // Mangia il pallino
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

// ================================
// AVVIO PARTITA
// ================================

function startGame(avatarIndex) {
  selectedAvatarIndex = avatarIndex;
  gameState = "playing";

  // Nascondo pannello game over e stoppo timer autorestart
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

  // 👉 suono di start
  riproduciSuono(suonoStart);
  // la musica di playing partirà automaticamente su "ended"
}

// ================================
// INIZIALIZZAZIONE DOM
// ================================

document.addEventListener("DOMContentLoaded", function () {
  // Schermate
  menuScreen = document.getElementById("menu-screen");
  gameScreen = document.getElementById("game-screen");

  // Board e HUD
  boardEl = document.getElementById("game-board");
  scoreEl = document.getElementById("score-value");

  // Pannello game over
  schermoGameover   = document.getElementById("schermo-gameover");
  finalScoreEl      = document.getElementById("punteggio-finale");
  bottoneRigioca    = document.getElementById("bottone-rigioca");
  bottoneMenu       = document.getElementById("bottone-menu");
  secondiRestartSpan = document.getElementById("secondi-restart");

  // Pulsante volume
  volumeBtn = document.getElementById("volume-btn");
  volumeBtn.addEventListener("click", () => {
    volumeOn = !volumeOn;
    volumeBtn.textContent = "VOLUME: " + (volumeOn ? "ON" : "OFF");

    if (!volumeOn) {
      fermaTuttiISuoni();
    } else {
      // se torni ON mentre sei in gioco e lo start è già finito → riavvia solo playing
      if (gameState === "playing" && suonoStart.ended) {
        avviaMusicaGioco();
      }
    }
  });

  // Selettore skin IN-GAME
  const skinOptionEls = document.querySelectorAll(".skin-option");
  skinOptionEls.forEach((btn) => {
    const index = parseInt(btn.dataset.avatarIndex, 10);
    if (!Number.isNaN(index)) {
      btn.addEventListener("click", () => {
        selectedAvatarIndex = index;
        updateDynamicPositions();
      });
    }
  });

  // Bottoni avatar nel MENU (solo selezione skin)
  const avatarButtons = document.querySelectorAll(".avatar-button");
  avatarButtons.forEach((btn) => {
    const index = parseInt(btn.dataset.avatarIndex, 10);
    if (!Number.isNaN(index)) {
      btn.addEventListener("click", () => {
        selectedAvatarIndex = index;

        // evidenzia avatar selezionato (classe da stilare in CSS)
        avatarButtons.forEach(b => b.classList.remove("avatar-button--selected"));
        btn.classList.add("avatar-button--selected");
      });
    }
  });

  // Bottone START GAME (parte solo se è stata scelta una skin)
  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (selectedAvatarIndex === null) return;
      startGame(selectedAvatarIndex);
    });
  }

  // Bottoni GAME OVER
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

  // Controlli da tastiera
  window.addEventListener("keydown", handleKeyDown);

  // Stato iniziale (solo per avere i dati pronti, il gioco parte da START)
  maze = createMaze();
  initializeDots();
  showScreen("menu");
});



const skinOptions = document.querySelectorAll(".skin-option");

skinOptions.forEach((el) => {
  el.addEventListener("click", () => {
    skinOptions.forEach(s => s.classList.remove("active"));
    el.classList.add("active");
  });
});