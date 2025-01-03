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
    row.forEach((square) => {
      const squareElement = document.createElement("div");
      squareElement.className = "square";

      if (square !== EMPTY) {
        const stoneElement = document.createElement("div");
        const color = square === DARK ? "dark" : "light";
        stoneElement.className = `stone ${color}`;
        squareElement.appendChild(stoneElement);
      } else {
        squareElement.addEventListener("click", () => {
          console.log("clicked");
          // ここでregisterTurnを呼ぶ
        });
      }
      boardElement.appendChild(squareElement);
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

async function registerTurn(turnCount, disc, x, y) {
  const requestBody = {
    turnCount,
    move: {
      disc,
      x,
      y,
    },
  };

  await fetch("/api/games/latest/turns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

async function main() {
  await registerGame();
  await showBoard();
}

main();
