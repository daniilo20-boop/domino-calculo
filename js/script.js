// Dicionário apenas com expressões matemáticas correspondentes aos valores de 0 a 6
const mathExpressions = {
    0: ["0 x 5", "0 / 2", "5 - 5", "3 - 3"],
    1: ["3 - 2", "5 / 5", "2 - 1", "4 / 4"],
    2: ["1 + 1", "10 / 5", "4 - 2", "6 / 3"],
    3: ["1 + 2", "9 / 3", "6 - 3", "12 / 4"],
    4: ["2 x 2", "8 / 2", "1 + 3", "7 - 3"],
    5: ["2 + 3", "10 / 2", "6 - 1", "4 + 1"],
    6: ["3 x 2", "12 / 2", "4 + 2", "9 - 3"]
};

// Variáveis de Estado do Sistema
let players = [];
let playerNames = [];
let playerTimes = [];
let useTimer = false;
let timerInterval = null;
let board = [];
let boneyard = [];
let currentPlayerIndex = 0;
let leftEnd = null;
let rightEnd = null;

// Referências do DOM
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const transitionScreen = document.getElementById('transition-screen');
const btnStart = document.getElementById('btn-start');
const numPlayersInput = document.getElementById('num-players');
const timeLimitSelect = document.getElementById('time-limit');
const playerNamesContainer = document.getElementById('player-names-container');
const timersContainer = document.getElementById('timers-container');
const boardDiv = document.getElementById('board');
const handDiv = document.getElementById('player-hand');
const turnIndicator = document.getElementById('turn-indicator');
const btnPass = document.getElementById('btn-pass');
const btnReady = document.getElementById('btn-ready');
const transitionMsg = document.getElementById('transition-msg');

// Event Listeners
btnStart.addEventListener('click', startGame);
btnPass.addEventListener('click', passTurn);
btnReady.addEventListener('click', showPlayerScreen);
numPlayersInput.addEventListener('input', renderNameInputs);

// Redesenha e centraliza a mesa automaticamente ao girar o celular ou redimensionar
window.addEventListener('resize', () => {
    if (!gameScreen.classList.contains('hidden')) {
        renderBoardSnake();
    }
});

// Gera os campos de nome dinamicamente conforme a quantidade de jogadores
function renderNameInputs() {
    let count = parseInt(numPlayersInput.value);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 4) count = 4;

    playerNamesContainer.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const row = document.createElement('div');
        row.className = 'name-input-row';
        row.innerHTML = `
            <label for="player-name-${i}">Jogador ${i}:</label>
            <input type="text" id="player-name-${i}" placeholder="Nome do Jogador ${i}" maxlength="20">
        `;
        playerNamesContainer.appendChild(row);
    }
}

renderNameInputs();

function startGame() {
    const numPlayers = parseInt(numPlayersInput.value);
    if (numPlayers < 1 || numPlayers > 4) {
        alert("Escolha entre 1 e 4 jogadores.");
        return;
    }

    const selectedSeconds = parseInt(timeLimitSelect.value);
    useTimer = selectedSeconds > 0;

    let deck = generateDeck();
    deck = shuffleDeck(deck);
    
    players = [];
    playerNames = [];
    playerTimes = [];

    for (let i = 0; i < numPlayers; i++) {
        players.push(deck.splice(0, 7));
        
        const inputEl = document.getElementById(`player-name-${i + 1}`);
        const typedName = inputEl ? inputEl.value.trim() : '';
        playerNames.push(typedName || `Jogador ${i + 1}`);
        playerTimes.push(selectedSeconds);
    }
    
    boneyard = deck;
    board = [];
    leftEnd = null;
    rightEnd = null;
    currentPlayerIndex = 0;

    setupScreen.classList.remove('active-screen');
    setupScreen.classList.add('hidden');
    
    if (players.length > 1) {
        showTransitionScreen();
    } else {
        showPlayerScreen();
    }
}

