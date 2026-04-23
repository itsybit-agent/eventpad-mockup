# EventPad

A mobile-first, tap-driven event modeling tool. Drop in commands, events, and read models, link them together, and EventPad infers slices and lays them out as a structured walkthrough you can hand off to an AI or a teammate.

> **Status:** MVP / mockup. The event-sourced core is solid; the mobile UI is still being shaped. See [`about.md`](about.md) for context.

## Why

Describing an app to an AI from a phone usually means typing emoji-prefixed bullet lists or long-pressing for symbols. EventPad replaces that with a purpose-built, tap-to-add interface that produces a real event model — not a freeform note.

## Features

- Create and manage event models with named elements (commands, events, read models, screens, processors, automations)
- Define typed properties on each element (`string`, `number`, `boolean`, `date`, `guid`, `array`, `object`)
- Link elements together with bidirectional tracking (command → event, event → read model, etc.)
- **Auto-infer slices** from connection patterns:
  - Command → Event = **State Change (SC)**
  - Event → Read Model = **State View (SV)**
  - Event → Processor → Command = **Automation (AU)**
- Name and organize inferred slices
- Given/When/Then scenarios per slice (including rejection and projection variants)
- Timeline view for narrative walkthroughs
- Undo last event, full clear, and event log inspection
- Import / export the entire model as JSON
- Property propagation (copy props from a command downstream to its events and read models)

## Element types

| Symbol | Type | Meaning |
|--------|------|---------|
| 🟦 | Command | An action to perform |
| 🟧 | Event | Something that happened |
| 🟩 | Read Model | Data for display |
| ⏹️ | Screen | User interface |
| ⚙️ | Processor | Automation logic |

## Tech

- **Vanilla JavaScript** ES modules — no build step, no framework, no dependencies
- **Event-sourced**: every UI action appends to an event stream; UI is a projection of that stream
- **Persistence**: `localStorage` (key: `eventpad_events`)
- **Static hosting**: just serve the directory

## Project layout

```
index.html             Entry point and sheet markup
styles.css             All styling
src/
  main.js              Bootstraps features and exposes window.EventPad
  core/
    eventStore.js      Append-only event stream + localStorage persistence
    projections.js     projectState() — folds events into the read model
    constants.js       Event types, element actions, connection labels
  features/            Vertical slices (one folder per feature)
    createElement/     command.js + sheet.js
    connect/           actionSheet.js, command.js, pickers.js
    deleteElement/
    elementMenu/
    elements/          view.js
    eventLog/          panel.js + view.js
    nameSlice/
    properties/
    scenarios/         command.js + sheet.js + view.js
    slices/            view.js
    timeline/          view.js
    undo/
  ui/
    feed.js            Main render orchestrator
    sheets.js          Bottom-sheet open/close
    toast.js           Transient messages
EVENT_MODEL.md         The full event model (the app modeling itself)
IMPLEMENTATION_MAP.md  Maps each event/projection/screen to its source line
TODO.md                Tracked work items
```

The `features/` folders follow a CQRS-style **vertical slice** layout: each feature owns its commands (`command.js`), its UI sheets (`sheet.js`), and its views (`view.js`).

## How it works

1. A user action (tap, type, submit) calls a feature's `dispatch*` function.
2. That function appends one or more events to the stream via `appendEvent()`.
3. `projectState()` folds the entire stream into a read model: elements, slices, connections, scenarios.
4. `render()` paints the feed from that read model.
5. The stream is persisted to `localStorage` after every append.

Because the whole UI is derived from events, **undo** is just popping the last event and re-projecting.

### Slice inference

When you create a connection, the dispatcher looks for known patterns and emits a `SliceInferred` event:

- `command → event` becomes an SC slice
- `event → readModel` becomes an SV slice
- A processor wired to both an SV trigger and an SC command becomes an AU slice (auto-inferred in `projections.js`)

The user is then prompted to name the inferred slice.

## Running locally

No build, no install. Just serve the directory:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000` on your phone (or use device emulation in a desktop browser — viewport is locked to mobile width).

### Debug console

Append `?declaw` to the URL to surface an in-page console that captures `console.log` output — useful for debugging on a real phone.

```
http://localhost:8000/?declaw
```

## Deployment

The site is deployed via **GitHub Pages**, served directly from the `main` branch root (configured in repo Settings → Pages — no Pages workflow needed because the site is already static).

The one workflow in `.github/workflows/deploy.yml` runs on every push to `main` and stamps a UTC timestamp into:

- the version label in `index.html`
- the `main.js` cache-bust query string (so browsers always pull the latest module)

It then commits the stamped file back to `main`, which triggers Pages to republish.

Since the site is fully static, you can also host it anywhere else (Netlify, Vercel, S3, Cloudflare Pages) by copying the directory.

## Persistence and data

All state lives in the browser's `localStorage` under the `eventpad_events` key. Use **Export** in the burger menu to download the model as JSON, and **Import** to load one back. There is no server.

## Roadmap

From [`TODO.md`](TODO.md):

- AU slice editing: Set Trigger, Add Context, Set Command
- Export to Markdown alongside JSON

Larger ideas from [`about.md`](about.md): rebuild the backend on .NET 10 / ASP.NET Core with CQRS + vertical slices, Angular 21 frontend, FileEventStore for event persistence, MediatR for in-process publishing, and .NET Aspire for local orchestration.

## Further reading

- [`EVENT_MODEL.md`](EVENT_MODEL.md) — the complete event model for EventPad itself (the tool models its own behavior)
- [`IMPLEMENTATION_MAP.md`](IMPLEMENTATION_MAP.md) — map from model elements to source files
- [`LEARNINGS.md`](LEARNINGS.md) — what worked, what broke, and concrete improvements
- [`TODO.md`](TODO.md) — outstanding work
- [`about.md`](about.md) — origin story and intent
