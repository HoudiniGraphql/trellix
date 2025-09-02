import { Server } from "$houdini/server";
import { DatabaseSync } from "node:sqlite";

export default new Server({
  context: () => {
    return {
      db: new DatabaseSync("./database.sqlite"),
    };
  },
});
