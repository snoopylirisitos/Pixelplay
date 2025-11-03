// --- CONSTANTES Y PARÁMETROS ---
const PLAYER_SIZE = 100; 
const PLAYER_SPEED = 9;
const BOOST_SIZE = 15; 
const PROJECTILE_SIZE = 10; 
const PROJECTILE_SPEED = 15; 
const SHOOT_COOLDOWN = 200; 
const PLAYER_FLOAT_LIMIT = 5; // Pixeles de desplazamiento de la animación flotante

const ASTEROID_TYPES = {
    small: { size: 75, speed: 4.5, sprite: 'asteroid_small.png', score: 10 }, 
    medium: { size: 100, speed: 3.5, sprite: 'asteroid_medium.png', score: 25 }, 
    large: { size: 130, speed: 2.5, sprite: 'asteroid_large.png', score: 50 } 
};

// --- CLASE PRINCIPAL DEL JUEGO: SpaceHeroGame (POO) ---

class SpaceHeroGame {
    constructor() {
        // DOM y Contexto
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.startScreen = document.getElementById("start-screen");
        this.loseScreen = document.getElementById("lose-screen");
        this.finalScoreElement = document.getElementById("final-score");

        // Audios (Asegúrate que tienes estos archivos en tu carpeta)
        this.bgMusic = document.getElementById("bg-music");
        this.crashSound = document.getElementById("crash-sound");
        this.boostSound = document.getElementById("boost-sound");
        this.shootSound = document.getElementById("shoot-sound");
        this.explosionSound = document.getElementById("explosion-sound");

        // --- SPRITES ---
        this.playerSprite = new Image(); 
        this.playerSprite.src = 'nave.png'; 

        this.boostSprite = new Image();
        this.boostSprite.src = 'boost.png'; 
        
        this.asteroidImages = {};
        for (const type in ASTEROID_TYPES) {
            const img = new Image();
            img.src = ASTEROID_TYPES[type].sprite; 
            this.asteroidImages[type] = img;
        }
        
        // Estado del Juego
        this.gameRunning = false;
        this.keys = {};
        this.player = null;
        this.asteroids = [];
        this.boosters = [];
        this.projectiles = []; 
        this.explosions = []; 
        this.score = 0;
        this.lastAsteroidSpawn = 0;
        this.lastBoostSpawn = 0;
        this.animationFrameId = null;
        
        this.canShoot = true;

        this.resizeCanvas();
        window.addEventListener("resize", this.resizeCanvas.bind(this));
        this.bindEvents();
    }

    resizeCanvas() {
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
    }

    // --- LÓGICA DE PANTALLAS Y EVENTOS (Sin cambios) ---

    showScreen(screenElement) {
        [this.startScreen, this.loseScreen].forEach(el => {
            el.classList.add('hidden');
        });
        
        if (screenElement) {
            screenElement.classList.remove('hidden');
        }
    }

