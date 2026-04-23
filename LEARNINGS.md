# Key Learnings & Improvements

Reflections from auditing EventPad's documentation against the actual implementation. Targeted at this codebase, but most of these generalize to any small event-sourced system.

---

## What worked

### 1. The event-sourced core paid for itself

The whole UI is `projectState(eventStream) → render(state)`. Because of that:

- **Undo is one line:** pop the last event, re-project. No reverse-mutations to maintain.
- **Persistence is trivial:** serialize the array.
- **Export / import is trivial:** the array *is* the model.
- **Time-travel debugging is free:** rebuild state from any prefix.
- **Tests would be trivial** (if there were any): given a list of events, assert a projection.

For a single-user, in-browser tool with `localStorage` as the database, this is the right amount of architecture — almost zero ceremony, lots of optionality.

### 2. Vertical slices kept features genuinely independent

`src/features/<feature>/{command,sheet,view}.js` made it easy to add scenarios, propagate properties, multi-pickers, and the timeline view without each touching the others. The only shared surface is `appendEvent()`, the projection, and `window.EventPad`.

### 3. Dogfooding the model surfaced gaps the model alone wouldn't

Modelling EventPad's own UI as event-modeling slices in `EVENT_MODEL.md` made the difference between "what we wished was on the event stream" and "what's actually on the event stream" obvious — see the next section.

---

## What broke (and why)

### 1. Documentation drifted faster than code

`IMPLEMENTATION_MAP.md` still pointed at line 807 of an `app.js` that hadn't existed in months. `EVENT_MODEL.md` listed events (`EventPopped`, `AllCleared`, `EventsCopied`, `Connected`, `Disconnected`) that were never in the codebase. Three causes:

- Refactors split a monolith into modules; line-numbered docs broke instantly.
- Aspirational events were modeled before being implemented and never reconciled afterwards.
- No CI check tied docs to code, so drift was silent.

### 2. Some "commands" weren't event-sourced

Undo, Clear All, Copy, Export, and Import are listed as commands with events in `EVENT_MODEL.md` — but none of them append to the stream. Two of them *can't* sensibly be on the stream (`Undo` would have to delete itself; `ClearAll` would have to skip the clear). The other three are pure UI side-effects that were modelled symmetrically with everything else, which read better than it implemented.

### 3. String literals slipped past the EventTypes registry

`'ElementRenamed'` and `'PropertyUpdated'` are appended as raw strings rather than `EventTypes.ElementRenamed`. The projection still handles them (because it switches on the same string), but:

- They aren't discoverable from `constants.js`.
- A typo would silently land an unprojectable event on the stream.
- Refactor tooling can't find them.

### 4. The connection event family was over-designed

`EventTypes` defines six connection events: `ProducerSet`, `ConsumerAdded`, `TriggerSet`, `InputScreenSet`, `DisplayScreenSet`, `ProcessorOutputSet`. Only the first three are ever appended. `ProducerSet` is overloaded across `producer`, `produces`, `input`, `display`, `invokes`, and `context` relations because the dispatcher writes the actual relation into the payload anyway.

The model meanwhile talks about a single conceptual `Connected` event. Three layers of naming for one thing.

### 5. AU slices live in two parallel worlds

Automation slices arrive in two ways:

- **Via the picker flow** — appends an explicit `SliceInferred`. Lives on the stream, can be named, can have scenarios.
- **Via projection-time auto-inference** — synthesized for orphan processors, gets a synthetic ID like `au_inferred_<id>`, **does not exist on the stream**. Can't be named, no scenarios survive a reload.

This is invisible to the user and surprised the audit. It's the kind of bug that only shows up when someone tries to attach a scenario to a slice that "obviously" exists.

### 6. `SliceCompleted` is a ghost event

It's defined in `EventTypes`. The projection has a `case` for it. Nothing ever appends it. The presence in two places out of three made it look real.

---

## Concrete improvements

In rough priority order:

### Documentation hygiene

1. **Drop file:line references from `IMPLEMENTATION_MAP.md`** in favour of file paths + function names. Line numbers will rot the next time someone runs Prettier; function names won't.
2. **Add a doc-drift CI check.** A small Node script that:
   - asserts every `EventTypes.X` entry appears in at least one `appendEvent` call,
   - asserts every event mentioned in `EVENT_MODEL.md`'s summary table is either in `EventTypes` or explicitly flagged ❎,
   - flags any `appendEvent('SomeString'` that bypasses the registry.
3. **Mark aspirational sections clearly.** The `## ⚠️ Status` block at the top of `EVENT_MODEL.md` is the new contract: anything not flagged is implemented; anything flagged ❎ is intentional.

### Code hygiene

4. **Promote string-literal events to constants.** Add `ElementRenamed` and `PropertyUpdated` to `EventTypes` and replace the two `appendEvent('...')` call sites. One commit, no behaviour change.
5. **Delete the unused `EventTypes`.** `InputScreenSet`, `DisplayScreenSet`, `ProcessorOutputSet` should go — they're tombstones for a richer connection model that the code abandoned.
6. **Resolve `SliceCompleted`.** Either emit it from `pickers.js` when an AU slice fills its last leg, or delete the constant and the projection case. Currently it's dead code that reads as live code.
7. **Make AU slices first-class on the stream.** The auto-inference in `projections.js:218` should append a real `SliceInferred` event the first time it would synthesise one, then back off. That removes the "two AU worlds" problem and lets users name and attach scenarios to processor slices.
8. **Collapse the connection event family.** Either:
   - keep one `ConnectionAdded { fromId, toId, relation }` and let `relation` discriminate, or
   - actually use the type-specific events and stop overloading `ProducerSet`.

   The current half-and-half is the worst option.

### Architectural pressure points to watch

9. **`projectState()` re-folds the entire stream on every render.** Fine for a few hundred events, painful past a few thousand. Two cheap mitigations: snapshot every N events, or memoize on stream length and only fold the tail.
10. **Connections are append-only — no `Disconnected` event exists.** That's a deliberate limitation, but it should be a documented one. Right now deleting an element implicitly orphans connections in the projection, which is fine until it isn't.
11. **`window.EventPad` is the integration surface for `onclick=` handlers in `index.html`.** This works but it means every new feature has to be re-exported in `src/main.js`. Worth considering data attributes + a single delegated click handler.
12. **Single global event stream, no streams-per-aggregate.** Fine at this size; if EventPad ever grows multiple models per browser, sharding by `modelId` will be needed.

### Mobile UX

13. **Slice naming prompt interrupts flow** — fires immediately when a pattern is detected. Worth deferring until the user finishes the current connect interaction.
14. **The FAB → type sheet → name sheet → action sheet sequence** is four taps to add one connected element. Worth a "connect from existing" entry that combines naming + relation in one sheet.
15. **Element cards are dense on small screens** — properties expand inline; consider a peek/expand pattern instead.

---

## Process learnings

- **Treat the model as code.** When `EVENT_MODEL.md` and the implementation disagree, one of them is a bug. Picking which is "right" is a deliberate decision, not a synchronisation chore.
- **Refactors that change file structure should refresh structural docs in the same PR.** `IMPLEMENTATION_MAP.md`'s line numbers were broken by a single split-into-modules commit.
- **Aspirational documentation is fine if labelled.** It's only harmful when readers can't tell which parts are real.
- **The audit took ~15 minutes once the right questions were asked** ("which events are appended? which are read? which are documented?"). It's worth running periodically — not because the docs need to be perfect, but because the diff between intent and reality is itself useful information.
