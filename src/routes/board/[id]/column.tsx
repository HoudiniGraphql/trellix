import { useState, useRef } from "react";
import invariant from "tiny-invariant";

import { Icon } from "~/components/icons";

import { NewCard } from "./new-card";
import { flushSync } from "react-dom";
import { Card } from "./card";
import { graphql, useFragment, type Column_column } from "$houdini";
import { EditableText } from "./components";

interface ColumnProps {
  column: Column_column;
}

export function Column(props: ColumnProps) {
  const column = useFragment(
    props.column,
    graphql(`
      fragment Column_column on Column {
        name
        cards @list(name: "Column__Cards") {
          order
          id
          ...BoardInfoCard_card
        }

        ...NewCard_column
      }
    `)
  );

  let [acceptDrop, setAcceptDrop] = useState(false);
  let [edit, setEdit] = useState(false);
  let listRef = useRef<HTMLUListElement>(null);

  function scrollList() {
    invariant(listRef.current);
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }

  const items = column.cards;

  return (
    <div
      className={
        "flex-shrink-0 flex flex-col overflow-hidden max-h-full w-80 border-slate-400 rounded-xl shadow-sm shadow-slate-400 bg-slate-100 " +
        (acceptDrop ? `outline outline-2 outline-brand-red` : ``)
      }
      onDragOver={(event) => {
        if (
          column.cards.length === 0 &&
          event.dataTransfer.types.includes("card")
        ) {
          event.preventDefault();
          setAcceptDrop(true);
        }
      }}
      onDragLeave={() => {
        setAcceptDrop(false);
      }}
      onDrop={(event) => {
        let transfer = JSON.parse(event.dataTransfer.getData("card"));
        invariant(transfer.id, "missing transfer.id");
        invariant(transfer.title, "missing transfer.title");

        console.log(transfer.id, transfer.title);

        setAcceptDrop(false);
      }}
    >
      <div className="p-2">
        <EditableText
          value={column.name}
          onChange={(val) => {
            console.log(val);
          }}
          inputLabel="Edit column name"
          buttonLabel={`Edit column "${name}" name`}
          inputClassName="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
          buttonClassName="block rounded-lg text-left w-full border border-transparent py-1 px-2 font-medium text-slate-600"
        />
      </div>

      <ul ref={listRef} className="flex-grow overflow-auto min-h-[2px]">
        {column.cards
          .sort((a, b) => a.order - b.order)
          .map((item, index, items) => (
            <Card
              key={item.id}
              card={item}
              previousOrder={items[index - 1] ? items[index - 1].order : 0}
              nextOrder={
                items[index + 1] ? items[index + 1].order : item.order + 1
              }
            />
          ))}
      </ul>
      {edit ? (
        <NewCard
          column={column}
          nextOrder={items.length === 0 ? 1 : items[items.length - 1].order + 1}
          onAddCard={() => scrollList()}
          onComplete={() => setEdit(false)}
        />
      ) : (
        <div className="p-2 pt-1">
          <button
            type="button"
            onClick={() => {
              flushSync(() => {
                setEdit(true);
              });
              scrollList();
            }}
            className="flex items-center gap-2 rounded-lg text-left w-full p-2 font-medium text-slate-500 hover:bg-slate-200 focus:bg-slate-200"
          >
            <Icon name="plus" /> Add a card
          </button>
        </div>
      )}
    </div>
  );
}
