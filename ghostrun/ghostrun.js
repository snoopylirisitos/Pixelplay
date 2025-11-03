// --- Constantes y Parámetros ---

const GROUND_Y = 50; 
const PLAYER_SIZE = 80; 
const GHOST_SIZE = 70;

const SPRITE_LEFT = 'personajeghostrun1.png';
const SPRITE_RIGHT = 'personajeghostrun2.png';

const LEVELS = [
    { duration: 60, spawnMin: 1500, spawnDecay: 20, baseSpeed: 3, speedBonus: 2 }, 
    { duration: 90, spawnMin: 1000, spawnDecay: 30, baseSpeed: 4, speedBonus: 3 }, 
    { duration: 120, spawnMin: 800, spawnDecay: 40, baseSpeed: 5, speedBonus: 4 }
];

// --- Clase Principal del Juego: GhostRun ---

class GhostRun {
    constructor() {
        // Referencias del DOM
        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.winScreen = document.getElementById('win-screen');
        this.loseScreen = document.getElementById('lose-screen');
        this.startButton = document.getElementById('startButton');
        this.player = document.getElementById('player');
        this.gameContainer = document.getElementById('game-container');
        this.timeBar = document.getElementById('time-bar');
        this.loseSound = document.getElementById('lose-sound');
        this.backgroundMusic = document.getElementById('background-music');
        this.winMessage = document.querySelector('#win-screen p:nth-child(2)');
        this.loseMessage = document.querySelector('#lose-screen .press-enter');
        this.winEnterText = document.querySelector('#win-screen .press-enter');
        
        // Variables de Estado
        this.currentLevel = 0;
        this.isPlaying = false;
        this.isJumping = false;
        this.playerX = 50;
        this.playerY = GROUND_Y;
        this.velocityY = 0;
        this.gameTimer = 0;
        this.keys = {};
        
        // Referencias de Intervalos y Timeouts
        this.gameInterval = null;
        this.ghostInterval = null;
        this.winTimeout = null; // NUEVO: Para corregir el bug
        
        // Parámetros de Movimiento
        this.jumpStrength = 20;
        this.gravity = 1.2;
        this.speed = 10;
        
        this.bindEvents();
        this.showScreen(this.menuScreen);
    }

    // --- Métodos de Control de Pantallas y Eventos ---

    showScreen(screen) {
        [this.menuScreen, this.gameScreen, this.winScreen, this.loseScreen].forEach(s => {
            s.classList.remove('active-screen');
        });
        screen.classList.add('active-screen');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => {
            this.currentLevel = 0; // Siempre inicia desde el nivel 1 al presionar JUGAR
            this.startGame();
        });

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    // --- Métodos de Juego ---

    startGame() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.gameTimer = 0;
        this.playerX = 50;
        this.playerY = GROUND_Y;
        this.isJumping = false;
        this.velocityY = 0;
        this.timeBar.style.width = '100%';
        this.player.src = SPRITE_RIGHT;
        
        const levelData = LEVELS[this.currentLevel];

        // Música
        this.backgroundMusic.currentTime = 0; 
        this.backgroundMusic.play().catch(e => console.error("Error al reproducir música:", e));

        // Limpiar
        document.querySelectorAll('.ghost').forEach(g => g.remove());

        this.showScreen(this.gameScreen);
        this.updatePlayerPosition(); 
        
        // Iniciar bucles
        this.gameInterval = setInterval(this.gameLoop.bind(this), 1000 / 60); 
        if (this.ghostInterval) clearInterval(this.ghostInterval);
        this.ghostInterval = setInterval(this.spawnGhost.bind(this), levelData.spawnMin); 
        
