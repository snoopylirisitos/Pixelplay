// --- CONSTANTES GLOBALES ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 64;     
const SPEED = 6;          
const COLLISION_MARGIN = 16; 
const MAX_ENERGY = 100;
const ENERGY_REGEN = 0.5;

const TEXT_SPEED = 2; 

const ABILITIES = { 
    // Ahora Tierra puede cambiar Agua (1) por Barro (5) O detener una Roca Móvil (4)
    TIERRA_TERRAFORMA: { key: 'q', cost: 30, cooldown: 90, duration: 180, tileToChange: 1, newTile: 5 },
    TIERRA_STOP_ROCK: { key: 'q', cost: 15, cooldown: 45, duration: 120 }, // Menor costo para la Roca
    AIRE_DASH: { key: 'Shift', cost: 20, cooldown: 120, duration: 15, speedMultiplier: 3 }
};
        
// --- DEFINICIÓN DE SPRITES ---
const SPRITE_PATHS = {
    'tierra_idle_right': 'tierra_idle_right.png',
    'tierra_idle_left': 'tierra_idle_left.png',
    'tierra_right': 'tierra_right.png',
    'tierra_left': 'tierra_left.png',
    'aire_idle_right': 'aire_idle_right.png',
    'aire_idle_left': 'aire_idle_left.png',
    'aire_right': 'aire_right.png',
    'aire_left': 'aire_left.png',
    'fondotierraaire': 'fondotierraaire.jpg',
    'coin_sprite': 'coin.png' 
};
const ASSET_LIST = Object.values(SPRITE_PATHS);

// --- DEFINICIÓN DEL MAPA ---
// Añadimos una sección de Roca (2) y una de Agua (1) para probar las habilidades
const LEVEL_MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0], 
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3], 
];
const MAP_ROWS = LEVEL_MAP.length;
const MAP_COLS = LEVEL_MAP[0].length;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

// --- POSICIONES DE MONEDAS ---
const COIN_POSITIONS = [
    { row: 2, col: 1 }, 
    { row: 13, col: 15 }, 
    { row: 8, col: 10 } 
];

// --- CLASE: MovingObstacle (La Roca Móvil) ---
class MovingObstacle {
    constructor(startX, startY, endX, endY, speed) {
        this.x = startX * TILE_SIZE;
        this.y = startY * TILE_SIZE;
        this.startX = startX * TILE_SIZE;
        this.startY = startY * TILE_SIZE;
        this.endX = endX * TILE_SIZE;
        this.endY = endY * TILE_SIZE;
        this.speed = speed;
        this.size = TILE_SIZE;
        this.dx = 0;
        this.dy = 0;
        this.isStopped = false;
        this.stopTimer = 0;
        this.startMoving();
    }

    startMoving() {
        const dx = this.endX - this.x;
        const dy = this.endY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.dx = (dx / dist) * this.speed;
        this.dy = (dy / dist) * this.speed;
        this.currentTargetX = this.endX;
        this.currentTargetY = this.endY;
    }

    update() {
        if (this.isStopped) {
            this.stopTimer--;
            if (this.stopTimer <= 0) {
                this.isStopped = false;
                this.startMoving();
            }
            return;
        }

        this.x += this.dx;
        this.y += this.dy;

        const atTarget = (
            Math.abs(this.x - this.currentTargetX) < this.speed && 
            Math.abs(this.y - this.currentTargetY) < this.speed
        );

        if (atTarget) {
            this.x = this.currentTargetX;
            this.y = this.currentTargetY;
            
            // Cambiar dirección
            if (this.currentTargetX === this.endX && this.currentTargetY === this.endY) {
                this.currentTargetX = this.startX;
                this.currentTargetY = this.startY;
            } else {
                this.currentTargetX = this.endX;
                this.currentTargetY = this.endY;
            }
            this.startMoving();
        }
    }
    
    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        ctx.fillStyle = this.isStopped ? '#808080' : '#4E4E4E'; // Gris o Gris oscuro
        ctx.fillRect(screenX, screenY, this.size, this.size);
        
