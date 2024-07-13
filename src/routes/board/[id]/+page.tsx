import React from "react";
import invariant from "tiny-invariant";
import { PageProps } from "./$types";

import { Column } from "./column";
import { NewColumn } from "./new-column";

export default function BoardSummary({ BoardInfo }: PageProps) {
  // scroll right when new columns are added
  let scrollContainerRef = React.useRef<HTMLDivElement>(null);
  function scrollRight() {
    invariant(scrollContainerRef.current, "no scroll container");
    scrollContainerRef.current.scrollLeft =
      scrollContainerRef.current.scrollWidth;
  }
  const board = BoardInfo.board;
  if (!board) {
    return <div>Board not found</div>;
  }

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-x-scroll"
      ref={scrollContainerRef}
      style={{ backgroundColor: board.color }}
    >
      <h1>
        {/* <EditableText
          value={board.name}
          fieldName="name"
          inputClassName="mx-8 my-4 text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
          buttonClassName="mx-8 my-4 text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
          buttonLabel={`Edit board "${board.name}" name`}
          inputLabel="Edit board name"
        /> */}
        {board.name}
      </h1>

      <div className="flex flex-grow min-h-0 h-full items-start gap-4 px-8 pb-4">
        {board.columns.map((col) => {
          return <Column key={col.id} column={col} />;
        })}

        <NewColumn
          board={board}
          onAdd={scrollRight}
          editInitially={board.columns.length === 0}
        />

        {/* trolling you to add some extra margin to the right of the container with a whole dang div */}
        <div data-lol className="w-8 h-1 flex-shrink-0" />
      </div>
    </div>
  );
}
