// Configurazione base della griglia e delle skin di Pac-Man
const CELL_SIZE = 30;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 15;

const AVATAR_COLORS = [
  { name: "Giallo Classico", color: "#FFD700", glow: "#FFA500" },
  { name: "Neon Rosa",       color: "#FF1493", glow: "#FF69B4" },
  { name: "Cyber Blu",       color: "#00FFFF", glow: "#0080FF" },
  { name: "Verde Acido",     color: "#00FF00", glow: "#39FF14" },
  { name: "Viola Elettrico", color: "#8B00FF", glow: "#8B00FF" }
];

// Configurazione API esterne (Giphy e meteo Open-Meteo)
const GIPHY_API_KEY = "";
const GIPHY_TAG_LOSE = "loser fail game over";
const GIPHY_TAG_WIN  = "victory celebration win";
const RESTART_SECONDS = 5;

const DEFAULT_LAT = 46.0;
const DEFAULT_LON = 8.9;
const METEO_FORECAST_BASE   = "https://api.open-meteo.com/v1/forecast";
const METEO_GEOCODING_BASE  = "https://geocoding-api.open-meteo.com/v1/search";

// Setup dei suoni di gioco
const suonoStart    = new Audio("assets/audio/audio_pacman_gamestart.mp3");
const suonoPlaying  = new Audio("assets/audio/audio_pacman_playing.mp3");
const suonoGameOver = new Audio("assets/audio/audio_pacman_gameover.mp3");

suonoStart.volume    = 0.8;
suonoPlaying.volume  = 0.5;
suonoGameOver.volume = 0.9;

suonoPlaying.loop = true;
let volumeOn = true;

// Stato di gioco e variabili principali
let gameState = "menu";
let selectedAvatarIndex = 0;

let pacman = { x: 7, y: 7, direction: "right" };
let score = 0;
let maze = null;
let dots = [];
let ghosts = [];
let ghostIntervalId = null;
let pacmanMoveInterval = null;

let lastLoseGifUrl = null;
let lastWinGifUrl  = null;

// Riferimenti al DOM
let menuScreen, gameScreen;
let boardEl;
let scoreEl, finalScoreEl;
let volumeBtn, backMenuBtn;

let schermoGameover, bottoneRigioca, bottoneMenu;
let secondiRestartSpan;
let reactionImageEl;
let titoloGameoverEl;

let cityInputEl, weatherBtnEl, weatherStatusEl;

let restartCountdownId = null;
let restartSeconds = RESTART_SECONDS;

let pacmanEl = null;
let ghostEls = [];

// Funzioni di gestione audio
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

suonoStart.addEventListener("ended", () => {
  if (gameState === "playing" && volumeOn) {
    avviaMusicaGioco();
  }
});

// Creazione del labirinto e posizionamento dei pallini
function createMaze() {
  const m = Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));

  for (let i = 0; i < GRID_HEIGHT; i++) {
    m[i][0] = 1;
    m[i][GRID_WIDTH - 1] = 1;
  }
  for (let j = 0; j < GRID_WIDTH; j++) {
    m[0][j] = 1;
    m[GRID_HEIGHT - 1][j] = 1;
  }

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

function removeDotElement(x, y) {
  const selector = `.dot[data-x="${x}"][data-y="${y}"]`;
  const el = boardEl.querySelector(selector);
  if (el) el.remove();
}

// Gestione delle schermate (menu / gioco)
function showScreen(name) {
  if (!menuScreen || !gameScreen) return;

  menuScreen.classList.toggle("screen--hidden", name !== "menu");
  gameScreen.classList.toggle("screen--hidden", name !== "playing");

  gameState = name;

  if (name !== "playing") {
    fermaMusicaGioco();
  }
}

// Rendering della board di gioco
function clearBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = "";
  pacmanEl = null;
  ghostEls = [];
}

