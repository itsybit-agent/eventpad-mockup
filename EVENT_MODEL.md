# EventPad MVP - Event Model

Element-first, slice-inferred event modeling tool.

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

### SC: Connect Elements
⏹️ ElementCard { selectedElement }
⏹️ ActionSheet { action, targetType }
🟦 Connect { fromId, toId, relation }
🟧 Connected { fromId, toId, relation }
🟩 ElementCard *(shows connection)*

**Valid connections:**
| From | To | Relation | Creates Slice? |
|------|----|----------|----------------|
| 🟦 Command | 🟧 Event | produces | SC |
| 🟧 Event | 🟦 Command | producer | SC |
| 🟧 Event | 🟩 ReadModel | consumer | SV |
| 🟩 ReadModel | 🟧 Event | updatedBy | SV |
| 🟧 Event | ⚙️ Processor | trigger | AU |
| ⚙️ Processor | 🟦 Command | invokes | AU (completes) |
| 🟦 Command | ⏹️ Screen | input | - |
| ⏹️ Screen | 🟦 Command | triggers | - |
| 🟩 ReadModel | ⏹️ Screen | display | - |
| ⏹️ Screen | 🟩 ReadModel | displays | - |

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

---

## 📖 Slice Naming

### SC: Name Slice
⏹️ SliceNamePrompt { sliceId, suggestedName? }
🟦 NameSlice { sliceId, name }
🟧 SliceNamed { sliceId, name }
🟩 Feed *(slice card with name)*

✅ "Name inferred slice"
```
Given: SliceInferred { sliceId: "s1", sliceType: "SC", elements: ["c1", "e1"] }
When: NameSlice { sliceId: "s1", name: "Create Order" }
Then: SliceNamed { sliceId: "s1", name: "Create Order" }
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

## 📖 Scenarios (GWT)

### SC: Add Scenario to Slice
⏹️ SliceCard { sliceId }
🟦 AddScenario { sliceId, scenarioId*, name }
🟧 ScenarioAdded { sliceId, scenarioId, name }
🟩 SliceCard *(scenario section)*

### SC: Set Given Events
⏹️ ScenarioEditor { scenarioId }
🟦 SetGiven { scenarioId, events: [{elementId, values}] }
🟧 GivenSet { scenarioId, events }

### SC: Set When Command
⏹️ ScenarioEditor { scenarioId }
🟦 SetWhen { scenarioId, commandId, values }
🟧 WhenSet { scenarioId, commandId, values }

### SC: Set Then Outcome
⏹️ ScenarioEditor { scenarioId }
🟦 SetThen { scenarioId, outcome: { type, elementId?, values?, reason? } }
🟧 ThenSet { scenarioId, outcome }

**Outcome types:**
- `{ type: "event", elementId, values }` → ✅ success
- `{ type: "rejection", reason }` → ❌ failure
- `{ type: "readModel", elementId, values }` → 🟩 state view result

---

---

## 📖 Automation Slice

### SC: Start Automation (Event triggers Processor)
⏹️ EventCard { eventId }
⏹️ ActionSheet { "What does this trigger?" }
🟦 CreateProcessor { eventId, processorId*, processorName }
🟧 ElementCreated { elementId: processorId, elementType: "processor", name }
🟧 TriggerSet { eventId, processorId }
🟧 SliceInferred { sliceId*, sliceType: "AU", elements: [eventId, processorId], complete: false }

✅ "Event triggers processor → starts AU slice (incomplete)"
```
Given: ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
When: Connect { fromId: "e1", toId: "p1", relation: "trigger" }
      + ElementCreated { elementId: "p1", elementType: "processor", name: "NotifyWarehouse" }
Then:
  TriggerSet { eventId: "e1", processorId: "p1" }
  SliceInferred { sliceId: "s1", sliceType: "AU", elements: ["e1", "p1"], complete: false }
```
**Note:** AU slice is incomplete until command is set.

### SC: Add Context ReadModel to Automation
⏹️ ProcessorCard { processorId in AU slice }
⏹️ ActionSheet { "What context does this need?" }
⏹️ ReadModelPicker { existing readModels }
🟦 AddContext { sliceId, readModelId }
🟧 ContextAdded { sliceId, readModelId }
🟧 SliceElementAdded { sliceId, elementId: readModelId }

✅ "Add context read model to AU slice"
```
Given:
  SliceInferred { sliceId: "s1", sliceType: "AU", elements: ["e1", "p1"], complete: false }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "CustomerProfile" }
When: AddContext { sliceId: "s1", readModelId: "rm1" }
Then:
  ContextAdded { sliceId: "s1", readModelId: "rm1" }
  SliceElementAdded { sliceId: "s1", elementId: "rm1" }
```

### SC: Set Automation Command (pick from existing)
⏹️ ProcessorCard { processorId in AU slice }
⏹️ ActionSheet { "What command does this invoke?" }
⏹️ CommandPicker { existing commands only! }
🟦 SetAutomationCommand { sliceId, commandId }
🟧 AutomationCommandSet { sliceId, commandId }
🟧 SliceElementAdded { sliceId, elementId: commandId }
🟧 SliceCompleted { sliceId }

✅ "Set command from picker → completes AU slice"
```
Given:
  SliceInferred { sliceId: "s1", sliceType: "AU", elements: ["e1", "p1"], complete: false }
  ElementCreated { elementId: "c1", elementType: "command", name: "SendNotification" }
When: SetAutomationCommand { sliceId: "s1", commandId: "c1" }
Then:
  AutomationCommandSet { sliceId: "s1", commandId: "c1" }
  SliceElementAdded { sliceId: "s1", elementId: "c1" }
  SliceCompleted { sliceId: "s1" }
```
**Note:** Command is PICKED from existing commands, not created inline.

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
| PropertyAdded | elementId, propertyId, name, type |
| Connected | fromId, toId, relation |
| Disconnected | fromId, toId |
| SliceInferred | sliceId, sliceType, elements, complete |
| SliceNamed | sliceId, name |
| SliceElementAdded | sliceId, elementId, position |
| ScenarioAdded | sliceId, scenarioId, name |
| GivenSet | scenarioId, events |
| WhenSet | scenarioId, commandId, values |
| ThenSet | scenarioId, outcome |

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
