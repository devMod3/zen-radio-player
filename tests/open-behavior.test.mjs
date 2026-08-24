import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../app/components/ZenRadioPlayer.tsx", import.meta.url), "utf8");

test("public open starts minimized and auto-selects the first current station", () => {
  const openEffect = component.match(/useEffect\(\(\) => \{\s*const open = \(\) => \{([\s\S]*?)\};\s*window\.addEventListener\(ZEN_PLAYER_OPEN_EVENT, open\)/)?.[1] ?? "";
  assert.match(openEffect, /setPlaylistOpen\(false\)/);
  assert.match(openEffect, /setAboutOpen\(false\)/);
  assert.match(openEffect, /setVisibility\("MINIMIZED"\)/);
  assert.doesNotMatch(openEffect, /setVisibility\("OPEN"\)/);
  assert.match(openEffect, /if \(!selected && stations\.length\) void selectStation\(stations\[0\]\)/);
});

test("clicking the mini-player restores the full player without choosing another station", () => {
  assert.match(component, /visibility === "MINIMIZED"[\s\S]*className="mini-player" onClick=\{\(\) => setVisibility\("OPEN"\)\}/);
});
