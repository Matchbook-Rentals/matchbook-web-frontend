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
