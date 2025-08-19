const { DatabaseSync } = require('node:sqlite');
const database = new DatabaseSync('./database.sqlite');

database.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    board_id INTEGER NOT NULL REFERENCES boards(id)
  );
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    column_id INTEGER NOT NULL REFERENCES columns(id)
  );
`)
