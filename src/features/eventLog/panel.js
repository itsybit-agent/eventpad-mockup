// ===========================================
// EVENT LOG - Panel
// ===========================================

import { getEventStream, loadEventStream, saveEventStream } from '../../core/eventStore.js';
import { showToast } from '../../ui/toast.js';
import { render } from '../../ui/feed.js';

export function toggleEventLog() {
  document.getElementById('eventLog').classList.toggle('open');
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

export function exportModel() {
  const eventStream = getEventStream();
  if (eventStream.length === 0) {
    showToast('Nothing to export yet');
    return;
  }

  const json = JSON.stringify(eventStream, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `eventpad-model-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Model exported!');
}

export function importModel(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const events = JSON.parse(e.target.result);
      if (!Array.isArray(events)) throw new Error('Invalid format');

      const confirmed = confirm(`Import ${events.length} events? This will replace your current model.`);
      if (!confirmed) return;

      localStorage.setItem('eventpad_events', JSON.stringify(events));
      loadEventStream();
      render();
      showToast(`Imported ${events.length} events!`);
    } catch (err) {
      showToast('Invalid JSON file');
    }
    // Reset input so same file can be re-imported
    input.value = '';
  };
  reader.readAsText(file);
}
