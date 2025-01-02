const EMPTY = 0;
const LIGHT = 1;
const DARK = 2;

const boardElement = document.getElementById("board");

async function showBoard() {
  const turnCount = 0;
  const response = await fetch(`api/games/latest/turns/${turnCount}`);
  const responseBody = await response.json();
  const board = responseBody.board;

  while (boardElement.firstChild) {
    boardElement.removeChild(boardElement.firstChild);
  }
  board.forEach((row) => {
    row.forEach((value) => {
      const newSquare = document.createElement("div");
      if (value > 0) {
        const stone = document.createElement("div");
        stone.classList.add(value === 1 ? "light" : "dark", "stone");
        newSquare.appendChild(stone);
      }
      newSquare.classList.add("square");
      boardElement.appendChild(newSquare);
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
