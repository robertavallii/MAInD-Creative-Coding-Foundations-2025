// Config base: griglia + skin di Pac-Man

const CELL_SIZE = 30;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 15;

// palette per le skin del pacman (usata nel selettore e nel render)
const AVATAR_COLORS = [
  { name: "Giallo Classico",  color: "#FFD700", glow: "#FFA500" },
  { name: "Neon Rosa",        color: "#FF1493", glow: "#FF69B4" },
  { name: "Cyber Blu",        color: "#00FFFF", glow: "#0080FF" },
  { name: "Verde Acido",      color: "#00FF00", glow: "#39FF14" },
  { name: "Viola Elettrico",  color: "#8B00FF", glow: "#8B00FF" }
];


// Config API esterne (Giphy + Open-Meteo)
const GIPHY_API_KEY = "";
const GIPHY_TAG_LOSE = "loser fail game over";
const GIPHY_TAG_WIN  = "victory celebration win";
const RESTART_SECONDS = 5;

// coordinate di fallback (es. Svizzera / area generica)
const DEFAULT_LAT = 46.0;
const DEFAULT_LON = 8.9;

const METEO_FORECAST_BASE  = "https://api.open-meteo.com/v1/forecast";
const METEO_GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";


// Audio di gioco

// suoni principali 
const suonoStart    = new Audio("assets/audio/audio_pacman_gamestart.mp3");
const suonoPlaying  = new Audio("assets/audio/audio_pacman_playing.mp3");
const suonoGameOver = new Audio("assets/audio/audio_pacman_gameover.mp3");

// volume
suonoStart.volume    = 0.8;
suonoPlaying.volume  = 0.5;
suonoGameOver.volume = 0.9;

// musica e in loop gioco
suonoPlaying.loop = true;

let volumeOn = true;


// Stato di gioco principale

let gameState = "menu";
let selectedAvatarIndex = 0;

// posizione e direzione di pacman (coordinate nella griglia)
let pacman = { x: 7, y: 7, direction: "right" };

// punteggio
let score = 0;

// labirinto e elementi di gioco
let maze = null;       // matrice 15x15 con 0 = vuoto, 1 = muro
let dots = [];         // array di tutti i puntini
let ghosts = [];       // array per fantasmi

// id  interval,. per mov auto
let ghostIntervalId = null;
let pacmanMoveInterval = null;

// cambia gif
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

// timer 
let restartCountdownId = null;
let restartSeconds = RESTART_SECONDS;

// rif. a elementi grafici di pacman e fantasmi
let pacmanEl = null;
let ghostEls = [];


// Funzioni audio (start / loop / stop)
function riproduciSuono(audio) {
  if (!volumeOn || !audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {
  });
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

// quando termina il suono di start, parte la musica di gioco
suonoStart.addEventListener("ended", () => {
  if (gameState === "playing" && volumeOn) {
    avviaMusicaGioco();
  }
});


// percorsoo e puntini  +

// creo una griglia 15x15 con obstacles
function createMaze() {
  const m = Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));

  // bordo esterno di muri
  for (let i = 0; i < GRID_HEIGHT; i++) {
    m[i][0] = 1;
    m[i][GRID_WIDTH - 1] = 1;
  }
  for (let j = 0; j < GRID_WIDTH; j++) {
    m[0][j] = 1;
    m[GRID_HEIGHT - 1][j] = 1;
  }

  // ostacoli interni 
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

// puntini su celle vuote
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

// rimuove il puntino dal DOM quando pacman lo mangia
function removeDotElement(x, y) {
  const selector = `.dot[data-x="${x}"][data-y="${y}"]`;
  const el = boardEl.querySelector(selector);
  if (el) el.remove();
}


// Gestione schermate (menu / gioco)

function showScreen(name) {
  if (!menuScreen || !gameScreen) return;

  menuScreen.classList.toggle("screen--hidden", name !== "menu");
  gameScreen.classList.toggle("screen--hidden", name !== "playing");

  gameState = name;

  // se non sono nella schermata di gioco, fermo la musica
  if (name !== "playing") {
    fermaMusicaGioco();
  }
}



