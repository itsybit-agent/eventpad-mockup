// ===========================================
// EVENT LOG - Panel
// ===========================================

import { getEventStream } from '../../core/eventStore.js';
import { showToast } from '../../ui/toast.js';

export function toggleEventLog() {
  document.getElementById('eventLog').classList.toggle('visible');
}

export async function copyEvent(index, element) {
  const eventStream = getEventStream();
  const evt = eventStream[index];
  const text = JSON.stringify(evt, null, 2);
  
  try {
    await navigator.clipboard.writeText(text);
    
    // Show feedback
    const existing = element.querySelector('.copied');
    if (existing) existing.remove();
    
    const badge = document.createElement('span');
    badge.className = 'copied';
    badge.textContent = '✓ copied';
    element.querySelector('.event-log-type').after(badge);
    
    setTimeout(() => badge.remove(), 1500);
  } catch (err) {
    showToast('Failed to copy');
  }
}

export async function copyAllEvents() {
  const eventStream = getEventStream();
  const text = JSON.stringify(eventStream, null, 2);
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('All events copied!');
  } catch (err) {
    showToast('Failed to copy');
  }
}
