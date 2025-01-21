import React from "react";

export const MenuIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export const UserIcon = (props: any) => (
  <svg
    {...props}
    width="164"
    height="160"
    viewBox="0 0 164 160"
    stroke="#4c4c4c"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* UserIcon paths */}
  </svg>
);


export const ArrowRight = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={27}
    height={30}
    viewBox="0 0 27 30"
    fill="none"
    {...props}
  >
    <path d="M24.418 16.2712L10.2806 2.97938" stroke="white" strokeWidth={6} />
    <line
      y1={-3}
      x2={19.7901}
      y2={-3}
      transform="matrix(0.599424 -0.800432 0.728557 0.684985 14.1367 30)"
      stroke="white"
      strokeWidth={6}
    />
  </svg>
);

export const ArrowLeft = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={27}
    height={30}
    viewBox="0 0 27 30"
    fill="none"
    {...props}
  >
    <path d="M2.58203 13.7288L16.7194 27.0206" stroke="white" strokeWidth={6} />
    <line
      y1={-3}
      x2={19.7901}
      y2={-3}
      transform="matrix(-0.599424 0.800432 -0.728557 -0.684985 12.8633 0)"
      stroke="white"
      strokeWidth={6}
    />
  </svg>
);

export const MatchmakerTabIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={58}
    height={36}
    viewBox="0 0 58 36"
    fill="none"
    {...props}
  >
    <g filter="url(#filter0_d_2668_1582)">
      {/* Left circle with X */}
      <path
        d="M35.4698 13.4239C35.4698 20.6622 28.5217 26.5978 19.8599 26.5978C11.1981 26.5978 4.25 20.6622 4.25 13.4239C4.25 6.18561 11.1981 0.25 19.8599 0.25C28.5217 0.25 35.4698 6.18561 35.4698 13.4239Z"
        fill="white"
        stroke="#4F4F4F"
        strokeWidth={0.5}
      />
      <path
        d="M14.6073 8.3858C15.0582 7.9872 15.778 7.99971 16.2148 8.41375L25.081 16.8172C25.5178 17.2313 25.5064 17.89 25.0554 18.2886C24.6044 18.6873 23.8847 18.6747 23.4479 18.2607L14.5817 9.85723C14.1448 9.44319 14.1563 8.78441 14.6073 8.3858Z"
        fill="#4F4F4F"
        fillOpacity={0.9}
      />
      <path
        d="M14.6056 18.2881C14.1546 17.8895 14.1432 17.2308 14.58 16.8167L23.4462 8.41325C23.8831 7.99921 24.6028 7.9867 25.0537 8.3853C25.5047 8.78391 25.5162 9.44269 25.0793 9.85673L16.2131 18.2602C15.7763 18.6742 15.0566 18.6868 14.6056 18.2881Z"
        fill="#4F4F4F"
        fillOpacity={0.9}
      />
      {/* Right circle with heart */}
      <path
        d="M53.5226 13.7071C53.5226 20.9454 46.5745 26.881 37.9126 26.881C29.2508 26.881 22.3027 20.9454 22.3027 13.7071C22.3027 6.46882 29.2508 0.533203 37.9126 0.533203C46.5745 0.533203 53.5226 6.46882 53.5226 13.7071Z"
        fill="white"
        stroke="#4F4F4F"
        strokeWidth={0.5}
      />
      {/* Fixed heart path */}
      <path
        d="M41.7085 9.47203C41.5938 9.34701 41.4473 9.26648 41.2537 9.2404C41.0912 9.21851 40.9292 9.24369 40.7588 9.30323C40.4835 9.39947 40.248 9.55322 40.021 9.73854C39.5631 10.1122 39.1948 10.5507 38.8514 11.021C38.6387 11.3123 38.4459 11.6148 38.2595 11.925C38.2422 11.9539 38.2177 11.9942 38.1895 12.0275C38.1666 12.0546 38.0915 12.1382 37.9641 12.1391C37.8443 12.1399 37.7682 12.0654 37.7465 12.0438C37.668 11.95 37.5816 11.8352 37.5396 11.7791C37.4319 11.6351 37.3278 11.4959 37.2158 11.3587C36.8072 10.858 36.3668 10.3974 35.82 10.0237C35.5756 9.85661 35.3222 9.72346 35.0357 9.65032C34.5735 9.53232 34.2186 9.6762 34.0215 9.99947C34.001 10.033 33.9821 10.0686 33.9645 10.1059C33.838 10.3733 33.8006 10.6622 33.8048 10.9747C33.812 11.5179 33.9149 12.0568 34.0723 12.5978C34.3863 13.6766 34.8637 14.706 35.4768 15.6949C35.9426 16.4464 36.4728 17.1543 37.1306 17.7855C37.4728 18.1041 37.8382 18.3891 38.002 18.1512C38.2035 18.0684 38.3825 17.9513 38.5594 17.8135C39.0639 17.4204 39.4613 16.9499 39.8245 16.4422C40.6055 15.3507 41.1806 14.1832 41.5886 12.9548C41.8373 12.2061 42.0121 11.4567 42.0334 10.5989C42.0276 10.4188 42.0159 10.1737 41.9506 9.93853C41.9003 9.7574 41.8285 9.60275 41.7085 9.47203Z"
        fill="#4F4F4F"
        fillOpacity={0.9}
        stroke="#4F4F4F"
        strokeWidth={0.5}
      />
    </g>
    <defs>
      <filter
        id="filter0_d_2668_1582"
        x={0}
        y={0}
        width={57.7734}
        height={35.1309}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={4} />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2668_1582"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_2668_1582"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);

