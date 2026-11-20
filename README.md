# Randu Chaaran — Two Spies

A single-player, top-down crime thriller set in Karimkunnu, a fictional town in Kerala. Walk the same streets as an undercover officer, follow the evidence through nine chapters, and learn what the town chooses to believe.

## Play locally

Requires Node.js 20.19+ or 22.12+. The project was built and tested with Node.js 24.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5188**. New Game starts the story. Continue loads the last completed objective’s checkpoint. Browser storage is local to the origin and browser profile.

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD or arrow keys | Direction pad |
| Interact | E | E button or nearby prompt |
| Complete or advance dialogue | E or Space | Continue button |
| Choose a response | Click, or focus with Tab and confirm with Enter | Tap the response |
| Pause during exploration | Escape | Pause button |
| Mute | M | Sound button |
| Case File | J | Case File button |

The arrow in the objective tracker points toward the current destination. Look for the amber marker when close. In stealth, solid cover breaks sight, and prolonged exposure restores a checkpoint.

## Explore Karimkunnu

Teal marks indicate optional landmarks, evidence, observation points, and investigation leads. Small amber marks indicate hidden envelopes. The Case File tracks explored districts, available leads, evidence, character notes, achievements, XP, and reputation. Its Records tab also controls field notifications.

- Eleven optional investigations ask you to compare two pieces of evidence and choose a supported explanation.
- Five replayable challenges span Shadow, Observation, Escape and Deduction. Completed challenges can be replayed from the Case File or **Challenge Records** on the title screen. Personal bests are local to the browser. Replays update the leaderboard separately from the campaign.
- Town conditions follow the story. Revisit districts after major events and use the openings in the yard fence and the tower lane to approach from a different direction. The park is open during free exploration. The rooftop can be revisited after its first story encounter, and **Explore Karimkunnu** on the end screen returns to town after the credits.
- Existing version 1 saves migrate at Continue. The expansion preserves the story checkpoint and credits completed objectives toward rank. Optional activities are independent of the nine-chapter path.

## Build and verify

```sh
npx playwright install chromium webkit
npm run typecheck
npm run build
npm test
npm run test:build
```

Serve the contents of `dist/` with a static HTTP server. Use `npm run preview` locally. The game loads its assets from the same origin and requires no backend or external services. Development-only tools include `?tiles` for the numbered spritesheet, `?chapter=4` for a chapter checkpoint, and `?fast` for shortened cinematic waits. None are enabled in the production build.

`src/data` holds the ordered objectives, dialogue, scene scripts and tile layouts. `src/scenes` handles the title, town, roof, park, credits and UI. `src/systems` handles input, checkpoints, audio, dialogue, scripted scenes, and stealth. `tests` covers the development build, and `checks` verifies the production preview.

## Assets and credits

All sprite and tile art comes from the supplied **Tiny City** pack by **Kenney**, released under **CC0**. The game reads the packed 192 × 176 sheet as 132 zero-spaced 16 × 16 frames. Procedural geometry supplies pavement markings, lamps, visual effects and captions. Audio is synthesized with WebAudio. Malayalam signage uses Noto Sans Malayalam when installed and the browser’s local font fallback otherwise. See [CREDITS.txt](CREDITS.txt) and the [Kenney license](public/assets/kenney/License.txt).
