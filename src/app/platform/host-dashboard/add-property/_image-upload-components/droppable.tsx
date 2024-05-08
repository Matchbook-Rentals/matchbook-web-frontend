import React from "react";
import { useDroppable } from "@dnd-kit/core";


function Droppable(props) {
  const {isOver, setNodeRef} = useDroppable({
    id: 'droppable',
  })
  const style = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <div>
      {props.children}
    </div>
  )
}


export default Droppable;