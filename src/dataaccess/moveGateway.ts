import mysql from "mysql2/promise";
import { MoveRecord } from "./moveRecord";

export class MoveGateway {
  async insert(
    conn: mysql.Connection,
    turnId: number,
    disc: number,
    x: number,
    y: number
  ) {
    const moveInsertResult = await conn.execute<mysql.ResultSetHeader>(
      "insert into moves (turn_id, disc, x, y) values (?, ?, ?, ?)",
      [turnId, disc, x, y]
    );

    return new MoveRecord(moveInsertResult[0].insertId, turnId, disc, x, y);
  }
}
