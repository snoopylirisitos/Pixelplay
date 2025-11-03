const storeGrid = document.getElementById("store-grid");
const libraryGrid = document.getElementById("library-grid");
const tiendaSection = document.getElementById("tienda-section");
const juegosSection = document.getElementById("tus-juegos-section");
const navTienda = document.getElementById("nav-tienda");
const navJuegos = document.getElementById("nav-juegos");

const modal = document.getElementById("modal");
const confirmBtn = document.getElementById("confirm-btn");
const closeBtn = document.getElementById("close-btn");
const successMsg = document.getElementById("purchase-success");
const nameInput = document.getElementById("buyer-name");
const modalTitle = document.getElementById("modal-title");
const modalPrice = document.getElementById("modal-price");

let selectedGame = null;

// =========================================================
// LISTA DE JUEGOS FINAL Y CORREGIDA
// - DungeonBit ELIMINADO.
// - Platformis, Ghost Run, Space Hero, CozyCats son jugables: true.
// - Tierra & Aire, LukaStrike, Dou son Próximamente: jugable: false.
// =========================================================
const juegos = [
    // JUEGOS DISPONIBLES PARA COMPRA Y JUEGO
    { id: "platformis", nombre: "Platformis", precio: 1.99, desc: "Salta, esquiva y llega a la meta sin caer.", imagen: "platformis.png", jugable: true, ruta: "Platformis/platformis.html" },
    { id: "ghostrun", nombre: "Ghost Run", precio: 5.99, desc: "Corre entre fantasmas en este endless runner.", imagen: "ghostrun.png", jugable: true, ruta: "GhostRun/ghostrun.html" },
    { id: "spacehero", nombre: "Space Hero", precio: 7.99, desc: "Conquista galaxias y salva el universo.", imagen: "spacehero.png", jugable: true, ruta: "SpaceHero/spacehero.html" },
    { id: "cozycats", nombre: "CozyCats", precio: 4.99, desc: "Cuida y decora con tus gatos adorables.", imagen: "cozycats.png", jugable: true, ruta: "CozyCats/cozycats.html" },
    
    // JUEGOS PRÓXIMAMENTE (NO JUGABLES NI COMPRABLES)
    { id: "tierrayaire", nombre: "Tierra & Aire", precio: 2.99, desc: "Explora cooperativamente en este mundo de elementos.", imagen: "tierrayaire.png", jugable: false },
    { id: "lukastrike", nombre: "LukaStrike", precio: 15.99, desc: "Vence a tus enemigos junto a Lucario y su Ak47.", imagen: "lukastrike.png", jugable: false },
    { id: "dou", nombre: "Dou", precio: 9.49, desc: "Cuida y alimenta a Dou.", imagen: "dou.png", jugable: false },
];

let biblioteca = []; 

function renderTienda() {
    storeGrid.innerHTML = "";
    juegos.forEach(juego => {
        const adquirido = biblioteca.includes(juego.id);
        
        // Determinar si es 'Próximamente' o está disponible para la venta
        const esProximamente = !juego.jugable;

        const card = document.createElement("div");
        // Añadimos la clase 'upcoming' si es un juego Próximamente (para el CSS)
        card.className = "game-card" + (esProximamente ? " upcoming" : ""); 
        
        // Contenido del botón en la Tienda
        let buttonHTML;
        if (adquirido) {
            buttonHTML = `<button class="adquirido">Adquirido</button>`;
        } else if (esProximamente) {
            // Juegos Próximamente: NO se pueden comprar
            buttonHTML = `<button disabled class="soon-btn">Próximamente</button>`;
        } else {
            // Juegos disponibles para la compra
            buttonHTML = `<button class="buy-btn" data-id="${juego.id}">Comprar</button>`;
        }
        
        card.innerHTML = `
            <img src="${juego.imagen}" alt="${juego.nombre}">
            <h3>${juego.nombre}</h3>
            <p>${juego.desc}</p>
            ${buttonHTML}
        `;
        storeGrid.appendChild(card);
    });

    // Solo asociamos el evento de compra a los botones que SÍ están disponibles
    document.querySelectorAll(".buy-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = e.target.dataset.id;
            selectedGame = juegos.find(j => j.id === id);
            abrirModal(selectedGame);
        });
    });
}

function abrirModal(juego) {
    modalTitle.textContent = `Comprar ${juego.nombre}`;
    modalPrice.innerHTML = `Precio: <strong>$${juego.precio}</strong>`;
    modal.classList.remove("hidden");
    nameInput.value = ""; // Limpiar input
}

closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
});

confirmBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
        alert("Por favor, ingresá tu nombre.");
        return;
    }
    
    modal.classList.add("hidden");
    successMsg.classList.remove("hidden");

    // Lógica de Compra y adición a la biblioteca
    if (selectedGame && !biblioteca.includes(selectedGame.id)) {
         biblioteca.push(selectedGame.id);
         renderTienda(); // Actualiza la tienda para mostrar 'Adquirido'
         renderBiblioteca(); // Añade el juego a la biblioteca
    }

    setTimeout(() => {
        successMsg.classList.add("hidden");
    }, 2500);
});

function renderBiblioteca() {
    libraryGrid.innerHTML = "";
    if (biblioteca.length === 0) {
        libraryGrid.innerHTML = `<p style="color:#888; text-align:center;">Aún no tienes juegos. ¡Compra alguno en la tienda!</p>`;
        return;
    }

    biblioteca.forEach(id => {
        const juego = juegos.find(j => j.id === id);
        if (!juego) return; 

        const card = document.createElement("div");
        card.className = "game-card";
        
        let buttonHTML;
        if (juego.jugable) {
            // JUEGO LISTO: Botón 'Jugar' con enlace a la ruta
            buttonHTML = `<a href="${juego.ruta}" target="_blank"><button>Jugar</button></a>`;
        } else {
            // JUEGO NO LISTO: Botón 'Próximamente' deshabilitado
            buttonHTML = `<button disabled>Próximamente</button>`;
        }
        
        card.innerHTML = `
            <img src="${juego.imagen}" alt="${juego.nombre}">
            <h3>${juego.nombre}</h3>
            ${buttonHTML}
        `;
        libraryGrid.appendChild(card);
    });
}

navTienda.addEventListener("click", () => {
    tiendaSection.classList.remove("hidden");
    juegosSection.classList.add("hidden");
    navTienda.classList.add("active");
    navJuegos.classList.remove("active");
});

navJuegos.addEventListener("click", () => {
    tiendaSection.classList.add("hidden");
    juegosSection.classList.remove("hidden");
    navJuegos.classList.add("active");
    navTienda.classList.remove("active");
});

// Inicialización
renderTienda();
renderBiblioteca();