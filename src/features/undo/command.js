// ===========================================
// UNDO - Command
// ===========================================

import { popEvent, clearEvents } from '../../core/eventStore.js';
import { showToast } from '../../ui/toast.js';
import { render } from '../../ui/feed.js';

export function undo() {
  const popped = popEvent();
  if (popped) {
    render();
    showToast('Undone');
  }
}

export function clearAll() {
  if (!confirm('Clear all events?')) return;
  
  const count = clearEvents();
  render();
  showToast(`Cleared ${count} events`);
}
