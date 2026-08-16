import { readFile } from "node:fs/promises";

const bundleUrl = new URL("../dist-pages/assets/zen-radio-player.js", import.meta.url);
const bundle = await readFile(bundleUrl, "utf8");

const invariants = [
  { valid: !/\bprocess\.env\b/.test(bundle), message: "El paquete conserva una dependencia de process.env incompatible con el navegador." },
  { valid: bundle.includes("data-zen-radio-open"), message: "Falta el disparador HTML público." },
  { valid: bundle.includes("#zen-radio-player"), message: "Falta el disparador para menús de Blogger." },
];

const failure = invariants.find(({ valid }) => !valid);
if (failure) throw new Error(failure.message);

console.log("Validated browser-only embed: no Node globals and both public triggers are present.");
