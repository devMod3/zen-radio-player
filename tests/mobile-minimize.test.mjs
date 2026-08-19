import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/player.css', import.meta.url), 'utf8');
const component = readFileSync(new URL('../app/components/ZenRadioPlayer.tsx', import.meta.url), 'utf8');

test('mobile CSS does not hide the second-to-last player tool', () => {
  assert.doesNotMatch(css, /\.player-tools>button:nth-last-of-type\(2\)\s*\{\s*display\s*:\s*none/i);
});

test('minimize control remains part of the player tools', () => {
  assert.match(component, /aria-label="Minimizar"/);
  assert.match(component, /setVisibility\("MINIMIZED"\)/);
});
