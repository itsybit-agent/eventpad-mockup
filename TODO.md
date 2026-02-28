# EventPad Implementation TODO

## Event Model Fixes (SC/SV Separation)
- [x] SV: View Element Properties - added scenarios for update/delete reflected
- [x] SC: Create Element - removed `🟩 Feed` from SC slice
- [x] SC: Rename Element - removed `🟩 Feed` from SC slice  
- [x] SC: Rename Slice - removed `🟩 Feed` and `⏹️ SliceCard` from SC slice
- [x] SC: Delete Element - removed `🟩 Feed` from SC slice
- [x] SC: Undo Last Event - removed `🟩 Feed` from SC slice
- [x] SC: Clear All Events - removed `🟩 Feed` from SC slice
- [x] SC: Add Screen to Slice - removed `🟩 SliceCard` from SC slice
- [x] SC: Add ReadModel to Slice - removed `🟩 SliceCard` from SC slice
- [x] SC: Pick Source Events - removed `🟩 Feed` from SC slice
- [x] SV: View Feed - added scenarios for rename, delete, slice updates, clear

## Implementation TODO
- [x] Scenarios - Add/Edit/Delete SC and SV scenarios ✅
- [ ] Property values in scenarios - allow entering values for Given/When/Then

## Future
- [ ] AU Slices - Set Trigger, Add Context, Set Command
- [ ] Export to Markdown/JSON