function generateDeck() {
    let deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            const list1 = mathExpressions[i];
            const expr1 = list1[Math.floor(Math.random() * list1.length)];
            
            let list2 = mathExpressions[j];
            if (i === j) {
                list2 = list2.filter(e => e !== expr1);
            }
            const expr2 = list2[Math.floor(Math.random() * list2.length)];
            
            deck.push({ val1: i, expr1: expr1, val2: j, expr2: expr2 });
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ==========================================
// CONTROLE DO RELÓGIO ESTILO XADREZ
// ==========================================
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTurnTimer() {
    stopTurnTimer();
    if (!useTimer) return;

    timerInterval = setInterval(() => {
        if (playerTimes[currentPlayerIndex] > 0) {
            playerTimes[currentPlayerIndex]--;
            renderTimers();

            if (playerTimes[currentPlayerIndex] === 0) {
                stopTurnTimer();
                handleTimeOut();
            }
        }
    }, 1000);
}

function stopTurnTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function renderTimers() {
    if (!useTimer) {
        timersContainer.classList.add('hidden');
        return;
    }

    timersContainer.classList.remove('hidden');
    timersContainer.innerHTML = '';

    playerNames.forEach((name, idx) => {
        const isCurrent = idx === currentPlayerIndex;
        const secondsLeft = playerTimes[idx];
        const isLow = isCurrent && secondsLeft <= 15 && secondsLeft > 0;

        const card = document.createElement('div');
        card.className = `player-timer-card ${isCurrent ? 'active-timer' : ''} ${isLow ? 'low-time' : ''}`;
        card.innerHTML = `
            <span class="timer-player-name">${name}</span>
            <span class="timer-clock">⏱️ ${formatTime(secondsLeft)}</span>
            <span class="timer-pieces-count">${players[idx].length} peça(s)</span>
        `;
        timersContainer.appendChild(card);
    });
}

function handleTimeOut() {
    const timeOutPlayer = playerNames[currentPlayerIndex];

    if (players.length === 1) {
        alert(`⏱️ O tempo acabou, ${timeOutPlayer}! Você ficou com ${players[0].length} peça(s) na mão.`);
        location.reload();
        return;
    }

    let minPieces = Infinity;
    let minSum = Infinity;
    let winnerName = "";

    players.forEach((hand, idx) => {
        const count = hand.length;
        const sum = hand.reduce((acc, tile) => acc + tile.val1 + tile.val2, 0);

        if (count < minPieces || (count === minPieces && sum < minSum)) {
            minPieces = count;
            minSum = sum;
            winnerName = playerNames[idx];
        }
    });

    alert(`⏱️ O tempo de ${timeOutPlayer} acabou!\n\n🏆 ${winnerName} venceu a partida por ter menos peças (${minPieces} peça(s))!`);
    location.reload();
}

// ==========================================
// FLUXO DE TELAS E JOGADAS
// ==========================================
function showTransitionScreen() {
    stopTurnTimer();
    gameScreen.classList.add('hidden');
    transitionScreen.classList.remove('hidden');
    transitionScreen.classList.add('active-screen');
    transitionMsg.innerText = `Passe o dispositivo para ${playerNames[currentPlayerIndex]}`;
}

function showPlayerScreen() {
    transitionScreen.classList.remove('active-screen');
    transitionScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active-screen');

    updateUI();
    startTurnTimer();
}

function updateUI() {
    turnIndicator.innerHTML = `<span style="font-size: 0.9rem; font-weight: 600; opacity: 0.85;">Vez de:</span> ${playerNames[currentPlayerIndex]}`;

    renderTimers();
    renderBoardSnake();

    handDiv.innerHTML = '';
    players[currentPlayerIndex].forEach((tile, index) => {
        const dominoEl = createDominoElement(tile, 'vertical', false);
        dominoEl.addEventListener('click', () => playTile(index));
        handDiv.appendChild(dominoEl);
    });

    if (players[currentPlayerIndex].length === 0) {
        stopTurnTimer();
        alert(`🎉 Fim de jogo! ${playerNames[currentPlayerIndex]} bateu e venceu!`);
        location.reload();
    }
}

function renderBoardSnake() {
    boardDiv.innerHTML = '';
    const isMobile = window.innerWidth <= 600;

    if (board.length === 0) {
        boardDiv.style.height = isMobile ? '140px' : '180px';
        return;
    }

    const tileLong = isMobile ? 76 : 110;
    const tileShort = isMobile ? 38 : 55;
    const gap = 2;
    const padding = isMobile ? 10 : 20;
    const boardWidth = boardDiv.clientWidth || (window.innerWidth - 32);

    let x = 0;
    let y = 0;
    let dir = 1;

    // 1º Passo: Calcula as posições relativas e os limites reais (min/max) do conjunto
    const items = [];
    let minX = Infinity, maxX = -Infinity;
    let minY = 0, maxY = tileShort;

    board.forEach((tile, index) => {
        const hitRightEdge = dir === 1 && (x + tileLong > boardWidth - padding * 2) && index > 0;
        const hitLeftEdge = dir === -1 && (x - tileLong < 0) && index > 0;

        let drawX, drawY, w, h, orientation, isReversed = false;

        if (hitRightEdge || hitLeftEdge) {
            orientation = 'vertical';
            w = tileShort;
            h = tileLong;
            drawX = dir === 1 ? (x - tileShort) : x;
            drawY = y + tileShort + gap;

            y = drawY + tileLong - tileShort;
            dir *= -1;
            x = dir === 1 ? (drawX + tileShort + gap) : (drawX - gap);
        } else {
            orientation = 'horizontal';
            w = tileLong;
            h = tileShort;
            drawX = dir === 1 ? x : (x - tileLong);
            drawY = y;
            isReversed = (dir === -1);

            x += dir * (tileLong + gap);
        }

        minX = Math.min(minX, drawX);
        maxX = Math.max(maxX, drawX + w);
        maxY = Math.max(maxY, drawY + h);

        items.push({ tile, index, drawX, drawY, orientation, isReversed });
    });

    // 2º Passo: Calcula a altura do tabuleiro e o deslocamento para centralizar tudo
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    const boardHeight = Math.max(isMobile ? 150 : 200, totalHeight + padding * 2);

    const offsetX = Math.max(padding, (boardWidth - totalWidth) / 2) - minX;
    const offsetY = Math.max(padding, (boardHeight - totalHeight) / 2) - minY;

    // 3º Passo: Renderiza as peças já centralizadas na mesa
    items.forEach(({ tile, index, drawX, drawY, orientation, isReversed }) => {
        const dominoEl = createDominoElement(tile, orientation, isReversed);
        dominoEl.style.left = `${drawX + offsetX}px`;
        dominoEl.style.top = `${drawY + offsetY}px`;
        boardDiv.appendChild(dominoEl);

        const topHalf = dominoEl.querySelector('.top');
        const bottomHalf = dominoEl.querySelector('.bottom');

        if (index === 0) {
            if (isReversed) {
                bottomHalf.classList.add('ponta-aberta');
            } else {
                topHalf.classList.add('ponta-aberta');
            }
        }

        if (index === board.length - 1) {
            if (isReversed) {
                topHalf.classList.add('ponta-aberta');
            } else {
                bottomHalf.classList.add('ponta-aberta');
            }
        }
    });

    boardDiv.style.height = `${boardHeight}px`;
}

function createDominoElement(tile, orientation, reverseVisual) {
    const div = document.createElement('div');
    div.className = `domino ${orientation}`;
    
    const firstExpr = reverseVisual ? tile.expr2 : tile.expr1;
    const secondExpr = reverseVisual ? tile.expr1 : tile.expr2;

    const topHalf = document.createElement('div');
    topHalf.className = 'domino-half top';
    topHalf.innerText = firstExpr;

    const bottomHalf = document.createElement('div');
    bottomHalf.className = 'domino-half bottom';
    bottomHalf.innerText = secondExpr;

    div.appendChild(topHalf);
    div.appendChild(bottomHalf);
    return div;
}

function playTile(tileIndex) {
    const tile = players[currentPlayerIndex][tileIndex];

    if (board.length === 0) {
        placeTile(tile, tileIndex, 'right', false);
        return;
    }

    const canPlayLeftFirst = tile.val1 === leftEnd;
    const canPlayLeftSecond = tile.val2 === leftEnd;
    const canPlayRightFirst = tile.val1 === rightEnd;
    const canPlayRightSecond = tile.val2 === rightEnd;

    if (!canPlayLeftFirst && !canPlayLeftSecond && !canPlayRightFirst && !canPlayRightSecond) {
        alert("Esta peça não encaixa em nenhuma das pontas. O resultado das equações deve ser igual aos das pontas abertas.");
        return;
    }

    if (canPlayRightFirst) {
        placeTile(tile, tileIndex, 'right', false);
    } else if (canPlayRightSecond) {
        placeTile(tile, tileIndex, 'right', true);
    } else if (canPlayLeftSecond) {
        placeTile(tile, tileIndex, 'left', false);
    } else if (canPlayLeftFirst) {
        placeTile(tile, tileIndex, 'left', true);
    }
}

function placeTile(tile, tileIndex, side, flip) {
    let playedTile = { ...tile };
    if (flip) {
        playedTile = { val1: tile.val2, expr1: tile.expr2, val2: tile.val1, expr2: tile.expr1 };
    }

    players[currentPlayerIndex].splice(tileIndex, 1);

    if (board.length === 0) {
        board.push(playedTile);
        leftEnd = playedTile.val1;
        rightEnd = playedTile.val2;
    } else {
        if (side === 'right') {
            board.push(playedTile);
            rightEnd = playedTile.val2;
        } else if (side === 'left') {
            board.unshift(playedTile);
            leftEnd = playedTile.val1;
        }
    }

    nextTurn();
}

function passTurn() {
    if (board.length > 0) {
        const hasValidMove = players[currentPlayerIndex].some(tile => 
            tile.val1 === leftEnd || tile.val2 === leftEnd || 
            tile.val1 === rightEnd || tile.val2 === rightEnd
        );
        if (hasValidMove) {
            alert("Você tem peças que podem ser jogadas! Resolva as equações para encontrar o encaixe.");
            return;
        }
    }

    if (boneyard.length > 0) {
        const newTile = boneyard.pop();
        players[currentPlayerIndex].push(newTile);
        alert("Você comprou uma peça do monte!");
        updateUI();
    } else {
        alert("O monte está vazio. Passando a vez.");
        nextTurn();
    }
}

function nextTurn() {
    if (players[currentPlayerIndex].length === 0) {
        updateUI();
        return;
    }
    
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    
    if (players.length > 1) {
        showTransitionScreen();
    } else {
        updateUI();
    }
}