import { createSchema } from "graphql-yoga";

type Card = { id: string; text: string };
type Column = { id: string; text: string; cards: Array<Card> };
type Board = {
  id: string;
  name: string;
  color: string;
  columns: Array<Column>;
};

const boards: Array<Board> = [];

// the current id for everything
let id = 0;

export default createSchema({
  typeDefs: /* GraphQL */ `
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
      deleteCard(id: ID!): DeleteCardOutput!
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
      title: String!
      content: String!
      order: Int!
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
    }

    type DeleteCardOutput {
      cardID: ID
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
      boards: () => boards,
      board: (_, { id }) => {
        return boards.find((board) => board.id.toString() === id);
      },
    },
    Mutation: {
      createBoard: (_, { input }) => {
        const board = { id: String(id++), ...input, columns: [] };
        boards.push(board);
        return { board };
      },
      deleteBoard: (_, { id }) => {
        const index = boards.findIndex((board) => board.id === id);
        if (index === -1) {
          return { boardID: null };
        }
        const [board] = boards.splice(index, 1);
        return { boardID: board.id };
      },
      updateBoard: (_, { input }) => {
        const board = boards.find((board) => board.id === input.id);
        if (!board) {
          return {};
        }
        Object.assign(board, input);
        return { board };
      },
      updateColumn: (_, { input }) => {
        const column = boards
          .flatMap((board) => board.columns)
          .find((column) => column.id.toString() === input.id);
        if (!column) {
          console.log("column not found", input.id, boards);
          return {};
        }
        Object.assign(column, input);
        return { column };
      },
      createColumn: (_, { input }) => {
        const column = { id: String(id++), ...input, cards: [] };
        // add the column to the board
        for (const board of boards) {
          if (board.id.toString() === input.board) {
            board.columns.push(column);
            return { column };
          }
        }
        return {};
      },
      createCard: (_, { input }) => {
        const card = { id: String(id++), ...input };
        const column = boards
          .flatMap((board) => board.columns)
          .find((column) => column.id === input.column);
        if (!column) {
          return {};
        }

        column.cards.push(card);
        return { card };
      },
      moveCard: (_, { input }) => {
        const { card: cardID, column: columnID, index } = input;

        // we need to track the parent ID of the source
        let card: Card | null = null;
        board_loop: for (const board of boards) {
          for (const column of board.columns) {
            for (const [index, columnCard] of column.cards.entries()) {
              if (columnCard.id !== cardID) {
                continue;
              }

              // we found the card
              card = columnCard;

              // remove the card from the column
              column.cards.splice(index, 1);

              // we're done
              break board_loop;
            }
          }
        }
        if (!card) {
          throw new Error("Card not found");
        }

        // now we have to look for the target column
        for (const column of boards.flatMap((board) => board.columns)) {
          // if we didn't find the column, skip it
          if (column.id !== columnID) {
            continue;
          }

          // add the card to the column at the designated index
          column.cards.splice(index, 0, card);

          // we're done
          break;
        }

        // nothing went wrong
        return { card };
      },
    },
  },
});
