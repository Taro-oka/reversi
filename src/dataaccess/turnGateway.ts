import mysql from "mysql2/promise";
import { TurnRecord } from "./turnRecord";

export class TurnGateway {
  async findForGameIdAndTurnCount(
    conn: mysql.Connection,
    gameId: number,
    turnCount: number
  ): Promise<TurnRecord | undefined> {
    const turnSelectResult = await conn.execute<mysql.RowDataPacket[]>(
      "select id, game_id, turn_count, next_disc, end_at from turns where game_id = ? and turn_count = ?",
      [gameId, turnCount]
    );
    const record = turnSelectResult[0][0];

    return record
      ? new TurnRecord(
          record["id"],
          record["game_id"],
          record["turn_count"],
          record["next_disc"],
          record["end_at"]
        )
      : undefined;
  }

  async insert(
    conn: mysql.Connection,
    gameId: number,
    turnCount: number,
    nextDisc: number,
    endAt: Date
  ) {
    const turnInsertResult = await conn.execute<mysql.ResultSetHeader>(
      "insert into turns (game_id, turn_count, next_disc, end_at) values (?,?,?,?)",
      [gameId, turnCount, nextDisc, endAt]
    );

    return new TurnRecord(
      turnInsertResult[0].insertId,
      gameId,
      turnCount,
      nextDisc,
      endAt
    );
  }
}
