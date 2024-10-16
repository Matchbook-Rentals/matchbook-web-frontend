// import React from 'react';

// const WindowIcon = () => {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
//       <g transform="translate(-1626.265 -410.265)">
//         <g transform="translate(1643.265 410.265)" fill="#fff" stroke="#fff" strokeWidth="1">
//           <rect width="13" height="13" stroke="none"/>
//           <rect x="0.5" y="0.5" width="12" height="12" fill="none"/>
//         </g>
//         <g transform="translate(1643.265 427.265)" fill="#fff" stroke="#fff" strokeWidth="1">
//           <rect width="13" height="13" stroke="none"/>
//           <rect x="0.5" y="0.5" width="12" height="12" fill="none"/>
//         </g>
//         <g transform="translate(1626.265 410.265)" fill="#fff" stroke="#fff" strokeWidth="1">
//           <rect width="13" height="13" stroke="none"/>
//           <rect x="0.5" y="0.5" width="12" height="12" fill="none"/>
//         </g>
//         <g transform="translate(1626.265 427.265)" fill="#fff" stroke="#fff" strokeWidth="1">
//           <rect width="13" height="13" stroke="none"/>
//           <rect x="0.5" y="0.5" width="12" height="12" fill="none"/>
//         </g>
//       </g>
//     </svg>
//   );
// };

// export default WindowIcon;

import React from "react";

// Define an interface for the component props
interface WindowIconProps {
  width?: number;
  height?: number;
}

const WindowIcon: React.FC<WindowIconProps> = ({ width = 30, height = 30 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 30 30"
      style={{ display: "block" }}
    >
      <g transform="translate(-1626.265 -410.265)">
        <g
          transform="translate(1643.265 410.265)"
          fill="#fff"
          stroke="#fff"
          strokeWidth="1"
        >
          <rect width="13" height="13" stroke="none" />
          <rect x="0.5" y="0.5" width="12" height="12" fill="none" />
        </g>
        <g
          transform="translate(1643.265 427.265)"
          fill="#fff"
          stroke="#fff"
          strokeWidth="1"
        >
          <rect width="13" height="13" stroke="none" />
          <rect x="0.5" y="0.5" width="12" height="12" fill="none" />
        </g>
        <g
          transform="translate(1626.265 410.265)"
          fill="#fff"
          stroke="#fff"
          strokeWidth="1"
        >
          <rect width="13" height="13" stroke="none" />
          <rect x="0.5" y="0.5" width="12" height="12" fill="none" />
        </g>
        <g
          transform="translate(1626.265 427.265)"
          fill="#fff"
          stroke="#fff"
          strokeWidth="1"
        >
          <rect width="13" height="13" stroke="none" />
          <rect x="0.5" y="0.5" width="12" height="12" fill="none" />
        </g>
      </g>
    </svg>
  );
};

export default WindowIcon;
