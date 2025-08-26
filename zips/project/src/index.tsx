import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Body } from "./screens/Body";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Body />
  </StrictMode>,
);
