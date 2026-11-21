# AGENTS.md

Agent entry point for `dsh-utodo`. Read this before touching the repo; it is short on purpose.

## What this is

A DeepSeek Harness (DSH) plugin: a left-sidebar entry and one global panel with todos and ideas.
Two halves, both hand-written, **no build step, no bundler, no runtime dependencies**:

| File | Role |
|---|---|
| `lib/index.js` | Host half. Deliberately empty: it registers nothing and exports nothing, so the Loader entry stays enabled and the client bundle is served. |
| `lib/client.js` | The whole UI. A `window.__ModuleLoader__.load({ id, factory })` bundle (CommonJS wrapper) that `require("react")` only. Registers slots `sidebar.panellist` (id `utodo`, order 20), `main` (keyed `utodo`), and `conversation.session.header.utilities` (a session probe). |
| `cordis.patch.yml` | Bundle patch that inserts the loader entry named `dsh-utodo`. |

Data lives in `localStorage["dsh-utodo.v1"]`: `{ todos: [], ideas: [], settings: { soonDays, tagTones, push } }`.
The only outbound traffic is the webhook the user pastes into settings; nothing else leaves the machine.

## Commands

```bash
node --check lib/client.js        # syntax (the bundle is not type-checked)
node .recon/smoke.mjs             # renders the panel with a fake React: grouping, ranges, views, tag colours, reminders, import text
node .recon/smoke-register.mjs    # runs apply() against a fake ctx.slots: injections and registrations
node .recon/ui-audit.mjs          # design-system audit (tokens only, class/CSS alignment, button types)
node .recon/preview.mjs           # writes .recon/preview-{light,dark}.html from the stylesheet
```

All five must pass before a commit. `smoke.mjs` prints one known false positive
(`composer placeholder :: missing 添加一条待办，回车即可`) — the placeholder is an element
attribute, not text; ignore that single line, nothing else.

Windows notes: there is no `/tmp`; write scratch output under `.recon/`. To read
`smoke.mjs`'s JSON, redirect to `.recon/smoke.json` first. The only browser available for
screenshots is Edge at `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`.

## Styling rules (non-negotiable)

The entire design layer is **one template string `const CSS`** near the top of `lib/client.js`
plus one `<style>` element injected by `injectStyle()`. There is no CSS file, no CSS-in-JS library,
and no second stylesheet.

- **Read `UI-GUIDELINES.md` first.** It holds the token table, component recipes, states, and the do/don't list.
- Colors, font sizes, radii and spacing come from `--ut-*` tokens declared on `.utodo-root`.
  No literal colors outside the token block; no magic `font-size`/`border-radius`; spacing on the 4pt scale.
- `node .recon/ui-audit.mjs` enforces the above mechanically and exits non-zero. If it complains, fix the CSS,
  never the audit — unless the rule itself is genuinely wrong, in which case change the rule *and* the guideline.
- Accent-coloured **text** uses `--ut-accent-ink`, not `--ut-accent`.
- New component? Add a static instance to `.recon/preview-body.html` and eyeball both themes.
- Scope everything under `.utodo-root`; never style DSH's global classes and never add `!important`.

## Engineering rules

- Keep the hand-written bundle format. Do not add a build step, do not add dependencies,
  do not convert to ESM inside `lib/client.js` (the file is wrapped in a CJS factory).
- UI copy is Chinese; code comments and identifiers are English. Keep both.
- Slots receive ids, not scopes: resolve a session with `sessions.scope(id)`, then
  `ctx.get('conversation').input.for(scopedCtx)` to write the draft.
- Client modules are assembled at DSH start-up: after changing `lib/client.js`, restart the desktop app.
- Keep `exports.__internals` in sync when you add a pure helper the smoke test asserts on.

## Versioning and release

1. Bump `version` in `package.json`; update the README "新增" / changelog wording.
2. `node --check` + the four `.recon` checks.
3. `npm pack --dry-run` to confirm the file list (`lib`, `cordis.patch.yml`, READMEs, LICENSE;
   add any new doc you want shipped to `files`).
4. Commit with a conventional subject (`feat:`, `fix:`, `docs:`, `chore:`).
5. Publishing (`npm publish`) and pushing are outward-facing: only do them when the user explicitly asks.
   A published version is immutable — never re-publish the same number.
