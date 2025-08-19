import { createSchema } from "graphql-yoga";
import type { DatabaseSync, SQLOutputValue } from "node:sqlite";


export default createSchema({
  typeDefs: `
    type Query {
      boards: [Board!]!
      board(id: ID!): Board
    }

    type Mutation {
      createBoard(input: CreateBoardInput!): CreateBoardOutput!
      updateBoard(input: UpdateBoardInput!): UpdateBoardOutput!
      deleteBoard(id: ID!): DeleteBoardOutput!
      createColumn(input: CreateColumnInput!): CreateColumnOutput!
      updateColumn(input: UpdateColumnInput!): UpdateColumnOutput!
      createCard(input: CreateCardInput!): CreateCardOutput!
      moveCard(input: MoveCardInput!): MoveCardOutput!
    }

    type Board {
      id: ID!
      name: String!
      color: String!
      columns: [Column!]!
    }

    type Column {
      name: String!
      id: ID!
      cards: [Card!]!
    }

    type Card {
      id: ID!
      text: String!
      order: Int!
      column: Column!
    }

    type DeleteBoardOutput {
      boardID: ID
    }

    input CreateBoardInput {
      name: String!
      color: String!
    }

    type CreateBoardOutput {
      board: Board
    }

    input CreateColumnInput {
      board: ID!
      name: String!
    }

    type CreateColumnOutput {
      column: Column
    }

    input UpdateColumnInput {
      id: ID!
      name: String!
    }

    type UpdateColumnOutput {
      column: Column
    }

    input CreateCardInput {
      text: String!
      column: ID!
    }

    type CreateCardOutput {
      card: Card
    }

    input MoveCardInput {
      card: ID!
      column: ID!
      index: Int!
    }

    type MoveCardOutput {
      card: Card
      board: Board
      source: Column
      destination: Column
    }

    input UpdateBoardInput {
      id: ID!
      name: String
      color: String
    }

    type UpdateBoardOutput {
      board: Board
    }
  `,
  resolvers: {
    // ---------- Queries ----------
    Query: {
      boards: (_: unknown, __: unknown, { db }: Ctx): GQLBoard[] => {
        const stmt = db.prepare("SELECT id, name, color FROM boards ORDER BY id");
        return stmt.all().map(mapBoard);
      },

      board: (_: unknown, { id }: { id: string }, { db }: Ctx): GQLBoard | null => {
        const stmt = db.prepare("SELECT id, name, color FROM boards WHERE id = ?");
        const row = stmt.get(toInt(id));
        return row ? mapBoard(row) : null;
      },
    },

    // ---------- Field resolvers ----------
    Board: {
      columns: (board: GQLBoard, _: unknown, { db }: Ctx): GQLColumn[] => {
        const stmt = db.prepare(
          "SELECT id, name, board_id FROM columns WHERE board_id = ? ORDER BY id"
        );
        return stmt.all(toInt(board.id)).map(mapColumn);
      },
    },

    Column: {
      cards: (column: GQLColumn, _: unknown, { db }: Ctx): GQLCard[] => {
        const stmt = db.prepare(
          `SELECT id, text, "order", column_id
           FROM cards
           WHERE column_id = ?
           ORDER BY "order", id`
        );
        return stmt.all(toInt(column.id)).map(mapCard);
      },
    },

    Card: {
      // Resolve the column by joining through cards -> columns
      column: (card: GQLCard, _: unknown, { db }: Ctx): GQLColumn => {
        const stmt = db.prepare(
          `SELECT c.id, c.name, c.board_id
           FROM columns c
           JOIN cards   k ON k.column_id = c.id
           WHERE k.id = ?`
        );
        const row = stmt.get(toInt(card.id));
        if (!row) throw new Error("Column not found for card");
        return mapColumn(row);
      },
    },

    // ---------- Mutations ----------
    Mutation: {
      createBoard: (_: unknown, { input }: { input: { name: string; color: string } }, { db }: Ctx) => {
        const insert = db.prepare(
          "INSERT INTO boards (name, color) VALUES (?, ?)"
        );
        const { lastInsertRowid } = insert.run(input.name, input.color);
        const row = db
          .prepare("SELECT id, name, color FROM boards WHERE id = ?")
          .get(Number(lastInsertRowid))!;
        return { board: mapBoard(row) };
      },

      deleteBoard: (_: unknown, { id }: { id: string }, { db }: Ctx) => {
        const bid = toInt(id);
        const exists = db.prepare("SELECT id FROM boards WHERE id = ?").get(bid);
        if (!exists) return { boardID: null };
        const del = db.prepare("DELETE FROM boards WHERE id = ?");
        del.run(bid);
        return { boardID: toID(bid) };
      },

      updateBoard: (_: unknown, { input }: { input: { id: string; name?: string | null; color?: string | null } }, { db }: Ctx) => {
        const bid = toInt(input.id);
        const current = db.prepare("SELECT id, name, color FROM boards WHERE id = ?").get(bid);
        if (!current) return { board: null };

        db.prepare("UPDATE boards SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?")
          .run(input.name ?? null, input.color ?? null, bid);

        const row = db.prepare("SELECT id, name, color FROM boards WHERE id = ?").get(bid)!;
        return { board: mapBoard(row) };
      },

      createColumn: (_: unknown, { input }: { input: { board: string; name: string } }, { db }: Ctx) => {
        const bid = toInt(input.board);
        const board = db.prepare("SELECT id FROM boards WHERE id = ?").get(bid);
        if (!board) return { column: null };

        const { lastInsertRowid } = db
          .prepare("INSERT INTO columns (board_id, name) VALUES (?, ?)")
          .run(bid, input.name);

        const row = db
          .prepare("SELECT id, name, board_id FROM columns WHERE id = ?")
          .get(Number(lastInsertRowid))!;
        return { column: mapColumn(row) };
      },

      updateColumn: (_: unknown, { input }: { input: { id: string; name: string } }, { db }: Ctx) => {
        const cid = toInt(input.id);
        const exists = db.prepare("SELECT id FROM columns WHERE id = ?").get(cid);
        if (!exists) return { column: null };

        db.prepare("UPDATE columns SET name = ? WHERE id = ?").run(input.name, cid);

        const row = db
          .prepare("SELECT id, name, board_id FROM columns WHERE id = ?")
          .get(cid)!;
        return { column: mapColumn(row) };
      },

      createCard: (_: unknown, { input }: { input: { text: string; column: string } }, { db }: Ctx) => {
        const cid = toInt(input.column);
        const column = db.prepare("SELECT id FROM columns WHERE id = ?").get(cid);
        if (!column) return { card: null };

        const nextOrder =
          db
            .prepare('SELECT COALESCE(MAX("order") + 1, 0) AS "order" FROM cards WHERE column_id = ?')
            .get(cid)!.order;

        const { lastInsertRowid } = db
          .prepare(
            'INSERT INTO cards (column_id, text, "order") VALUES (?, ?, ?)'
          )
          .run(cid, input.text, nextOrder);

        const row = db
          .prepare('SELECT id, text, "order", column_id FROM cards WHERE id = ?')
          .get(Number(lastInsertRowid))!;
        return { card: mapCard(row) };
      },

      // Move a card to another column at a specific index, reindexing both columns.
      moveCard: (_: unknown, { input }: { input: { card: string; column: string; index: number } }, { db }: Ctx) => {
        const cardId = toInt(input.card);
        const destId = toInt(input.column);
        const destIndex = input.index;

        // Load source card + source column + board
        const card = db
          .prepare(
            `SELECT k.id, k.text, k."order", k.column_id,
                    c.name AS column_name, c.board_id
             FROM cards k
             JOIN columns c ON c.id = k.column_id
             WHERE k.id = ?`
          )
          .get(cardId);
        if (!card) throw new Error("Card not found");

        const sourceColId = card.column_id;

        // Load destination column + its board
        const destination = db
          .prepare("SELECT id, name, board_id FROM columns WHERE id = ?")
          .get(destId);
        if (!destination) throw new Error("Destination column not found");

        // Load the source board (to match your original return shape)
        const sourceBoard = db
          .prepare("SELECT id, name, color FROM boards WHERE id = ?")
          .get(card.board_id)!;

        // Reindex & move atomically
        tx(db, () => {
          // Close the gap in the source column
          db.prepare(
            'UPDATE cards SET "order" = "order" - 1 WHERE column_id = ? AND "order" > ?'
          ).run(sourceColId, card.order);

          // Make room in destination at the desired index
          db.prepare(
            'UPDATE cards SET "order" = "order" + 1 WHERE column_id = ? AND "order" >= ?'
          ).run(destId, destIndex);

          // Move the card
          db.prepare(
            'UPDATE cards SET column_id = ?, "order" = ? WHERE id = ?'
          ).run(destId, destIndex, cardId);
        });

        // Return fresh rows
        const cardRow = db
          .prepare('SELECT id, text, "order", column_id FROM cards WHERE id = ?')
          .get(cardId)!;

        const sourceCol = db
          .prepare("SELECT id, name, board_id FROM columns WHERE id = ?")
          .get(sourceColId)!;

        const destCol = destination; // already loaded

        return {
          card: mapCard(cardRow),
          board: mapBoard(sourceBoard),
          source: mapColumn(sourceCol),
          destination: mapColumn(destCol),
        };
      },
    },
  },
});

// GraphQL-facing shapes 
type GQLBoard  = { id: string; name: string; color: string };
type GQLColumn = { id: string; name: string };
type GQLCard   = { id: string; text: string; order: number };

type Ctx = { db: DatabaseSync };

// ---------- Small helpers ----------
const toID = (n: number | bigint) => String(n);
const toInt = (id: string) => Number.parseInt(id, 10);

function mapBoard(row: Record<string, SQLOutputValue>): GQLBoard {
  return { id: toID(row.id as number), name: row.name as string, color: row.color as string};
}
function mapColumn(row: Record<string, SQLOutputValue>): GQLColumn {
  return { id: toID(row.id as number), name: row.name as string};
}
function mapCard(row: Record<string, SQLOutputValue>): GQLCard {
  return { id: toID(row.id as number), text: row.text as string, order: row.order as number };
}

function tx<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const v = fn();
    db.exec("COMMIT");
    return v;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
