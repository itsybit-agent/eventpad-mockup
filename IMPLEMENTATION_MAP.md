# Event Model → Implementation Map

Maps the event model in [`EVENT_MODEL.md`](EVENT_MODEL.md) to the actual source files. The codebase is organized as vertical slices under `src/features/`; this file is the index.

> **Note:** Older revisions of this map referenced line numbers in a single monolithic `app.js`. That file no longer exists — everything is in modules now.

---

## Events appended in code

Source of truth: `src/core/constants.js` (`EventTypes`).

| Event | Where it's appended | Notes |
|-------|---------------------|-------|
| `ElementCreated` | `src/features/createElement/command.js:10` | Also appended inline by `dispatchConnection()` (`src/features/connect/command.js:31`) and by several picker flows in `src/features/connect/pickers.js` (lines 286, 491, 605) |
| `ElementDeleted` | `src/features/deleteElement/command.js:40` | |
| `ElementRenamed` | `src/features/properties/sheet.js:219` | **Appended as raw string `'ElementRenamed'` — not in `EventTypes`** |
| `PropertyAdded` | `src/features/properties/sheet.js:73, 172` | Second site is the propagate flow |
| `PropertyUpdated` | `src/features/properties/sheet.js:61` | **Appended as raw string `'PropertyUpdated'` — not in `EventTypes`** |
| `PropertyRemoved` | `src/features/properties/sheet.js:199` | |
| `ProducerSet` | `src/features/connect/command.js:41`, `src/features/connect/pickers.js:99, 133, 292, 326` | Used for `producer`, `produces`, `trigger`, `invokes`, and `context` relations — payload is `{ fromId, toId, relation }` |
| `ConsumerAdded` | `src/features/connect/pickers.js:498, 520` | Event → ReadModel link |
| `TriggerSet` | `src/features/connect/pickers.js:376` | Processor SV trigger |
| `SliceInferred` | `src/features/connect/command.js:135`, `src/features/connect/pickers.js:164, 357, 391, 531` | One per slice-detecting flow |
| `SliceNamed` | `src/features/nameSlice/sheet.js:36` | |
| `SliceElementAdded` | `src/features/connect/command.js:63`, `src/features/connect/pickers.js:111, 304, 340, 590, 610` | |
| `SliceElementRemoved` | `src/features/deleteElement/command.js:25` | |
| `SliceDeleted` | `src/features/deleteElement/command.js:33` | |
| `ScenarioAdded` | `src/features/scenarios/command.js:15` | |
| `ScenarioDeleted` | `src/features/scenarios/command.js:26` | |
| `GivenSet` | `src/features/scenarios/command.js:34` | |
| `WhenSet` | `src/features/scenarios/command.js:42` | |
| `ThenEventSet` | `src/features/scenarios/command.js:51` | |
| `ThenRejectionSet` | `src/features/scenarios/command.js:60` | |
| `ThenReadModelSet` | `src/features/scenarios/command.js:68` | |

### Defined in `EventTypes` but never appended

- `InputScreenSet` — superseded by `ProducerSet` with `relation: 'input'`
- `DisplayScreenSet` — superseded by `ProducerSet` with `relation: 'display'`
- `ProcessorOutputSet` — superseded by `ProducerSet` with `relation: 'invokes'`
- `SliceCompleted` — projection handles it (`src/core/projections.js:148`) but no dispatcher emits it

### "Commands" that don't go through the event stream

These appear as commands in `EVENT_MODEL.md` but mutate state directly without appending events. They are **not event-sourced** and cannot be undone:

| Operation | Implementation | Why not an event |
|-----------|----------------|-------------------|
| Undo | `src/features/undo/command.js:10` (`popEvent()`) | Pops the last event from the stream — it *is* the undo, can't itself be on the stream |
| Clear All | `src/features/undo/command.js:20` (`clearEvents()`) | Empties the stream |
| Copy Event Log | `src/features/eventLog/panel.js` | UI-only clipboard write |
| Export Model | `src/features/eventLog/panel.js` | UI-only file download |
| Import Model | `src/features/eventLog/panel.js` | Replaces stream wholesale; doesn't append |

