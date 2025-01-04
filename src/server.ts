import express from "express";
import morgan from "morgan";
import "express-async-errors";
import mysql from "mysql2/promise";
import { GameGateway } from "./dataaccess/gameGateway";
import { TurnGateway } from "./dataaccess/turnGateway";
import { MoveGateway } from "./dataaccess/moveGateway";
import { SquareGateway } from "./dataaccess/squareGateway";

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

const PORT = 3000;
const app = express();
app.use(morgan("dev"));
app.use(express.static("static", { extensions: ["html"] }));
app.use(express.json()); // req.body内に受け取ったjsonを格納できるように

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const moveGateway = new MoveGateway();
const squareGateway = new SquareGateway();

app.get("/api/hello", async (req, res) => {
  res.json({
    message: "Hello",
  });
});

app.post("/api/games", async (req, res) => {
  const now = new Date();
  const conn = await connectMySql();

  try {
    await conn.beginTransaction();

    const gameRecord = await gameGateway.insert(conn, now);
    const turnRecord = await turnGateway.insert(
      conn,
      gameRecord.id,
      0,
      DARK,
      now
    );
    await squareGateway.insertAll(conn, turnRecord.id, INITIAL_BOARD);

    await conn.commit();
  } catch (e) {
    console.error(e);
  } finally {
    await conn.end();
  }
  res.status(201).end();
});

app.get("/api/error", async (req, res) => {
  throw new Error("Error!!!");
});

app.get("/api/games/latest/turns/:turnCount", async (req, res) => {
  const turnCount = parseInt(req.params.turnCount);
  const conn = await connectMySql();
  try {
    const gameRecord = await gameGateway.findLatest(conn);
    if (!gameRecord) throw new Error("Latest game not found");

    const turnRecord = await turnGateway.findForGameIdAndTurnCount(
      conn,
      gameRecord.id,
      turnCount
    );
    if (!turnRecord) throw new Error("Turn not found");

    const squareRecords = await squareGateway.findByTurnId(conn, turnRecord.id);
    if (!squareRecords) throw new Error("Squares not found");

    const board = Array.from(Array(8)).map((_) => Array.from(Array(8)));
    squareRecords.forEach((s) => {
      board[s.y][s.x] = s.disc;
    });

    const responseBody = {
      turnCount,
      board,
      nextDisc: turnRecord.nextDisc,
      winnerDisc: null,
    };
    res.json(responseBody);
  } finally {
    await conn.end();
  }
});

app.post("/api/games/latest/turns", async (req, res) => {
  const turnCount = parseInt(req.body.turnCount);
  const disc = parseInt(req.body.move.disc);
  const x = parseInt(req.body.move.x);
  const y = parseInt(req.body.move.y);

  const conn = await connectMySql();
  try {
    await conn.beginTransaction();

    // ひとつ前のターンを取得する
    const gameRecord = await gameGateway.findLatest(conn);
    if (!gameRecord) throw new Error("Latest game not found");

    const prevTurnCount = turnCount - 1;
    const prevTurnRecord = await turnGateway.findForGameIdAndTurnCount(
      conn,
      gameRecord.id,
      prevTurnCount
    );
    if (!prevTurnRecord) throw new Error("turn not found");

    const squareRecords = await squareGateway.findByTurnId(
      conn,
      prevTurnRecord.id
    );
    if (!squareRecords) throw new Error("squares not found");

    const board = Array.from(Array(8)).map((_) => Array.from(Array(8)));
    squareRecords.forEach((s) => {
      board[s.y][s.x] = s.disc;
    });

    // 石を置く
    board[y][x] = disc;

    // 更新する
    const now = new Date();
    const nextDisc = disc === DARK ? LIGHT : DARK;
    const turnRecord = await turnGateway.insert(
      conn,
      gameRecord.id,
      turnCount,
      nextDisc,
      now
    );
    await squareGateway.insertAll(conn, turnRecord.id, board);
    await moveGateway.insert(conn, turnRecord.id, disc, x, y);

    await conn.commit();
  } finally {
    await conn.end();
  }

  res.status(201).end();
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("error!", err);
    res.status(500).send({
      message: err instanceof Error ? err.message : "Unexpected error occurred",
    });
  }
);

export const startServer = () => {
  app.listen(PORT, () => {
    console.log("started!!");
  });
};

async function connectMySql() {
  return await mysql.createConnection({
    host: "localhost",
    port: 3307,
    database: "reversi",
    user: "reversi",
    password: "password",
  });
}