// Rendering della board (muri, puntini, pacman, fantasmi)
function clearBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = "";
  pacmanEl = null;
  ghostEls = [];
}

// costruisce il DOM della board partendo da maze + dots + ghosts
function renderBoard() {
  if (!maze || !boardEl) return;

  clearBoard();

  // muri
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

  // puntini
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

  // fantasmi (sprite impostato come background)
  ghosts.forEach((ghost) => {
    const ghostEl = document.createElement("div");
    ghostEl.className = "ghost";
    ghostEl.style.width  = CELL_SIZE - 6 + "px";
    ghostEl.style.height = CELL_SIZE - 6 + "px";
    ghostEl.style.backgroundImage    = `url("${ghost.img}")`;
    ghostEl.style.backgroundSize     = "contain";
    ghostEl.style.backgroundRepeat   = "no-repeat";
    ghostEl.style.backgroundPosition = "center";

    boardEl.appendChild(ghostEl);
    ghostEls.push(ghostEl);
  });

  // pacman
  pacmanEl = document.createElement("div");
  pacmanEl.className = "pacman";
  pacmanEl.style.width  = CELL_SIZE - 6 + "px";
  pacmanEl.style.height = CELL_SIZE - 6 + "px";
  boardEl.appendChild(pacmanEl);

  // allineo le posizioni iniziali
  updateDynamicPositions();
}

// aggiorna posizioni e aspetto di pacman + fantasmi nel DOM
function updateDynamicPositions() {
  if (!pacmanEl) return;

  pacmanEl.style.left = pacman.x * CELL_SIZE + 3 + "px";
  pacmanEl.style.top  = pacman.y * CELL_SIZE + 3 + "px";

  // colore di pacman basato sulla skin selezionata
  const skin = AVATAR_COLORS[selectedAvatarIndex] || AVATAR_COLORS[0];
  pacmanEl.style.backgroundColor = skin.color;

  // rotazione per simulare la direzione (bocca)
  let rotation = 0;
  if (pacman.direction === "left")      rotation = 180;
  else if (pacman.direction === "up")   rotation = -90;
  else if (pacman.direction === "down") rotation = 90;

  pacmanEl.style.transform = `rotate(${rotation}deg)`;

  // fantasmi
  ghosts.forEach((ghost, i) => {
    const el = ghostEls[i];
    if (!el) return;
    el.style.left = ghost.x * CELL_SIZE + 3 + "px";
    el.style.top  = ghost.y * CELL_SIZE + 3 + "px";
  });
}


// HUD (score) + gestione punteggio

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

// collisione base: stesso x,y di pacman e fantasma
function checkCollision() {
  return ghosts.some((ghost) => ghost.x === pacman.x && ghost.y === pacman.y);
}


// Timer per il riavvio automatico del game

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


// Pannello di reazione (GIF da Giphy o fallback)

// imposta l'immagine della reaction nel pannello game over / win
function setReactionImage(url, altText) {
  if (!reactionImageEl) return;

  if (!url) {
    reactionImageEl.src = "";
    reactionImageEl.alt = "Reaction not available";
    return;
  }

  // reset veloce per forzare il reload
  reactionImageEl.src = "";
  reactionImageEl.alt = "";

  reactionImageEl.src = url;
  reactionImageEl.alt = altText || "GIF reaction";
}

// chiede a Giphy una GIF per un certo tag
async function fetchGifUrl(tag) {
  if (!GIPHY_API_KEY) {
    // se non ho la key, rinuncio e torno null
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

    // prendo una GIF random tra i risultati
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
    // in caso di errore, torno null e userò il fallback
    return null;
  }
}

// versione per la sconfitta
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
    // fallback locale
    setReactionImage("assets/image/fantasma_azzurro.png", "Ghost reaction");
  }
}

// versione per la vittoria
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
    // fallback locale
    setReactionImage("assets/image/fantasma_azzurro.png", "Ghost reaction");
  }
}



