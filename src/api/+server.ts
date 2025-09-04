import { Server } from "$houdini/server";
import { useExecutionCancellation } from "graphql-yoga";
import { DatabaseSync } from "node:sqlite";

export default new Server({
  plugins: [useExecutionCancellation()],
  context: (ctx) => {
    return {
      db: new DatabaseSync("./database.sqlite"),
      request: ctx.request,
    };
  },
});
