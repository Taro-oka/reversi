const EMPTY = 0;
const LIGHT = 1;
const DARK = 2;

const board = document.getElementById("board");

async function showBoard() {
  const turnCount = 0;
  const response = await fetch(`api/games/latest/turns/${turnCount}`);
  const responseBody = await response.json();
  const _board = responseBody.board;

  while (board.firstChild) {
    board.removeChild(board.firstChild);
  }
  _board.forEach((row) => {
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