function renderBoard() {
  if (!maze || !boardEl) return;

  clearBoard();

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (maze[y][x] === 1) {
        const wall = document.createElement("div");
        wall.className = "cell cell-wall";
        wall.style.left   = x * CELL_SIZE + "px";
        wall.style.top    = y * CELL_SIZE + "px";
        wall.style.width  = CELL_SIZE + "px";
        wall.style.height = CELL_SIZE + "px";
        boardEl.appendChild(wall);
      }
    }
  }

  dots.forEach((dot) => {
    const dotEl = document.createElement("div");
    dotEl.className = "dot";
    dotEl.dataset.x = dot.x;
    dotEl.dataset.y = dot.y;
    dotEl.style.width  = "6px";
    dotEl.style.height = "6px";
    dotEl.style.left   = dot.x * CELL_SIZE + CELL_SIZE / 2 - 3 + "px";
    dotEl.style.top    = dot.y * CELL_SIZE + CELL_SIZE / 2 - 3 + "px";
    boardEl.appendChild(dotEl);
  });

  ghosts.forEach((ghost) => {
    const ghostEl = document.createElement("div");
    ghostEl.className = "ghost";
    ghostEl.style.width  = CELL_SIZE - 6 + "px";
    ghostEl.style.height = CELL_SIZE - 6 + "px";
    ghostEl.style.backgroundImage    = `url(${ghost.img})`;
    ghostEl.style.backgroundSize     = "contain";
    ghostEl.style.backgroundRepeat   = "no-repeat";
    ghostEl.style.backgroundPosition = "center";

    boardEl.appendChild(ghostEl);
    ghostEls.push(ghostEl);
  });

  pacmanEl = document.createElement("div");
  pacmanEl.className = "pacman";
  pacmanEl.style.width  = CELL_SIZE - 6 + "px";
  pacmanEl.style.height = CELL_SIZE - 6 + "px";
  boardEl.appendChild(pacmanEl);

  updateDynamicPositions();
}

// Aggiornamento delle posizioni di Pac-Man e dei fantasmi
function updateDynamicPositions() {
  if (!pacmanEl) return;

  pacmanEl.style.left = pacman.x * CELL_SIZE + 3 + "px";
  pacmanEl.style.top  = pacman.y * CELL_SIZE + 3 + "px";

  const skin = AVATAR_COLORS[selectedAvatarIndex] || AVATAR_COLORS[0];
  pacmanEl.style.backgroundColor = skin.color;

  let rotation = 0;
  if (pacman.direction === "left")      rotation = 180;
  else if (pacman.direction === "up")   rotation = -90;
  else if (pacman.direction === "down") rotation = 90;

  pacmanEl.style.transform = `rotate(${rotation}deg)`;

  ghosts.forEach((ghost, i) => {
    const el = ghostEls[i];
    if (!el) return;
    el.style.left = ghost.x * CELL_SIZE + 3 + "px";
    el.style.top  = ghost.y * CELL_SIZE + 3 + "px";
  });
}

// Logica di punteggio e gestione collisioni
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

// Timer per il riavvio automatico della partita
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

// Pannello di reazione con GIF (Giphy o fallback)
function setReactionImage(url, altText) {
  if (!reactionImageEl) return;

  if (!url) {
    reactionImageEl.src = "";
    reactionImageEl.alt = "Reaction not available";
    return;
  }

  reactionImageEl.src = "";
  reactionImageEl.alt = "";

  reactionImageEl.src = url;
  reactionImageEl.alt = altText || "GIF reaction";
}

