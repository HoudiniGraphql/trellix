import { Icon } from "~/components/icons";
import type { PageProps } from "./$types";
import { Button } from "~/components/button";
import { Label, LabeledInput } from "~/components/input";
import { graphql, useMutation } from "$houdini/index";

export default function Projects({ Home }: PageProps) {
  return (
    <div className="h-full">
      <NewBoard />
      <div className="p-8">
        <h2 className="font-bold mb-2 text-xl">Boards</h2>
        <nav className="flex flex-wrap gap-8">
          {Home.boards.map((board) => (
            <Board
              key={board.id}
              name={board.name}
              id={board.id}
              color={board.color}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

function Board({
  name,
  id,
  color,
}: {
  name: string;
  id: string;
  color: string;
}) {
  const [, deleteBoard] = useMutation(
    graphql(`
      mutation deleteBoard($id: ID!) {
        deleteBoard(id: $id) {
          boardID @Board_delete
        }
      }
    `)
  );

  return (
    <a
      href={`/board/${id}`}
      className="w-60 h-40 p-4 block border-b-8 shadow rounded hover:shadow-lg bg-white relative"
      style={{ borderColor: color }}
    >
      <div className="font-bold">{name}</div>
      <input type="hidden" name="boardId" value={id} />
      <button
        aria-label="Delete board"
        className="absolute top-4 right-4 hover:text-brand-red"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          deleteBoard({ variables: { id } });
        }}
      >
        <Icon name="trash" />
      </button>
    </a>
  );
}

function NewBoard() {
  const [isCreating, createBoard] = useMutation(
    graphql(`
      mutation createBoard($name: String!, $color: String!) {
        createBoard(input: { name: $name, color: $color }) {
          board {
            id @optimisticKey
            name
            color
            ...All_Boards_insert @prepend
          }
        }
      }
    `)
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;
    await createBoard({
      variables: { name, color },
      optimisticResponse: {
        createBoard: {
          board: {
            name,
            color,
          },
        },
      },
    });
    form.reset();
  }

  return (
    <form method="post" className="p-8 max-w-md" onSubmit={handleSubmit}>
      <input type="hidden" name="intent" value="createBoard" />
      <div>
        <h2 className="font-bold mb-2 text-xl">New Board</h2>
        <LabeledInput label="Name" name="name" type="text" required />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Label htmlFor="board-color">Color</Label>
          <input
            id="board-color"
            name="color"
            type="color"
            defaultValue="#cbd5e1"
            className="bg-transparent"
          />
        </div>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