        // Indicador de estado
        if (this.isStopped) {
             ctx.fillStyle = '#FFFFFF';
             ctx.font = '10px Press Start 2P';
             ctx.textAlign = 'center';
             ctx.fillText('STOP', screenX + this.size / 2, screenY + this.size / 2 + 5);
        }
    }
    
    // Obtener la baldosa más cercana a la posición actual (para colisión)
    getTileBounds() {
        const col = Math.floor(this.x / TILE_SIZE);
        const row = Math.floor(this.y / TILE_SIZE);
        return { col, row };
    }
}


// --- CLASE: Player (Mismos métodos, pero ahora debe chocar con la Roca Móvil) ---
class Player {
    constructor(name, x, y, baseSpriteName, controls, element) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.size = TILE_SIZE; 
        this.controls = controls;
        this.element = element; 
        this.dx = 0; 
        this.dy = 0;
        this.baseSpriteName = baseSpriteName; 
        this.lastDirection = 'right'; 
        this.currentSpriteKey = `${baseSpriteName}_idle_right`; 
        this.energy = MAX_ENERGY;
        this.cooldown = 0; 
        this.dashFrames = 0; 
        this.terraformaTarget = null; 
    }

    // Adaptamos canMoveTo para recibir el obstáculo móvil
    canMoveTo(newX, newY, movingObstacle) {
        if (newX < 0 || newX > WORLD_WIDTH - this.size || newY < 0 || newY > WORLD_HEIGHT - this.size) return false;

        const margin = COLLISION_MARGIN / 2;
        const checkPoints = [
            { x: newX + margin, y: newY + margin },                              
            { x: newX + this.size - margin, y: newY + margin },              
            { x: newX + margin, y: newY + this.size - margin },              
            { x: newX + this.size - margin, y: newY + this.size - margin } 
        ];
        const isDashing = (this.element === 'Aire' && this.dashFrames > 0);

        for (const point of checkPoints) {
            const col = Math.floor(point.x / TILE_SIZE);
            const row = Math.floor(point.y / TILE_SIZE);
            if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) continue; 
            
            const tileType = LEVEL_MAP[row][col];
            if (this.element === 'Tierra' && tileType === 1) return false; 
            
            // Tierra puede pasar barro (5)
            if (this.element === 'Tierra' && tileType === 5) continue; 
            
            if (this.element === 'Aire' && tileType === 2) {
                if (!isDashing) return false;
            }
        }
        
        // Comprobar colisión con la roca móvil
        if (movingObstacle && !movingObstacle.isStopped) {
            const dx = newX - movingObstacle.x;
            const dy = newY - movingObstacle.y;
            const collisionDist = TILE_SIZE - COLLISION_MARGIN; 
            
            if (Math.abs(dx) < collisionDist && Math.abs(dy) < collisionDist) {
                // Aire puede chocar si está dashiando, pero es mala práctica. 
                // Simplificamos: La roca es un obstáculo duro.
                return false; 
            }
        }
        
        return true;
    }

    update(movingObstacle) { // Recibe el obstáculo móvil
        this.energy = Math.min(MAX_ENERGY, this.energy + ENERGY_REGEN);
        if (this.cooldown > 0) this.cooldown--;
        
        let currentSpeed = SPEED;
        if (this.element === 'Aire' && this.dashFrames > 0) {
            currentSpeed *= ABILITIES.AIRE_DASH.speedMultiplier;
            this.dashFrames--;
        }

        let newX = this.x + this.dx * currentSpeed;
        let newY = this.y + this.dy * currentSpeed;

        // Pasamos el movingObstacle a canMoveTo
        if (this.dx !== 0 && this.canMoveTo(newX, this.y, movingObstacle)) { 
            this.x = newX;
        }
        
        if (this.dy !== 0 && this.canMoveTo(this.x, newY, movingObstacle)) { 
            this.y = newY;
        }
        
        if (this.dx < 0) { 
            this.currentSpriteKey = `${this.baseSpriteName}_left`;
            this.lastDirection = 'left';
        } else if (this.dx > 0) { 
            this.currentSpriteKey = `${this.baseSpriteName}_right`;
            this.lastDirection = 'right';
        } else {
            this.currentSpriteKey = `${this.baseSpriteName}_idle_${this.lastDirection}`;
        }
    }
    
    draw(ctx, cameraX, cameraY, images) {
        // ... (código de dibujo de jugador y barra de energía)
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        const currentSprite = images[SPRITE_PATHS[this.currentSpriteKey]];

        if (currentSprite) {
            ctx.drawImage(currentSprite, screenX, screenY, this.size, this.size);
        } else {
            ctx.fillStyle = this.element === 'Tierra' ? '#964B00' : '#ADD8E6';
            ctx.fillRect(screenX, screenY, this.size, this.size);
        }
        
        const barWidth = this.size;
        const barHeight = 4;
        const barY = screenY - 10;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, barY, barWidth, barHeight);
        
        const energyPercent = this.energy / MAX_ENERGY;
        ctx.fillStyle = this.cooldown > 0 ? '#ff0000' : '#00ff00';
        ctx.fillRect(screenX, barY, barWidth * energyPercent, barHeight);
    }
}