async function fetchGifUrl(tag) {
  if (!GIPHY_API_KEY) {
    return null;
  }

  try {
    const query = encodeURIComponent(tag);
    const url =
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}` +
      `&q=${query}&limit=25&rating=g`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Giphy API error: " + res.status);

    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * data.data.length);
    const gifObj = data.data[randomIndex];
    const images = gifObj.images || {};

    const gifUrl =
      (images.downsized_medium && images.downsized_medium.url) ||
      (images.original && images.original.url) ||
      (images.fixed_height && images.fixed_height.url) ||
      null;

    return gifUrl;
  } catch (err) {
    return null;
  }
}

async function showLoseGif() {
  let gifUrl = null;
  let attempts = 0;

  do {
    gifUrl = await fetchGifUrl(GIPHY_TAG_LOSE);
    attempts++;
  } while (gifUrl && gifUrl === lastLoseGifUrl && attempts < 3);

  if (gifUrl) {
    setReactionImage(gifUrl, "Internet's reaction to your Game Over");
    lastLoseGifUrl = gifUrl;
  } else {
    setReactionImage("assets/image/fantasma_azzurro.png", "Ghost reaction");
  }
}

async function showWinGif() {
  let gifUrl = null;
  let attempts = 0;

  do {
    gifUrl = await fetchGifUrl(GIPHY_TAG_WIN);
    attempts++;
  } while (gifUrl && gifUrl === lastWinGifUrl && attempts < 3);

  if (gifUrl) {
    setReactionImage(gifUrl, "Internet celebrates your victory");
    lastWinGifUrl = gifUrl;
  } else {
    setReactionImage("assets/image/fantasma_azzurro.png", "Ghost reaction");
  }
}

// Funzioni per leggere il meteo dall’API e applicare il tema
async function getWeatherCodeForCoords(lat, lon) {
  const url =
    `${METEO_FORECAST_BASE}?latitude=${lat}&longitude=${lon}&current_weather=true`;

  const res = await fetch(url);

  if (!res.ok) throw new Error("Meteo API error: " + res.status);
  const data = await res.json();

  if (!data.current_weather) return null;
  return data.current_weather.weathercode;
}

async function getWeatherCodeForCity(cityName) {
  const url =
    `${METEO_GEOCODING_BASE}?name=${encodeURIComponent(cityName)}` +
    `&count=1&language=en&format=json`;

  const res = await fetch(url);

  if (!res.ok) throw new Error("Geocoding error: " + res.status);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    return { weathercode: null, label: null };
  }

  const { latitude, longitude, name, country } = data.results[0];

  const code = await getWeatherCodeForCoords(latitude, longitude);
  const label = country ? `${name}, ${country}` : name;
  return { weathercode: code, label };
}

function applicaTemaMeteo(weathercode) {
  const body = document.body;
  body.classList.remove(
    "meteo-sereno",
    "meteo-nuvoloso",
    "meteo-pioggia",
    "meteo-nebbia",
    "meteo-neve",
    "meteo-default"
  );

  if (weathercode === null || weathercode === undefined) {
    body.classList.add("meteo-default");
    return;
  }

  if (weathercode >= 0 && weathercode <= 2) {
    body.classList.add("meteo-sereno");
  } else if (weathercode === 3) {
    body.classList.add("meteo-nuvoloso");
  } else if (weathercode >= 45 && weathercode <= 48) {
    body.classList.add("meteo-nebbia");
  } else if (
    (weathercode >= 51 && weathercode <= 67) ||
    (weathercode >= 80 && weathercode <= 82)
  ) {
    body.classList.add("meteo-pioggia");
  } else if (weathercode >= 71 && weathercode <= 77) {
    body.classList.add("meteo-neve");
  } else {
    body.classList.add("meteo-default");
  }
}

function descrizioneMeteoDaCodice(code) {
  if (code === null || code === undefined) return "Unknown";

  if (code === 0) return "Clear sky";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";

  if (code >= 45 && code <= 48) return "Fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";

  return "Mixed / unstable";
}

function aggiornaWeatherStatus(label, code, isFallback = false) {
  if (!weatherStatusEl) return;

  const desc = descrizioneMeteoDaCodice(code);
  if (!label) {
    weatherStatusEl.textContent = `Weather: ${desc}`;
  } else if (isFallback) {
    weatherStatusEl.textContent = `City not found, using ${label} • ${desc}`;
  } else {
    weatherStatusEl.textContent = `Weather in ${label}: ${desc}`;
  }
}

async function caricaMeteoDefault() {
  try {
    const code = await getWeatherCodeForCoords(DEFAULT_LAT, DEFAULT_LON);
    applicaTemaMeteo(code);
    aggiornaWeatherStatus("default location", code);
  } catch (err) {
    applicaTemaMeteo(null);
    aggiornaWeatherStatus(null, null);
  }
}

async function caricaMeteoDaCityInput() {
  const cityRaw = cityInputEl ? cityInputEl.value.trim() : "";

  if (!cityRaw) {
    await caricaMeteoDefault();
    return;
  }

  try {
    const res = await getWeatherCodeForCity(cityRaw);

    if (res.weathercode === null) {
      await caricaMeteoDefault();
      aggiornaWeatherStatus("default location", null, true);
      return;
    }
    applicaTemaMeteo(res.weathercode);
    aggiornaWeatherStatus(res.label, res.weathercode);
  } catch (err) {
    await caricaMeteoDefault();
    if (weatherStatusEl) {
      weatherStatusEl.textContent = "Weather: error loading data";
    }
  }
}

// Gestione Game Over e vittoria
function gestisciCollisione() {
  if (gameState !== "playing") return;
  if (!checkCollision()) return;

  if (pacmanMoveInterval) {
    clearInterval(pacmanMoveInterval);
    pacmanMoveInterval = null;
  }
  stopGhosts();
  fermaMusicaGioco();

  riproduciSuono(suonoGameOver);

  if (titoloGameoverEl) {
    titoloGameoverEl.textContent = "GAME OVER";
  }

  showLoseGif();

  if (finalScoreEl) {
    finalScoreEl.textContent = score;
  }
  if (schermoGameover) {
    schermoGameover.classList.remove("nascosto");
  }

  avviaTimerAutoRestart();
  gameState = "gameover";
}

function gestisciVittoria() {
  if (gameState !== "playing") return;

  if (pacmanMoveInterval) {
    clearInterval(pacmanMoveInterval);
    pacmanMoveInterval = null;
  }
  stopGhosts();
  fermaMusicaGioco();

  if (titoloGameoverEl) {
    titoloGameoverEl.textContent = "YOU WIN!";
  }

  showWinGif();

  if (finalScoreEl) {
    finalScoreEl.textContent = score;
  }
  if (schermoGameover) {
    schermoGameover.classList.remove("nascosto");
  }

  avviaTimerAutoRestart();
  gameState = "win";
}

// Movimento casuale dei fantasmi
function moveGhosts() {
  const directions = ["up", "down", "left", "right"];

  ghosts = ghosts.map((ghost) => {
    const validMoves = directions.filter((dir) => {
      let newX = ghost.x;
      let newY = ghost.y;

      if (dir === "up")   newY--;
      else if (dir === "down")  newY++;
      else if (dir === "left")  newX--;
      else if (dir === "right") newX++;

      return maze[newY] && maze[newY][newX] === 0;
    });

    if (validMoves.length > 0) {
      const randomDir =
        validMoves[Math.floor(Math.random() * validMoves.length)];
      let newX = ghost.x;
      let newY = ghost.y;

      if (randomDir === "up")   newY--;
      else if (randomDir === "down")  newY++;
      else if (randomDir === "left")  newX--;
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

// Movimento di Pac-Man e gestione input
function tryMovePacman() {
  let newX = pacman.x;
  let newY = pacman.y;

  if (pacman.direction === "up")        newY--;
  else if (pacman.direction === "down") newY++;
  else if (pacman.direction === "left") newX--;
  else if (pacman.direction === "right") newX++;

  if (!maze[newY] || maze[newY][newX] !== 0) {
    return;
  }

  pacman.x = newX;
  pacman.y = newY;

  const dotIndex = dots.findIndex((dot) => dot.x === newX && dot.y === newY);
  if (dotIndex !== -1) {
    const eaten = dots[dotIndex];
    dots.splice(dotIndex, 1);
    removeDotElement(eaten.x, eaten.y);
    score += 10;
    updateHUD();

    if (dots.length === 0) {
      gestisciVittoria();
      return;
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

function changeDirection(newDir) {
  pacman.direction = newDir;

  if (!pacmanMoveInterval) {
    startPacmanAutoMove();
    tryMovePacman();
  }
}

function handleKeyDown(e) {
  if (gameState !== "playing") return;

  if (e.key === "ArrowUp")         changeDirection("up");
  else if (e.key === "ArrowDown")  changeDirection("down");
  else if (e.key === "ArrowLeft")  changeDirection("left");
  else if (e.key === "ArrowRight") changeDirection("right");
}

// Avvio, riavvio della partita e ritorno al menu
function startGame(avatarIndex) {
  if (typeof avatarIndex === "number") {
    selectedAvatarIndex = avatarIndex;
  }

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

  boardEl.style.width  = GRID_WIDTH * CELL_SIZE + "px";
  boardEl.style.height = GRID_HEIGHT * CELL_SIZE + "px";

  renderBoard();
  showScreen("playing");
  startGhosts();

  riproduciSuono(suonoStart);
}

function tornaAlMenu() {
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
}

// Inizializzazione: query del DOM e listener
document.addEventListener("DOMContentLoaded", function () {
  menuScreen  = document.getElementById("menu-screen");
  gameScreen  = document.getElementById("game-screen");

  boardEl = document.getElementById("game-board");
  scoreEl = document.getElementById("score-value");

  schermoGameover    = document.getElementById("schermo-gameover");
  finalScoreEl       = document.getElementById("punteggio-finale");
  bottoneRigioca     = document.getElementById("bottone-rigioca");
  bottoneMenu        = document.getElementById("bottone-menu");
  secondiRestartSpan = document.getElementById("secondi-restart");
  reactionImageEl    = document.getElementById("reaction-image");
  titoloGameoverEl   = document.getElementById("titolo-gameover");

  cityInputEl     = document.getElementById("city-input");
  weatherBtnEl    = document.getElementById("weather-btn");
  weatherStatusEl = document.getElementById("weather-status");

  if (weatherBtnEl) {
    weatherBtnEl.addEventListener("click", () => {
      caricaMeteoDaCityInput();
    });
  }

  volumeBtn   = document.getElementById("volume-btn");
  backMenuBtn = document.getElementById("back-menu-btn");

  if (volumeBtn) {
    volumeBtn.addEventListener("click", () => {
      volumeOn = !volumeOn;
      volumeBtn.textContent = "VOLUME: " + (volumeOn ? "ON" : "OFF");

      if (!volumeOn) {
        fermaTuttiISuoni();
      } else {
        if (gameState === "playing" && suonoStart.ended) {
          avviaMusicaGioco();
        }
      }
    });
  }

  if (backMenuBtn) {
    backMenuBtn.addEventListener("click", () => {
      tornaAlMenu();
    });
  }

  const skinOptionEls = document.querySelectorAll(".skin-option");
  skinOptionEls.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      selectedAvatarIndex = index;

      skinOptionEls.forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");

      updateDynamicPositions();
    });
  });

  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startGame(selectedAvatarIndex);
    });
  }

  if (bottoneRigioca) {
    bottoneRigioca.addEventListener("click", () => {
      startGame(selectedAvatarIndex);
    });
  }

  if (bottoneMenu) {
    bottoneMenu.addEventListener("click", () => {
      tornaAlMenu();
    });
  }

  window.addEventListener("keydown", handleKeyDown);

  const touchButtons = document.querySelectorAll(".touch-btn");
  touchButtons.forEach((btn) => {
    const dir = btn.dataset.dir;
    if (!dir) return;

    const handler = (event) => {
      event.preventDefault();
      if (gameState !== "playing") return;
      changeDirection(dir);
    };

    btn.addEventListener("click", handler);
    btn.addEventListener("touchstart", handler);
  });

  applicaTemaMeteo(null);
  aggiornaWeatherStatus("Not loaded", null);

  maze = createMaze();
  initializeDots();
  showScreen("menu");
});