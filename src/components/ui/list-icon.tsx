// import React from 'react';

// const ListIcon = () => {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" width="44.5" height="28" viewBox="0 0 44.5 28">
//       <g transform="translate(-1542.75 -419)">
//         <g transform="translate(1542.75 419)" fill="#5a6754" stroke="#5a6754" strokeWidth="1">
//           <rect width="8" height="8" stroke="none"/>
//           <rect x="0.5" y="0.5" width="7" height="7" fill="none"/>
//         </g>
//         <g transform="translate(1542.75 429)" fill="#5a6754" stroke="#5a6754" strokeWidth="1">
//           <rect width="8" height="8" stroke="none"/>
//           <rect x="0.5" y="0.5" width="7" height="7" fill="none"/>
//         </g>
//         <g transform="translate(1542.75 439)" fill="#5a6754" stroke="#5a6754" strokeWidth="1">
//           <rect width="8" height="8" stroke="none"/>
//           <rect x="0.5" y="0.5" width="7" height="7" fill="none"/>
//         </g>
//         <line x2="29" transform="translate(1558.25 423.5)" fill="none" stroke="#5a6754" strokeWidth="1"/>
//         <line x2="29" transform="translate(1558.25 433)" fill="none" stroke="#5a6754" strokeWidth="1"/>
//         <line x2="29" transform="translate(1558.25 442.5)" fill="none" stroke="#5a6754" strokeWidth="1"/>
//       </g>
//     </svg>
//   );
// };

// export default ListIcon;

import React from 'react';

// Define a type for the size prop
interface Size {
  width: number;
  height: number;
}

// Define a type for the component props
interface ListIconProps {
  size?: Size;
  borderRight?: boolean;
}

const ListIcon: React.FC<ListIconProps> = ({
  size = { width: 44.5, height: 28 },
  borderRight = false,
}) => {
  // Calculate border properties based on the borderRight prop
  const borderStyle = borderRight
    ? {
        stroke: "#5a6754",
        strokeWidth: 1,
        strokeDasharray: "0",
        x1: size.width - 1,
        y1: "0",
        x2: size.width - 1,
        y2: size.height,
      }
    : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size.width}
      height={size.height}
      viewBox="0 0 44.5 28"
      style={{ display: 'block', marginRight: borderRight ? '1px' : '0' }}
    >
      <g transform="translate(-1542.75 -419)">
        <g transform="translate(1542.75 419)" fill="#5a6754" stroke="#5a6754" strokeWidth="1">
          <rect width="8" height="8" stroke="none" />
          <rect x="0.5" y="0.5" width="7" height="7" fill="none" />
        </g>
        <g transform="translate(1542.75 429)" fill="#5a6754" stroke="#5a6754" strokeWidth="1">
          <rect width="8" height="8" stroke="none" />
          <rect x="0.5" y="0.5" width="7" height="7" fill="none" />
        </g>
        <g transform="translate(1542.75 439)" fill="#5a6754" stroke="#5a6754" strokeWidth="1">
          <rect width="8" height="8" stroke="none" />
          <rect x="0.5" y="0.5" width="7" height="7" fill="none" />
        </g>
        <line x2="29" transform="translate(1558.25 423.5)" fill="none" stroke="#5a6754" strokeWidth="1" />
        <line x2="29" transform="translate(1558.25 433)" fill="none" stroke="#5a6754" strokeWidth="1" />
        <line x2="29" transform="translate(1558.25 442.5)" fill="none" stroke="#5a6754" strokeWidth="1" />
        {/* Optional right border */}
        {borderRight && <line {...borderStyle} />}
      </g>
    </svg>
  );
};

export default ListIcon;

