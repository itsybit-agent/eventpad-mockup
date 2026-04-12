# EventPad — Mobile event modeling tool

I wanted a quick way to describe an app to AI when I'm on my phone. Using emojis for commands, events, and read models kind of worked, but it wasn't structured and long-pressing to find the right symbol got old fast. I wanted something purpose-built — tap to add a command, an event, a read model, link them together, and have a real model I could hand off.

EventPad is that tool — or will be. The backend is solid: you create a model, drop in your elements, link them together, organize into chapters and slices with Given-When-Then scenarios. The whole thing is event-sourced itself. But the UI isn't quite what I want it to be yet. I'm still figuring out what event modeling should look and feel like when you're working on a phone. This is one I really want to complete someday.

**Features:**
- Create and manage event models with named elements (commands, events, read models, automations)
- Define properties on each element to capture field-level detail
- Link elements together (command to event, event to read model, etc.) with bidirectional tracking
- Organize slices into chapters for structured walkthroughs
- Three slice types: state change, state view, and automation
- Given-When-Then scenarios on slices for acceptance-level specifications
- Rejection and projection scenarios for modeling failures and read model state
- Model validation that flags structural issues

**Tech:**
- .NET 10 / ASP.NET Core API with CQRS and vertical slices
- Angular 21 frontend
- FileEventStore for event persistence
- MediatR for in-process event publishing and projections
- .NET Aspire for local orchestration
