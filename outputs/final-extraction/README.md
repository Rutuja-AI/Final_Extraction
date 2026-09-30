# Final Extraction — checkpoint 02

Open dist/index.html directly in Chrome or Edge, or use the running preview at http://127.0.0.1:5173/.

The vault now reveals a three-dimensional round tunnel with structural rings, lights, a walkway and gold crates. There is no flat illuminated rectangle immediately behind the door. The wheel turns before the door swings open, and the animation finishes before the results appear.

Play: expand Try with sample credentials, fill the samples, verify each field, and begin the extraction sequence. Read the field notes and select the five actions in the correct order. The five-minute demo countdown begins on entry to the sequence. Wrong sequences remove 30 seconds and 150 score points. A hint costs 100 score points. The timer freezes on a correct submission. Refresh or Replay starts a fresh demo.

Sample credentials: ERASE-7429 / SILENT-031 / MINT-OMEGA / NORTH-07.
Demo solution: surveillance, alarm, locks, passage, crew.

This remains a client-side demo, not an event-ready verification system. Sample answers are in the browser code, refresh resets the mission, and money (100,000 credits) and risk (12) are fixed examples. The scoring formula is provisional: money / 100 + remaining seconds * 5 - risk * 20 - wrong sequences * 150 - hints * 100, floored at zero. Earlier mission integration, Python server validation, persistent team state and authoritative scoring are still required. The event brief still needs to specify the source of the shutdown code. No audio has been added yet.

Source: src.jsx contains the 3D scene; App.jsx contains the mission flow; Sequence.jsx contains the puzzle; style.css contains styles. Build with node --preserve-symlinks --preserve-symlinks-main build.mjs from this folder. Serve with python -m http.server 5173 --bind 127.0.0.1 --directory dist. The dist folder is independently portable; Google Fonts is optional and falls back offline.

## Checkpoint 03 — extended escape cinematic
After the vault door opens, the camera moves through the tunnel. The exit doors slide aside, revealing an illuminated loading bay and an armored getaway van. The van departs before the completion screen appears. The full timeline is approximately 24 seconds, including the vault opening.

Use Preview finale · animation only on the first screen to watch without entering credentials. This preview does not award a score. Replay and Skip animation controls are available. Reduced-motion users receive the final scene without camera travel. A successful puzzle submission plays the same cinematic and then shows its frozen demo score.

The scene is rendered live in Three.js; no video, GIF, or audio is used. Event validation remains a separate pending integration.

## Checkpoint 04 — celebrating crew
Two stylized red-jumpsuit characters smile and raise their arms beside gold bags in the open cargo bay. The camera follows the departing truck for a close celebration shot. White theatrical masks hang beside their waists. This is a simple 3D character pass, with no recorded laughter or audio. Preview finale shows it without solving the puzzle.
