# Final Extraction (Codeverse 2.0, Phase 2 Game 5)

Playable React and Three.js demo for the final escape. The visual flow includes credential entry, a five-command sequence, a full-screen tunnel and getaway cinematic, a three- or four-person crew, sound cues, and a result screen. **The central gateway is not connected yet.** The current credentials, timer, penalties, money, risk, and score are demo values held in the browser.

## Run locally

Requirements: Node.js and npm. From this folder (`outputs/final-extraction`):

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173/`). To make a production build, run `npm run build`; its output is `dist/`. For a standalone preview that can be opened directly as `dist/index.html`, run:

```powershell
node --preserve-symlinks --preserve-symlinks-main build.mjs
```

The standalone preview uses only local JavaScript and CSS. Google Fonts are optional. The sound is synthesized in the browser, so no audio assets or audio service are needed. Browsers start sound after a user action; use **Mute sound / Turn sound on** to control it.

## Try the demo

1. Choose **3 teammates** or **4 teammates** under **Crew on transport**.
2. Open **Try with sample credentials**, fill the samples, and verify all four fields. The samples are `ERASE-7429`, `SILENT-031`, `MINT-OMEGA`, and `NORTH-07`.
3. Start the sequence. The demo order is **surveillance → alarm → locks → passage → crew**. The five-minute countdown starts here.
4. Submit the correct order to play the full-screen vault, tunnel, transport, and escape animation. Status text appears over the animation. Close the result panel to view the finished scene.

**Preview finale · animation only** on the first screen plays the cinematic without completing a mission or awarding a score. Wrong sequences remove 30 seconds and 150 demo points; one hint costs 100 demo points. Refresh or Replay resets the demo.

## Project map

| File | Purpose |
| --- | --- |
| `App.jsx` | Screen flow, sample credential checks, local timer, demo score, sound control, crew selector |
| `Sequence.jsx` | Five-command puzzle, demo answer, wrong-order and hint callbacks |
| `src.jsx` | Three.js vault, tunnel, getaway van, and three- or four-person crew animation |
| `sound.js` | Browser-generated sound cues |
| `style.css` | Layout, full-screen cinematic, overlays, responsive styling |
| `index.html` | Vite entry page |
| `build.mjs` | Standalone offline preview build |

## Central gateway integration handoff

The event integration guide calls this game `p2g5`. It says games communicate with the **central gateway**, which owns team IDs, progression, outputs, money, attempts, hints, and final scoring. The gateway base URL, game API key, and test team are to be supplied by the gateway team. **There are no live gateway requests or configurable gateway URLs in this repo today.** The points below are the intended connection points, not implemented endpoints in this app.

| Gateway call | When Final Extraction needs it | Notes |
| --- | --- | --- |
| `GET /api/teams/{team_id}/state` | On entry or resume, to check team status, balance, and whether required outputs exist | Values from other games are not returned here. Use only team IDs from the gateway's `teams.json`. |
| `POST /api/verify` | When the team submits the four artifacts | Send `team_id`, `deletion_key`, `shutdown_code`, `control_token`, and `route_code`. The gateway responds with `valid`/`invalid` per field and records invalid credential attempts itself. Do not send duplicate `wrong_attempt` events for those fields. |
| `POST /api/events` | On a sequence wrong attempt, hint use, and verified completion | Use `game_id: "p2g5"`, a unique UUID `event_id`, the real `team_id`, and event type `wrong_attempt`, `hint_used`, or `solved` as applicable. A `solved` event should include `meta.time_remaining_seconds`; the gateway computes the final score. |

Gateway requests need an `X-Game-Key` header. Keep this key in the server-side adapter, never in browser JavaScript. The local adapter in `server.mjs` reads `GATEWAY_BASE_URL` and `P2G5_GAME_KEY` from an ignored `.env` file, uses a 3-second timeout, logs events and verification results under `.local-data/`, and queues events for retry every 20 seconds. With no `team_id` launch parameter, the original sample demo is unchanged. When launched as `?team_id=T07` and gateway settings are configured, the existing credential form loads that team's state, verifies the four entered artifacts through `/api/verify`, and reports sequence, hint, and solve events. The interface layout is unchanged.

To run both locally, start `npm run api` and `npm run dev` in separate terminals from this folder. Copy `.env.example` to `.env` when gateway settings are supplied. Use the normal local URL for the demo, or add a team ID such as `?team_id=T00` to exercise gateway mode after configuration.

Integration points in the current code:

- The UI reads the team ID from the launch URL (`team_id`) or `window.__CODEVERSE_TEAM_ID__`; authentication is not implemented.
- Artifact values are entered by the team and checked through `/api/verify`. The gateway's state response reports output presence, not values, so this follows the current TRD rather than auto-filling artifacts.
- The Shutdown Code producer remains configurable because the two TRDs disagree. Set `SHUTDOWN_CODE_GAME_ID` only after the organizer confirms the producer.
- Replace the local demo countdown and `score` in `App.jsx` with the event clock/rules and the gateway's authoritative result. The current formula is `max(0, money / 100 + remaining_seconds * 5 - risk * 20 - wrong_sequences * 150 - hints * 100)` with sample money `100,000` and risk `12`; it is **not** the final event scoring contract.
- The local five-minute timer is still used and sent as `meta.time_remaining_seconds`; confirm how to use the event-wide clock before the event.
- Replace the crew-size selector with team data if the gateway or team roster provides it. The 3D scene already accepts `crewSize={3}` or `crewSize={4}`.
- Do not send a `solved` event from **Preview finale · animation only**.

The two event documents disagree about the **Shutdown Code** source: the central gateway guide says its owner is unconfirmed, while the complete game flow says Phase 1 Alarm System produces it. Confirm which game issues and stores this value before connecting `/api/verify`. The gateway team must also supply the base URL, `p2g5` key, and the final scoring/sequence policy.

## Current status

The visual animation, three- or four-person crew option, full-screen sequence and tunnel presentation, and sound cues are implemented. The Test sound button was removed. Demo mode is preserved; gateway mode is wired behind the same interface but still needs real gateway settings and a live integration check.