        // NUEVO: Temporizador de victoria
        if (this.winTimeout) clearTimeout(this.winTimeout);
        this.winTimeout = setTimeout(() => this.checkWinCondition(this.currentLevel), levelData.duration * 1000);
    }

    gameOver(win) {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        clearInterval(this.gameInterval);
        clearInterval(this.ghostInterval);
        if (this.winTimeout) clearTimeout(this.winTimeout); // CORRECCIÓN DEL BUG
        
        this.backgroundMusic.pause(); 

        if (win) {
            this.currentLevel++; 
            
            if (this.currentLevel < LEVELS.length) {
                this.winMessage.textContent = `¡Sobreviviste ${LEVELS[this.currentLevel - 1].duration} segundos!`;
                this.winEnterText.textContent = `Presiona ENTER para Nivel ${this.currentLevel + 1}`;
                this.showScreen(this.winScreen);
            } else {
                this.currentLevel = 0;
                this.winMessage.textContent = '¡HAS GANADO EL JUEGO!';
                this.winEnterText.textContent = 'Presiona ENTER para comenzar desde el inicio';
                this.showScreen(this.winScreen);
            }
        } else {
            this.currentLevel = 0; 
            this.loseSound.currentTime = 0;
            this.loseSound.play();
            this.loseMessage.textContent = 'Presiona ENTER para comenzar desde el inicio';
            this.showScreen(this.loseScreen);
        }
    }
    
    checkWinCondition(levelCompleted) {
        if (this.isPlaying && levelCompleted === this.currentLevel) {
            this.gameOver(true); 
        }
    }

    // --- Métodos del Bucle de Juego ---

    gameLoop() {
        if (!this.isPlaying) return;

        this.handlePlayerMovement();
        this.handleGhosts();

        this.gameTimer += 1 / 60; 
        this.updateTimeBar();
    }

    handlePlayerMovement() {
        // Movimiento Horizontal
        if (this.keys['ArrowRight']) {
            this.playerX = Math.min(this.gameContainer.clientWidth - PLAYER_SIZE, this.playerX + this.speed);
            this.player.src = SPRITE_RIGHT; 
        }
        if (this.keys['ArrowLeft']) {
            this.playerX = Math.max(0, this.playerX - this.speed);
            this.player.src = SPRITE_LEFT; 
        }
        
        // Salto y Gravedad
        if (this.isJumping) {
            this.velocityY -= this.gravity;
            this.playerY += this.velocityY;
            
            if (this.playerY <= GROUND_Y) {
                this.playerY = GROUND_Y;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }

        this.updatePlayerPosition();
    }

    handleGhosts() {
        const ghosts = document.querySelectorAll('.ghost');
        for (let i = 0; i < ghosts.length; i++) {
            const ghost = ghosts[i];
            let ghostY = parseFloat(ghost.style.top);
            const ghostSpeed = parseFloat(ghost.dataset.speed);
            
            ghostY += ghostSpeed;
            ghost.style.top = `${ghostY}px`;

            // Colisión
            if (this.checkCollision(this.player, ghost)) {
                this.gameOver(false); 
                return; 
            }

            // Eliminar si sale de la pantalla
            if (ghostY > this.gameContainer.clientHeight) {
                ghost.remove();
            }
        }
    }

    spawnGhost() {
        if (!this.isPlaying) return;

        const levelData = LEVELS[this.currentLevel];
        const ghost = document.createElement('img');
        ghost.src = 'ghost.png';
        ghost.classList.add('ghost');
        
        const containerWidth = this.gameContainer.clientWidth;
        const startX = Math.random() * (containerWidth - GHOST_SIZE); 
        
        ghost.style.left = `${startX}px`;
        ghost.style.top = `0px`;
        
        let difficultyBonus = Math.min(this.gameTimer / 10, 5); 
        const ghostSpeed = levelData.baseSpeed + difficultyBonus + Math.random() * levelData.speedBonus;
        ghost.dataset.speed = ghostSpeed; 
        
        this.gameContainer.appendChild(ghost);

        // Ajustar dificultad (frecuencia de aparición)
        if (this.ghostInterval) clearInterval(this.ghostInterval);
        let newInterval = Math.max(levelData.spawnMin - (this.gameTimer * levelData.spawnDecay), levelData.spawnMin / 2);
        this.ghostInterval = setInterval(this.spawnGhost.bind(this), newInterval);
    }
    
    // --- Métodos de DOM y Utilidad ---

    updatePlayerPosition() {
        this.player.style.left = `${this.playerX}px`;
        this.player.style.bottom = `${this.playerY}px`;
    }

    updateTimeBar() {
        const totalDuration = LEVELS[this.currentLevel].duration;
        const percentage = 100 - (this.gameTimer / totalDuration) * 100;
        this.timeBar.style.width = `${percentage}%`;
    }

    checkCollision(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        return (
            rect1.left < rect2.right &&
            rect1.right > rect2.left &&
            rect1.top < rect2.bottom &&
            rect1.bottom > rect2.top
        );
    }
    
    // --- Manejo de Entradas (Input Handlers) ---

    handleKeyDown(e) {
        this.keys[e.key] = true;

        if (e.key === 'ArrowUp' && !this.isJumping) {
            this.isJumping = true;
            this.velocityY = this.jumpStrength;
        }

        // Volver a jugar (después de ganar o perder)
        if (e.key === 'Enter' && !this.isPlaying) {
            if (this.winScreen.classList.contains('active-screen') || this.loseScreen.classList.contains('active-screen')) {
                this.startGame();
            }
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
}

// Inicialización: Crear una instancia de la clase para iniciar el juego
document.addEventListener('DOMContentLoaded', () => {
    new GhostRun();
});