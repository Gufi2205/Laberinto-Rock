// Referencia al lienzo y su contexto de dibujo 2D
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const objeSound = new Audio('colision1.mp3');
objeSound.preload = 'auto';
// Crear un pool de sonidos para evitar problemas de reproducción simultánea
const soundPool = [];
for (let i = 0; i < 5; i++) {
    const sound = new Audio('colision1.mp3');
    sound.preload = 'auto';
    soundPool.push(sound);
}
let currentSound = 0;

// Objeto para rastrear teclas presionadas
let keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Cargar la imagen del jugador
const playerImage = new Image();
playerImage.src = 'bajo.png';

// Al inicio del archivo, después de cargar la imagen del jugador
const objeImage = new Image();
objeImage.src = 'pedal.png';

// Definir el objeto jugador después de cargar las imágenes
const player = {
    x: 50,
    y: 50,
    w: 50,  // Aumentado de 30 a 50
    h: 50,  // Aumentado de 30 a 50
    speed: 5
};

const levels = [
    {
        obstacles: [
            { x: 180, y: 120, w: 300, h: 20 },
            { x: 350, y: 220, w: 20, h: 150 },
            { x: 150, y: 300, w: 200, h: 20 },
            { x: 500, y: 150, w: 20, h: 200 },
            { x: 100, y: 100, w: 20, h: 150 }
        ],
        objes: Array(2).fill(null).map(() => ({
            x: 0,
            y: 0,
            collected: false
        }))
    },
    {
        obstacles: [
            { x: 150, y: 150, w: 250, h: 20 },
            { x: 180, y: 250, w: 20, h: 150 },
            { x: 380, y: 180, w: 20, h: 150 },
            { x: 500, y: 100, w: 20, h: 200 },
            { x: 250, y: 400, w: 300, h: 20 },
            { x: 100, y: 350, w: 150, h: 20 },
            { x: 600, y: 200, w: 20, h: 250 }
        ],
        objes: Array(4).fill(null).map(() => ({
            x: 0,
            y: 0,
            collected: false
        }))
    },
    {
        obstacles: [
            { x: 120, y: 120, w: 20, h: 180 },
            { x: 280, y: 150, w: 20, h: 180 },
            { x: 440, y: 120, w: 20, h: 180 },
            { x: 180, y: 320, w: 250, h: 20 },
            { x: 600, y: 150, w: 20, h: 250 },
            { x: 50, y: 400, w: 300, h: 20 },
            { x: 350, y: 50, w: 200, h: 20 },
            { x: 700, y: 200, w: 20, h: 200 }
        ],
        objes: Array(6).fill(null).map(() => ({
            x: 0,
            y: 0,
            collected: false
        }))
    }
];

let currentLevel = 0;

function rectsCollide(a, b) {
    return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
}

function drawrect(obj) {
    ctx.fillStyle = obj.color || 'white';
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
}

// Añadir velocidades aleatorias para las monedas del nivel 3
function initializeMovingCoins() {
    if (levels[2].coins[0].vx === undefined) {
        levels[2].coins.forEach(coin => {
            coin.vx = (Math.random() * 2 - 1) * 1.5; // Velocidad X aleatoria entre -1.5 y 1.5
            coin.vy = (Math.random() * 2 - 1) * 1.5; // Velocidad Y aleatoria entre -1.5 y 1.5
        });
    }
}

// Cambiar el tamaño del canvas
canvas.width = 800;  // Aumentar el ancho
canvas.height = 600; // Aumentar el alto

function update() {
    const level = levels[currentLevel];

    // Eliminar toda la sección de movimiento de monedas
    // Si estamos en el nivel 3, ya no necesitamos inicializar velocidades

    // Movimiento del jugador según las teclas presionadas
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // Limites del escenario - evitar que el jugador salga del canvas
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
    if (player.y + player.h > canvas.height) player.y = canvas.height - player.h;

    // Comprobación de colisión con obstáculos y retroceso del movimiento
    for (let obs of level.obstacles) {
        if (rectsCollide(player, obs)) {
            if (keys['ArrowUp']) player.y += player.speed;
            if (keys['ArrowDown']) player.y -= player.speed;
            if (keys['ArrowLeft']) player.x += player.speed;
            if (keys['ArrowRight']) player.x -= player.speed;
        }
    }

    // Comprobación de colisión con monedas y recolección
    for (let obje of level.objes) {
        if (!obje.collected) {
            if (
                player.x < obje.x + 15 &&
                player.x + player.w > obje.x &&
                player.y < obje.y + 15 &&
                player.y + player.h > obje.y
            ) {
                obje.collected = true; // Marca el objeto como recogido

                // Usar el pool de sonidos para reproducir el efecto
                try {
                    soundPool[currentSound].currentTime = 0;
                    soundPool[currentSound].play();
                    currentSound = (currentSound + 1) % soundPool.length;
                } catch (e) {
                    console.log("Error reproduciendo sonido:", e);
                }
            }
        }
    }

    // Verifica si todas los objetos del nivel han sido recogidos
    const allCollected = level.objes.every(c => c.collected);
    if (allCollected) {
        if (currentLevel < levels.length - 1) {
            currentLevel++; // Avanza al siguiente nivel
            resetLevel();   // Reinicia la posición del jugador y objetos
        } else {
            // Fin del juego: muestra mensaje y reinicia
            alert("🎮 ¡Felicitaciones!");
            currentLevel = 0;
            resetLevel();
        }
    }
}

