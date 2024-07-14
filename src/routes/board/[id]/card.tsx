import { useState } from "react";

import { Icon } from "~/components/icons";
import {
  graphql,
  useFragment,
  useMutation,
  type BoardInfoCard_card,
} from "$houdini";

interface CardProps {
  card: BoardInfoCard_card;
}

export function Card(props: CardProps) {
  const card = useFragment(
    props.card,
    graphql(`
      fragment BoardInfoCard_card on Card {
        id
        order
        text
        column {
          id
        }
      }
    `)
  );

  let [acceptDrop, setAcceptDrop] = useState<"none" | "top" | "bottom">("none");

  const [, deleteCard] = useMutation(
    graphql(`
      mutation deleteCard($cardID: ID!) {
        deleteCard(id: $cardID) {
          cardID @Card_delete
        }
      }
    `)
  );

  const [, moveCard] = useMutation(
    graphql(`
      mutation moveCard($input: MoveCardInput!) {
        moveCard(input: $input) {
          board {
            columns {
              id
              cards {
                id
                order
              }
            }
          }
        }
      }
    `)
  );

  return (
    <li
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("card")) {
          event.preventDefault();
          event.stopPropagation();
          let rect = event.currentTarget.getBoundingClientRect();
          let midpoint = (rect.top + rect.bottom) / 2;
          setAcceptDrop(event.clientY <= midpoint ? "top" : "bottom");
        }
      }}
      onDragLeave={() => {
        setAcceptDrop("none");
      }}
      onDrop={(event) => {
        event.stopPropagation();

        let transfer = JSON.parse(event.dataTransfer.getData("card"));
        console.log({
          accept: acceptDrop,
          this: card.order,
          next: acceptDrop === "top" ? card.order : card.order + 1,
        });

        let droppedOrder = acceptDrop === "top" ? card.order : card.order + 1;

        moveCard({
          variables: {
            input: {
              card: transfer.id,
              column: card.column.id,
              index: droppedOrder,
            },
          },
        });

        setAcceptDrop("none");
      }}
      className={
        "border-t-2 border-b-2 -mb-[2px] last:mb-0 cursor-grab active:cursor-grabbing px-2 py-1 " +
        (acceptDrop === "top"
          ? "border-t-brand-red border-b-transparent"
          : acceptDrop === "bottom"
          ? "border-b-brand-red border-t-transparent"
          : "border-t-transparent border-b-transparent")
      }
    >
      <div
        draggable
        className="bg-white shadow shadow-slate-300 border-slate-300 text-sm rounded-lg w-full py-1 px-2 relative"
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("card", JSON.stringify(card));
          event.dataTransfer.setData("fromColumn", JSON.stringify(card));
        }}
      >
        <h3 className="mb-2">{card.text}</h3>
        <button
          aria-label="Delete card"
          className="absolute top-[0.25rem] right-4 hover:text-brand-red"
          type="submit"
          onClick={(event) => {
            event.preventDefault();
            deleteCard({ variables: { cardID: card.id } });
          }}
        >
          <Icon name="trash" />
        </button>
      </div>
    </li>
  );
}
