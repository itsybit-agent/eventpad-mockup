# Event Model → Implementation Map

## Events (🟧)

| Event | Model Section | Emitted In | Line |
|-------|---------------|------------|------|
| ElementCreated | SC: Create Element | `dispatchCreateElement()` | 807 |
| ElementCreated | SC: Connect (new element) | `dispatchConnection()` | 827 |
| Connected/ProducerSet | SC: Connect * | `dispatchConnection()` | 837 |
| SliceInferred | AU: Infer * Slice | `dispatchConnection()` | 941 |
| SliceNamed | SC: Name Slice | `dispatchNameSlice()` | 971 |
| SliceElementAdded | SC: Add Element to Slice | `dispatchConnection()` | 866 |
| SliceElementAdded | pickElement (AU) | `pickElement()` | 1155 |
| SliceCompleted | SC: Set AU Command | `pickElement()` | 1162 |

## Projections (🟩 Read Models)

| Read Model | Model Section | Projected In | Lines |
|------------|---------------|--------------|-------|
| Feed.elements | SV: View Feed | `projectState()` case ElementCreated | 679-686 |
| Feed.slices | SV: View Feed | `projectState()` case SliceInferred/Named | 715-735 |
| SliceElementOrder | SV: Slice Element Order | `sortSliceElements()` | 597-607 |
| ElementCard.connections | - | `projectState()` case ProducerSet | 702-713 |

## Screens (⏹️)

| Screen | Model Section | Rendered By | Function |
|--------|---------------|-------------|----------|
| Feed | SV: View Feed | `render()` | Main feed with slices + loose elements |
| ElementCard | - | `render()` | Element with emoji, name, connections |
| SliceCard | - | `render()` | Named slice with elements |
| ActionSheet | SC: Connect | `showActions()` | Element actions menu |
| NameSheet | SC: Create/Name | `showSheet('nameSheet')` | Text input for naming |
| PickerSheet | SC: Set AU Command | `showPicker()` | Pick existing elements |
| SliceNamePrompt | SC: Name Slice | `showSheet('sliceNameSheet')` | Name inferred slice |

## Commands (🟦)

| Command | Model Section | Handler | Triggers |
|---------|---------------|---------|----------|
| CreateElement | SC: Create Element | `dispatchCreateElement()` | ElementCreated |
| Connect | SC: Connect * | `dispatchConnection()` | Connected, SliceInferred?, SliceElementAdded? |
| NameSlice | SC: Name Slice | `dispatchNameSlice()` | SliceNamed |
| PickElement | SC: Set AU Command | `pickElement()` | SliceElementAdded, SliceCompleted? |

## Automations (⚙️)

| Automation | Model Section | Implemented In | Logic |
|------------|---------------|----------------|-------|
| PatternDetector (SC) | AU: Infer SC Slice | `dispatchConnection()` | Command→Event = SC |
| PatternDetector (SV) | AU: Infer SV Slice | `dispatchConnection()` | Event→ReadModel = SV |
| ElementSorter | SV: Slice Element Order | `sortSliceElements()` | Sort by type hierarchy |
| PreConnectedIncluder | Rule in SC inference | `dispatchConnection()` | Include pre-connected screens |

## Missing/TODO

| Model Section | Status | Notes |
|---------------|--------|-------|
| SC: Set Trigger (from SV) | ❌ Not implemented | Need SVEventPicker |
| SC: Add Additional Context | ❌ Not implemented | Need ReadModelPicker for AU |
| Processor "What triggers?" | ❌ Not implemented | Currently creates via Event action |
| Scenarios (GWT editing) | ❌ Not implemented | ScenarioAdded, GivenSet, WhenSet, ThenSet |
| Properties | ❌ Not implemented | PropertyAdded event exists but no UI |

## Flow Diagram

```
User Action              Command              Events                    Projection
─────────────────────────────────────────────────────────────────────────────────
Tap +                    -                    -                         Show TypeSheet
Select type              -                    -                         Show NameSheet  
Enter name               CreateElement        ElementCreated            Feed + new card
Tap element              -                    -                         Show ActionSheet
Select action            Connect              Connected                 Card shows connection
                                              + ElementCreated          Feed + new card
                                              + SliceInferred?          Feed + slice card
                                              + SliceElementAdded?      Slice updated
Slice inferred           -                    -                         Show SliceNamePrompt
Enter name               NameSlice            SliceNamed                Slice card named
Processor pick cmd       PickElement          SliceElementAdded         Slice updated
                                              + SliceCompleted?         Slice complete
```