    bindEvents() {
        document.getElementById("play-btn").addEventListener("click", () => {
            this.showScreen(null); 
            this.startGame();
        });

        document.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
            // Disparo con BARRA ESPACIADORA o F
            if (this.gameRunning && (e.key === " " || e.key.toLowerCase() === "f") && this.canShoot) {
                this.fireProjectile();
            }
        });
        document.addEventListener("keyup", (e) => this.keys[e.key] = false);

        document.addEventListener("keydown", (e) => {
            if (!this.gameRunning && !this.loseScreen.classList.contains('hidden') && e.key === "Enter") {
                this.showScreen(this.startScreen); 
                this.crashSound.pause();
                this.crashSound.currentTime = 0;
                this.bgMusic.currentTime = 0;
            }
        });
    }

    // --- LÓGICA DEL JUEGO ---

    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.asteroids = [];
        this.boosters = [];
        this.projectiles = [];
        this.explosions = []; 

        // Inicialización de la nave (Centrada verticalmente)
        this.player = { 
            x: this.canvas.width / 2 - PLAYER_SIZE / 2, 
            y: this.canvas.height / 2 - PLAYER_SIZE / 2,
            w: PLAYER_SIZE, 
            h: PLAYER_SIZE,
            playerAnimY: 0,   // Nuevo: Desplazamiento vertical de la animación
            playerAnimDir: 1  // Nuevo: Dirección de la animación (1=arriba, -1=abajo)
        };
        
        this.bgMusic.currentTime = 0;
        this.bgMusic.play().catch(e => console.warn("Música bloqueada por el navegador."));
        
        this.loop(performance.now());
    }

    gameOver() {
        if (!this.gameRunning) return;
        this.gameRunning = false;
        cancelAnimationFrame(this.animationFrameId);

        this.bgMusic.pause();
        this.crashSound.currentTime = 0;
        this.crashSound.play();
        
        this.finalScoreElement.textContent = Math.floor(this.score);
        this.showScreen(this.loseScreen);
    }

    loop(timestamp) {
        if (!this.gameRunning) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.spawnElements(timestamp);
        this.updatePlayer();
        this.updateElements();
        this.updateProjectiles();
        this.updateExplosions(timestamp);
        this.updatePlayerAnimation(); // Nuevo: Actualizar animación

        this.drawElements();
        this.drawProjectiles();
        this.drawPlayer();
        this.drawExplosions(); 
        this.drawScore();
        
        this.checkCollisions();

        this.score += 0.05; 
        
        this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    updatePlayerAnimation() {
        // Animación de flotación suave
        this.player.playerAnimY += this.player.playerAnimDir * 0.5; // Velocidad de flotación
        
        if (this.player.playerAnimY > PLAYER_FLOAT_LIMIT) {
            this.player.playerAnimDir = -1;
        } else if (this.player.playerAnimY < -PLAYER_FLOAT_LIMIT) {
            this.player.playerAnimDir = 1;
        }
    }

    updatePlayer() {
        let dx = 0;
        
        if (this.keys["ArrowLeft"] || this.keys["a"]) dx -= PLAYER_SPEED;
        if (this.keys["ArrowRight"] || this.keys["d"]) dx += PLAYER_SPEED;
        
        this.player.x += dx;
        
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.w, this.player.x));
    }
    
    // ... (rest of the update/spawn/create methods remain the same) ...
    updateElements() {
        this.asteroids = this.asteroids.filter(a => {
            a.y += a.vy; 
            return a.y < this.canvas.height + a.h; 
        });
        
        this.boosters = this.boosters.filter(b => {
            b.y += b.vy; 
            return b.y < this.canvas.height + b.h;
        });
    }

    updateProjectiles() {
        this.projectiles = this.projectiles.filter(p => {
            p.y += p.vy;
            return p.y > -p.h; 
        });
    }

    updateExplosions(timestamp) {
        this.explosions = this.explosions.filter(exp => (timestamp - exp.startTime) < 200);
    }

    spawnElements(timestamp) {
        const currentInterval = Math.max(300, 2000 - Math.floor(this.score) * 10);
        
        if (timestamp - this.lastAsteroidSpawn > currentInterval) {
            this.asteroids.push(this.createAsteroid());
            this.lastAsteroidSpawn = timestamp;
        }
        
        if (timestamp - this.lastBoostSpawn > 9000) {
            this.boosters.push(this.createBooster());
            this.lastBoostSpawn = timestamp;
        }
    }
    
    selectAsteroidType() {
        const rand = Math.random();
        if (rand < 0.6) return 'small'; 
        if (rand < 0.9) return 'medium'; 
        return 'large';
    }

    createAsteroid() {
        const type = this.selectAsteroidType(); 
        const data = ASTEROID_TYPES[type];
        const size = data.size;
        const speed = data.speed;

        let x = Math.random() * (this.canvas.width - size); 
        let y = -size; 
        let vx = 0; 
        let vy = speed; 
        
        return { x, y, w: size, h: size, vx, vy, type: type };
    }
    
    createBooster() {
        const size = BOOST_SIZE * 2; 
        return {
            x: Math.random() * (this.canvas.width - size), 
            y: -size, 
            w: size, h: size,
            vx: 0, 
            vy: 2.5 
        };
    }

    fireProjectile() {
        if (!this.canShoot) return;
        this.canShoot = false;
        
        const p = {
            x: this.player.x + this.player.w / 2 - PROJECTILE_SIZE / 2,
            y: this.player.y,
            w: PROJECTILE_SIZE,
            h: PROJECTILE_SIZE * 3, 
            vy: -PROJECTILE_SPEED,
            color: 'var(--neon-yellow)'
        };
        this.projectiles.push(p);

        // Reproducir sonido de disparo
        this.shootSound.currentTime = 0;
        this.shootSound.play().catch(e => console.warn("Error al reproducir sonido de disparo:", e));

        setTimeout(() => {
            this.canShoot = true;
        }, SHOOT_COOLDOWN);
    }

    // --- MÉTODOS DE DIBUJO ---
    
    drawPlayer() {
        // Mayor sombra neón para más dinamismo (de 20 a 30)
        this.ctx.shadowColor = 'var(--neon-blue)';
        this.ctx.shadowBlur = 30; 
        
        // Aplicar desplazamiento de la animación (this.player.playerAnimY)
        const drawY = this.player.y + this.player.playerAnimY;
        
        if (this.playerSprite.complete) {
            this.ctx.drawImage(this.playerSprite, this.player.x, drawY, this.player.w, this.player.h);
        } else {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(this.player.x, drawY, this.player.w, this.player.h);
        }
        this.ctx.shadowBlur = 0;
    }

    // ... (rest of the draw methods remain the same) ...
    drawElements() {
        // Asteroides
        this.asteroids.forEach(a => {
            const sprite = this.asteroidImages[a.type];
            if (sprite && sprite.complete) {
                this.ctx.drawImage(sprite, a.x, a.y, a.w, a.h);
            } else {
                this.ctx.fillStyle = 'gray';
                this.ctx.fillRect(a.x, a.y, a.w, a.h);
            }
        });
        
        // Boosters
        this.ctx.shadowColor = 'var(--neon-yellow)';
        this.ctx.shadowBlur = 15;
        this.boosters.forEach(b => {
            if (this.boostSprite.complete) {
                this.ctx.drawImage(this.boostSprite, b.x, b.y, b.w, b.h);
            } else {
                this.ctx.fillStyle = 'yellow';
                this.ctx.beginPath();
                this.ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.shadowBlur = 0;
    }

    drawProjectiles() {
        this.ctx.fillStyle = 'var(--neon-yellow)';
        this.ctx.shadowColor = 'var(--neon-yellow)';
        this.ctx.shadowBlur = 15;
        this.projectiles.forEach(p => {
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
        });
        this.ctx.shadowBlur = 0;
    }

    drawExplosions() {
        this.ctx.shadowColor = 'var(--neon-red)';
        this.ctx.shadowBlur = 20;
        this.explosions.forEach(exp => {
            this.ctx.fillStyle = `rgba(255, 100, 0, ${(200 - (performance.now() - exp.startTime)) / 200})`;
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, exp.radius * ((performance.now() - exp.startTime) / 200), 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;
    }

    drawScore() {
        this.ctx.font = "20px 'Press Start 2P'";
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Puntos: ${Math.floor(this.score)}`, 20, 30);
    }
    
    // ... (rest of the collision methods remain the same) ...
    checkAABBCollision(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    }

    checkCollisions() {
        const projectilesToRemove = [];
        const asteroidsToRemove = [];

        this.projectiles.forEach((p, pIndex) => {
            this.asteroids.forEach((a, aIndex) => {
                if (this.checkAABBCollision(p, a)) {
                    projectilesToRemove.push(pIndex);
                    asteroidsToRemove.push(aIndex);
                    
                    this.score += ASTEROID_TYPES[a.type].score; 
                    
                    this.explosions.push({
                        x: a.x + a.w / 2, 
                        y: a.y + a.h / 2, 
                        radius: a.w / 2, 
                        startTime: performance.now()
                    });
                    
                    this.explosionSound.currentTime = 0;
                    this.explosionSound.play().catch(e => console.warn("Error al reproducir sonido de explosión:", e));
                }
            });
        });

        this.projectiles = this.projectiles.filter((_, index) => !projectilesToRemove.includes(index));
        this.asteroids = this.asteroids.filter((_, index) => !asteroidsToRemove.includes(index));

        // Nave vs. Asteroide (Game Over)
        this.asteroids.forEach(a => {
            // Se debe usar la posición de dibujo animada para la colisión
            const playerCollision = {...this.player, y: this.player.y + this.player.playerAnimY};
            
            if (this.checkAABBCollision(playerCollision, a)) {
                this.gameOver();
                return;
            }
        });
        
        // Nave vs. Boost (Puntos)
        this.boosters = this.boosters.filter(b => {
            const playerCollision = {...this.player, y: this.player.y + this.player.playerAnimY};
            if (this.checkAABBCollision(playerCollision, b)) {
                this.score += 20; 
                this.boostSound.currentTime = 0;
                this.boostSound.play().catch(e => console.warn("Error al reproducir sonido de boost:", e));
                return false; 
            }
            return true; 
        });
    }
}

// Inicialización del juego
document.addEventListener('DOMContentLoaded', () => {
    const game = new SpaceHeroGame();
    game.showScreen(game.startScreen); 
});