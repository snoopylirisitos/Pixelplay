// --- CONSTANTES ---
const COINS_START = 430; 

// --- DEFINICIÓN DE ASSETS (AJUSTAR W, H, OFFSET AL TAMAÑO DE TUS SPRITES) ---
const ITEM_TYPES = [
    // w y h son el tamaño del sprite; offset es la corrección para que la base del objeto
    // coincida con el punto (x, y) donde se hace clic.
    // collides: false permite superposición (alfombras, gatos).
    { id: 'sofaRosa', name: 'Sillón Rosa', cost: 30, sprite: 'sofa_rosa.png', w: 100, h: 70, type: 'sofa', offset: {x: -50, y: -60}, collides: true }, 
    { id: 'sofaCeleste', name: 'Sillón Celeste', cost: 40, sprite: 'sofa_celeste.png', w: 100, h: 70, type: 'sofa', offset: {x: -50, y: -60}, collides: true },
    
    { id: 'planta1', name: 'Planta Verde', cost: 20, sprite: 'planta1.png', w: 50, h: 80, type: 'plant', offset: {x: -25, y: -70}, collides: true },
    { id: 'planta2', name: 'Planta Flor', cost: 25, sprite: 'planta2.png', w: 50, h: 90, type: 'plant', offset: {x: -25, y: -80}, collides: true },
    
    { id: 'cama1', name: 'Cama Individual', cost: 70, sprite: 'cama1.png', w: 120, h: 100, type: 'bed', offset: {x: -60, y: -70}, collides: true },
    { id: 'cama2', name: 'Cama Doble', cost: 90, sprite: 'cama2.png', w: 150, h: 120, type: 'bed', offset: {x: -75, y: -80}, collides: true },
    
    { id: 'alfombra1', name: 'Alfombra Redonda', cost: 35, sprite: 'alfombra1.png', w: 80, h: 80, type: 'rug', offset: {x: -40, y: -40}, collides: false }, 
    { id: 'alfombra2', name: 'Alfombra Cuadrada', cost: 45, sprite: 'alfombra2.png', w: 100, h: 100, type: 'rug', offset: {x: -50, y: -50}, collides: false },
    { id: 'alfombra3', name: 'Alfombra Larga', cost: 50, sprite: 'alfombra3.png', w: 140, h: 80, type: 'rug', offset: {x: -70, y: -40}, collides: false },

    { id: 'mesita1', name: 'Mesita Cuadrada', cost: 55, sprite: 'mesita1.png', w: 40, h: 50, type: 'table', offset: {x: -20, y: -60}, collides: true },
    { id: 'mesita2', name: 'Mesita Redonda', cost: 60, sprite: 'mesita2.png', w: 45, h: 55, type: 'table', offset: {x: -22, y: -65}, collides: true },
    
    { id: 'gato1', name: 'Gato Juguetón', cost: 80, sprite: 'gato1.png', w: 50, h: 50, type: 'cat', offset: {x: -25, y: -40}, collides: false }, 
    { id: 'gato2', name: 'Gato Dormilón', cost: 85, sprite: 'gato2.png', w: 60, h: 40, type: 'cat', offset: {x: -30, y: -30}, collides: false },
    { id: 'gato3', name: 'Gato Curioso', cost: 90, sprite: 'gato3.png', w: 45, h: 55, type: 'cat', offset: {x: -22, y: -45}, collides: false },
];

const BACKGROUNDS = [
    { id: 'bg1', name: 'Invernadero', file: 'fondo1.jpg' },
    { id: 'bg2', name: 'Sala Luminosa', file: 'fondo2.jpg' },
    { id: 'bg3', name: 'Dormitorio Pastel', file: 'fondo3.png' } // Reemplazar con tu fondo final
];

// --- CLASE PRINCIPAL: CozyCatsGame ---