---

## Projections

All projections live in a single fold: `projectState()` in `src/core/projections.js:28`.

| Read model | Built from | Lines |
|------------|------------|-------|
| `state.elements` | `ElementCreated`, `ElementDeleted`, `PropertyAdded`, `PropertyUpdated`, `PropertyRemoved`, `ElementRenamed` | 41–91 |
| `state.connections` | `ProducerSet`, `ConsumerAdded`, `TriggerSet`, `ProcessorOutputSet`, `InputScreenSet`, `DisplayScreenSet` | 93–104 |
| `state.slices` | `SliceInferred`, `SliceNamed`, `SliceElementAdded`, `SliceElementRemoved`, `SliceDeleted`, `SliceCompleted` | 106–153 |
| `state.scenarios` | `ScenarioAdded`, `ScenarioDeleted`, `GivenSet`, `WhenSet`, `ThenEventSet`, `ThenRejectionSet`, `ThenReadModelSet` | 156–214 |
| Synthetic AU slices | Auto-inferred from processor connections after the fold | 218–246 |
| Slice element ordering | `sortSliceElements()` (screen/processor → command/readModel → event) | 9–26 |
| `findSliceForElement()` | Lookup helper | 252–255 |
| `findSourceSlice()` | Lookup helper (skips AU) | 258–263 |
| `getSliceDetail()` | Slice + resolved element objects with properties | 273–296 |

---

## Screens (sheets) and where they live

All sheets are declared in `index.html`; the open/close mechanic is in `src/ui/sheets.js`.

| Sheet | `index.html` | Opened by |
|-------|---------------|-----------|
| Feed | line 43 | always rendered (`src/ui/feed.js:18`) |
| Timeline | line 51 | `toggleViewMode()` (`src/features/timeline/view.js`) |
| Create Element (type picker) | 68–110 | `openCreateSheet()` (`src/features/createElement/sheet.js`) |
| Name Element | 113–120 | After `selectType()` (`src/features/createElement/sheet.js`) |
| Action Sheet | 123–129 | `showActions()` (`src/features/connect/actionSheet.js`) |
| Picker Sheet | 132–139 | `showPicker()` and friends (`src/features/connect/pickers.js`) |
| Element Menu | 142–148 | `openElementMenu()` (`src/features/elementMenu/sheet.js`) |
| Property Sheet | 151–168 | `openPropertySheet()` (`src/features/properties/sheet.js`) |
| Propagate Properties | 171–180 | After `PropertyAdded` (`src/features/properties/sheet.js`) |
| Multi Picker | 183–191 | `showMultiPicker()` (`src/features/connect/pickers.js`) |
| Slice Name Prompt | 194–203 | `promptSliceNaming()` (`src/features/nameSlice/sheet.js`) |
| Add Scenario | 206–214 | `openAddScenarioSheet()` (`src/features/scenarios/sheet.js`) |
| Edit Scenario | 217–244 | `openEditScenarioSheet()` (`src/features/scenarios/sheet.js`) |
| Toast | 246 | `showToast()` (`src/ui/toast.js`) |
| Debug console | 58–65 | `?declaw` URL flag (`src/main.js:184`) |

---

## Commands → Events

