// --- 1. НАСТРОЙКА МОДУЛЯ (ДО ЗАГРУЗКИ WASM) ---
var Module = {
    canvas: document.getElementById('canvas'),
    onReady: function() {
        console.log("USP Ready");
    },
    locateFile: function(filename) {
        return filename;
    }
};

// Читаем URL и сразу передаем аргументы (важно!)
const params = new URLSearchParams(window.location.search);
let gameName = params.get('game');

if (gameName) {
    gameName = gameName.toLowerCase();
    console.log("Игра из URL:", gameName);
    // Передаем аргументы до запуска main()
    Module.arguments = ['./' + gameName];
} else {
    Module.arguments = [];
}

// --- 2. ЛОГИКА ЗАГРУЗКИ ИГРЫ ---
if (gameName) {
    Module.preRun = Module.preRun || [];
    Module.preRun.push(function() {
        console.log("PreRun: Скачивание файла...");
        Module.addRunDependency('game-download');

        // Если файлы в папке games, добавьте 'games/' ниже:
        var gameUrl = 'games/' + gameName; 

        var xhr = new XMLHttpRequest();
        xhr.open('GET', gameUrl, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function() {
            if (xhr.status === 200) {
                var data = new Uint8Array(xhr.response);
                Module.FS_createDataFile('/', gameName, data, true, true, true);
                console.log("PreRun: Файл создан");
                Module.removeRunDependency('game-download');
            } else {
                console.error("PreRun: 404");
                Module.arguments = [];
                Module.removeRunDependency('game-download');
            }
        };
        xhr.onerror = function() {
            console.error("PreRun: Сеть");
            Module.arguments = [];
            Module.removeRunDependency('game-download');
        };
        xhr.send(null);
    });
}

// --- 3. ОБРАБОТЧИК СТАРТА (ЗВУК) ---
var overlay = document.getElementById('start-overlay');
overlay.addEventListener('click', function() {
    overlay.style.display = 'none';
    document.getElementById('status').style.display = 'none';

    if (Module.SDL2 && Module.SDL2.audioContext && Module.SDL2.audioContext.state === 'suspended') {
        Module.SDL2.audioContext.resume();
    }
    Module.canvas.focus();
    
    // Авто-ресет если нужно
    setTimeout(function() {
        sendKey('F5', 'down');
        setTimeout(() => sendKey('F5', 'up'), 50);
    }, 500);
});

// --- 4. ЛОГИКА ВИРТУАЛЬНОЙ КЛАВИАТУРЫ ---
if (!window.activeModifiers) {
    window.activeModifiers = { shift: false, sym: false };
}
var activeModifiers = window.activeModifiers;

function getKeyCode(char) {
    if (!char) return '';
    if (char.length === 1) {
        if (char >= '0' && char <= '9') return 'Digit' + char;
        if (char >= 'a' && char <= 'z') return 'Key' + char.toUpperCase();
        if (char >= 'A' && char <= 'Z') return 'Key' + char;
        if (char === '.') return 'Period';
        if (char === ',') return 'Comma';
        if (char === '-') return 'Minus';
        if (char === '=') return 'Equal';
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

// Навешиваем события на кнопки
var buttons = document.querySelectorAll('.vk-btn');
buttons.forEach(function(btn) {
    var key = btn.getAttribute('data-key');
    if (!key) return; // Пропускаем кнопки без атрибута (например, Reset)

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

// Отдельная кнопка Reset
document.getElementById('btn-reset').addEventListener('click', function(e) {
    e.preventDefault();
    Module.canvas.focus();
    sendKey('F5', 'down');
    setTimeout(() => sendKey('F5', 'up'), 50);
});