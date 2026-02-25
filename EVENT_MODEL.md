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

**AU Pattern:** Automation reacts to domain events with context from read models.

```
🟧 Trigger Event (from existing SV)
🟩 Primary ReadModel (auto-included from same SV)
🟩 Additional Context ReadModels (optional, from other SVs)
⚙️ Processor
🟦 Command (picked from existing)
🟧 Output Events (from command's SC slice)
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
⏹️ ProcessorCard { processorId }
⏹️ ActionSheet { "What triggers this?" }
⏹️ SVEventPicker { events from existing SV slices only }
🟦 SetTrigger { processorId, eventId, readModelId (from same SV) }
🟧 TriggerSet { processorId, eventId }
🟧 SliceInferred { sliceId*, sliceType: "AU", elements: [eventId, readModelId, processorId], complete: false }

✅ "Pick trigger event → auto-includes SV's read model"
```
Given:
  ElementCreated { elementId: "e1", elementType: "event", name: "OrderCreated" }
  ElementCreated { elementId: "rm1", elementType: "readModel", name: "OrderList" }
  SliceInferred { sliceId: "sv1", sliceType: "SV", elements: ["rm1", "e1"] }
  SliceNamed { sliceId: "sv1", name: "Order List View" }
  ElementCreated { elementId: "p1", elementType: "processor", name: "NotifyWarehouse" }
When: SetTrigger { processorId: "p1", eventId: "e1" }
Then:
  TriggerSet { processorId: "p1", eventId: "e1" }
  SliceInferred { sliceId: "au1", sliceType: "AU", elements: ["e1", "rm1", "p1"], complete: false }
```
**Note:** Trigger event must come from an existing SV. ReadModel from same SV is auto-included.

### SC: Add Additional Context
⏹️ ProcessorCard { processorId in AU slice }
⏹️ ActionSheet { "What additional context?" }
⏹️ ReadModelPicker { readModels from other SV slices }
🟦 AddContext { sliceId, readModelIds[] }
🟧 ContextAdded { sliceId, readModelId }
🟧 SliceElementAdded { sliceId, elementId: readModelId }

✅ "Add additional context read models"
```
Given:
  SliceInferred { sliceId: "au1", sliceType: "AU", elements: ["e1", "rm1", "p1"], complete: false }
  ElementCreated { elementId: "rm2", elementType: "readModel", name: "CustomerProfile" }
  SliceInferred { sliceId: "sv2", sliceType: "SV", elements: ["rm2", "e2"] }
When: AddContext { sliceId: "au1", readModelId: "rm2" }
Then:
  ContextAdded { sliceId: "au1", readModelId: "rm2" }
  SliceElementAdded { sliceId: "au1", elementId: "rm2" }
```
**Note:** Additional context comes from OTHER SV slices. Can add multiple.

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
  SliceInferred { sliceId: "au1", sliceType: "AU", elements: ["e1", "rm1", "p1"], complete: false }
  ElementCreated { elementId: "c1", elementType: "command", name: "SendNotification" }
When: SetAutomationCommand { sliceId: "au1", commandId: "c1" }
Then:
  AutomationCommandSet { sliceId: "au1", commandId: "c1" }
  SliceElementAdded { sliceId: "au1", elementId: "c1" }
  SliceCompleted { sliceId: "au1" }
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
