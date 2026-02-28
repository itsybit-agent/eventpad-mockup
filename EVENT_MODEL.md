# EventPad MVP - Event Model

Element-first, slice-inferred event modeling tool.

**All features are modeled as slices** - dogfooding! 🐕

---

## 📖 Feature Slices Overview

| Feature | Type | Screen → Command → Event |
|---------|------|--------------------------|
| Create Element | SC | FAB → CreateElement → ElementCreated |
| Delete Element | SC | ElementCard → DeleteElement → ElementDeleted |
| Rename Element | SC | ElementCard → RenameElement → ElementRenamed |
| Add Property | SC | ElementCard → AddProperty → PropertyAdded |
| Edit Property | SC | PropertyRow → UpdateProperty → PropertyUpdated |
| Delete Property | SC | PropertySheet → DeleteProperty → PropertyRemoved |
| Rename Slice | SC | SliceHeader → RenameSlice → SliceNamed |
| Connect Elements | SC | ActionSheet → Connect → Connected |
| Pick Source Events | SC | ReadModel → MultiPicker → SV Slice |
| Undo | SC | UndoButton → Undo → EventPopped |
| Clear All | SC | ClearButton → ClearAll → AllCleared |
| Copy Event Log | SC | EventLog → CopyEvents → EventsCopied |
| Add SC Scenario | SC | SliceCard → AddScenario → ScenarioAdded |
| Set Given | SC | ScenarioEditor → SetGiven → GivenSet |
| Set When | SC | ScenarioEditor → SetWhen → WhenSet |
| Set Then Event | SC | ScenarioEditor → SetThenEvent → ThenEventSet |
| Set Then Rejection | SC | ScenarioEditor → SetThenRejection → ThenRejectionSet |
| Add SV Scenario | SC | SliceCard → AddScenario → ScenarioAdded |
| Set Then ReadModel | SC | ScenarioEditor → SetThenReadModel → ThenReadModelSet |
| Delete Scenario | SC | ScenarioEditor → DeleteScenario → ScenarioDeleted |
| View Feed | SV | Feed ← ElementCreated, SliceNamed, ... |
| View Event Log | SV | EventLogPanel ← all events |
| View Scenarios | SV | SliceCard ← ScenarioAdded, GivenSet, ... |

---

## 📖 Elements

### SC: Create Element
⏹️ Feed { }
🟦 CreateElement { elementId*, elementType, name }
🟧 ElementCreated { elementId, elementType, name, properties: [] }
🟩 Feed *(element card appears)*

✅ "Create event element"
```
Given: []
When: CreateElement { elementId: "e1", elementType: "event", name: "OrderCreated" }
Then: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
```

✅ "Create command element"
```
Given: []
When: CreateElement { elementId: "c1", elementType: "command", name: "CreateOrder" }
Then: ElementCreated { elementId: "c1", elementType: "command", name: "CreateOrder" }
```

### SC: Edit Element (from anywhere)
⏹️ SliceCard { elementId } | ⏹️ ElementCard { elementId }
🟦 OpenElementMenu { elementId }
⏹️ ElementMenuSheet { rename, delete, properties, connect }

**Unified entry point** — tap any element (in slice or loose) to get edit options.

### SC: Rename Element
⏹️ ElementMenuSheet { elementId }
🟦 RenameElement { elementId, name }
🟧 ElementRenamed { elementId, name }
🟩 Feed *(element name updated)*

✅ "Rename element"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
When: RenameElement { elementId: "e1", name: "OrderPlaced" }
Then: ElementRenamed { elementId: "e1", name: "OrderPlaced" }
```

---

## 📖 Properties

### SC: Add Property
⏹️ ElementCard { elementId, expanded }
⏹️ PropertySheet { mode: "add" }
🟦 AddProperty { elementId, propertyId*, name, propertyType }
🟧 PropertyAdded { elementId, propertyId, name, propertyType }
🟩 ElementCard *(property appears in list)*

✅ "Add string property"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
When: AddProperty { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
Then: PropertyAdded { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
```