// --- CLASE: DialogManager (Para texto Pixel Art) ---
// (No hay cambios en esta clase)
class DialogManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.messages = [];
        this.currentMessage = '';
        this.fullText = '';
        this.charIndex = 0;
        this.timer = 0;
        this.isTyping = false;
        this.isActive = false;
    }

    queueMessage(text) {
        this.messages.push(text);
        if (!this.isActive) {
            this.startNextMessage();
        }
    }

    startNextMessage() {
        if (this.messages.length > 0) {
            this.isActive = true;
            this.fullText = this.messages.shift();
            this.currentMessage = '';
            this.charIndex = 0;
            this.timer = 0;
            this.isTyping = true;
        } else {
            this.isActive = false;
        }
    }

    update() {
        if (!this.isActive || !this.isTyping) return;

        this.timer++;
        if (this.timer >= TEXT_SPEED) {
            this.timer = 0;
            if (this.charIndex < this.fullText.length) {
                this.currentMessage += this.fullText[this.charIndex];
                this.charIndex++;
            } else {
                this.isTyping = false;
            }
        }
    }

    skip() {
        if (this.isTyping) {
            this.currentMessage = this.fullText;
            this.isTyping = false;
        } else if (this.isActive) {
            this.startNextMessage();
        }
    }

    draw() {
        if (!this.isActive) return;

        const W = CANVAS_WIDTH * 0.9;
        const H = CANVAS_HEIGHT * 0.25;
        const X = CANVAS_WIDTH * 0.05;
        const Y = CANVAS_HEIGHT * 0.70;
        const PADDING = 20;

        // Caja de diálogo estilo Pixel Art
        this.ctx.fillStyle = '#000000'; // Fondo negro
        this.ctx.fillRect(X, Y, W, H);
        this.ctx.strokeStyle = '#FFFFFF'; // Borde blanco
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(X, Y, W, H);
        
        // Texto
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px Press Start 2P';
        
        const lines = this.wrapText(this.currentMessage, W - 2 * PADDING, this.ctx);

        lines.forEach((line, index) => {
            this.ctx.fillText(line, X + PADDING, Y + PADDING + (index * 25));
        });

        // Indicador de avance
        if (!this.isTyping) {
            this.ctx.font = '12px Press Start 2P';
            this.ctx.fillText('[SPACE]', X + W - 90, Y + H - 10);
        }
    }

    wrapText(text, maxWidth, ctx) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? " " : "") + word;
            const width = ctx.measureText(testLine).width;
            
            if (width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines.filter(line => line);
    }
}


// --- CLASE PRINCIPAL DEL JUEGO (TierraYAireGame) ---

class TierraYAireGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.menuContainer = document.getElementById('menu-container');
        this.playButton = document.getElementById('play-button');
        this.gameMusic = document.getElementById('game-music');

        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.images = {};
        this.assetsLoaded = false;
        this.isGameOver = false;
        this.isGamePaused = false; 

        this.dialogManager = new DialogManager(this.ctx);
        this.initialDialogShown = false; 
        
        // NUEVA PROPIEDAD: Obstáculo móvil
        this.movingObstacle = new MovingObstacle(1, 1, 6, 1, 2); // De (1, 1) a (6, 1) a velocidad 2

        this.bindMenuEvents(); 
    }
    
    // --- Lógica de Menú/Inicio CORREGIDA (CRUCIAL) ---
    bindMenuEvents() {
        this.playButton.addEventListener('click', () => {
            // MOSTRAR CANVAS Y OCULTAR MENÚ
            this.menuContainer.style.display = 'none';
            this.canvas.style.display = 'block'; // ESTO HACE VISIBLE EL CANVAS
            
            console.log("Juego iniciado: el Canvas debería ser visible ahora.");

            this.gameMusic.volume = 0.4;
            this.gameMusic.play().catch(e => console.log("Música iniciada por interacción."));
            
            // Inicializar jugadores y configuración
            this.playerTierra = new Player(
                'Tierra', TILE_SIZE * 2, WORLD_HEIGHT / 2, 'tierra', 
                { up: 'w', down: 's', left: 'a', right: 'd' }, 'Tierra'
            );
            this.playerAire = new Player(
                'Aire', TILE_SIZE * 4, WORLD_HEIGHT / 2, 'aire', 
                { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, 'Aire'
            );
            this.players = [this.playerTierra, this.playerAire];
            this.keys = {};

            this.coinsCollected = 0;
            this.activeCoins = COIN_POSITIONS.map(pos => ({ ...pos, collected: false, tutorial: false }));
            
            this.loadAssets().then(() => {
                this.assetsLoaded = true;
                this.bindGameEvents();
                
                this.loop(); 
                
                // INICIO DEL JUEGO CON DIÁLOGO (Juego pausado)
                this.isGamePaused = true;
                this.dialogManager.queueMessage("¡Bienvenidos al desafío! Debemos alcanzar la meta juntos.");
                this.dialogManager.queueMessage("¡CUIDADO! Esa roca móvil nos bloquea. Tierra (WASD), usa 'Q' para detenerla temporalmente.");
                this.dialogManager.queueMessage("Aire (Flechas), solo podrás pasarla cuando esté detenida, o usando SHIFT para el Dash en el terreno de roca.");
                this.dialogManager.queueMessage("¡Coleccionemos las 3 monedas y vayamos a la meta!");
                this.initialDialogShown = true;
            });
        });
    }
    
    // ... (loadAssets, bindGameEvents, handleInput - sin cambios importantes) ...

    handleAbilities(key) {
        if (key === ABILITIES.AIRE_DASH.key && this.playerAire.cooldown === 0 && this.playerAire.energy >= ABILITIES.AIRE_DASH.cost) {
            this.playerAire.energy -= ABILITIES.AIRE_DASH.cost;
            this.playerAire.cooldown = ABILITIES.AIRE_DASH.cooldown;
            this.playerAire.dashFrames = ABILITIES.AIRE_DASH.duration;
            return;
        }

        if (key === ABILITIES.TIERRA_TERRAFORMA.key && this.playerTierra.cooldown === 0) {
            this.activateTerraformaOrStopRock();
        }
    }
    
    activateTerraformaOrStopRock() {
        const p = this.playerTierra;
        const abilityTerra = ABILITIES.TIERRA_TERRAFORMA;
        const abilityStop = ABILITIES.TIERRA_STOP_ROCK;
        
        let targetCol = Math.floor((p.x + p.size / 2 + p.dx * TILE_SIZE / 2) / TILE_SIZE);
        let targetRow = Math.floor((p.y + p.size / 2 + p.dy * TILE_SIZE / 2) / TILE_SIZE);

        // 1. INTENTAR DETENER LA ROCA MÓVIL
        const rockTile = this.movingObstacle.getTileBounds();
        const distToRock = Math.abs(rockTile.col - targetCol) + Math.abs(rockTile.row - targetRow);

        if (distToRock <= 1 && !this.movingObstacle.isStopped && p.energy >= abilityStop.cost) {
            this.movingObstacle.isStopped = true;
            this.movingObstacle.stopTimer = abilityStop.duration;
            p.energy -= abilityStop.cost;
            p.cooldown = abilityStop.cooldown;
            return;
        }

        // 2. INTENTAR LA TERRAFORMA
        if (p.energy >= abilityTerra.cost) {
            if (targetRow >= 0 && targetRow < MAP_ROWS && targetCol >= 0 && targetCol < MAP_COLS && LEVEL_MAP[targetRow][targetCol] === abilityTerra.tileToChange) {
                p.energy -= abilityTerra.cost;
                p.cooldown = abilityTerra.cooldown;
                
                LEVEL_MAP[targetRow][targetCol] = abilityTerra.newTile;
                this.playerTierra.terraformaTarget = { row: targetRow, col: targetCol, timer: abilityTerra.duration };
            }
        }
    }


    // ... (checkCoinCollection - sin cambios) ...

    update() {
        if (this.isGameOver) return;
        
        this.dialogManager.update(); 
        
        if (this.isGamePaused) return; 

        // ACTUALIZAR LA ROCA MÓVIL
        this.movingObstacle.update();

        // ACTUALIZAR JUGADORES (con referencia al obstáculo móvil para colisión)
        this.players.forEach(p => p.update(this.movingObstacle));

        // ... (lógica de Terraforma y Cámara)
        if (this.playerTierra.terraformaTarget) {
            this.playerTierra.terraformaTarget.timer--;
            
            if (this.playerTierra.terraformaTarget.timer <= 0) {
                const { row, col } = this.playerTierra.terraformaTarget;
                if (LEVEL_MAP[row][col] === ABILITIES.TIERRA_TERRAFORMA.newTile) {
                    LEVEL_MAP[row][col] = ABILITIES.TIERRA_TERRAFORMA.tileToChange; 
                }
                this.playerTierra.terraformaTarget = null;
            }
        }
        
        this.checkCoinCollection(); 

        let midX = (this.playerTierra.x + this.playerAire.x) / 2;
        let midY = (this.playerTierra.y + this.playerAire.y) / 2;
        this.cameraX = midX - CANVAS_WIDTH / 2;
        this.cameraY = midY - CANVAS_HEIGHT / 2;
        this.cameraX = Math.max(0, Math.min(this.cameraX, WORLD_WIDTH - CANVAS_WIDTH));
        this.cameraY = Math.max(0, Math.min(this.cameraY, WORLD_HEIGHT - CANVAS_HEIGHT));

        this.checkWinCondition();
    }
    
    // ... (checkWinCondition - sin cambios) ...

    draw() {
        if (!this.assetsLoaded) {
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Press Start 2P';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Cargando Assets...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.drawMap();
        
        // DIBUJA EL OBSTÁCULO MÓVIL
        this.movingObstacle.draw(this.ctx, this.cameraX, this.cameraY);

        this.drawCoins(); 

        this.players.sort((a, b) => a.y - b.y).forEach(p => {
            p.draw(this.ctx, this.cameraX, this.cameraY, this.images); 
        });
        
        this.drawHUD();
        this.dialogManager.draw();

        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Press Start 2P';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('¡NIVEL COMPLETADO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            this.ctx.font = '16px Press Start 2P';
            this.ctx.fillText('¡Lo hicimos juntos!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        }
    }

    drawMap() {
        const bgImage = this.images[SPRITE_PATHS['fondotierraaire']];

        if (bgImage) {
            this.ctx.drawImage(bgImage, this.cameraX, this.cameraY, CANVAS_WIDTH, CANVAS_HEIGHT, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
             this.ctx.fillStyle = '#27AE60'; 
             this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        for (let row = 0; row < MAP_ROWS; row++) {
            for (let col = 0; col < MAP_COLS; col++) {
                const tileType = LEVEL_MAP[row][col];
                
                let color;
                if (tileType === 1) color = '#3498DB';      // Agua (Bloquea Tierra)
                else if (tileType === 2) color = '#7F8C8D'; // Roca (Bloquea Aire)
                else if (tileType === 3) color = '#F39C12'; // Meta
                else if (tileType === 5) color = '#A0522D'; // Barro (Temporal de Tierra)
                else continue;

                const worldX = col * TILE_SIZE;
                const worldY = row * TILE_SIZE; 
                
                const screenX = worldX - this.cameraX;
                const screenY = worldY - this.cameraY;

                if (screenX + TILE_SIZE > 0 && screenX < CANVAS_WIDTH &&
                    screenY + TILE_SIZE > 0 && screenY < CANVAS_HEIGHT) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    
                    this.ctx.strokeStyle = '#00000033';
                    this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // ... (drawCoins, drawHUD - sin cambios) ...

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop.bind(this));
    }
}

// Inicialización del juego al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    new TierraYAireGame();
});