# Assignment 01

## Brief

Choose a “mini-game” to rebuild with HTML, CSS and JavaScript. The requirements are:

- The webpage should be responsive
- Choose an avatar at the beginning of the game
- Keep track of the score of the player
- Use the keyboard to control the game (indicate what are the controls in the page). You can also use buttons (mouse), but also keyboard.
- Use some multimedia files (audio, video, …)
- Implement an “automatic restart” in the game (that is not done via the refresh of the page)



## Screenshots

![Game start window](./docs/img_pacman_01.png)
![Game image](./docs/img_pacman_02.png)
![Game over panel](./docs/img_pacman_03.png)


## Short project description 

Pacman is a simplified reproduction of the iconic arcade game. The player selects a starting skin, moves through the maze using the arrow keys, collects points, and avoids ghosts. When a collision occurs, a game-over screen appears and an automatic restart is triggered.


## Function List
## Function List

### riproduciSuono(audio)
- **Parameters:** `audio` (HTMLAudioElement)  
- **Logic:** Plays the provided audio file from the beginning if the global `volumeOn` flag is enabled. If the volume is disabled, the function exits without playing the sound.  
- **Returns:** `void`

### avviaMusicaGioco()
- **Parameters:** none  
- **Logic:** Starts the looping background soundtrack used during gameplay, only if the volume is active.  
- **Returns:** `void`

### fermaMusicaGioco()
- **Parameters:** none  
- **Logic:** Pauses the background music without resetting its playback position.  
- **Returns:** `void`

### fermaTuttiISuoni()
- **Parameters:** none  
- **Logic:** Pauses all the main audio tracks (start, playing and game-over sounds), stopping any sound currently playing.  
- **Returns:** `void`

### createMaze()
- **Parameters:** none  
- **Logic:** Creates and returns a 2D array representing the maze layout. Borders and predefined internal obstacles are marked as walls (1), while all other cells are walkable (0).  
- **Returns:** `number[][]` (maze matrix)

### initializeDots()
- **Parameters:** none  
- **Logic:** Iterates through the maze and collects the coordinates of all walkable cells in the inner area. Each valid cell is added to the global `dots` array.  
- **Returns:** `void`

### `removeDotElement(x, y)`
- **Parameters:** `x` (number), `y` (number)  
- **Logic:** Removes the DOM element representing a dot at the given coordinates, reflecting that Pac-Man has collected it.  
- **Returns:** `void`

### showScreen(name)
- **Parameters:** `name` (string: `"menu"` or `"playing"`)  
- **Logic:** Toggles visibility between the menu and game screens and updates the global `gameState`. It also ensures that the background music stops when the game screen is not active.  
- **Returns:** `void`

### clearBoard()
- **Parameters:** none  
- **Logic:** Clears the board container by removing all its child elements and resets the references for Pac-Man and ghost DOM nodes.  
- **Returns:** `void`

### renderBoard()
- **Parameters:** none  
- **Logic:** Renders all visual elements of the game (maze walls, dots, ghosts, Pac-Man). After creating the elements, it calls `updateDynamicPositions()` to place them on screen.  
- **Returns:** `void`

### `updateDynamicPositions()`
- **Parameters:** none  
- **Logic:** Updates the screen position, rotation and visual style of Pac-Man and the ghosts based on their current coordinates, direction and selected skin.  
- **Returns:** `void`

### updateHUD()
- **Parameters:** none  
- **Logic:** Updates the score displayed in the HUD by setting it to the current `score` value.  
- **Returns:** `void`

### resetGhosts()
- **Parameters:** none  
- **Logic:** Resets the ghosts array using predefined starting positions and image paths for each ghost.  
- **Returns:** `void`

### checkCollision()
- **Parameters:** none  
- **Logic:** Checks whether Pac-Man occupies the same grid cell as any ghost.  
- **Returns:** `boolean` (true if a collision is detected)

### fermaTimerAutoRestart()
- **Parameters:** none  
- **Logic:** Stops the automatic restart countdown by clearing the active interval stored in `restartCountdownId` and resetting the reference.  
- **Returns:** `void`

### avviaTimerAutoRestart()
- **Parameters:** none  
- **Logic:** Starts the countdown shown in the game-over panel. It updates the timer every second and restarts the game automatically when the countdown reaches zero.  
- **Returns:** `void`

### gestisciCollisione()
- **Parameters:** none  
- **Logic:** Handles a collision between Pac-Man and a ghost. It stops all movement, stops the background music, plays the game-over sound, updates the final score, shows the game-over overlay, starts the automatic restart timer and sets the `gameState` to `"gameover"`.  
- **Returns:** `void`

### moveGhosts()
- **Parameters:** none  
- **Logic:** For each ghost, determines valid adjacent directions, selects one at random and updates its position. Then refreshes their on-screen positions and checks for collisions with Pac-Man.  
- **Returns:** `void`

### startGhosts()
- **Parameters:** none  
- **Logic:** Starts the ghosts’ movement loop by calling `moveGhosts()` at fixed intervals. Clears any previously active interval before starting a new one.  
- **Returns:** `void`

### stopGhosts()
- **Parameters:** none  
- **Logic:** Stops the ghosts’ movement loop by clearing the interval and resetting the reference.  
- **Returns:** `void`

### tryMovePacman()
- **Parameters:** none  
- **Logic:** Computes the next cell based on Pac-Man’s direction and checks if it is walkable. If valid, updates Pac-Man’s position, handles dot collection, updates the score and checks for collisions. If all dots are eaten, it resets the dots and board for a new level.  
- **Returns:** `void`

### startPacmanAutoMove()
- **Parameters:** none  
- **Logic:** Starts the automatic movement loop for Pac-Man. If the loop is already running, the function does nothing.  
- **Returns:** `void`

### handleKeyDown(e)
- **Parameters:** `e` (KeyboardEvent)  
- **Logic:** Handles keyboard input during gameplay. Updates Pac-Man’s direction based on arrow keys and, if needed, starts the automatic movement loop and triggers an initial step.  
- **Returns:** `void`

### startGame(avatarIndex)
- **Parameters:** `avatarIndex` (number)  
- **Logic:** Initializes a new game session. It stores the selected skin, hides the game-over panel, resets the restart timer, resets Pac-Man, dots, ghosts and score, updates the HUD, sets the board size, renders the board, shows the game screen, starts the ghosts’ loop and plays the start sound.  
- **Returns:** `void`



### Content and data sources (link)

