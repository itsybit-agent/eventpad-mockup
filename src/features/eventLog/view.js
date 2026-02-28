// ===========================================
// EVENT LOG - View (SV: View Event Log)
// ===========================================

import { getEventStream } from '../../core/eventStore.js';

// Render event log list
export function renderEventLog() {
  const eventStream = getEventStream();
  return eventStream.slice().reverse().map((evt, i) => `
    <div class="event-log-item" onclick="window.EventPad.copyEvent(${eventStream.length - 1 - i}, this)">
      <span class="event-log-type">${evt.type}</span>
      <span class="event-log-time">${new Date(evt.timestamp).toLocaleTimeString()}</span>
      <div class="event-log-data">${JSON.stringify(evt.data, null, 2)}</div>
    </div>
  `).join('');
}