// Funzioni meteo: chiamata API + tema visivo

// dato lat/lon, chiedo il meteo attuale a Open-Meteo
async function getWeatherCodeForCoords(lat, lon) {
  const url = `${METEO_FORECAST_BASE}?latitude=${lat}&longitude=${lon}&current_weather=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Meteo API error: " + res.status);

  const data = await res.json();
  if (!data.current_weather) return null;

  // prendo solo il weathercode, il resto non mi serve
  return data.current_weather.weathercode;
}

// dato il nome città, faccio prima geocoding → poi chiedo il meteo
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

// mappa i codici meteo alle classi CSS del body
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

  // mapping molto semplice sui range dei codici
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

// traduco il codice meteo in una stringa leggibile
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

// aggiorno il testo sotto l'input del meteo
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

// carica il meteo di default (coordinate predefinite)
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

// carica il meteo in base all'input dell'utente (city name)
async function caricaMeteoDaCityInput() {
  const cityRaw = cityInputEl ? cityInputEl.value.trim() : "";

  if (!cityRaw) {
    // se input vuoto, vado di default
    await caricaMeteoDefault();
    return;
  }

  try {
    const res = await getWeatherCodeForCity(cityRaw);

    if (res.weathercode === null) {
      // se non trovo la città, torno al default ma lo segnalo come fallback
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


// Gestione game over e vittoria

function gestisciCollisione() {
  if (gameState !== "playing") return;
  if (!checkCollision()) return;

  // fermo il movimento
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

  // carico GIF sconfitta (o fallback)
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

  // fermo il movimento
  if (pacmanMoveInterval) {
    clearInterval(pacmanMoveInterval);
    pacmanMoveInterval = null;
  }
  stopGhosts();
  fermaMusicaGioco();

  if (titoloGameoverEl) {
    titoloGameoverEl.textContent = "YOU WIN!";
  }

  // carico GIF vittoria (o fallback)
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
    // calcolo tutte le mosse valide (celle non muro)
    const validMoves = directions.filter((dir) => {
      let newX = ghost.x;
      let newY = ghost.y;

      if (dir === "up")        newY--;
      else if (dir === "down") newY++;
      else if (dir === "left") newX--;
      else if (dir === "right") newX++;

      return maze[newY] && maze[newY][newX] === 0;
    });

    if (validMoves.length > 0) {
      // scelgo una direzione random tra quelle valide
      const randomDir =
        validMoves[Math.floor(Math.random() * validMoves.length)];
      let newX = ghost.x;
      let newY = ghost.y;

      if (randomDir === "up")        newY--;
      else if (randomDir === "down") newY++;
      else if (randomDir === "left") newX--;
      else if (randomDir === "right") newX++;

      return { ...ghost, x: newX, y: newY };
    }

    // se non ci sono mosse valide, il fantasma resta fermo
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



// Movimento di Pac-Man + input tastiera

// prova a spostare pacman di una cella nella direzione corrente
function tryMovePacman() {
  let newX = pacman.x;
  let newY = pacman.y;

  if (pacman.direction === "up")        newY--;
  else if (pacman.direction === "down") newY++;
  else if (pacman.direction === "left") newX--;
  else if (pacman.direction === "right") newX++;

  // se la cella successiva non è vuota (muro o fuori), non mi muovo
  if (!maze[newY] || maze[newY][newX] !== 0) {
    return;
  }

  // aggiorno posizione
  pacman.x = newX;
  pacman.y = newY;

  // controllo se ho mangiato un puntino
  const dotIndex = dots.findIndex((dot) => dot.x === newX && dot.y === newY);
  if (dotIndex !== -1) {
    const eaten = dots[dotIndex];
    dots.splice(dotIndex, 1);
    removeDotElement(eaten.x, eaten.y);
    score += 10;
    updateHUD();

    // se non ci sono più puntini → vittoria
    if (dots.length === 0) {
      gestisciVittoria();
      return;
    }
  }

  updateDynamicPositions();
  gestisciCollisione();
}

// intervallo che muove pacman in automatico
function startPacmanAutoMove() {
  if (pacmanMoveInterval) return;

  pacmanMoveInterval = setInterval(() => {
    if (gameState !== "playing") return;
    tryMovePacman();
  }, 140);
}

// cambio direzione (sia da tastiera che da touch)
function changeDirection(newDir) {
  pacman.direction = newDir;

  // se il movimento automatico non è ancora partito, lo avvio
  if (!pacmanMoveInterval) {
    startPacmanAutoMove();
    tryMovePacman();
  }
}

// gestione input tastiera
function handleKeyDown(e) {
  if (gameState !== "playing") return;

  if (e.key === "ArrowUp")         changeDirection("up");
  else if (e.key === "ArrowDown")  changeDirection("down");
  else if (e.key === "ArrowLeft")  changeDirection("left");
  else if (e.key === "ArrowRight") changeDirection("right");
}



// Start / restart partita e ritorno al menu

function startGame(avatarIndex) {
  if (typeof avatarIndex === "number") {
    selectedAvatarIndex = avatarIndex;
  }

  gameState = "playing";

  if (schermoGameover) {
    schermoGameover.classList.add("nascosto");
  }
  fermaTimerAutoRestart();

  // reset stato di gioco
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

  // imposto dimensioni della board
  boardEl.style.width  = GRID_WIDTH * CELL_SIZE + "px";
  boardEl.style.height = GRID_HEIGHT * CELL_SIZE + "px";

  renderBoard();
  showScreen("playing");
  startGhosts();

  // suono di start (poi parte il loop di gioco)
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



// Inizializzazione: query DOM + event listener

document.addEventListener("DOMContentLoaded", function () {
  // schermate
  menuScreen  = document.getElementById("menu-screen");
  gameScreen  = document.getElementById("game-screen");

  // board + HUD
  boardEl = document.getElementById("game-board");
  scoreEl = document.getElementById("score-value");

  // pannello gameover
  schermoGameover    = document.getElementById("schermo-gameover");
  finalScoreEl       = document.getElementById("punteggio-finale");
  bottoneRigioca     = document.getElementById("bottone-rigioca");
  bottoneMenu        = document.getElementById("bottone-menu");
  secondiRestartSpan = document.getElementById("secondi-restart");
  reactionImageEl    = document.getElementById("reaction-image");
  titoloGameoverEl   = document.getElementById("titolo-gameover");

  // elementi meteo (input + bottone + stato)
  cityInputEl     = document.getElementById("city-input");
  weatherBtnEl    = document.getElementById("weather-btn");
  weatherStatusEl = document.getElementById("weather-status");

  // click sul bottone "LOAD WEATHER"
  if (weatherBtnEl) {
    weatherBtnEl.addEventListener("click", () => {
      caricaMeteoDaCityInput();
    });
  }

  // volume + back to menu
  volumeBtn   = document.getElementById("volume-btn");
  backMenuBtn = document.getElementById("back-menu-btn");

  // gestione volume
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

  // bottone per tornare al menu dalla schermata di gioco
  if (backMenuBtn) {
    backMenuBtn.addEventListener("click", () => {
      tornaAlMenu();
    });
  }

  // selettore delle skin
  const skinOptionEls = document.querySelectorAll(".skin-option");
  skinOptionEls.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      selectedAvatarIndex = index;

      skinOptionEls.forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");

      updateDynamicPositions();
    });
  });

  // bottone start game nel menu
  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startGame(selectedAvatarIndex);
    });
  }

  // bottoni dentro la schermata gameover
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


  // input da tastiera
  window.addEventListener("keydown", handleKeyDown);

  // controlli touch (mobile)
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

  // stato iniziale meteo: tema di default + testo "Not loaded"
  applicaTemaMeteo(null);
  aggiornaWeatherStatus("Not loaded", null);

  // preparo la board in background (maze + dots) e mostro il menu
  maze = createMaze();
  initializeDots();
  showScreen("menu");
});
