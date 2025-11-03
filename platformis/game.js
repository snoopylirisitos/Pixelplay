// --- CONSTANTES GLOBALES Y PARÁMETROS ---
const GRAVITY = 0.5;
const JUMP_STRENGTH = 10;
const MOVE_SPEED = 4;
const PLAYER_SIZE = 40;
const PLATFORM_HEIGHT = 20;

// --- CLASE PRINCIPAL DEL JUEGO: PlatformisGame (POO) ---

class PlatformisGame {
    constructor() {
        // DOM y Contexto
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.startScreen = document.getElementById("start-screen");
        this.selectScreen = document.getElementById("character-select");
        this.winScreen = document.getElementById("win-screen");
        this.loseScreen = document.getElementById("lose-screen");
        this.loseMsgEl = document.getElementById("lose-msg");

        // Audios
        this.bgMusic = document.getElementById("bg-music");
        this.winSound = document.getElementById("win-sound");
        this.loseSound = document.getElementById("lose-sound");

        // Estado del Juego
        this.gameRunning = false;
        this.gameOverFlag = false;
        this.keys = {};
        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.playerImage = null;
        this.animationFrameId = null; // Para control del loop

        this.resizeCanvas();
        window.addEventListener("resize", this.resizeCanvas.bind(this));
        this.bindEvents();
    }

    resizeCanvas() {
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
    }

    bindEvents() {
        // 1. Iniciar Selección
        document.getElementById("play-btn").addEventListener("click", () => {
            this.showScreen(this.selectScreen);
            this.bgMusic.currentTime = 0;
            this.bgMusic.play().catch(e => console.error("Error al reproducir música:", e));
        });

        // 2. Selección de Personaje e Inicio de Juego
        document.querySelectorAll(".characters img").forEach(img => {
            img.addEventListener("click", (e) => this.handleCharacterSelect(e.target));
        });

        // 3. Controles del Juego
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
        document.addEventListener("keyup", (e) => this.keys[e.key] = false);
    }

    handleCharacterSelect(imgElement) {
        const selectedId = imgElement.dataset.id;
        
        // Cargar imagen
        this.playerImage = new Image();
        this.playerImage.src = `img/player${selectedId}.png`;

        // Resetear visualmente la selección
        document.querySelectorAll(".characters img").forEach(img => img.classList.remove('selected'));
        imgElement.classList.add('selected');

        // Ocultar selección e iniciar el juego
        this.showScreen(null); // Oculta todas las pantallas de menú
        this.startGame();
    }

    // --- LÓGICA DE PANTALLAS ---

    showScreen(screenElement) {
        [this.startScreen, this.selectScreen, this.winScreen, this.loseScreen].forEach(el => {
            el.classList.add('hidden');
        });
        if (screenElement) {
            screenElement.classList.remove('hidden');
        }
    }

    // --- LÓGICA DEL JUEGO ---

    startGame() {
        this.gameRunning = true;
        this.gameOverFlag = false;
        
        // Reiniciar estado del jugador (si no existía, se crea)
        this.player = { 
            x: 100, y: 100, 
            w: PLAYER_SIZE, h: PLAYER_SIZE, 
            vx: 0, vy: 0, onPlatform: false 
        };
        
        this.generateLevel();
        this.bgMusic.play(); // Asegura que la música sigue si ya la iniciamos
        this.loop();
    }

    generateLevel() {
        this.platforms = [];
        this.enemies = [];

        // Plataforma inicial fija
        const startPlatform = {
            x: 50,
            y: this.canvas.height / 2,
            w: 200,
            h: PLATFORM_HEIGHT,
            vx: 0,
            isStart: true
        };
        this.platforms.push(startPlatform);

        this.player.x = startPlatform.x + 20;
        this.player.y = startPlatform.y - this.player.h;

        // Plataformas aleatorias
        for (let i = 0; i < 10; i++) {
            let randomY;
            do {
                randomY = Math.random() * (this.canvas.height - 50);
            } while (randomY > startPlatform.y - 80 && randomY < startPlatform.y + startPlatform.h + 80); // Evitar colisión con inicio

            this.platforms.push({
                x: Math.random() * (this.canvas.width - 150),
                y: randomY,
                w: 150,
                h: PLATFORM_HEIGHT,
                vx: (Math.random() - 0.5) * 1.5 // Movimiento un poco más rápido
            });
        }

        // Generar enemigos
        for (let i = 0; i < 5; i++) {
            const type = Math.random() < 0.5 ? "💣" : "🔪";
            this.enemies.push({
                emoji: type,
                x: 200 + Math.random() * (this.canvas.width - 300),
                y: 100 + Math.random() * (this.canvas.height - 200),
                w: 40, h: 40,
                vx: type === "🔪" ? (Math.random() < 0.5 ? 2 : -2) : 0
            });
        }
    }

    // --- BUCLE DE JUEGO Y ACTUALIZACIONES ---

