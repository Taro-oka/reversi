import { connectMySql } from "../dataaccess/connection";
import { GameGateway } from "../dataaccess/gameGateway";
import { TurnGateway } from "../dataaccess/turnGateway";
import { SquareGateway } from "../dataaccess/squareGateway";
import { MoveGateway } from "../dataaccess/moveGateway";
import { DARK, LIGHT } from "./constants";

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();
const squareGateway = new SquareGateway();
const moveGateway = new MoveGateway();

class findLatestGameByTurnCountOutput {
  constructor(
    private _turnCount: number,
    private _board: number[][],
    private _nextDisc: number | undefined,
    protected _winnerDisc: number | undefined
  ) {}

  get turnCount(): number {
    return this._turnCount;
  }

  get board(): number[][] {
    return this._board;
  }

  get nextDisc(): number | undefined {
    return this._nextDisc;
  }

  get winnerDisc(): number | undefined {
    return this._winnerDisc;
  }
}

export class TurnService {
  async findLatestGameByTurnCount(
    turnCount: number
  ): Promise<findLatestGameByTurnCountOutput> {
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

      const squareRecords = await squareGateway.findByTurnId(
        conn,
        turnRecord.id
      );
      if (!squareRecords) throw new Error("Squares not found");

      const board = Array.from(Array(8)).map((_) => Array.from(Array(8)));
      squareRecords.forEach((s) => {
        board[s.y][s.x] = s.disc;
      });

      return new findLatestGameByTurnCountOutput(
        turnCount,
        board,
        turnRecord.nextDisc,
        undefined
      );
    } finally {
      await conn.end();
    }
  }

  async registerTurn(turnCount: number, disc: number, x: number, y: number) {
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
  }
}
