// Twin Tides — the hand-in program (Node 22, standard library only).
//
// The game itself is plain static files under game/ (index.html plus its ES
// modules) and the screenshots under screenshots/. This program's only job
// is to hand those in: copy both folders into the output directory the
// grader gives it, then write /output/dossier.json, the summary the judge
// reads, using the kit's vendored make.fun library. It runs twice in the
// grader and both runs must write identical bytes, so there is no clock,
// no randomness and no network anywhere in here — just copies.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(outDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// The caps are the scorer's own limits, so a hand-in this program accepts
// is one the scorer accepts too: at most 4 screenshots of 256 KiB each,
// game/ within 993 files and 48 MiB, and the dossier text capped at 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