✅ "Add number property"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
When: AddProperty { elementId: "e1", propertyId: "p2", name: "amount", propertyType: "number" }
Then: PropertyAdded { elementId: "e1", propertyId: "p2", name: "amount", propertyType: "number" }
```

**Property types:** string, number, boolean, date, guid, array, object

### SC: Edit Property
⏹️ PropertyRow { elementId, propertyId }
⏹️ PropertySheet { mode: "edit", property }
🟦 UpdateProperty { elementId, propertyId, name, propertyType }
🟧 PropertyUpdated { elementId, propertyId, name, propertyType }
🟩 ElementCard *(property updated)*

✅ "Update property name and type"
```
Given: 
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  PropertyAdded { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "string" }
When: UpdateProperty { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
Then: PropertyUpdated { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
```

### SC: Delete Property
⏹️ PropertySheet { mode: "edit", property }
⏹️ ConfirmDialog { "Delete this property?" }
🟦 DeleteProperty { elementId, propertyId }
🟧 PropertyRemoved { elementId, propertyId }
🟩 ElementCard *(property removed)*

✅ "Delete property"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  PropertyAdded { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
When: DeleteProperty { elementId: "e1", propertyId: "p1" }
Then: PropertyRemoved { elementId: "e1", propertyId: "p1" }
```

### SV: View Element Properties
🟧 PropertyAdded, PropertyUpdated, PropertyRemoved
🟩 ElementProperties { elementId, properties: Property[] }
⏹️ ElementCard *(properties section)*

✅ "Element shows its properties"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  PropertyAdded { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
  PropertyAdded { elementId: "e1", propertyId: "p2", name: "amount", propertyType: "number" }
Then:
  ElementProperties { 
    elementId: "e1", 
    properties: [
      { id: "p1", name: "orderId", type: "guid" },
      { id: "p2", name: "amount", type: "number" }
    ] 
  }
```

---

### SV: View Feed
🟧 ElementCreated, SliceNamed, SliceElementAdded
🟩 Feed { elements: Element[], slices: Slice[] }
⏹️ Feed

✅ "Feed shows created element"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
Then: Feed { elements: [{ id: "e1", type: "event", name: "OrderCreated" }] }
```

✅ "Feed shows multiple elements"
```
Given: 
  ElementCreated { elementId: "c1", elementType: "command", name: "CreateOrder" }
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
Then: Feed { 
  elements: [
    { id: "c1", type: "command", name: "CreateOrder" },
    { id: "e1", type: "event", name: "OrderCreated" }
  ] 
}
```

✅ "Feed shows named slice"
```
Given:
  ElementCreated { elementId: "c1", elementType: "command", name: "CreateOrder" }
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
Then: Feed {
  slices: [{ id: "s1", name: "Create Order", type: "SC", elements: ["c1", "e1"] }],
  elements: []  // c1 and e1 now in slice, not loose
}
```

---

## 📖 Connections

### SC: Connect Command to Event
⏹️ ElementCard { commandId }
⏹️ ActionSheet { "What does this produce?" }
🟦 Connect { fromId: commandId, toId: eventId, relation: "produces" }
🟧 Connected { fromId, toId, relation }

✅ "Command produces event"
```
Given: 
  ElementCreated { elementId: "c1", elementType: "command", name: "AddTodo" }
When: Connect { fromId: "c1", toId: "e1", relation: "produces" }
      + ElementCreated { elementId: "e1", elementType: "event", name: "TodoAdded" }
Then: Connected { fromId: "c1", toId: "e1", relation: "produces" }
```

### SC: Connect Event to ReadModel
⏹️ ElementCard { eventId }
⏹️ ActionSheet { "What does this update?" }
🟦 Connect { fromId: eventId, toId: readModelId, relation: "consumer" }
🟧 Connected { fromId, toId, relation }

✅ "Event updates read model"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "TodoAdded" }
When: Connect { fromId: "e1", toId: "rm1", relation: "consumer" }
      + ElementCreated { elementId: "rm1", elementType: "readModel", name: "TodoList" }
Then: Connected { fromId: "e1", toId: "rm1", relation: "consumer" }
```

### SC: Connect Screen to Command
⏹️ ElementCard { commandId }
⏹️ ActionSheet { "What screen triggers this?" }
🟦 Connect { fromId: commandId, toId: screenId, relation: "input" }
🟧 Connected { fromId, toId, relation }

✅ "Screen triggers command"
```
Given:
  ElementCreated { elementId: "c1", elementType: "command", name: "AddTodo" }
When: Connect { fromId: "c1", toId: "scr1", relation: "input" }
      + ElementCreated { elementId: "scr1", elementType: "screen", name: "AddTodoForm" }
Then: Connected { fromId: "c1", toId: "scr1", relation: "input" }
```

### SC: Connect ReadModel to Screen
⏹️ ElementCard { readModelId }
⏹️ ActionSheet { "What screen displays this?" }
🟦 Connect { fromId: readModelId, toId: screenId, relation: "display" }
🟧 Connected { fromId, toId, relation }

✅ "Screen displays read model"
```
Given:
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "TodoList" }
When: Connect { fromId: "rm1", toId: "scr1", relation: "display" }
      + ElementCreated { elementId: "scr1", elementType: "screen", name: "Dashboard" }
Then: Connected { fromId: "rm1", toId: "scr1", relation: "display" }
```

---

## 📖 Slice Inference

### AU: Infer State Change Slice
🟧 Connected { relation: "produces" | "producer" }
🟩 Elements
⚙️ PatternDetector
🟦 InferSlice { sliceId*, sliceType: "SC", elements }
🟧 SliceInferred { sliceId, sliceType, elements, complete: true }

✅ "Command produces event → infers SC slice"
```
Given: ElementCreated { elementId: "c1", elementType: "command", name: "Create" }
When: Connect { fromId: "c1", toId: "e1", relation: "produces" }
      + ElementCreated { elementId: "e1", elementType: "event", name: "Created" }
Then: 
  Connected { fromId: "c1", toId: "e1", relation: "produces" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"], complete: true }
```

✅ "Screen connected before slice → included when slice inferred"
```
Given: 
  ElementCreated { elementId: "c1", elementType: "command", name: "Poo" }
  ElementCreated { elementId: "scr1", elementType: "screen", name: "but" }
  Connected { fromId: "c1", toId: "scr1", relation: "input" }
When: 
  Connect { fromId: "c1", toId: "e1", relation: "produces" }
  + ElementCreated { elementId: "e1", elementType: "event", name: "poooooood" }
Then:
  Connected { fromId: "c1", toId: "e1", relation: "produces" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["scr1", "c1", "e1"], complete: true }
```
**Rule:** When inferring slice, include pre-connected screens (input) at start, readModels at end.

✅ "Event asks what produces it → infers SC slice"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "Created" }
When: Connect { fromId: "c1", toId: "e1", relation: "producer" }
      + ElementCreated { elementId: "c1", elementType: "command", name: "Create" }
Then:
  Connected { fromId: "c1", toId: "e1", relation: "producer" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"], complete: true }
```

### AU: Infer State View Slice
🟧 Connected { relation: "consumer" | "updatedBy" }
🟩 Elements
⚙️ PatternDetector
🟦 InferSlice { sliceId*, sliceType: "SV", elements }
🟧 SliceInferred { sliceId, sliceType, elements, complete: true }

✅ "Event updates read model → infers SV slice"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
When: Connect { fromId: "e1", toId: "rm1", relation: "consumer" }
      + ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
Then:
  Connected { fromId: "e1", toId: "rm1", relation: "consumer" }
  SliceInferred { sliceId: "s1", sliceType: "SV", elements: ["e1", "rm1"], complete: true }
```

✅ "Read model asks what updates it → infers SV slice"
```
Given: ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
When: Connect { fromId: "e1", toId: "rm1", relation: "updatedBy" }
      + ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
Then:
  Connected { fromId: "e1", toId: "rm1", relation: "updatedBy" }
  SliceInferred { sliceId: "s1", sliceType: "SV", elements: ["e1", "rm1"], complete: true }
```

✅ "Multiple events update same read model"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
  Connected { fromId: "e1", toId: "rm1", relation: "consumer" }
  SliceInferred { sliceId: "s1", sliceType: "SV", elements: ["e1", "rm1"] }
  SliceNamed { sliceId: "s1", name: "Order List View" }
When: Connect { fromId: "e2", toId: "rm1", relation: "consumer" }
      + ElementCreated { elementId: "e2", elementType: "event", name: "OrderCanceled" }
Then:
  Connected { fromId: "e2", toId: "rm1", relation: "consumer" }
  SliceElementAdded { sliceId: "s1", elementId: "e2", position: "start" }
```
**Result:** SV slice elements = [⏹️ Dashboard, 🟩 OrderList, 🟧 OrderCreated, 🟧 OrderCanceled]

**SV slice order:** Screen at top (what user sees), ReadModel, then events (what updates it)

### SC: Pick Source Events (Multi-Select)
⏹️ ElementCard { elementId, type: "readModel" }
⏹️ ActionSheet { "Pick source events" }
⏹️ MultiPickerSheet { events[], selectedEvents: Set }
🟦 CreateSVSlice { readModelId, eventIds[] }
🟧 ConsumerAdded[] { fromId: eventId, toId: readModelId, relation: "consumer" }
🟧 SliceInferred { sliceId, sliceType: "SV", elements: [...eventIds, readModelId], complete: true }
🟩 Feed { new SV slice appears }
⏹️ SliceNameSheet { }

✅ "Pick multiple existing events for read model"
```
Given: 
  ElementCreated { elementId: "e1", elementType: "event", name: "MistakeLogged" }
  ElementCreated { elementId: "e2", elementType: "event", name: "SuccessLogged" }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "Learnings" }
When: CreateSVSlice { readModelId: "rm1", eventIds: ["e1", "e2"] }
Then:
  ConsumerAdded { fromId: "e1", toId: "rm1", relation: "consumer" }
  ConsumerAdded { fromId: "e2", toId: "rm1", relation: "consumer" }
  SliceInferred { sliceId: "s1", sliceType: "SV", elements: ["e1", "e2", "rm1"], complete: true }
```

✅ "Pick single event for read model"
```
Given: 
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
When: CreateSVSlice { readModelId: "rm1", eventIds: ["e1"] }
Then:
  ConsumerAdded { fromId: "e1", toId: "rm1", relation: "consumer" }
  SliceInferred { sliceId: "s1", sliceType: "SV", elements: ["e1", "rm1"], complete: true }
```

**Multi-picker UI flow:**
1. Tap Read Model → "Pick source events"
2. Multi-select sheet shows all existing events
3. Tap events to toggle selection (✓ checkmark)
4. Button shows count: "Create SV Slice (2 events)"
5. Creates connections + SV slice
6. Prompts for slice name

---

## 📖 Slice Naming

### SC: Rename Slice
⏹️ SliceHeader { sliceId, currentName }
🟦 RenameSlice { sliceId, name }
🟧 SliceNamed { sliceId, name }
🟩 Feed { slice.name updated }
⏹️ SliceCard { shows new name }

✅ "Tap slice header → rename slice"
```
Given: 
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
When: RenameSlice { sliceId: "s1", name: "Place Order" }
Then: SliceNamed { sliceId: "s1", name: "Place Order" }
```

✅ "Name new (unnamed) slice"
```
Given: SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
When: RenameSlice { sliceId: "s1", name: "Create Order" }
Then: SliceNamed { sliceId: "s1", name: "Create Order" }
```

**Slice visualization:**
```
┌─────────────────────────────┐
│ Rename Slice             SC │
├─────────────────────────────┤
│ ⏹️ SliceHeader              │
│ 🟦 RenameSlice              │
│ 🟧 SliceNamed               │
└─────────────────────────────┘
```

---

## 📖 Delete Element

### SC: Delete Element
⏹️ ElementCard { elementId, swipe or long-press }
🟦 DeleteElement { elementId }
🟧 ElementDeleted { elementId }
🟩 Feed { element removed }

✅ "Delete loose element"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
When: DeleteElement { elementId: "e1" }
Then: ElementDeleted { elementId: "e1" }
```

✅ "Delete element in slice → removes from slice"
```
Given:
  SliceInferred { sliceId: "s1", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
When: DeleteElement { elementId: "e1" }
Then: 
  ElementDeleted { elementId: "e1" }
  SliceElementRemoved { sliceId: "s1", elementId: "e1" }
```

---

## 📖 Undo

### SC: Undo Last Event
⏹️ Header { UndoButton }
🟦 Undo { }
🟧 EventPopped { poppedEvent }
🟩 Feed { previous state restored }

✅ "Undo last action"
```
Given: 
  ElementCreated { elementId: "e1", name: "OrderCreated" }
  ElementCreated { elementId: "e2", name: "OrderShipped" }
When: Undo { }
Then: EventPopped { poppedEvent: { type: "ElementCreated", data: { elementId: "e2" } } }
```

---

## 📖 Clear All

### SC: Clear All Events
⏹️ Header { ClearButton }
⏹️ ConfirmDialog { "Clear all?" }
🟦 ClearAll { }
🟧 AllCleared { eventCount }
🟩 Feed { empty }

✅ "Clear all events"
```
Given: 
  ElementCreated { elementId: "e1" }
  ElementCreated { elementId: "c1" }
  SliceInferred { sliceId: "s1" }
When: ClearAll { }
Then: AllCleared { eventCount: 3 }
```

---

## 📖 Copy Event Log

### SC: Copy Events
⏹️ EventLogPanel { tap event or "Copy All" }
🟦 CopyEvents { eventIds? }
🟧 EventsCopied { count }
⏹️ Toast { "Copied!" }

✅ "Copy single event"
```
Given: ElementCreated { id: "evt_1", elementId: "e1" }
When: CopyEvents { eventIds: ["evt_1"] }
Then: EventsCopied { count: 1 }
```

✅ "Copy all events"
```
Given: 
  ElementCreated { id: "evt_1" }
  ElementCreated { id: "evt_2" }
When: CopyEvents { }
Then: EventsCopied { count: 2 }
```

---

## 📖 View Event Log

### SV: Event Log
🟧 ElementCreated, Connected, SliceInferred, SliceNamed, ...
🟩 EventLog { events: Event[], count }
⏹️ EventLogPanel { scrollable list }

✅ "Event log shows all events"
```
Given:
  ElementCreated { elementId: "e1" }
  ElementCreated { elementId: "c1" }
  Connected { fromId: "c1", toId: "e1" }
Then:
  EventLog { events: [...], count: 3 }
```

---

## 📖 Add Element to Existing Slice

### SC: Add Screen to Slice (input)
⏹️ ElementCard { commandId in slice }
⏹️ ActionSheet { "What screen triggers this?" }
🟦 AddElementToSlice { sliceId, elementId, position: "start" }
🟧 SliceElementAdded { sliceId, elementId, position: "start" }
🟩 SliceCard *(screen at start)*

✅ "Add input screen to SC slice"
```
Given:
  ElementCreated { elementId: "c1", elementType: "command" }
  ElementCreated { elementId: "e1", elementType: "event" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
When: 
  Connect { fromId: "c1", toId: "scr1", relation: "input" }
  + ElementCreated { elementId: "scr1", elementType: "screen", name: "OrderForm" }
Then:
  Connected { fromId: "c1", toId: "scr1", relation: "input" }
  SliceElementAdded { sliceId: "s1", elementId: "scr1", position: "start" }
```

**Result:** Slice elements = [⏹️ OrderForm, 🟦 Create, 🟧 Created]

### SC: Add ReadModel to Slice (output)
⏹️ ElementCard { eventId in slice }
⏹️ ActionSheet { "What does this update?" }
🟦 AddElementToSlice { sliceId, elementId, position: "end" }
🟧 SliceElementAdded { sliceId, elementId, position: "end" }
🟩 SliceCard *(readModel at end)*

✅ "Add output read model to SC slice"
```
Given:
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
When:
  Connect { fromId: "e1", toId: "rm1", relation: "consumer" }
  + ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
Then:
  Connected { fromId: "e1", toId: "rm1", relation: "consumer" }
  SliceElementAdded { sliceId: "s1", elementId: "rm1", position: "end" }
```

**Result:** Slice elements = [🟦 Create, 🟧 Created, 🟩 OrderList]

### SC: Add Display Screen to Slice
✅ "Add display screen after read model"
```
Given:
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1", "rm1"] }
When:
  Connect { fromId: "rm1", toId: "scr2", relation: "display" }
  + ElementCreated { elementId: "scr2", elementType: "screen", name: "Confirmation" }
Then:
  Connected { fromId: "rm1", toId: "scr2", relation: "display" }
  SliceElementAdded { sliceId: "s1", elementId: "scr2", position: "end" }
```

**Result:** Slice elements = [🟦 Create, 🟧 Created, 🟩 OrderList, ⏹️ Confirmation]

---

## 📖 Full SC Slice Pattern

**Complete State Change slice:**
```
⏹️ Screen (input)     ← optional
    ↓
🟦 Command            ← required
    ↓
🟧 Event(s)           ← required (1+)
    ↓
🟩 ReadModel          ← optional
    ↓
⏹️ Screen (display)   ← optional
```

---

## 📖 Scenarios

Two scenario types matching slice types:
- **SC Scenarios:** Given (events) → When (command) → Then (event | rejection)
- **SV Scenarios:** Given (events) → Then (read model state)

---

## 📖 SC Scenarios (Given/When/Then)

### SC: Add Scenario
⏹️ SliceCard { sliceId, "+ Add scenario" button }
🟦 AddScenario { sliceId, scenarioId*, name, scenarioType }
🟧 ScenarioAdded { sliceId, scenarioId, name, scenarioType }

✅ "Add scenario to SC slice"
```
Given: SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
When: AddScenario { sliceId: "s1", scenarioId: "scn1", name: "Create order", scenarioType: "SC" }
Then: ScenarioAdded { sliceId: "s1", scenarioId: "scn1", name: "Create order", scenarioType: "SC" }
```

### SC: Set Given Events
⏹️ ScenarioEditor { scenarioId, GIVEN section }
🟦 SetGiven { scenarioId, events: [{elementId, values}] }
🟧 GivenSet { scenarioId, events }

✅ "Set given events with property values"
```
Given: ScenarioAdded { sliceId: "s1", scenarioId: "scn1", scenarioType: "SC" }
When: SetGiven { scenarioId: "scn1", events: [
  { elementId: "e1", values: { orderId: "123", amount: 100 } }
]}
Then: GivenSet { scenarioId: "scn1", events: [...] }
```

### SC: Set When Command
⏹️ ScenarioEditor { scenarioId, WHEN section }
🟦 SetWhen { scenarioId, commandId, values }
🟧 WhenSet { scenarioId, commandId, values }

✅ "Set when command with values"
```
Given: ScenarioAdded { scenarioId: "scn1", scenarioType: "SC" }
When: SetWhen { scenarioId: "scn1", commandId: "c1", values: { orderId: "123" } }
Then: WhenSet { scenarioId: "scn1", commandId: "c1", values: { orderId: "123" } }
```

### SC: Set Then Event (success)
⏹️ ScenarioEditor { scenarioId, THEN section }
🟦 SetThenEvent { scenarioId, eventId, values }
🟧 ThenEventSet { scenarioId, eventId, values }

✅ "Expect event outcome"
```
Given: ScenarioAdded { scenarioId: "scn1", scenarioType: "SC" }
When: SetThenEvent { scenarioId: "scn1", eventId: "e1", values: { orderId: "123" } }
Then: ThenEventSet { scenarioId: "scn1", eventId: "e1", values: { orderId: "123" } }
```

### SC: Set Then Rejection (failure)
⏹️ ScenarioEditor { scenarioId, THEN section }
🟦 SetThenRejection { scenarioId, reason }
🟧 ThenRejectionSet { scenarioId, reason }

✅ "Expect rejection outcome"
```
Given: ScenarioAdded { scenarioId: "scn1", scenarioType: "SC" }
When: SetThenRejection { scenarioId: "scn1", reason: "Insufficient funds" }
Then: ThenRejectionSet { scenarioId: "scn1", reason: "Insufficient funds" }
```

### SC: Delete Scenario
⏹️ ScenarioCard { scenarioId, delete button }
🟦 DeleteScenario { scenarioId }
🟧 ScenarioDeleted { sliceId, scenarioId }

### SV: View Slice Scenarios
🟧 ScenarioAdded, GivenSet, WhenSet, ThenEventSet, ThenRejectionSet, ScenarioDeleted
🟩 SliceScenarios { sliceId, scenarios: Scenario[] }
⏹️ SliceCard *(scenario count badge + list)*

✅ "Slice shows its scenarios"
```
Given:
  ScenarioAdded { sliceId: "s1", scenarioId: "scn1", name: "Create order", scenarioType: "SC" }
  GivenSet { scenarioId: "scn1", events: [] }
  WhenSet { scenarioId: "scn1", commandId: "c1", values: { orderId: "123" } }
  ThenEventSet { scenarioId: "scn1", eventId: "e1", values: { orderId: "123" } }
Then:
  SliceScenarios { 
    sliceId: "s1", 
    scenarios: [{
      id: "scn1",
      name: "Create order",
      type: "SC",
      given: [],
      when: { commandId: "c1", values: { orderId: "123" } },
      then: { type: "event", eventId: "e1", values: { orderId: "123" } }
    }]
  }
```

**SC Scenario display:**
```
✅ "Create order successfully"
Given: 🟧 CustomerRegistered { customerId: "c1" }
When:  🟦 CreateOrder { customerId: "c1", amount: 100 }
Then:  🟧 OrderCreated { orderId: "o1", amount: 100 }

❌ "Reject order for unknown customer"
Given: []
When:  🟦 CreateOrder { customerId: "unknown", amount: 100 }
Then:  Rejected: "Customer not found"
```

---

## 📖 SV Scenarios (Given/Then)

SV scenarios have no "When" — they test read model projections.

### SC: Add SV Scenario
⏹️ SliceCard { sliceId, sliceType: "SV", "+ Add scenario" button }
🟦 AddScenario { sliceId, scenarioId*, name, scenarioType: "SV" }
🟧 ScenarioAdded { sliceId, scenarioId, name, scenarioType: "SV" }

### SC: Set Given Events
⏹️ ScenarioEditor { scenarioId, GIVEN section }
🟦 SetGiven { scenarioId, events: [{elementId, values}] }
🟧 GivenSet { scenarioId, events }

### SC: Set Then ReadModel
⏹️ ScenarioEditor { scenarioId, THEN section }
🟦 SetThenReadModel { scenarioId, readModelId, values }
🟧 ThenReadModelSet { scenarioId, readModelId, values }

✅ "Read model shows projected state"
```
Given: ScenarioAdded { scenarioId: "scn1", scenarioType: "SV" }
When: SetThenReadModel { scenarioId: "scn1", readModelId: "rm1", values: { count: 2, items: ["a", "b"] } }
Then: ThenReadModelSet { scenarioId: "scn1", readModelId: "rm1", values: { count: 2, items: ["a", "b"] } }
```

### SV: View SV Slice Scenarios
🟧 ScenarioAdded, GivenSet, ThenReadModelSet, ScenarioDeleted
🟩 SliceScenarios { sliceId, scenarios: Scenario[] }
⏹️ SliceCard *(scenario count badge + list)*

✅ "SV slice shows its scenarios"
```
Given:
  ScenarioAdded { sliceId: "sv1", scenarioId: "scn1", name: "Order list shows orders", scenarioType: "SV" }
  GivenSet { scenarioId: "scn1", events: [
    { elementId: "e1", values: { orderId: "o1", amount: 100 } },
    { elementId: "e1", values: { orderId: "o2", amount: 200 } }
  ]}
  ThenReadModelSet { scenarioId: "scn1", readModelId: "rm1", values: { count: 2, totalAmount: 300 } }
Then:
  SliceScenarios { 
    sliceId: "sv1", 
    scenarios: [{
      id: "scn1",
      name: "Order list shows orders",
      type: "SV",
      given: [{ elementId: "e1", values: {...} }, { elementId: "e1", values: {...} }],
      then: { type: "readModel", readModelId: "rm1", values: { count: 2, totalAmount: 300 } }
    }]
  }
```

**SV Scenario display:**
```
✅ "Order list shows orders"
Given: 
  🟧 OrderCreated { orderId: "o1", amount: 100 }
  🟧 OrderCreated { orderId: "o2", amount: 200 }
Then:  
  🟩 OrderList { count: 2, totalAmount: 300 }

✅ "Empty order list"
Given: []
Then:  🟩 OrderList { count: 0, totalAmount: 0 }
```

---

### SV: View Scenarios
🟧 ScenarioAdded, GivenSet, WhenSet, ThenEventSet, ThenRejectionSet, ThenReadModelSet
🟩 SliceScenarios { sliceId, scenarios: Scenario[] }
⏹️ SliceCard *(scenario count + preview)*

---

---

## 📖 Automation Slice

**AU Pattern:** Automation reacts to domain events with context from read models.
AU slice is only created when **complete** (has trigger + command).
Event not shown in display - implied by linked ReadModel's SV.

```
⚙️ Processor (top)
       ↓
🟩 ReadModels ↗   🟦 Command ↗   (same row, linked to source slices)
```

### SC: Create Processor
⏹️ FAB (+)
⏹️ ElementTypeSheet { select "Processor" }
⏹️ NameSheet { enter name }
🟦 CreateElement { elementId*, elementType: "processor", name }
🟧 ElementCreated { elementId, elementType: "processor", name }

✅ "Create processor element"
```
Given: []
When: CreateElement { elementId: "p1", elementType: "processor", name: "NotifyWarehouse" }
Then: ElementCreated { elementId: "p1", elementType: "processor", name: "NotifyWarehouse" }
```

### SC: Set Trigger (from SV slice)
⏹️ ProcessorCard { processorId, no trigger yet }
⏹️ ActionSheet { "What triggers this?" }
⏹️ SVEventPicker { events grouped by their SV slice }
🟦 SetTrigger { processorId, eventId }
🟧 TriggerSet { fromId: eventId, toId: processorId, relation: "trigger" }

✅ "Pick trigger event from SV → stores trigger (no slice yet)"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
  SliceInferred { sliceId: "sv1", sliceType: "SV", elements: ["rm1", "e1"] }
  SliceNamed { sliceId: "sv1", name: "Order List View" }
  ElementCreated { elementId: "p1", elementType: "processor", name: "NotifyWarehouse" }
When: SetTrigger { processorId: "p1", eventId: "e1" }
Then:
  TriggerSet { fromId: "e1", toId: "p1", relation: "trigger" }
```
**Note:** NO slice created yet. Processor shows "triggered by: 🟧 event" as loose element.

### SC: Add Additional Context (optional, repeatable)
⏹️ ProcessorCard { processorId, has trigger }
⏹️ ActionSheet { "What additional context?" }
⏹️ ReadModelPicker { all readModels }
🟦 AddContext { processorId, readModelId }
🟧 ProducerSet { fromId: processorId, toId: readModelId, relation: "context" }

✅ "Add additional context read model"
```
Given:
  ElementCreated { elementId: "p1", elementType: "processor" }
  TriggerSet { fromId: "e1", toId: "p1", relation: "trigger" }
  ElementCreated { elementId: "rm2", elementType: "readModel", name: "CustomerProfile" }
When: AddContext { processorId: "p1", readModelId: "rm2" }
Then:
  ProducerSet { fromId: "p1", toId: "rm2", relation: "context" }
```
**Note:** Can add multiple. All context ReadModels included when AU slice is created.

### SC: Set Command → Create Complete AU Slice
⏹️ ProcessorCard { processorId, has trigger }
⏹️ ActionSheet { "What command does this invoke?" }
⏹️ CommandPicker { existing commands only }
🟦 SetCommand { processorId, commandId }
🟧 ProducerSet { fromId: processorId, toId: commandId, relation: "invokes" }
🟧 SliceInferred { sliceId*, sliceType: "AU", elements: [...], complete: true }

✅ "Set command → creates complete AU slice with all elements"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
  SliceInferred { sliceId: "sv1", sliceType: "SV", elements: ["rm1", "e1"] }
  ElementCreated { elementId: "rm2", elementType: "readModel", name: "CustomerProfile" }
  ElementCreated { elementId: "p1", elementType: "processor", name: "NotifyWarehouse" }
  TriggerSet { fromId: "e1", toId: "p1", relation: "trigger" }
  ProducerSet { fromId: "p1", toId: "rm2", relation: "context" }
  ElementCreated { elementId: "c1", elementType: "command", name: "SendEmail" }
When: SetCommand { processorId: "p1", commandId: "c1" }
Then:
  ProducerSet { fromId: "p1", toId: "c1", relation: "invokes" }
  SliceInferred { 
    sliceId: "au1", 
    sliceType: "AU", 
    elements: ["e1", "rm1", "rm2", "p1", "c1"],  // trigger, primary RM, additional RM, processor, command
    complete: true 
  }
```
**Note:** AU slice created only when complete. Elements: trigger event + primary ReadModel (from same SV) + additional context ReadModels + processor + command.

### AU Slice Display
```
┌──────────────────────────────────────────────┐
│ NotifyWarehouse                           AU │
├──────────────────────────────────────────────┤
│              ⚙️ NotifyWarehouse              │
│                     ↓                        │
│  🟩 OrderList ↗  🟩 Profile ↗  🟦 SendEmail ↗ │
└──────────────────────────────────────────────┘
```
**Event not shown** - implied by linked ReadModel's SV slice.
**ReadModels** (left) and **Command** (right) are **references** - tap ↗ to jump to their source SC/SV slice.
More space for multiple context ReadModels.

---

## 📖 Slice Element Order

### SV: Slice Element Order
🟧 SliceInferred, SliceElementAdded
🟩 SliceElementOrder { sliceId, sliceType, orderedElements: ElementId[] }

**Ordering hierarchy (top to bottom):**
```
⏹️ Screen / ⚙️ Processor   ← top (UI/automation layer)
🟦 Command / 🟩 ReadModel   ← middle (what happens / what's shown)
🟧 Events                   ← bottom (facts, lowest level)
```

**Order by slice type:**

| SliceType | Order (top → bottom) |
|-----------|---------------------|
| SC | ⏹️ input, 🟦 command, 🟩 readModel?, 🟧 events..., ⏹️ display? |
| SV | ⏹️ display?, 🟩 readModel, 🟧 events... |
| AU | ⚙️ processor, 🟦 command, 🟩 context..., 🟧 trigger, 🟧 outputs... |

✅ "SC elements ordered: screen, command, readModel, events"
```
Given:
  ElementCreated { elementId: "scr1", elementType: "screen" }
  ElementCreated { elementId: "c1", elementType: "command" }
  ElementCreated { elementId: "e1", elementType: "event" }
  ElementCreated { elementId: "rm1", elementType: "readModel" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["scr1", "c1", "e1", "rm1"] }
Then:
  SliceElementOrder { sliceId: "s1", orderedElements: ["scr1", "c1", "rm1", "e1"] }
```

✅ "SV elements ordered: screen, readModel, events"
```
Given:
  ElementCreated { elementId: "scr1", elementType: "screen" }
  ElementCreated { elementId: "rm1", elementType: "readModel" }
  ElementCreated { elementId: "e1", elementType: "event" }
  ElementCreated { elementId: "e2", elementType: "event" }
  SliceInferred { sliceId: "s1", sliceType: "SV", elements: ["scr1", "rm1", "e1", "e2"] }
Then:
  SliceElementOrder { sliceId: "s1", orderedElements: ["scr1", "rm1", "e1", "e2"] }
```

✅ "AU elements ordered: processor, command, context, events"
```
Given:
  ElementCreated { elementId: "p1", elementType: "processor" }
  ElementCreated { elementId: "c1", elementType: "command" }
  ElementCreated { elementId: "rm1", elementType: "readModel" }
  ElementCreated { elementId: "e1", elementType: "event" }
  ElementCreated { elementId: "e2", elementType: "event" }
  SliceInferred { sliceId: "s1", sliceType: "AU", elements: ["p1", "c1", "rm1", "e1", "e2"] }
Then:
  SliceElementOrder { sliceId: "s1", orderedElements: ["p1", "c1", "rm1", "e1", "e2"] }
```

---

## Event Types Summary

| Event | Data |
|-------|------|
| ElementCreated | elementId, elementType, name |
| ElementDeleted | elementId |
| ElementRenamed | elementId, name |
| PropertyAdded | elementId, propertyId, name, propertyType |
| PropertyUpdated | elementId, propertyId, name, propertyType |
| PropertyRemoved | elementId, propertyId |
| Connected | fromId, toId, relation |
| Disconnected | fromId, toId |
| SliceInferred | sliceId, sliceType, elements, complete |
| SliceNamed | sliceId, name |
| SliceElementAdded | sliceId, elementId, position |
| SliceElementRemoved | sliceId, elementId |
| ScenarioAdded | sliceId, scenarioId, name, scenarioType |
| GivenSet | scenarioId, events: [{elementId, values}] |
| WhenSet | scenarioId, commandId, values |
| ThenEventSet | scenarioId, eventId, values |
| ThenRejectionSet | scenarioId, reason |
| ThenReadModelSet | scenarioId, readModelId, values |
| ScenarioDeleted | sliceId, scenarioId |

---

## Notation

| Icon | Element |
|------|---------|
| ⏹️ | Screen |
| 🟦 | Command |
| 🟧 | Event |
| 🟩 | Read Model |
| ⚙️ | Processor |
| ✅ | Success scenario |
| ❌ | Rejection scenario |

---

## 📋 Example: Todo List with Automation

### Elements Created
```
Given:
  ElementCreated { elementId: "c1", elementType: "command", name: "AddTodo" }
  ElementCreated { elementId: "e1", elementType: "event", name: "TodoAdded" }
  ElementCreated { elementId: "c2", elementType: "command", name: "CompleteTodo" }
  ElementCreated { elementId: "e2", elementType: "event", name: "TodoCompleted" }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "TodoList" }
  ElementCreated { elementId: "scr1", elementType: "screen", name: "AddTodoForm" }
  ElementCreated { elementId: "scr2", elementType: "screen", name: "TodoDashboard" }
  ElementCreated { elementId: "p1", elementType: "processor", name: "SendReminder" }
  ElementCreated { elementId: "c3", elementType: "command", name: "SendEmail" }
```

### SC Slice 1: Add Todo
```
Given:
  Connected { fromId: "scr1", toId: "c1", relation: "triggers" }
  Connected { fromId: "c1", toId: "e1", relation: "produces" }
Then:
  SliceInferred { sliceId: "sc1", sliceType: "SC", elements: ["scr1", "c1", "e1"] }
  SliceNamed { sliceId: "sc1", name: "Add Todo" }

Result:
┌─────────────────────────┐
│ Add Todo             SC │
├─────────────────────────┤
│ ⏹️ AddTodoForm          │
│ 🟦 AddTodo              │
│ 🟧 TodoAdded            │
└─────────────────────────┘
```

### SC Slice 2: Complete Todo
```
Given:
  Connected { fromId: "c2", toId: "e2", relation: "produces" }
Then:
  SliceInferred { sliceId: "sc2", sliceType: "SC", elements: ["c2", "e2"] }
  SliceNamed { sliceId: "sc2", name: "Complete Todo" }

Result:
┌─────────────────────────┐
│ Complete Todo        SC │
├─────────────────────────┤
│ 🟦 CompleteTodo         │
│ 🟧 TodoCompleted        │
└─────────────────────────┘
```

### SV Slice: Todo List View
```
Given:
  Connected { fromId: "e1", toId: "rm1", relation: "consumer" }
  Connected { fromId: "e2", toId: "rm1", relation: "consumer" }
  Connected { fromId: "rm1", toId: "scr2", relation: "display" }
Then:
  SliceInferred { sliceId: "sv1", sliceType: "SV", elements: ["scr2", "rm1", "e1", "e2"] }
  SliceNamed { sliceId: "sv1", name: "Todo List View" }

Result:
┌─────────────────────────┐
│ Todo List View       SV │
├─────────────────────────┤
│ ⏹️ TodoDashboard        │
│ 🟩 TodoList             │
│ 🟧 TodoAdded            │
│ 🟧 TodoCompleted        │
└─────────────────────────┘
```

### AU Slice: Reminder Automation
```
Given:
  # Processor picks trigger from SV slice
  TriggerSet { processorId: "p1", eventId: "e1" }  # from "Todo List View" SV
Then:
  SliceInferred { sliceId: "au1", sliceType: "AU", elements: ["p1", "rm1", "e1"], complete: false }
  # rm1 (TodoList) auto-included from same SV

Given:
  # Processor picks command
  AutomationCommandSet { sliceId: "au1", commandId: "c3" }
Then:
  SliceElementAdded { sliceId: "au1", elementId: "c3" }
  SliceCompleted { sliceId: "au1" }
  SliceNamed { sliceId: "au1", name: "Reminder Automation" }

Result:
┌─────────────────────────┐
│ Reminder Automation  AU │
├─────────────────────────┤
│ ⚙️ SendReminder         │
│ 🟦 SendEmail            │
│ 🟩 TodoList             │
│ 🟧 TodoAdded            │
└─────────────────────────┘
```

### Complete Model Summary
```
SC: Add Todo          [⏹️ AddTodoForm → 🟦 AddTodo → 🟧 TodoAdded]
SC: Complete Todo     [🟦 CompleteTodo → 🟧 TodoCompleted]
SV: Todo List View    [⏹️ TodoDashboard ← 🟩 TodoList ← 🟧 TodoAdded, 🟧 TodoCompleted]
AU: Reminder          [⚙️ SendReminder → 🟦 SendEmail | context: 🟩 TodoList | trigger: 🟧 TodoAdded]
```
