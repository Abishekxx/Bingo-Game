const socket = io();
const grid = document.getElementById('grid');
const info = document.getElementById('info');
const joinBtn = document.getElementById('joinBtn');
const nameInput = document.getElementById('nameInput');
const nameEntry = document.getElementById('name-entry');

let playerId;
let myTurn = false;
let myName = "";
let opponentName = "";

// When user clicks "Join Game"
joinBtn.addEventListener('click', () => {
  myName = nameInput.value.trim() || "Player";
  socket.emit('joinGame', myName);
  nameEntry.style.display = 'none';
  info.style.display = 'block';
});

// Generate randomized 5x5 grid
function generateGrid() {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1)
                       .sort(() => Math.random() - 0.5);

  grid.innerHTML = ''; // Clear existing

  numbers.forEach((num) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = num;
    cell.dataset.number = num;
    grid.appendChild(cell);

    cell.addEventListener('click', () => {
      if (myTurn && !cell.classList.contains('marked')) {
        cell.classList.add('marked');
        socket.emit('markNumber', { number: num });
        checkWin();
      }
    });
  });
}

// Receive your player number
socket.on('playerNumber', (num) => {
  playerId = num;
});

// Start game when both players join
socket.on('startGame', ({ currentTurnId, players }) => {
  opponentName = players.find(p => p.id !== socket.id)?.name || "Opponent";
  myTurn = (socket.id === currentTurnId);
  grid.style.display = 'grid';
  generateGrid();
  info.textContent = myTurn ? `Your turn, ${myName}!` : `${opponentName}'s turn`;
});

// Switch turns
socket.on('switchTurn', (currentTurnId) => {
  myTurn = (socket.id === currentTurnId);
  info.textContent = myTurn ? `Your turn, ${myName}!` : `${opponentName}'s turn`;
});

// Update grid when other player marks
socket.on('updateGrid', ({ number }) => {
  document.querySelectorAll('.cell').forEach(cell => {
    if (parseInt(cell.dataset.number) === number) {
      cell.classList.add('marked');
    }
  });
});

// Show win result
socket.on('gameWon', (winnerId) => {
  alert(winnerId === socket.id ? `🎉 ${myName}, you won!` : `😢 ${opponentName} won.`);
  window.location.reload();
});

// Show message when player leaves
socket.on('playerLeft', () => {
  alert("Opponent left the game. Refresh to start again.");
  window.location.reload();
});

// Room full handler
socket.on('roomFull', () => {
  alert("Room is full. Try again later.");
});

// Check win conditions (rows, columns, diagonals)
function checkWin() {
  const cells = document.querySelectorAll('.cell');
  const matrix = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) =>
      cells[r * 5 + c].classList.contains('marked') ? 1 : 0
    )
  );

  const winLines = [];

  for (let i = 0; i < 5; i++) {
    winLines.push(matrix[i]);                            // row
    winLines.push(matrix.map(row => row[i]));            // column
  }

  winLines.push(matrix.map((row, i) => row[i]));         // main diag
  winLines.push(matrix.map((row, i) => row[4 - i]));     // anti diag

  const hasWon = winLines.some(line => line.every(val => val === 1));

  if (hasWon) {
    socket.emit('win', socket.id);
  }
}
