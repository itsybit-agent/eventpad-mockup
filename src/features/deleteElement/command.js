// ===========================================
// DELETE ELEMENT - Command
// ===========================================

import { appendEvent, EventTypes } from '../../core/eventStore.js';
import { projectState } from '../../core/projections.js';
import { showToast } from '../../ui/toast.js';
import { render } from '../../ui/feed.js';

export function deleteElement(elementId) {
  const state = projectState();
  const element = state.elements[elementId];
  
  if (!element) return;
  
  if (!confirm(`Delete "${element.name}"?`)) return;
  
  // Check if element is in any slice
  const containingSlice = Object.values(state.slices).find(s => 
    s.elements.includes(elementId)
  );
  
  if (containingSlice) {
    // Remove from slice first
    appendEvent(EventTypes.SliceElementRemoved, {
      sliceId: containingSlice.id,
      elementId
    });
    
    // If slice now has < 2 elements, delete the slice too
    const remainingElements = containingSlice.elements.filter(id => id !== elementId);
    if (remainingElements.length < 2) {
      appendEvent(EventTypes.SliceDeleted, {
        sliceId: containingSlice.id
      });
    }
  }
  
  // Delete the element
  appendEvent(EventTypes.ElementDeleted, {
    elementId
  });
  
  showToast(`${element.name} deleted`);
  render();
}
