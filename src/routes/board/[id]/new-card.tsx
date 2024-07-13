import { useRef } from "react";
import invariant from "tiny-invariant";

import { SaveButton, CancelButton } from "./components";
import { graphql, useFragment, NewCard_column, useMutation } from "$houdini";

export function NewCard(props: {
  column: NewCard_column;
  nextOrder: number;
  onComplete: () => void;
  onAddCard: () => void;
}) {
  let textAreaRef = useRef<HTMLTextAreaElement>(null);
  let buttonRef = useRef<HTMLButtonElement>(null);

  const column = useFragment(
    props.column,
    graphql(`
      fragment NewCard_column on Column {
        id
      }
    `)
  );

  // the mutation to create a new card
  const [, createCard] = useMutation(
    graphql(`
      mutation createCard($text: String!, $columnID: ID!) {
        createCard(input: { text: $text, column: $columnID }) {
          card {
            id @optimisticKey
            ...Column_Cards_insert @parentID(value: $columnID) @append
          }
        }
      }
    `)
  );

  return (
    <form
      method="post"
      className="flex flex-col gap-2.5 p-2 pt-1"
      onSubmit={(event) => {
        event.preventDefault();
        let formData = new FormData(event.currentTarget);
        const text = formData.get("title") as string;
        createCard({
          variables: {
            text,
            columnID: column.id,
          },
        });
        invariant(textAreaRef.current);
        textAreaRef.current.value = "";
        props.onAddCard();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          props.onComplete();
        }
      }}
    >
      <textarea
        autoFocus
        required
        ref={textAreaRef}
        name={"title"}
        placeholder="Enter a title for this card"
        className="outline-none shadow shadow-slate-300 border-slate-300 text-sm rounded-lg w-full py-1 px-2 resize-none placeholder:text-sm placeholder:text-slate-500 h-14"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            invariant(buttonRef.current, "expected button ref");
            buttonRef.current.click();
          }
          if (event.key === "Escape") {
            props.onComplete();
          }
        }}
        onChange={(event) => {
          let el = event.currentTarget;
          el.style.height = el.scrollHeight + "px";
        }}
      />
      <div className="flex justify-between">
        <SaveButton ref={buttonRef}>Save Card</SaveButton>
        <CancelButton onClick={props.onComplete}>Cancel</CancelButton>
      </div>
    </form>
  );
}