function resetLevel() {
    // Reinicia la posición del jugador
    player.x = 50;
    player.y = 50;

    // Reinicia el estado de los objetos
    levels[currentLevel].objes.forEach(obje => {
        obje.collected = false;
    });
}

function draw() {
    // Cambiar el fondo a verde
    ctx.fillStyle = '#2E8B57'; // Verde mar
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar jugador usando la imagen
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);

    const level = levels[currentLevel];

    // Dibujar obstáculos con nueva alineación diagonal
    for (let obs of level.obstacles) {
        drawrect({ ...obs, color: '#8B4513' }); // Marrón silla de montar
    }

    // Dibujar monedas usando la imagen
    for (let obje of level.objes) {
        if (!obje.collected) {
            ctx.drawImage(objeImage, obje.x, obje.y, 25, 25); // Aumentado de 15 a 25
        }
    }

    // Modificar el estilo del texto para los contadores
    ctx.font = 'bold 28px Arial'; // Aumentado de 24 a 28
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.textAlign = 'left'; // Asegurar alineación a la izquierda
    
    // Dibujar texto con contorno más a la izquierda
    ctx.strokeText(`Nivel: ${currentLevel + 1}`, 20, 40);
    ctx.fillText(`Nivel: ${currentLevel + 1}`, 20, 40);
    
    ctx.strokeText(`Objetos: ${level.objes.filter(c => c.collected).length}/${level.objes.length}`, 20, 80);
    ctx.fillText(`Objetos: ${level.objes.filter(c => c.collected).length}/${level.objes.length}`, 20, 80);

    // Añadir el nombre en el escenario con el mismo estilo
    ctx.font = 'bold 16px Arial';
    ctx.strokeText('Julio Perez', 10, canvas.height - 15);
    ctx.fillText('Julio Perez', 10, canvas.height - 15);
}

//bucle principal del juego
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Al final del archivo, antes de iniciar el juego
// Agregar música de fondo
const backgroundMusic = new Audio('fondo.mp3'); // Cambio del archivo de música
backgroundMusic.loop = true; // La música se reproducirá en bucle
backgroundMusic.volume = 0.5; // Ajustar el volumen al 50%

// Función para generar posiciones aleatorias para los objetos
function generateRandomPosition(level) {
    let x, y;
    let validPosition = false;
    
    while (!validPosition) {
        x = Math.random() * (canvas.width - 50);
        y = Math.random() * (canvas.height - 50);
        validPosition = true;
        
        // Verificar colisiones con obstáculos
        for (let obs of level.obstacles) {
            if (x < obs.x + obs.w + 30 &&
                x + 25 > obs.x - 30 &&
                y < obs.y + obs.h + 30 &&
                y + 25 > obs.y - 30) {
                validPosition = false;
                break;
            }
        }
    }
    return { x, y };
}

// Función para inicializar las posiciones de los objetos
function initializeLevelObjects() {
    levels.forEach(level => {
        level.objes.forEach(obj => {
            const pos = generateRandomPosition(level);
            obj.x = pos.x;
            obj.y = pos.y;
        });
    });
}

// Llamar a la función de inicialización al inicio del juego
function startGame() {
    // Remover la reproducción inmediata de música
    // La música se iniciará cuando el usuario haga clic en START
    backgroundMusic.play().catch(error => {
        console.log("Error al reproducir la música:", error);
    });

    // Configurar el estilo de la pantalla de inicio
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Crear un degradado para el título
    const gradient = ctx.createLinearGradient(0, canvas.height/2 - 100, 0, canvas.height/2);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');

    // Dibujar un marco decorativo
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    // Configurar y dibujar el título
    ctx.fillStyle = gradient;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Laberinto Rock', canvas.width/2, canvas.height/2 - 80);

    // Crear y dibujar el botón START
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = canvas.width/2 - buttonWidth/2;
    const buttonY = canvas.height/2 - buttonHeight/2;

    // Dibujar el botón
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Texto del botón
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('START', canvas.width/2, canvas.height/2 + 8);

    // Dibujar instrucciones
    ctx.font = '18px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Recolecta todos los pedales para pasar al siguiente nivel', canvas.width/2, canvas.height/2 + 80);

    // Función para manejar el clic en el botón
    const handleClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
            clickY >= buttonY && clickY <= buttonY + buttonHeight) {
            initializeLevelObjects(); // Inicializar objetos al comenzar
            backgroundMusic.play().catch(error => {
                console.log("Error al reproducir la música:", error);
            });
            document.removeEventListener('click', handleClick);
            resetLevel();
            gameLoop();
        }
    };

    // Solo agregar el listener de clic para el botón
    document.addEventListener('click', handleClick);
}

// Reemplazar la llamada directa a gameLoop con startGame
startGame();
// Comentar o eliminar estas líneas:
// resetLevel();
// gameLoop();



