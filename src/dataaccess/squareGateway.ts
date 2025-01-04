import mysql from "mysql2/promise";
import { SquareRecord } from "./squareRecord";

export class SquareGateway {
  async findByTurnId(
    conn: mysql.Connection,
    turnId: number
  ): Promise<SquareRecord[] | undefined> {
    const squareSelectResults = await conn.execute<mysql.RowDataPacket[]>(
      "select id, turn_id, x, y, disc from squares where turn_id = ?",
      [turnId]
    );

    if (!squareSelectResults || !squareSelectResults.length) return undefined;

    const results = squareSelectResults[0];
    return results.map(
      (result) =>
        new SquareRecord(
          result["id"],
          result["turn_id"],
          result["disc"],
          result["x"],
          result["y"]
        )
    );
  }

  async insertAll(conn: mysql.Connection, turnId: number, board: number[][]) {
    const squareCount = board
      .map((line) => line.length)
      .reduce((acc, cur) => acc + cur, 0);

    const squareInsertSql =
      "insert into squares (turn_id, x, y, disc) values" +
      Array.from(Array(squareCount))
        .map(() => "(?, ?, ?, ?)")
        .join(", ");

    const squareInsertValues: any[] = [];
    board.forEach((line, y) => {
      line.forEach((disc, x) => {
        squareInsertValues.push(turnId);
        squareInsertValues.push(x);
        squareInsertValues.push(y);
        squareInsertValues.push(disc);
      });
    });

    await conn.execute(squareInsertSql, squareInsertValues);
  }
}