    loop() {
        if (!this.gameRunning) {
            cancelAnimationFrame(this.animationFrameId);
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updatePlayer();
        this.updatePlatforms();
        this.updateEnemies();

        this.drawPlatforms();
        this.drawEnemies();
        this.drawPlayer();

        this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    updatePlayer() {
        // Aplicar gravedad
        this.player.vy += GRAVITY; 
        
        // Movimiento horizontal
        this.player.vx = 0;
        if (this.keys["ArrowLeft"]) this.player.vx = -MOVE_SPEED;
        else if (this.keys["ArrowRight"]) this.player.vx = MOVE_SPEED;

        // Aplicar movimiento
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        // Colisiones con plataformas
        this.player.onPlatform = false;
        for (const p of this.platforms) {
            if (this.checkPlatformCollision(this.player, p)) {
                this.player.y = p.y - this.player.h;
                this.player.vy = 0;
                this.player.onPlatform = true;
                this.player.x += p.vx; // Mover con la plataforma
            }
        }

        // Colisión con enemigos
        for (const e of this.enemies) {
            if (this.checkAABBCollision(this.player, e)) {
                this.gameOver("💀 Te atraparon!");
                return;
            }
        }

        // Condiciones de fin de juego
        if (this.player.y > this.canvas.height) {
            this.gameOver("💀 Te caíste!");
            return;
        }
        if (this.player.x + this.player.w >= this.canvas.width) {
            this.winGame();
            return;
        }
    }

    updatePlatforms() {
        for (const p of this.platforms) {
            p.x += p.vx;
            if (p.x < 0 || p.x + p.w > this.canvas.width) p.vx *= -1;
        }
    }

    updateEnemies() {
        for (const e of this.enemies) {
            e.x += e.vx;
            if (e.x < 0 || e.x + e.w > this.canvas.width) e.vx *= -1;
        }
    }

    // --- MÉTODOS DE DIBUJO ---

    drawPlatforms() {
        for (const p of this.platforms) {
            this.ctx.fillStyle = p.isStart ? "rgba(0, 255, 153, 0.8)" : "rgba(255, 255, 255, 0.8)";
            this.ctx.shadowColor = p.isStart ? "#00ff99" : "#fff";
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
            this.ctx.shadowBlur = 0; // Resetear sombra para otros dibujos

            if (p.isStart) {
                // Dibujar bandera
                this.ctx.fillStyle = "red";
                this.ctx.beginPath();
                this.ctx.moveTo(p.x + p.w - 20, p.y);
                this.ctx.lineTo(p.x + p.w - 20, p.y - 30);
                this.ctx.lineTo(p.x + p.w - 5, p.y - 25);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }

    drawEnemies() {
        this.ctx.font = "40px 'Press Start 2P'"; // Usar la fuente pixel
        this.ctx.textAlign = "left";
        this.ctx.shadowColor = "#ff0000";
        this.ctx.shadowBlur = 5;
        for (const e of this.enemies) {
            this.ctx.fillText(e.emoji, e.x, e.y + e.h * 0.9);
        }
        this.ctx.shadowBlur = 0;
    }

    drawPlayer() {
        if (this.playerImage && this.playerImage.complete) {
            this.ctx.drawImage(this.playerImage, this.player.x, this.player.y, this.player.w, this.player.h);
        } else {
            this.ctx.fillStyle = "yellow";
            this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
        }
    }

    // --- MÉTODOS DE COLISIÓN Y FIN DE JUEGO ---

    checkAABBCollision(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    }

    checkPlatformCollision(player, platform) {
        // Colisión superior de la plataforma
        return (
            player.x < platform.x + platform.w &&
            player.x + player.w > platform.x &&
            player.y + player.h > platform.y && 
            player.y + player.h < platform.y + platform.h + 5 && // Permite un pequeño margen
            player.vy >= 0
        );
    }
    
    // --- MANEJO DE INPUTS Y ESTADO ---

    handleKeyDown(e) {
        this.keys[e.key] = true;

        // Salto
        if ((e.key === " " || e.key === "ArrowUp") && this.player && this.player.onPlatform) {
            this.player.vy = -JUMP_STRENGTH;
            this.player.onPlatform = false;
        }

        // Reinicio con ENTER
        if ((this.gameOverFlag || !this.gameRunning) && e.key === "Enter") {
            this.showScreen(this.startScreen); // Vuelve a la pantalla inicial
            this.winSound.pause();
            this.loseSound.pause();
            this.bgMusic.currentTime = 0;
        }
    }

    gameOver(msg) {
        if (!this.gameRunning) return;
        this.gameRunning = false;
        this.gameOverFlag = true;
        
        this.bgMusic.pause();
        this.loseSound.currentTime = 0;
        this.loseSound.play();
        
        this.loseMsgEl.textContent = msg;
        this.showScreen(this.loseScreen);
    }

    winGame() {
        if (!this.gameRunning) return;
        this.gameRunning = false;
        this.gameOverFlag = true;

        this.bgMusic.pause();
        this.winSound.currentTime = 0;
        this.winSound.play();
        
        this.showScreen(this.winScreen);
    }
}

// Inicialización:
document.addEventListener('DOMContentLoaded', () => {
    new PlatformisGame();
});