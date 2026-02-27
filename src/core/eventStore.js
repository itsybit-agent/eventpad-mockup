// ===========================================
// EVENT STORE - Source of Truth
// ===========================================

import { EventTypes } from './constants.js';

// Re-export for convenience
export { EventTypes };

// Event stream (source of truth)
let eventStream = [];

// Get current stream (read-only copy)
export function getEventStream() {
  return [...eventStream];
}

// Load from localStorage
export function loadEventStream() {
  const saved = localStorage.getItem('eventpad_events');
  if (saved) {
    eventStream = JSON.parse(saved);
  }
  return eventStream;
}

// Save to localStorage
export function saveEventStream() {
  localStorage.setItem('eventpad_events', JSON.stringify(eventStream));
}

// Append event to stream
export function appendEvent(type, data) {
  const event = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type,
    data,
    timestamp: new Date().toISOString()
  };
  eventStream.push(event);
  saveEventStream();
  console.log('📌 Event:', type, data);
  return event;
}

// Pop last event (undo)
export function popEvent() {
  if (eventStream.length === 0) return null;
  const popped = eventStream.pop();
  saveEventStream();
  return popped;
}

// Clear all events
export function clearEvents() {
  const count = eventStream.length;
  eventStream = [];
  saveEventStream();
  return count;
}

// Get event count
export function getEventCount() {
  return eventStream.length;
}
