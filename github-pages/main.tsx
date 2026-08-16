import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RadioApp from "../app/components/RadioApp";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("No se encontró el contenedor de Zen Radio Player.");

createRoot(root).render(
  <StrictMode>
    <RadioApp playlistEndpoint={null} />
  </StrictMode>,
);
