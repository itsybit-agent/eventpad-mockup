// ===========================================
// CREATE ELEMENT - Command
// ===========================================

import { appendEvent, EventTypes } from '../../core/eventStore.js';

export function dispatchCreateElement(elementType, name) {
  const elementId = 'el_' + Date.now();
  
  appendEvent(EventTypes.ElementCreated, {
    elementId,
    elementType,
    name
  });

  return elementId;
}
