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
    column_id INTEGER NOT NULL REFERENCES columns(id),
    dateCreated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO "boards" ("id", "name", "color") VALUES
  ('1', 'Todo ', '#cbd5e1');

  INSERT INTO "columns" ("id", "name", "board_id") VALUES
  ('1', 'Backlog', '1'),
  ('2', 'In Progress', '1'),
  ('3', 'World', '1');

  INSERT INTO "cards" ("id", "text", "order", "column_id", "dateCreated") VALUES
  ('1', 'test', '0', '1', '2025-09-04T00:25:59.438Z'),
  ('2', 'hello', '1', '1', '2025-09-04T00:27:04.198Z'),
  ('3', 'Test', '0', '2', '2025-09-04T00:27:46.536Z');
`)
