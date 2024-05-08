import React from "react";
import { useDraggable } from "@dnd-kit/core";


function Draggable(props) {
  const { attributes, listeners, setNoderef, transform } = useDraggable({
    id: 'draggable',
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : 'undefined';

  return (
    <button ref={setNoderef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  )
}

export default Draggable;