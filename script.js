// --- 1. ГЕНЕРАЦИЯ ГАЛЕРЕИ ---

async function loadGallery() {
    try {
        const res = await fetch('games.json');
        if (!res.ok) throw new Error("games.json не найден");
        
        const games = await res.json();
        const container = document.getElementById('gallery-container');
        
        container.innerHTML = ''; // Очищаем надпись "Загрузка..."

        games.forEach(game => {
            // Создаем HTML карточки
            const link = document.createElement('a');
            link.href = "?game=" + game.file; // Ссылка перезагружает страницу с новым параметром
            link.className = 'game-card';
            
            const img = document.createElement('img');
            img.src = game.img;
            img.alt = game.name;
            img.loading = "lazy";

            const title = document.createElement('div');
            title.className = 'game-title';
            title.innerText = game.name;

            link.appendChild(img);
            link.appendChild(title);
            container.appendChild(link);
        });

    } catch (e) {
        document.getElementById('gallery-container').innerHTML = "Ошибка загрузки списка игр.";
        console.error(e);
    }
}

// Запускаем загрузку галереи при старте
document.addEventListener('DOMContentLoaded', loadGallery);


// --- 2. НАСТРОЙКА ЭМУЛЯТОРА ---

const params = new URLSearchParams(window.location.search);
let gameName = params.get('game');

var Module = {
    canvas: document.getElementById('canvas'),
    onReady: function() {
        console.log("USP Ready");
        
        if (gameName) {
            document.querySelector('.page-header').style.display = 'none';
            document.getElementById('gallery-container').style.display = 'none';
            document.getElementById('vk-container').style.display = 'block';
            document.getElementById('canvas').style.display = 'block';
            document.getElementById('start-overlay').style.display = 'flex';
            
            // Фокусируемся на канвасе, чтобы работали кнопки
            Module.canvas.focus();
            window.dispatchEvent(new Event('resize'));
            setTimeout(() => Module.canvas.focus(), 100);
        } else {
            // Если игры нет (просто index.html)
            // Показываем меню и галерею, прячем эмулятор
            document.getElementById('start-overlay').style.display = 'none';
            document.querySelector('.page-header').style.display = 'block';
            document.getElementById('gallery-container').style.display = 'grid'; 
            document.getElementById('vk-container').style.display = 'none';
            document.getElementById('canvas').style.display = 'none';
        }
    },
    locateFile: function(filename) {
        return filename;
    }
};

// Обработка нажатия "Назад" в браузере (если вдруг SPA)
window.addEventListener('popstate', () => {
    location.reload();
});

if (gameName) {
    gameName = gameName.toLowerCase();
    Module.arguments = ['./' + gameName];
} else {
    Module.arguments = [];
}

// --- 3. ЗАГРУЗКА ИГРЫ ---

if (gameName) {
    Module.preRun = Module.preRun || [];
    Module.preRun.push(function() {
        console.log("Загрузка:", gameName);
        Module.addRunDependency('game-download');
        
        var gameUrl = 'games/' + gameName; 
        var xhr = new XMLHttpRequest();
        xhr.open('GET', gameUrl, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function() {
            if (xhr.status === 200) {
                var data = new Uint8Array(xhr.response);
                Module.FS_createDataFile('/', gameName, data, true, true, true);
                Module.removeRunDependency('game-download');
            } else {
                console.error("404");
                Module.arguments = [];
                Module.removeRunDependency('game-download');
            }
        };
        xhr.onerror = function() {
            console.error("Сеть");
            Module.arguments = [];
            Module.removeRunDependency('game-download');
        };
        xhr.send(null);
    });
}

// --- 4. UI ЛОГИКА ---

var overlay = document.getElementById('start-overlay');
overlay.addEventListener('click', function() {
    overlay.style.display = 'none';
    document.getElementById('status').style.display = 'none';
    if (Module.SDL2 && Module.SDL2.audioContext && Module.SDL2.audioContext.state === 'suspended') {
        Module.SDL2.audioContext.resume();
    }
    Module.canvas.focus();
    setTimeout(function() {
        sendKey('F5', 'down');
        setTimeout(() => sendKey('F5', 'up'), 50);
    }, 500);
});

// --- 5. КЛАВИАТУРА ---
if (!window.activeModifiers) window.activeModifiers = { shift: false, sym: false };
var activeModifiers = window.activeModifiers;

function getKeyCode(char) {
    if (!char) return '';
    if (char.length === 1) {
        if (char >= '0' && char <= '9') return 'Digit' + char;
        if (char >= 'a' && char <= 'z') return 'Key' + char.toUpperCase();
        if (char === '.') return 'Period';
    }
    if (char === 'Enter') return 'Enter';
    if (char === 'ShiftLeft') return 'ShiftLeft';
    if (char === 'AltLeft') return 'AltLeft';
    return char;
}

function sendKey(keyCode, type) {
    if (!Module || !Module.canvas) return;
    Module.canvas.focus();
    
    var code = getKeyCode(keyCode);
    var eventInit = {
        bubbles: true, cancelable: true, key: keyCode, code: code,
        keyCode: keyCode.length === 1 ? keyCode.toUpperCase().charCodeAt(0) : 0,
        which: keyCode.length === 1 ? keyCode.toUpperCase().charCodeAt(0) : 0,
        shiftKey: activeModifiers.shift, altKey: activeModifiers.sym
    };
    
    var event = new KeyboardEvent(type === 'down' ? "keydown" : "keyup", eventInit);
    window.dispatchEvent(event);
}

var buttons = document.querySelectorAll('.vk-btn');
buttons.forEach(function(btn) {
    var key = btn.getAttribute('data-key');
    if (!key) return;
    var isModifier = (key === 'ShiftLeft' || key === 'AltLeft');
    var pressHandler = function(e) {
        e.preventDefault(); 
        if (isModifier) {
            if (key === 'ShiftLeft') {
                activeModifiers.shift = !activeModifiers.shift;
                btn.classList.toggle('active', activeModifiers.shift);
                sendKey('ShiftLeft', activeModifiers.shift ? 'down' : 'up');
            } else if (key === 'AltLeft') {
                activeModifiers.sym = !activeModifiers.sym;
                btn.classList.toggle('active', activeModifiers.sym);
                sendKey('AltLeft', activeModifiers.sym ? 'down' : 'up');
            }
        } else {
            btn.classList.add('active');
            sendKey(key, 'down');
        }
    };
    var releaseHandler = function(e) {
        e.preventDefault();
        if (!isModifier) {
            btn.classList.remove('active');
            sendKey(key, 'up');
        }
    };
    btn.addEventListener('mousedown', pressHandler);
    btn.addEventListener('touchstart', pressHandler, {passive: false});
    btn.addEventListener('mouseup', releaseHandler);
    btn.addEventListener('touchend', releaseHandler);
    btn.addEventListener('mouseleave', releaseHandler);
});

document.getElementById('btn-reset').addEventListener('click', function(e) {
    e.preventDefault();
    Module.canvas.focus();
    sendKey('F5', 'down');
    setTimeout(() => sendKey('F5', 'up'), 50);
});