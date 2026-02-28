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
⏹️ Feed { FAB button }
🟦 CreateElement { elementId*, elementType, name }
🟧 ElementCreated { elementId, elementType, name, properties: [] }

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
⏹️ ElementMenuSheet { elementId, "Rename" option }
🟦 RenameElement { elementId, name }
🟧 ElementRenamed { elementId, name }

✅ "Rename element"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
When: RenameElement { elementId: "e1", name: "OrderPlaced" }
Then: ElementRenamed { elementId: "e1", name: "OrderPlaced" }
```

---

## 📖 Properties

### SC: Add Property
⏹️ ElementCard { elementId, "+ Add property" button }
⏹️ PropertySheet { mode: "add" }
🟦 AddProperty { elementId, propertyId*, name, propertyType }
🟧 PropertyAdded { elementId, propertyId, name, propertyType }

✅ "Add guid property"
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
⏹️ PropertyRow { elementId, propertyId, tap }
⏹️ PropertySheet { mode: "edit", property }
🟦 UpdateProperty { elementId, propertyId, name, propertyType }
🟧 PropertyUpdated { elementId, propertyId, name, propertyType }

✅ "Update property name and type"
```
Given: 
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  PropertyAdded { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "string" }
When: UpdateProperty { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
Then: PropertyUpdated { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
```

### SC: Delete Property
⏹️ PropertySheet { mode: "edit", "Delete" button }
🟦 DeleteProperty { elementId, propertyId }
🟧 PropertyRemoved { elementId, propertyId }

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

✅ "Property update reflected in view"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  PropertyAdded { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "string" }
  PropertyUpdated { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
Then:
  ElementProperties { 
    elementId: "e1", 
    properties: [{ id: "p1", name: "orderId", type: "guid" }]
  }
```

✅ "Property deletion reflected in view"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  PropertyAdded { elementId: "e1", propertyId: "p1", name: "orderId", propertyType: "guid" }
  PropertyAdded { elementId: "e1", propertyId: "p2", name: "amount", propertyType: "number" }
  PropertyRemoved { elementId: "e1", propertyId: "p1" }
Then:
  ElementProperties { 
    elementId: "e1", 
    properties: [{ id: "p2", name: "amount", type: "number" }]
  }
```

---

### SV: View Feed
🟧 ElementCreated, ElementDeleted, ElementRenamed, SliceInferred, SliceNamed, SliceElementAdded, AllCleared
🟩 Feed { elements: Element[], slices: Slice[] }
⏹️ Feed

✅ "Feed shows created element"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
Then: Feed { elements: [{ id: "e1", type: "event", name: "OrderCreated" }], slices: [] }
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
  ],
  slices: []
}
```

✅ "Feed reflects element rename"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  ElementRenamed { elementId: "e1", name: "OrderPlaced" }
Then: Feed { elements: [{ id: "e1", type: "event", name: "OrderPlaced" }], slices: [] }
```

✅ "Feed reflects element deletion"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  ElementCreated { elementId: "e2", elementType: "event", name: "OrderShipped" }
  ElementDeleted { elementId: "e1" }
Then: Feed { elements: [{ id: "e2", type: "event", name: "OrderShipped" }], slices: [] }
```

✅ "Feed shows named slice (elements move from loose to slice)"
```
Given:
  ElementCreated { elementId: "c1", elementType: "command", name: "CreateOrder" }
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
Then: Feed {
  slices: [{ id: "s1", name: "Create Order", type: "SC", elements: ["c1", "e1"] }],
  elements: []
}
```

✅ "Feed reflects slice rename"
```
Given:
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
  SliceNamed { sliceId: "s1", name: "Place Order" }
Then: Feed { slices: [{ id: "s1", name: "Place Order", type: "SC", elements: ["c1", "e1"] }] }
```

✅ "Feed reflects element added to slice"
```
Given:
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceElementAdded { sliceId: "s1", elementId: "scr1", position: "start" }
Then: Feed { slices: [{ id: "s1", elements: ["scr1", "c1", "e1"] }] }
```

✅ "Feed is empty after clear all"
```
Given:
  ElementCreated { elementId: "e1" }
  ElementCreated { elementId: "c1" }
  SliceInferred { sliceId: "s1" }
  AllCleared { eventCount: 3 }
Then: Feed { elements: [], slices: [] }
```

---

### SV: View Slice (with element details)
🟧 SliceInferred, SliceNamed, SliceElementAdded, ElementCreated, PropertyAdded, PropertyUpdated, PropertyRemoved
🟩 SliceDetail { sliceId, name, type, elements: ElementWithProperties[] }
⏹️ SliceCard

✅ "Slice shows elements with their properties"
```
Given:
  ElementCreated { elementId: "c1", elementType: "command", name: "CreateOrder" }
  PropertyAdded { elementId: "c1", propertyId: "p1", name: "orderId", propertyType: "guid" }
  PropertyAdded { elementId: "c1", propertyId: "p2", name: "amount", propertyType: "number" }
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  PropertyAdded { elementId: "e1", propertyId: "p3", name: "orderId", propertyType: "guid" }
  PropertyAdded { elementId: "e1", propertyId: "p4", name: "amount", propertyType: "number" }
  PropertyAdded { elementId: "e1", propertyId: "p5", name: "createdAt", propertyType: "date" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
  SliceNamed { sliceId: "s1", name: "Create Order" }
Then:
  SliceDetail {
    sliceId: "s1",
    name: "Create Order",
    type: "SC",
    elements: [
      { id: "c1", type: "command", name: "CreateOrder", properties: [
        { id: "p1", name: "orderId", type: "guid" },
        { id: "p2", name: "amount", type: "number" }
      ]},
      { id: "e1", type: "event", name: "OrderCreated", properties: [
        { id: "p3", name: "orderId", type: "guid" },
        { id: "p4", name: "amount", type: "number" },
        { id: "p5", name: "createdAt", type: "date" }
      ]}
    ]
  }
```

✅ "Slice reflects property updates"
```
Given:
  ElementCreated { elementId: "c1", elementType: "command", name: "CreateOrder" }
  PropertyAdded { elementId: "c1", propertyId: "p1", name: "orderId", propertyType: "string" }
  SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1"] }
  PropertyUpdated { elementId: "c1", propertyId: "p1", name: "orderId", propertyType: "guid" }
Then:
  SliceDetail {
    sliceId: "s1",
    elements: [{ id: "c1", properties: [{ name: "orderId", type: "guid" }] }]
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
⏹️ SliceHeader { sliceId, tap to rename }
🟦 RenameSlice { sliceId, name }
🟧 SliceNamed { sliceId, name }

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
⏹️ ElementMenuSheet { elementId, "Delete" option }
🟦 DeleteElement { elementId }
🟧 ElementDeleted { elementId }

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
🟦 ClearAll { }
🟧 AllCleared { eventCount }

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

### Data Flow in Scenarios

Scenarios can include **optional example values** to show data lineage — where each property value comes from:

```
✅ "Complete order for existing customer"
Given: 
  🟧 CustomerRegistered { customerId: "cust-1", name: "Alice" }
  🟧 OrderCreated { orderId: "ord-1", customerId: "cust-1", amount: 150 }
When:  
  🟦 CompleteOrder { orderId: "ord-1" }     ← orderId from OrderCreated
Then:  
  🟧 OrderCompleted { 
    orderId: "ord-1",           ← from When.orderId
    customerId: "cust-1",       ← from Given.OrderCreated.customerId
    completedAt: "2026-02-28"   ← generated (new)
  }
```

**Property sources:**
- `←` indicates where a value flows from (Given event, When command, or generated)
- Properties without source annotation are new/generated values
- This helps validate that all required data is available in the Given

---

## 📖 SC Scenarios (Given/When/Then)

### SC: Add Scenario
⏹️ SliceCard { sliceId, "+ Add scenario" button }
🟦 AddScenario { sliceId, scenarioId*, name, scenarioType }
🟧 ScenarioAdded { sliceId, scenarioId, name, scenarioType }

✅ "Add scenario to SC slice"
```
Given: SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
When: AddScenario { sliceId: "s1", scenarioId: "scn1", name: "Create order successfully", scenarioType: "SC" }
Then: ScenarioAdded { sliceId: "s1", scenarioId: "scn1", name: "Create order successfully", scenarioType: "SC" }
```

### SC: Set Given Events
⏹️ ScenarioEditor { scenarioId, GIVEN section }
🟦 SetGiven { scenarioId, events: [{elementId, values}] }
🟧 GivenSet { scenarioId, events }

✅ "Set given events with example values"
```
Given: ScenarioAdded { sliceId: "s1", scenarioId: "scn1", scenarioType: "SC" }
When: SetGiven { scenarioId: "scn1", events: [
  { elementId: "e1", values: { customerId: "cust-1", name: "Alice" } }
]}
Then: GivenSet { scenarioId: "scn1", events: [...] }
```

### SC: Set When Command
⏹️ ScenarioEditor { scenarioId, WHEN section }
🟦 SetWhen { scenarioId, commandId, values }
🟧 WhenSet { scenarioId, commandId, values }

✅ "Set when command with example values"
```
Given: ScenarioAdded { scenarioId: "scn1", scenarioType: "SC" }
When: SetWhen { scenarioId: "scn1", commandId: "c1", values: { 
  customerId: "cust-1",    ← reference to Given.CustomerRegistered.customerId
  amount: 150              ← new input value
} }
Then: WhenSet { scenarioId: "scn1", commandId: "c1", values: {...} }
```

### SC: Set Then Event (success)
⏹️ ScenarioEditor { scenarioId, THEN section }
🟦 SetThenEvent { scenarioId, eventId, values }
🟧 ThenEventSet { scenarioId, eventId, values }

✅ "Expect event outcome with data lineage"
```
Given: ScenarioAdded { scenarioId: "scn1", scenarioType: "SC" }
When: SetThenEvent { scenarioId: "scn1", eventId: "e1", values: { 
  orderId: "*",              ← generated (new guid)
  customerId: "cust-1",      ← from When.CreateOrder.customerId
  amount: 150,               ← from When.CreateOrder.amount
  createdAt: "*"             ← generated (timestamp)
} }
Then: ThenEventSet { scenarioId: "scn1", eventId: "e1", values: {...} }
```

**Note:** `"*"` indicates a generated/wildcard value that will be produced by the system.

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

**SC Scenario display (with data lineage):**
```
✅ "Create order for existing customer"
Given: 
  🟧 CustomerRegistered { customerId: "cust-1", name: "Alice", tier: "gold" }
When:  
  🟦 CreateOrder { 
    customerId: "cust-1",     ← Given.CustomerRegistered.customerId
    amount: 250 
  }
Then:  
  🟧 OrderCreated { 
    orderId: "*",             ← generated
    customerId: "cust-1",     ← When.CreateOrder.customerId
    amount: 250,              ← When.CreateOrder.amount
    discount: 25,             ← calculated (gold tier = 10%)
    createdAt: "*"            ← generated
  }

❌ "Reject order for unknown customer"
Given: []
When:  🟦 CreateOrder { customerId: "unknown-1", amount: 100 }
Then:  Rejected: "Customer not found"

❌ "Reject order exceeding credit limit"
Given: 
  🟧 CustomerRegistered { customerId: "cust-2", creditLimit: 500 }
  🟧 OrderCreated { customerId: "cust-2", amount: 400 }
When:  
  🟦 CreateOrder { customerId: "cust-2", amount: 200 }
Then:  
  Rejected: "Credit limit exceeded (current: 400, requested: 200, limit: 500)"
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

**SV Scenario display (with data lineage):**
```
✅ "Order list aggregates multiple orders"
Given: 
  🟧 OrderCreated { orderId: "ord-1", customerId: "cust-1", amount: 100 }
  🟧 OrderCreated { orderId: "ord-2", customerId: "cust-1", amount: 200 }
  🟧 OrderCreated { orderId: "ord-3", customerId: "cust-2", amount: 150 }
Then:  
  🟩 OrderList { 
    count: 3,                           ← count of Given events
    totalAmount: 450,                   ← sum of Given.*.amount
    orders: [
      { orderId: "ord-1", amount: 100 },  ← from Given[0]
      { orderId: "ord-2", amount: 200 },  ← from Given[1]
      { orderId: "ord-3", amount: 150 }   ← from Given[2]
    ]
  }

✅ "Order list filters by customer"
Given: 
  🟧 OrderCreated { orderId: "ord-1", customerId: "cust-1", amount: 100 }
  🟧 OrderCreated { orderId: "ord-2", customerId: "cust-2", amount: 200 }
Then:  
  🟩 CustomerOrders { 
    customerId: "cust-1",               ← filter parameter
    count: 1,                           ← filtered count
    orders: [{ orderId: "ord-1" }]      ← only cust-1's orders
  }

✅ "Empty order list"
Given: []
Then:  🟩 OrderList { count: 0, totalAmount: 0, orders: [] }
```

---

### SV: View Scenario
🟧 ScenarioAdded, GivenSet, WhenSet, ThenEventSet, ThenRejectionSet, ThenReadModelSet
🟩 ScenarioCard { scenarioId, name, type, given[], when?, then }
⏹️ ScenarioCard *(in slice scenario section)*

**ScenarioCard Read Model:**
```typescript
ScenarioCard {
  scenarioId: string
  name: string
  type: "SC" | "SV"
  given: Array<{
    elementId: string
    elementName: string
    propertyValues: Array<{ name: string, value: any }>
  }>
  when?: {
    commandId: string
    commandName: string
    propertyValues: Array<{ name: string, value: any }>
  }
  then: 
    | { type: "event", eventId: string, eventName: string, propertyValues: Array<{ name, value }> }
    | { type: "rejection", reason: string }
    | { type: "readModel", readModelId: string, readModelName: string, propertyValues: Array<{ name, value }> }
}
```

**Display rules:**
1. If **no values** specified → show element name only
2. If **values** specified → show element name + `{ prop: value, ... }`
3. Then values should **match** Given/When values to show data flow

**Example: SC scenario with values (shows data flow)**
```
┌─────────────────────────────────────────────────────────┐
│ Create order for gold customer                        × │
│                                                         │
│ Given  CustomerRegistered { customerId: "cust-1",       │
│          tier: "gold" }                                 │
│ When   CreateOrder { customerId: "cust-1",              │
│          amount: 250 }                                  │
│ Then   OrderCreated { customerId: "cust-1",             │
│          amount: 250, discount: 25 }                    │
└─────────────────────────────────────────────────────────┘
```
↑ `customerId` flows from Given → When → Then
↑ `amount` flows from When → Then  
↑ `discount` is calculated (new value)

**Example: SC scenario without values**
```
┌─────────────────────────────────────────────────────────┐
│ Create order successfully                             × │
│                                                         │
│ Given  CustomerRegistered                               │
│ When   CreateOrder                                      │
│ Then   OrderCreated                                     │
└─────────────────────────────────────────────────────────┘
```

**Example: SV scenario (read model projection)**
```
┌─────────────────────────────────────────────────────────┐
│ Order list shows total                                × │
│                                                         │
│ Given  OrderCreated { orderId: "o1", amount: 100 }      │
│ And    OrderCreated { orderId: "o2", amount: 200 }      │
│ Then   OrderList { count: 2, total: 300 }               │
└─────────────────────────────────────────────────────────┘
```
↑ `count` = number of Given events
↑ `total` = sum of Given amounts

**Example: Rejection**
```
┌─────────────────────────────────────────────────────────┐
│ Reject unknown customer                               × │
│                                                         │
│ When   CreateOrder { customerId: "unknown" }            │
│ Then   Rejected: "Customer not found"                   │
└─────────────────────────────────────────────────────────┘
```

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
