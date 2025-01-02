const EMPTY = 0;
const LIGHT = 1;
const DARK = 2;

const INITIAL_BOARD = [
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, LIGHT, DARK, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, DARK, LIGHT, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
];

const board = document.getElementById("board");

async function showBoard() {
  while (board.firstChild) {
    board.removeChild(board.firstChild);
  }
  INITIAL_BOARD.forEach((row) => {
    row.forEach((value) => {
      const newSquare = document.createElement("div");
      if (value > 0) {
        const stone = document.createElement("div");
        stone.classList.add(value === 1 ? "light" : "dark", "stone");
        newSquare.appendChild(stone);
      }
      newSquare.classList.add("square");
      board.appendChild(newSquare);
    });
  });
}

async function registerGame() {
  const res = await fetch("/api/games", {
    method: "POST",
  });
  // const data = await res.json();
  console.log(res);
}

async function main() {
  await registerGame();
  await showBoard();
}

main();