| Command (UI action) | Handler | Events emitted |
|---------------------|---------|----------------|
| CreateElement | `dispatchCreateElement()` (`src/features/createElement/command.js:7`) | `ElementCreated` |
| RenameElement | `renameElement()` (`src/features/properties/sheet.js:211`) | `'ElementRenamed'` |
| AddProperty | `saveProperty()` add branch (`src/features/properties/sheet.js:73`) | `PropertyAdded` (+ optional propagate offer) |
| UpdateProperty | `saveProperty()` update branch (`src/features/properties/sheet.js:59`) | `'PropertyUpdated'` |
| DeleteProperty | `deleteProperty()` (`src/features/properties/sheet.js:194`) | `PropertyRemoved` |
| Connect (general) | `dispatchConnection()` (`src/features/connect/command.js:22`) | `ElementCreated` + `ProducerSet` + (`SliceElementAdded` or `SliceInferred`) |
| Connect (picker variants) | various in `src/features/connect/pickers.js` | `ProducerSet` / `ConsumerAdded` / `TriggerSet` (+ slice events) |
| NameSlice | `dispatchNameSlice()` (`src/features/nameSlice/sheet.js:32`) | `SliceNamed` |
| DeleteElement | `deleteElement()` (`src/features/deleteElement/command.js:10`) | `SliceElementRemoved` (if in slice) + `SliceDeleted` (if slice empty) + `ElementDeleted` |
| AddScenario | `addScenario()` (`src/features/scenarios/command.js:13`) | `ScenarioAdded` |
| SetGiven / SetWhen / SetThen* | `src/features/scenarios/command.js:33–68` | `GivenSet` / `WhenSet` / `ThenEventSet` / `ThenRejectionSet` / `ThenReadModelSet` |
| DeleteScenario | `deleteScenario()` (`src/features/scenarios/command.js:25`) | `ScenarioDeleted` |
| Undo | `undo()` (`src/features/undo/command.js:9`) | *(none — pops the stream)* |
| Clear All | `clearAll()` (`src/features/undo/command.js:17`) | *(none — empties the stream)* |

---

## Automations (in-process projections, not events)

These run synchronously inside `dispatchConnection()` or `projectState()` rather than emitting events:

| Automation | Where | Logic |
|------------|-------|-------|
| Pattern detector — SC | `src/features/connect/command.js:85` | `command → event` ⇒ infer SC slice |
| Pattern detector — SV | `src/features/connect/command.js:107` | `event → readModel` ⇒ infer SV slice |
| Pattern detector — AU (synthetic) | `src/core/projections.js:218` | processor with both `trigger` and `invokes` connections ⇒ synthesize AU slice with no `SliceInferred` event |
| Pre-connected includer | `src/features/connect/command.js:94, 119` | When inferring a slice, sweep up already-connected screens / read models / events |
| Element sorter | `src/core/projections.js:20` | Order elements within a slice by type hierarchy |

---

## Event flow (current)

```
User action              Command handler          Events appended                  Projection update
──────────────────────────────────────────────────────────────────────────────────────────────────
Tap +                    openCreateSheet          —                                show TypeSheet
Pick type                selectType               —                                show NameSheet
Submit name              dispatchCreateElement    ElementCreated                   elements[id] = …
Tap element              openElementMenu          —                                show ElementMenu
Pick "Connect"           showActions              —                                show ActionSheet
Pick relation            dispatchConnection       ElementCreated                   elements[id] = …
                                                  + ProducerSet                    connections.push(…)
                                                  + SliceInferred? (new pattern)   slices[id] = …
                                                  + SliceElementAdded? (existing)  slice.elements.push(…)
Pattern detected         promptSliceNaming        —                                show SliceNamePrompt
Submit slice name        dispatchNameSlice        SliceNamed                       slice.name = …
Pick AU command          pickElement (pickers.js) ProducerSet (+ SliceElementAdded) connections.push(…)
Add scenario             addScenario              ScenarioAdded                    scenarios[id] = …
Edit Given/When/Then     setGiven / setWhen / …   GivenSet / WhenSet / Then*Set    scenario.{given,when,then} = …
Undo                     undo                     — (popEvent + re-project)        rebuilt from N-1 events
```

---

## Known gaps and quirks

- `'ElementRenamed'` and `'PropertyUpdated'` are appended as **raw string literals** rather than via `EventTypes` constants — should be promoted to constants.
- `'SliceCompleted'` is read by the projection but never emitted.
- AU slices are **auto-inferred at projection time** rather than via an explicit `SliceInferred` event. They have synthetic IDs (`au_inferred_<processorId>`), so they don't survive on the event stream and can't be named or have scenarios attached.
- No `Disconnected` event exists — connections are append-only.
- Undo / Clear All / Copy / Export / Import bypass the event stream entirely; treating them as event-sourced commands in `EVENT_MODEL.md` is aspirational, not real.
