# EventPad Implementation TODO

## Done

### Event Model fixes (SC/SV separation)
- [x] SV: View Element Properties — added scenarios for update/delete reflected
- [x] SC: Create / Rename / Delete Element — removed `🟩 Feed` from SC slices
- [x] SC: Rename Slice — removed `🟩 Feed` and `⏹️ SliceCard` from SC slice
- [x] SC: Undo / Clear All — removed `🟩 Feed` from SC slices *(also: marked these as not event-sourced; see EVENT_MODEL.md)*
- [x] SC: Add Screen / ReadModel to Slice — removed `🟩 SliceCard` from SC slices
- [x] SC: Pick Source Events — removed `🟩 Feed` from SC slice
- [x] SV: View Feed — added scenarios for rename, delete, slice updates, clear

### Implementation
- [x] Scenarios — Add / Edit / Delete SC and SV scenarios
- [x] Property values in scenarios — Given / When / Then values
- [x] Property propagation — copy props from a command downstream to event/readModel
- [x] AU slice auto-inference at projection time for orphan processors
- [x] Export model to JSON
- [x] Import model from JSON

## Outstanding

### Plumbing / cleanup (from doc audit)
- [ ] Promote `'ElementRenamed'` and `'PropertyUpdated'` from raw string literals to entries in `EventTypes` (`src/core/constants.js`)
- [ ] Remove unused `EventTypes`: `InputScreenSet`, `DisplayScreenSet`, `ProcessorOutputSet` — superseded by `ProducerSet`
- [ ] Decide on `SliceCompleted`: either emit it explicitly when an AU slice gains its missing leg, or remove it from `EventTypes` and from the projection
- [ ] Synthetic AU slices (`au_inferred_<id>`) can't be named or have scenarios attached — add an explicit `SliceInferred` event for them so they live on the stream

### Features
- [ ] AU slice editing — Set Trigger, Add Context, Set Command (UI flows exist in pickers; no dedicated AU sheet)
- [ ] Export to Markdown (only JSON today)
- [ ] Tests — there is no test suite

### Mobile UX (from `about.md`)
- [ ] Rethink the feed layout for one-handed use
- [ ] Improve the inferred-slice naming prompt — interrupts flow
- [ ] Better element-card density on small screens
