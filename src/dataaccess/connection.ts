import mysql from "mysql2/promise";

export async function connectMySql() {
  return await mysql.createConnection({
    host: "localhost",
    port: 3306,
    database: "reversi",
    user: "root",
    password: "taromysql",
  });
}