export const OverviewTabIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={36}
    height={36}
    viewBox="0 0 36 36"
    fill="none"
    {...props}
  >
    <g filter="url(#filter0_d_2734_2)">
      <circle
        cx={18}
        cy={14}
        r={13.75}
        stroke="#4F4F4F"
        strokeWidth={0.5}
        shapeRendering="crispEdges"
      />
    </g>
    <g filter="url(#filter1_d_2734_2)">
      <path
        d="M16.3882 16.2585C17.7745 16.2525 18.9027 15.7917 19.8576 14.9213C20.3784 14.4466 20.7537 13.857 20.9958 13.2186C21.4378 12.0529 21.4485 10.8619 20.9056 9.69399C20.6128 9.06442 20.2365 8.47983 19.6688 8.01868C19.318 7.73387 18.9443 7.47061 18.51 7.27607C17.358 6.76001 16.1777 6.70572 14.9861 7.06802C14.007 7.36594 13.2145 7.95086 12.5974 8.74642C12.1051 9.38111 11.8161 10.1108 11.7183 10.9055C11.5511 12.2632 11.8662 13.4992 12.783 14.5567C13.1427 14.9717 13.5521 15.33 14.0425 15.6092C14.799 16.0398 15.6091 16.2421 16.3818 16.2585Z"
        stroke="#4F4F4F"
        strokeWidth={0.5}
        fill="none"
      />
      <path
        d="M19.8626 15.9815L24.6774 21.7138C24.3013 21.2994 23.9296 20.8811 23.558 20.4628L22.9845 19.8184L23.1709 19.6519C22.9364 19.3894 22.7004 19.1274 22.4649 18.8659C22.3299 18.716 22.195 18.5662 22.0606 18.4166C21.9285 18.2694 21.7963 18.1219 21.664 17.9743C21.4235 17.7061 21.1827 17.4374 20.9413 17.1699C20.7154 16.9194 20.4882 16.6696 20.2641 16.4233C20.1725 16.3226 20.0814 16.2224 19.9911 16.123L19.8626 15.9815Z"
        stroke="#4F4F4F"
        strokeWidth={0.5}
        fill="none"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_2734_2"
        x={0}
        y={0}
        width={36}
        height={36}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={4} />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2734_2"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_2734_2"
          result="shape"
        />
      </filter>
      <filter
        id="filter1_d_2734_2"
        x={6.66602}
        y={6}
        width={24.9824}
        height={24.4941}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={4} />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2734_2"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_2734_2"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);

