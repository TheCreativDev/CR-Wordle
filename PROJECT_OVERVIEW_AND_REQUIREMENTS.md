# CR Wordle — Project Overview & Requirements (Handoff Notes)

Last updated: 2025-12-22

## What this is
CR Wordle is a small Wordle-like guessing game themed around Clash Royale cards.
The focus is fun: quick feedback loops, satisfying UI, and playful progression.

There are two user-facing pages:
- `index.html`: the game
- `dashboard.html`: an admin-ish dashboard for browsing cards + viewing Firebase game stats

## Tech stack / constraints
- Plain static site: HTML + CSS + vanilla JavaScript (IIFE modules)
- No build tooling / bundler: scripts load via `<script>` tags
- Card dataset is a static JS file: `data/cards.js`
- Optional backend: Firebase (Realtime Database + Anonymous Auth) used for analytics and dashboard stats
- Local player stats (win rate, streak, etc.) stored in `localStorage`

## Quick start (dev)
- Open `index.html` directly in a browser.
- Optional: configure Firebase in `js/firebase-config.js` (see `FIREBASE_SETUP.md`).

## Core gameplay (how it works)
- A random target card is selected at the start of each game.
- Player has a maximum of 10 guesses.
- Player types a card name; an autocomplete dropdown shows up to 8 matching unguessed cards.
- On selecting a card, a “guess row” is added (most recent on top).
- Each guess row compares attributes vs the target card:
  - `elixir` (numeric)
  - `rarity` (ordered)
  - `type` (exact)
  - `range` (exact)
  - `speed` (ordered with special `N/A` rules)
  - `hitSpeed` (numeric with special `N/A` rules)
  - `releaseYear` (numeric)

Comparison UI rules:
- Correct value: green cell
- Incorrect value: red cell
- For ordered/numeric: arrow ↑ / ↓ indicates the target is higher/lower
- “N/A” can render as a grey cell (used when comparison is not meaningful)

Category toggles:
- In the attribute header row, most columns are toggleable.
- Toggling disables that category in the guess grid (blank cells).
- A minimum of 2 categories must remain enabled.

Win/Loss:
- Win when guessed card id equals target id.
- Loss when 10 guesses are used without winning.
- Win shows win message; loss shows loss message and reveals the target card image/name.

## Data model
The main dataset lives in `data/cards.js`.

Card shape (current expected fields):
- `id`: string (lowercase, no spaces)
- `name`: string
- `elixir`: number
- `rarity`: "Common" | "Rare" | "Epic" | "Legendary" | "Champion"
- `type`: "Troop" | "Spell" | "Building"
- `target`: "Ground" | "Air & Ground" | "N/A" (not currently used in comparisons)
- `range`: usually "Melee" | "Ranged" (data currently also includes "N/A" in places)
- `speed`: "Slow" | "Medium" | "Fast" | "Very Fast" | "N/A"
- `hitSpeed`: number | "N/A"
- `releaseYear`: number
- `image`: string path like `images/cards/<id>.png`

Ordering constants:
- `RARITY_ORDER` and `SPEED_ORDER` are defined in `data/cards.js`.

## Architecture (modules and responsibilities)

### Bootstrapping
- `js/app.js`
  - Validates `CARDS` exists.
  - Calls `UI.init()`.
  - Starts first game via `Game.startNewGame()`.
  - Resets UI via `UI.resetUI()`.
  - Logs “game start” to Firebase analytics (if available).

### Game state + rules
- `js/game.js`
  - Owns game state: target card, guessed cards, win/loss flags.
  - Exposes `startNewGame()`, `makeGuess(cardId)`, `searchCards(query)`, etc.
  - Implements comparisons and special handling for `N/A` (especially for speed + hitSpeed).
  - Maximum guesses = 10.

### UI (DOM + rendering)
- `js/ui.js`
  - Owns DOM bindings, event listeners, and rendering.
  - Implements autocomplete UX (keyboard + mouse).
  - Renders guess rows and attribute cells.
  - Implements “category disabling” in the header row.
  - Shows win/loss views and triggers Stats/Firebase logging.

### Local player stats
- `js/stats.js`
  - Persists simple aggregate stats in `localStorage` under `cr_wordle_stats`.
  - Tracks: games played, wins, average guesses (wins only), best game, streak.

### Firebase analytics
- `js/firebase-config.js`
  - Initializes Firebase app.
  - Signs in anonymously.
  - Exposes globals: `database`, `auth`, and `isAuthenticated`.

- `js/firebase-analytics.js`
  - `logGameStart()` increments `stats/gamesStarted`.
  - `logGame(gameData)` writes game records under `games/<uid>/...`.
  - `fetchAllGames()` reads all games for the current user.
  - `fetchStats()` reads global `stats`.

### Dashboard
- `dashboard.html` + `css/dashboard.css`
  - Contains a login gate (password-based, front-end only).
  - After login, shows:
    - aggregate game stats (from Firebase)
    - card completion grid (cards dim until they’ve been won as target at least once)
    - a card browser with filters, grid/list views, and a modal

- `js/dashboard.js`
  - Filtering, view switching, card rendering, modal navigation.

- `js/dashboard-stats.js`
  - Loads Firebase data and renders aggregate stats.
  - Auto-refreshes every 30 seconds.

## UX & design requirements (important)
Primary goal: fun.

### Visual direction
- The UI should be intuitive and good-looking.
- The requested style direction is neumorphism-like.

Current state:
- The project already uses a dark, “card-y” theme with CSS variables in both `css/styles.css` and `css/dashboard.css`.
- Maintain and reuse existing CSS variables instead of introducing new colors casually.

When implementing new UI:
- Prefer consistent “soft surface” look: rounded corners, subtle highlights/shadows, tactile buttons.
- Keep interactions snappy and readable:
  - clear focus states
  - accessible contrast
  - responsive layout for mobile

### Gameplay UX
- Autocomplete must remain fast and keyboard-friendly.
- Don’t allow guesses once the game is won/lost.
- “Play again” should be immediate and reset UI state cleanly.

### Data quality UX
- Missing images should fail gracefully (there is a placeholder fallback already used in UI).
- Card data should remain internally consistent (types/rarities/speeds).

## Non-goals / scope boundaries
- This is not a competitive or monetized product; keep it lightweight.
- Avoid heavy frameworks unless explicitly requested.
- Avoid adding build steps unless there is a clear payoff.

## Known quirks / things to watch
- `range` in data is documented as "Melee" | "Ranged", but at least some entries include "N/A".
  - The game comparison currently treats `range` as exact-match and the UI renders any value.
- Firebase usage is optional, but the dashboard depends on it for stats.
- The dashboard “login” is client-side only; it is not real security.

## Common change areas (where to implement)
- Game rule changes: `js/game.js`
- Input/autocomplete/guess rendering: `js/ui.js`
- Local stats definitions: `js/stats.js`
- Firebase event schema / writes: `js/firebase-analytics.js`
- Styling: `css/styles.css` (game), `css/dashboard.css` (dashboard)
- Card content: `data/cards.js` and images in `images/cards/`

## Suggested engineering conventions for future agents
- Preserve the no-build, static-file approach unless asked to change it.
- Keep modules as IIFEs and avoid introducing global state beyond what already exists.
- Prefer small, incremental changes; this project is meant to be fun and hackable.
