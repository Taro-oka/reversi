import express from "express";
import { connectMySql } from "../dataaccess/connection";
import { GameGateway } from "../dataaccess/gameGateway";
import { TurnGateway } from "../dataaccess/turnGateway";
import { MoveGateway } from "../dataaccess/moveGateway";
import { SquareGateway } from "../dataaccess/squareGateway";
import { DARK, LIGHT } from "../application/constants";

export const turnRouter = express.Router();

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const moveGateway = new MoveGateway();
const squareGateway = new SquareGateway();

turnRouter.get("/api/games/latest/turns/:turnCount", async (req, res) => {
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

turnRouter.post("/api/games/latest/turns", async (req, res) => {
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
