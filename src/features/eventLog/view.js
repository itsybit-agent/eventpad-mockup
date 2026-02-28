// ===========================================
// EVENT LOG - View (SV: View Event Log)
// ===========================================

import { getEventStream } from '../../core/eventStore.js';

// Render event log list
export function renderEventLog() {
  const eventStream = getEventStream();
  
  if (eventStream.length === 0) {
    return '<div class="event-log-empty">No events yet</div>';
  }
  
  return eventStream.slice().reverse().map((evt, i) => `
    <div class="event-log-item" onclick="window.EventPad.copyEvent(${eventStream.length - 1 - i}, this)">
      <div class="event-log-item-header">
        <span class="event-log-type">${evt.type}</span>
        <span class="event-log-time">${new Date(evt.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="event-log-data">${JSON.stringify(evt.data, null, 2)}</div>
    </div>
  `).join('');
}
