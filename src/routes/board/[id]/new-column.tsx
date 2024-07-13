import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import invariant from "tiny-invariant";
import { Icon } from "~/components/icons";
import { graphql, NewColumn_board, useFragment } from "$houdini";

import { CancelButton, SaveButton } from "./components";

export function NewColumn(props: {
  board: NewColumn_board;
  onAdd: () => void;
  editInitially: boolean;
}) {
  let [editing, setEditing] = useState(props.editInitially);
  let inputRef = useRef<HTMLInputElement>(null);

  const board = useFragment(
    props.board,
    graphql(`
      fragment NewColumn_board on Board {
        id
      }
    `)
  );

  return editing ? (
    <form
      method="post"
      className="p-2 flex-shrink-0 flex flex-col gap-5 overflow-hidden max-h-full w-80 border rounded-xl shadow bg-slate-100"
      onSubmit={(event) => {
        event.preventDefault();
        props.onAdd();
        invariant(inputRef.current, "missing input ref");
        inputRef.current.value = "";
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setEditing(false);
        }
      }}
    >
      <input
        autoFocus
        required
        ref={inputRef}
        type="text"
        name="name"
        className="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
      />
      <div className="flex justify-between">
        <SaveButton>Save Column</SaveButton>
        <CancelButton onClick={() => setEditing(false)}>Cancel</CancelButton>
      </div>
    </form>
  ) : (
    <button
      onClick={() => {
        flushSync(() => {
          setEditing(true);
        });
        props.onAdd();
      }}
      aria-label="Add new column"
      className="flex-shrink-0 flex justify-center h-16 w-16 bg-black hover:bg-white bg-opacity-10 hover:bg-opacity-5 rounded-xl"
    >
      <Icon name="plus" size="xl" />
    </button>
  );
}
