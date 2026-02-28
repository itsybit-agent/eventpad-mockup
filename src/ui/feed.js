// ===========================================
// FEED - Orchestrator
// ===========================================

import { getEventCount } from '../core/eventStore.js';
import { projectState } from '../core/projections.js';

// Import feature views
import { renderSliceCard, jumpToElementSlice } from '../features/slices/view.js';
import { renderElementCard, toggleElement } from '../features/elements/view.js';
import { renderEventLog } from '../features/eventLog/view.js';

// Re-export for window.EventPad
export { toggleElement, jumpToElementSlice };

// Main render function
export function render() {
  const state = projectState();
  const feed = document.getElementById('feed');
  const eventCount = getEventCount();
  
  // Update event count
  document.getElementById('eventCount').textContent = eventCount;
  document.getElementById('undoBtn').disabled = eventCount === 0;
  
  // Update event log (from eventLog feature)
  document.getElementById('eventLogList').innerHTML = renderEventLog();

  const elements = Object.values(state.elements);
  const slices = Object.values(state.slices);
  
  // Get elements that are in slices
  const slicedElementIds = new Set(slices.flatMap(s => s.elements));
  
  // Show/hide empty state
  const emptyState = document.getElementById('emptyState');
  emptyState.style.display = elements.length ? 'none' : 'block';

  // Render slices
  let html = slices.map(slice => renderSliceCard(slice, state)).join('');

  // Render loose elements (not in any slice)
  const looseElements = elements.filter(el => !slicedElementIds.has(el.id));
  html += looseElements.map(el => renderElementCard(el, state)).join('');

  feed.innerHTML = emptyState.outerHTML + html;
}
