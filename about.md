# EventPad — Mobile event modeling tool

I kept running into the same problem: every time I wanted to sketch out an event model, I'd end up in a whiteboard tool that wasn't built for it. Sticky notes everywhere, no structure, no way to define Given-When-Then scenarios, and definitely no validation. I wanted something purpose-built — a tool where I could model an entire event-sourced system on my phone or laptop, with real structure behind the boxes and arrows.

EventPad is that tool. You create a model, drop in your commands, events, and read models, link them together, then organize everything into chapters and slices. Each slice can have GWT scenarios: "given these prior events, when this command fires, then these events happen." It also handles projection scenarios (given events, then a read model state) and rejection scenarios (given state, when command, then rejection reason). The whole thing is event-sourced itself — the model aggregate rebuilds from its own event stream.

**Features:**
- Create and manage event models with named elements (commands, events, read models, automations)
- Define properties on each element to capture field-level detail
- Link elements together (command to event, event to read model, etc.) with bidirectional tracking
- Organize slices into chapters for structured walkthroughs
- Three slice types: state change, state view, and automation
- Given-When-Then scenarios on slices for acceptance-level specifications
- Rejection scenarios for modeling command failures and business rule violations
- Projection scenarios for read model state verification
- Model validation that flags structural issues

**Tech:**
- .NET 10 / ASP.NET Core API with CQRS and vertical slices
- Angular 21 frontend
- FileEventStore for event persistence
- MediatR for in-process event publishing and projections
- .NET Aspire for local orchestration