class CozyCatsGame {
    constructor() {
        // DOM y Audios
        this.canvas = document.getElementById("catCafeCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.startScreen = document.getElementById("start-screen");
        this.gameContainer = document.getElementById("game-container");
        this.inventoryElement = document.getElementById("inventory");
        this.backgroundSelectionElement = document.getElementById("background-selection");
        this.coinsElement = document.getElementById("coins");
        this.backgroundDisplay = document.getElementById("background-display"); 
        
        this.bgMusic = document.getElementById("bg-music");
        this.selectSound = document.getElementById("select-sound");

        // Estado del Juego
        this.coins = COINS_START;
        this.decorations = []; 
        this.currentSelectedItem = null; 
        this.gameRunning = false;
        this.currentBackground = BACKGROUNDS[0];

        this.images = {};
        this.assetsLoaded = false;
        
        this.bindEvents();
        this.loadAssets();
    }
    
    // --- GESTIÓN DE ASSETS Y SONIDOS ---
    
    loadAssets() {
        const allAssets = [
            ...ITEM_TYPES.map(item => item.sprite),
            ...BACKGROUNDS.map(bg => bg.file)
        ];
        
        let loadedCount = 0;
        const totalCount = allAssets.length;
        
        allAssets.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedCount++;
                this.images[src] = img;
                if (loadedCount === totalCount) {
                    this.assetsLoaded = true;
                }
            };
            img.onerror = () => {
                console.error(`Error loading asset: ${src}`);
                loadedCount++;
                if (loadedCount === totalCount) this.assetsLoaded = true;
            };
        });
    }

    playSound(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0; 
            audioElement.play().catch(e => console.warn("Audio playback blocked:", e));
        }
    }

    // --- LÓGICA DE INICIO Y FONDOS ---

    bindEvents() {
        document.getElementById("play-btn").addEventListener("click", () => this.startGame());
        window.addEventListener("resize", this.resizeCanvas.bind(this));
        
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    }
    
    startGame() {
        if (!this.assetsLoaded) {
            alert("Los elementos gráficos aún se están cargando. Por favor, espera un momento.");
            return;
        }
        
        this.startScreen.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        this.gameRunning = true;
        
        this.resizeCanvas();
        this.initBackgroundButtons();
        this.initInventoryButtons();
        this.updateCoinsDisplay();
        this.changeBackground(BACKGROUNDS[0]); 
        
        // Iniciar Música de Fondo
        this.bgMusic.currentTime = 0;
        this.bgMusic.play().catch(e => console.warn("Música bloqueada por el navegador."));
        
        this.loop();
    }
    
    resizeCanvas() {
        const gameArea = document.getElementById('game-area');
        if (!gameArea) return;
        this.canvas.width = gameArea.clientWidth;
        this.canvas.height = gameArea.clientHeight;
    }

    initBackgroundButtons() {
        this.backgroundSelectionElement.innerHTML = ''; 
        BACKGROUNDS.forEach(bg => {
            const btn = document.createElement('button');
            btn.className = 'bg-btn';
            btn.style.backgroundImage = `url('${bg.file}')`;
            btn.title = bg.name;
            btn.onclick = () => this.changeBackground(bg);
            this.backgroundSelectionElement.appendChild(btn);
        });
    }

    changeBackground(bg) {
        this.currentBackground = bg;
        this.backgroundDisplay.style.backgroundImage = `url('${bg.file}')`;
        this.backgroundDisplay.style.backgroundSize = 'cover';
        this.backgroundDisplay.style.backgroundPosition = 'center'; 
    }

    // --- LÓGICA DE INVENTARIO Y COLOCACIÓN ---
    
    initInventoryButtons() {
        this.inventoryElement.innerHTML = ''; 
        
        ITEM_TYPES.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'item-btn';
            btn.style.backgroundImage = `url('${item.sprite}')`;
            btn.setAttribute('data-cost', `${item.cost} M`);
            btn.title = item.name;
            
            btn.onclick = () => {
                this.selectItem(item);
                this.playSound(this.selectSound); 
            };
            this.inventoryElement.appendChild(btn);
        });
    }

    selectItem(item) {
        // Deseleccionar botón anterior
        const prevSelectedBtn = this.inventoryElement.querySelector('.item-btn.selected');
        if (prevSelectedBtn) {
            prevSelectedBtn.classList.remove('selected');
        }

        if (this.coins >= item.cost) {
            this.currentSelectedItem = { 
                ...item, 
                x: 0, 
                y: 0,
                spriteImg: this.images[item.sprite]
            };
            this.canvas.style.cursor = 'none'; 
            
            // Seleccionar botón actual
            const currentBtn = this.inventoryElement.querySelector(`[title="${item.name}"]`);
            if (currentBtn) {
                currentBtn.classList.add('selected');
            }

        } else {
            alert("¡No tienes suficientes monedas!");
            this.currentSelectedItem = null; 
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleMouseMove(e) {
        if (!this.currentSelectedItem) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // El punto de colocación es el mouse (la base del objeto)
        this.currentSelectedItem.x = mouseX;
        this.currentSelectedItem.y = mouseY;
    }
    
    handleMouseDown(e) {
        if (!this.currentSelectedItem) return;
        
        const item = this.currentSelectedItem;
        
        // Calcular la caja de colisión (base del objeto)
        const finalX = item.x + item.offset.x; 
        const finalY = item.y + item.offset.y; 
        const finalW = item.w;
        const finalH = item.h;

        // 1. Verificar límites del canvas
        if (finalX < 0 || finalY < 0 || finalX + finalW > this.canvas.width || finalY + finalH > this.canvas.height) {
            alert("¡No puedes colocar esto fuera del área de juego!");
            return;
        }
        
        // 2. Verificar Colisión (solo si item.collides es true)
        if (item.collides) {
            const isColliding = this.decorations.some(d => {
                if (!d.collides) return false; 
                
                // Colisión AABB entre la base de los objetos que colisionan
                const dXAdjusted = d.x + d.offset.x;
                const dYAdjusted = d.y + d.offset.y;
                
                return finalX < dXAdjusted + d.w && finalX + finalW > dXAdjusted &&
                       finalY < dYAdjusted + d.h && finalY + finalH > dYAdjusted;
            });

            if (isColliding) {
                alert("¡Ya hay algo ahí!");
                return;
            }
        }

        // 3. Colocar el objeto
        this.decorations.push({
            ...item, 
            x: item.x, 
            y: item.y,
        });

        // 4. Cobrar y limpiar
        this.coins -= item.cost;
        this.updateCoinsDisplay();
        this.playSound(this.selectSound); 
        
        this.currentSelectedItem = null;
        this.canvas.style.cursor = 'default';

        const prevSelectedBtn = this.inventoryElement.querySelector('.item-btn.selected');
        if (prevSelectedBtn) {
            prevSelectedBtn.classList.remove('selected');
        }
    }

    // --- BUCLE Y DIBUJO ---
    
    updateCoinsDisplay() {
        this.coinsElement.textContent = this.coins;
    }
    
    loop() {
        if (!this.gameRunning) return;
        
        this.draw();
        
        requestAnimationFrame(this.loop.bind(this));
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Ordenar por la coordenada Y del punto de colocación (simula profundidad)
        this.decorations.sort((a, b) => a.y - b.y); 
        this.decorations.forEach(d => this.drawItem(d, false));
        
        if (this.currentSelectedItem) {
            this.drawItem(this.currentSelectedItem, true);
        }
    }
    
    drawItem(item, isPreview) {
        // La posición de dibujo se calcula restando el offset al punto (x, y)
        const drawX = item.x + item.offset.x;
        const drawY = item.y + item.offset.y; 
        const w = item.w;
        const h = item.h;
        
        const opacity = isPreview ? 0.6 : 1.0;
        this.ctx.globalAlpha = opacity;
        
        if (item.spriteImg && item.spriteImg.complete) {
            this.ctx.drawImage(item.spriteImg, drawX, drawY, w, h);
        } else {
            // Dibujo de respaldo
            this.ctx.fillStyle = isPreview ? `rgba(255, 0, 0, 0.4)` : 'gray';
            this.ctx.fillRect(drawX, drawY, w, h);
        }
        
        this.ctx.globalAlpha = 1.0;
    }
}

// Inicialización del juego
document.addEventListener('DOMContentLoaded', () => {
    new CozyCatsGame();
});