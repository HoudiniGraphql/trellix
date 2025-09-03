import { createSchema } from "graphql-yoga";
import type { DatabaseSync, SQLOutputValue } from "node:sqlite";
import { DateTimeResolver, DateTimeTypeDefinition } from 'graphql-scalars'

export default createSchema({
  typeDefs: `
    ${DateTimeTypeDefinition}

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
      deleteCard(id: ID!): DeleteCardOutput!
    }

    type DeleteCardOutput {
      cardID: ID
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
      dateCreated: DateTime!
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
      delay: Int
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
    Query: {
      boards: (_: unknown, __: unknown, { db }: Ctx): Board[] => {
        const stmt = db.prepare(
          "SELECT id, name, color FROM boards ORDER BY id",
        );
        return stmt.all().map(mapBoard);
      },

      board: (
        _: unknown,
        { id }: { id: string },
        { db }: Ctx,
      ): Board | null => {
        const stmt = db.prepare(
          "SELECT id, name, color FROM boards WHERE id = ?",
        );
        const row = stmt.get(toInt(id));
        return row ? mapBoard(row) : null;
      },
    },

    // ---------- Field resolvers ----------
    Board: {
      columns: (board: Board, _: unknown, { db }: Ctx): Column[] => {
        const stmt = db.prepare(
          "SELECT id, name, board_id FROM columns WHERE board_id = ? ORDER BY id",
        );
        return stmt.all(toInt(board.id)).map(mapColumn);
      },
    },

    Column: {
      cards: (column: Column, _: unknown, { db }: Ctx): Card[] => {
        const stmt = db.prepare(
          `SELECT *
           FROM cards
           WHERE column_id = ?
           ORDER BY "order", id`,
        );
        return stmt.all(toInt(column.id)).map(mapCard);
      },
    },

    Card: {
      // Resolve the column by joining through cards -> columns
      column: (card: Card, _: unknown, { db }: Ctx): Column => {
        const stmt = db.prepare(
          `SELECT c.id, c.name, c.board_id
           FROM columns c
           JOIN cards   k ON k.column_id = c.id
           WHERE k.id = ?`,
        );
        const row = stmt.get(toInt(card.id));
        if (!row) throw new Error("Column not found for card");
        return mapColumn(row);
      },
      dateCreated: (card: Card): string => {
        return new Date(card.dateCreated).toISOString()
      },
    },

    // ---------- Mutations ----------
    Mutation: {
      createBoard: (
        _: unknown,
        { input }: { input: { name: string; color: string } },
        { db }: Ctx,
      ) => {
        const insert = db.prepare(
          "INSERT INTO boards (name, color) VALUES (?, ?)",
        );
        const { lastInsertRowid } = insert.run(input.name, input.color);
        const row = db
          .prepare("SELECT id, name, color FROM boards WHERE id = ?")
          .get(Number(lastInsertRowid))!;
        return { board: mapBoard(row) };
      },

      deleteBoard: (_: unknown, { id }: { id: string }, { db }: Ctx) => {
        const bid = toInt(id);
        const exists = db
          .prepare("SELECT id FROM boards WHERE id = ?")
          .get(bid);
        if (!exists) return { boardID: null };
        const del = db.prepare("DELETE FROM boards WHERE id = ?");
        del.run(bid);
        return { boardID: toID(bid) };
      },

      updateBoard: (
        _: unknown,
        {
          input,
        }: {
          input: { id: string; name?: string | null; color?: string | null };
        },
        { db }: Ctx,
      ) => {
        const bid = toInt(input.id);
        const current = db
          .prepare("SELECT id, name, color FROM boards WHERE id = ?")
          .get(bid);
        if (!current) return { board: null };

        db.prepare(
          "UPDATE boards SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?",
        ).run(input.name ?? null, input.color ?? null, bid);

        const row = db
          .prepare("SELECT id, name, color FROM boards WHERE id = ?")
          .get(bid)!;
        return { board: mapBoard(row) };
      },

      deleteCard: (_: unknown, { id }: { id: string }, ctx: Ctx) => {
        const cardID = toInt(id);
        const existing = ctx.db
          .prepare('SELECT id, text, "order", column_id FROM cards WHERE id = ?')
          .get(cardID);

        if (!existing) {
          throw new Error("Unknown card with id: " + id)
        };

        tx(ctx, (db) => {
            db.prepare("DELETE FROM cards WHERE id = ?").run(cardID);
            db.prepare(
              'UPDATE cards SET "order" = "order" - 1 WHERE column_id = ? AND "order" > ?'
            ).run(existing.column_id, existing.order);
        });

        return { cardID: toID(cardID) };
      },

      createColumn: (
        _: unknown,
        { input }: { input: { board: string; name: string } },
        { db }: Ctx,
      ) => {
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

      updateColumn: (
        _: unknown,
        { input }: { input: { id: string; name: string } },
        { db }: Ctx,
      ) => {
        const cid = toInt(input.id);
        const exists = db
          .prepare("SELECT id FROM columns WHERE id = ?")
          .get(cid);
        if (!exists) return { column: null };

        db.prepare("UPDATE columns SET name = ? WHERE id = ?").run(
          input.name,
          cid,
        );

        const row = db
          .prepare("SELECT id, name, board_id FROM columns WHERE id = ?")
          .get(cid)!;
        return { column: mapColumn(row) };
      },

      createCard: (
        _: unknown,
        { input }: { input: { text: string; column: string } },
        { db }: Ctx,
      ) => {
        const cid = toInt(input.column);
        const column = db
          .prepare("SELECT id FROM columns WHERE id = ?")
          .get(cid);
        if (!column) return { card: null };

        const nextOrder = db
          .prepare(
            'SELECT COALESCE(MAX("order") + 1, 0) AS "order" FROM cards WHERE column_id = ?',
          )
          .get(cid)!.order;

        const { lastInsertRowid } = db
          .prepare(
            'INSERT INTO cards (column_id, text, "order", dateCreated) VALUES (?, ?, ?, ?)',
          )
          .run(cid, input.text, nextOrder, new Date().toISOString());

        const row = db
          .prepare(
            'SELECT id, text, "order", column_id, dateCreated FROM cards WHERE id = ?',
          )
          .get(Number(lastInsertRowid))!;
        return { card: mapCard(row) };
      },

      moveCard: async (
        _: unknown,
        { input }: { input: { card: string; column: string; index: number, delay?: number } },
        ctx: Ctx,
      ) => {
        const cardId = toInt(input.card);
        const destColId = toInt(input.column);
        const desiredIndex = input.index;

        if (input.delay) {
          await new Promise((resolve) => {
            setTimeout(resolve, input.delay)
          })
        }

        // do everything inside a cancellable savepoint
        return tx(ctx, (db) => {
          // Load source card + its column/board
          const src = db
            .prepare(
              `
                SELECT k.id, k.text, k."order" AS src_order, k.column_id AS src_col_id,
                       c.board_id AS src_board_id
                FROM cards k
                JOIN columns c ON c.id = k.column_id
                WHERE k.id = ?
              `,
            )
            .get(cardId) as
            | {
                id: number;
                text: string;
                src_order: number;
                src_col_id: number;
                src_board_id: number;
              }
            | undefined;

          if (!src) throw new Error("Card not found");

          const destCol = db
            .prepare(`SELECT id, name, board_id FROM columns WHERE id = ?`)
            .get(destColId) as
            | { id: number; name: string; board_id: number }
            | undefined;

          if (!destCol) throw new Error("Destination column not found");

          const srcColId = src.src_col_id;
          const srcOrder = src.src_order;

          // Counts for clamping (read inside the txn for a consistent snapshot)
          const srcCount = (
            db
              .prepare(`SELECT COUNT(*) AS n FROM cards WHERE column_id = ?`)
              .get(srcColId) as { n: number }
          ).n;
          const destCount = (
            db
              .prepare(`SELECT COUNT(*) AS n FROM cards WHERE column_id = ?`)
              .get(destColId) as { n: number }
          ).n;

          if (srcColId === destColId) {
            // ---------- Same-column reorder ----------
            // Final valid index in same list is [0, srcCount-1]
            const finalIndex = Math.max(
              0,
              Math.min(desiredIndex, Math.max(0, srcCount - 1)),
            );
            if (finalIndex === srcOrder) {
              // no-op: still return the fresh rows
            } else if (finalIndex < srcOrder) {
              // Move up: shift DOWN items in [finalIndex, srcOrder-1] by +1
              db.prepare(
                `
                  UPDATE cards
                  SET "order" = "order" + 1
                  WHERE column_id = ? AND "order" >= ? AND "order" < ?
                `,
              ).run(srcColId, finalIndex, srcOrder);

              db.prepare(`UPDATE cards SET "order" = ? WHERE id = ?`).run(
                finalIndex,
                cardId,
              );
            } else {
              // Move down: shift UP items in srcOrder, finalIndex] by -1
              db.prepare(
                `
                  UPDATE cards
                  SET "order" = "order" - 1
                  WHERE column_id = ? AND "order" > ? AND "order" <= ?
                `,
              ).run(srcColId, srcOrder, finalIndex);

              db.prepare(`UPDATE cards SET "order" = ? WHERE id = ?`).run(
                finalIndex,
                cardId,
              );
            }
          } else {
            // ---------- Cross-column move ----------
            // Insert slot is [0, destCount] (destCount==0 -> 0)
            const insertAt = Math.max(0, Math.min(desiredIndex, destCount));

            // Close gap in source
            db.prepare(
              `
                UPDATE cards
                SET "order" = "order" - 1
                WHERE column_id = ? AND "order" > ?
              `,
            ).run(srcColId, srcOrder);

            // Open gap in destination
            db.prepare(
              `
                UPDATE cards
                SET "order" = "order" + 1
                WHERE column_id = ? AND "order" >= ?
              `,
            ).run(destColId, insertAt);

            // Move card
            db.prepare(
              `UPDATE cards SET column_id = ?, "order" = ? WHERE id = ?`,
            ).run(destColId, insertAt, cardId);
          }

          // Fresh rows for return payload (still inside txn for consistency)
          const cardRow = db
            .prepare(
              `SELECT id, text, "order", column_id FROM cards WHERE id = ?`,
            )
            .get(cardId)!;
          const sourceCol = db
            .prepare(`SELECT id, name, board_id FROM columns WHERE id = ?`)
            .get(srcColId)!;
          const destColRow = db
            .prepare(`SELECT id, name, board_id FROM columns WHERE id = ?`)
            .get(destColId)!;
          const boardRow = db
            .prepare(`SELECT id, name, color FROM boards WHERE id = ?`)
            .get(destColRow.board_id)!;

          return {
            card: mapCard(cardRow),
            board: mapBoard(boardRow),
            source: mapColumn(sourceCol),
            destination: mapColumn(destColRow),
          };
        });
      },
    },
    DateTime: DateTimeResolver
  },
});

// GraphQL-facing shapes
type Board = { id: string; name: string; color: string };
type Column = { id: string; name: string };
type Card = { id: string; text: string; order: number; dateCreated: string };

type Ctx = { db: DatabaseSync; session: Record<string, any>; request: Request };

// ---------- Small helpers ----------
const toID = (n: number | bigint) => String(n);
const toInt = (id: string) => Number.parseInt(id, 10);

function mapBoard(row: Record<string, SQLOutputValue>): Board {
  return {
    id: toID(row.id as number),
    name: row.name as string,
    color: row.color as string,
  };
}
function mapColumn(row: Record<string, SQLOutputValue>): Column {
  return { id: toID(row.id as number), name: row.name as string };
}
function mapCard(row: Record<string, SQLOutputValue>): Card {
  return {
    id: toID(row.id as number),
    text: row.text as string,
    order: row.order as number,
    dateCreated: row.dateCreated as string,
  };
}

function tx<T>(
  ctx: Ctx,
  fn: (db: DatabaseSync) => T,
): T {
  // SAVEPOINT works even if a transaction is already open
  ctx.db.exec("SAVEPOINT gql_move");
  let released = false;

  const onAbort = () => {
    if (!released) {
      try {
        ctx.db.exec("ROLLBACK TO gql_move");
        ctx.db.exec("RELEASE gql_move");
      } catch {
        /* ignore */
      }
    }
  };

  ctx.request.signal.addEventListener("abort", onAbort, { once: true });
  try {
    ctx.request.signal.throwIfAborted(); // fast-fail before doing any work
    const result = fn(ctx.db);
    ctx.request.signal.throwIfAborted(); // ensure we don't commit after an abort
    ctx.db.exec("RELEASE gql_move"); // commit the savepoint
    released = true;
    return result;
  } catch (e) {
    try {
      ctx.db.exec("ROLLBACK TO gql_move");
      ctx.db.exec("RELEASE gql_move");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    ctx.request.signal.removeEventListener("abort", onAbort);
  }
}
