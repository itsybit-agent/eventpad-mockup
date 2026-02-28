// ===========================================
// CONNECT - Element Pickers
// ===========================================

import { appendEvent, EventTypes } from '../../core/eventStore.js';
import { projectState } from '../../core/projections.js';
import { typeIcons, typeLabels } from '../../core/constants.js';
import { showSheet, hideAllSheets } from '../../ui/sheets.js';
import { showToast } from '../../ui/toast.js';
import { render } from '../../ui/feed.js';
import { getSelectedElement } from './command.js';
import { promptSliceNaming } from '../nameSlice/sheet.js';

let pendingPicker = null;
let multiPickerSelection = new Set();
let multiPickerConfig = null;

export function showPicker(targetType, relation, sliceType) {
  hideAllSheets();
  
  const state = projectState();
  const availableElements = Object.values(state.elements)
    .filter(el => el.type === targetType);
  
  document.getElementById('pickerSheetTitle').textContent = `Pick ${typeLabels[targetType]}`;
  
  const pickerOptions = document.getElementById('pickerOptions');
  const pickerEmpty = document.getElementById('pickerEmpty');
  
  if (availableElements.length === 0) {
    pickerOptions.innerHTML = '';
    pickerEmpty.style.display = 'block';
  } else {
    pickerEmpty.style.display = 'none';
    pickerOptions.innerHTML = availableElements.map(el => `
      <div class="sheet-option" onclick="window.EventPad.pickElement('${el.id}')">
        <div class="sheet-option-icon" style="background: var(--${el.type}); color: ${el.type === 'command' || el.type === 'processor' ? '#fff' : '#000'};">${typeIcons[el.type]}</div>
        <div class="sheet-option-text">
          <div class="sheet-option-title">${el.name}</div>
          <div class="sheet-option-desc">${typeLabels[el.type]}</div>
        </div>
      </div>
    `).join('');
  }
  
  pendingPicker = { targetType, relation, sliceType };
  showSheet('pickerSheet');
}

export function pickElement(elementId) {
  if (!pendingPicker) return;
  
  const { targetType, relation, sliceType } = pendingPicker;
  const state = projectState();
  const selectedElement = getSelectedElement();
  const pickedElement = state.elements[elementId];
  
  hideAllSheets();
  
  // Special case: Processor picking command - create AU slice
  if (selectedElement.type === 'processor' && targetType === 'command') {
    createAUSlice(elementId, state, selectedElement);
    pendingPicker = null;
    render();
    return;
  }
  
  // Default: Create connection to existing element
  appendEvent(EventTypes.ProducerSet, {
    fromId: selectedElement.id,
    toId: elementId,
    relation
  });
  
  // Check if selected element is in a slice
  const existingSlice = Object.values(state.slices).find(s => 
    s.elements.includes(selectedElement.id)
  );
  
  if (existingSlice) {
    appendEvent(EventTypes.SliceElementAdded, {
      sliceId: existingSlice.id,
      elementId: elementId
    });
    showToast(`${pickedElement.name} added to slice!`);
  } else {
    showToast(`Connected to ${pickedElement.name}`);
  }
  
  pendingPicker = null;
  render();
}

function createAUSlice(commandId, state, selectedElement) {
  // Find trigger connection for this processor
  const triggerConn = state.connections.find(c => 
    c.to === selectedElement.id && c.relation === 'trigger'
  );
  
  if (!triggerConn) return;
  
  // Create connection to command
  appendEvent(EventTypes.ProducerSet, {
    fromId: selectedElement.id,
    toId: commandId,
    relation: 'invokes'
  });
  
  // Get the readModelId from trigger event's SV slice
  const triggerEventId = triggerConn.from;
  const svSlice = Object.values(state.slices).find(s => 
    s.type === 'SV' && s.elements.includes(triggerEventId)
  );
  const primaryReadModelId = svSlice?.elements.find(id => 
    state.elements[id]?.type === 'readModel'
  );
  
  // Get additional context ReadModels
  const contextConns = state.connections.filter(c => 
    c.from === selectedElement.id && c.relation === 'context'
  );
  const additionalReadModelIds = contextConns.map(c => c.to);
  
  // Build elements array
  const elements = [triggerEventId];
  if (primaryReadModelId) elements.push(primaryReadModelId);
  additionalReadModelIds.forEach(id => {
    if (!elements.includes(id)) elements.push(id);
  });
  elements.push(selectedElement.id, commandId);
  
  const sliceId = 'slice_' + Date.now();
  
  appendEvent(EventTypes.SliceInferred, {
    sliceId,
    sliceType: 'AU',
    elements,
    complete: true
  });
  
  showToast(`AU slice created!`);
  
  // Prompt for name
  promptSliceNaming(sliceId, `${selectedElement.name} Automation`);
}

// SV Picker - shows events from existing SV slices for AU trigger
export function showSVPicker() {
  hideAllSheets();
  
  const state = projectState();
  const svSlices = Object.values(state.slices).filter(s => s.type === 'SV' && s.name);
  
  document.getElementById('pickerSheetTitle').textContent = 'Pick Trigger from State View';
  
  const pickerOptions = document.getElementById('pickerOptions');
  const pickerEmpty = document.getElementById('pickerEmpty');
  
  if (svSlices.length === 0) {
    pickerOptions.innerHTML = '';
    pickerEmpty.textContent = 'No State Views yet. Create an SV slice first (Event → ReadModel).';
    pickerEmpty.style.display = 'block';
  } else {
    pickerEmpty.style.display = 'none';
    
    let html = '';
    svSlices.forEach(sv => {
      const events = sv.elements
        .map(id => state.elements[id])
        .filter(el => el && el.type === 'event');
      
      const readModel = sv.elements
        .map(id => state.elements[id])
        .find(el => el && el.type === 'readModel');
      
      if (events.length > 0 && readModel) {
        html += `<div style="padding: 8px 16px; color: var(--text-muted); font-size: 12px; text-transform: uppercase;">${sv.name}</div>`;
        events.forEach(evt => {
          html += `
            <div class="sheet-option" onclick="window.EventPad.pickSVTrigger('${evt.id}', '${readModel.id}', '${sv.id}')">
              <div class="sheet-option-icon" style="background: var(--event);">🟧</div>
              <div class="sheet-option-text">
                <div class="sheet-option-title">${evt.name}</div>
                <div class="sheet-option-desc">+ 🟩 ${readModel.name} as context</div>
              </div>
            </div>
          `;
        });
      }
    });
    
    pickerOptions.innerHTML = html || '<div style="padding: 16px; color: var(--text-muted);">No events in State Views</div>';
  }
  
  showSheet('pickerSheet');
}

export function pickSVTrigger(eventId, readModelId, svSliceId) {
  hideAllSheets();
  
  const state = projectState();
  const selectedElement = getSelectedElement();
  const evt = state.elements[eventId];
  
  appendEvent(EventTypes.TriggerSet, {
    fromId: eventId,
    toId: selectedElement.id,
    relation: 'trigger',
    readModelId: readModelId
  });
  
  showToast(`Trigger set: ${evt.name}. Now pick a command.`);
  render();
}

// ===========================================
// MULTI-SELECT PICKER (for SV slices)
// ===========================================

export function showMultiPicker(targetType, relation, sliceType) {
  hideAllSheets();
  
  const state = projectState();
  const availableElements = Object.values(state.elements)
    .filter(el => el.type === targetType);
  
  multiPickerSelection = new Set();
  multiPickerConfig = { targetType, relation, sliceType };
  
  document.getElementById('multiPickerSheetTitle').textContent = `Select ${typeLabels[targetType]}s`;
  
  const pickerOptions = document.getElementById('multiPickerOptions');
  const pickerEmpty = document.getElementById('multiPickerEmpty');
  const confirmBtn = document.getElementById('multiPickerConfirm');
  
  if (availableElements.length === 0) {
    pickerOptions.innerHTML = '';
    pickerEmpty.style.display = 'block';
    confirmBtn.disabled = true;
  } else {
    pickerEmpty.style.display = 'none';
    pickerOptions.innerHTML = availableElements.map(el => `
      <div class="sheet-option" data-element-id="${el.id}" onclick="window.EventPad.toggleMultiPickerItem('${el.id}')">
        <div class="sheet-option-icon" style="background: var(--${el.type}); color: ${el.type === 'command' || el.type === 'processor' ? '#fff' : '#000'};">${typeIcons[el.type]}</div>
        <div class="sheet-option-text">
          <div class="sheet-option-title">${el.name}</div>
          <div class="sheet-option-desc">${typeLabels[el.type]}</div>
        </div>
        <span class="check">✓</span>
      </div>
    `).join('');
  }
  
  updateMultiPickerButton();
  showSheet('multiPickerSheet');
}

export function toggleMultiPickerItem(elementId) {
  if (multiPickerSelection.has(elementId)) {
    multiPickerSelection.delete(elementId);
  } else {
    multiPickerSelection.add(elementId);
  }
  
  // Update visual state
  const option = document.querySelector(`[data-element-id="${elementId}"]`);
  if (option) {
    option.classList.toggle('selected', multiPickerSelection.has(elementId));
  }
  
  updateMultiPickerButton();
}

function updateMultiPickerButton() {
  const btn = document.getElementById('multiPickerConfirm');
  const count = multiPickerSelection.size;
  btn.textContent = `Create SV Slice (${count} event${count !== 1 ? 's' : ''})`;
  btn.disabled = count === 0;
}

export function confirmMultiPick() {
  if (multiPickerSelection.size === 0 || !multiPickerConfig) return;
  
  const state = projectState();
  const selectedElement = getSelectedElement();
  const readModelId = selectedElement.id;
  const eventIds = Array.from(multiPickerSelection);
  
  hideAllSheets();
  
  // Create connections from each event to the read model
  eventIds.forEach(eventId => {
    appendEvent(EventTypes.ConsumerAdded, {
      fromId: eventId,
      toId: readModelId,
      relation: 'consumer'
    });
  });
  
  // Create SV slice: events... → readModel
  const sliceId = 'slice_' + Date.now();
  const elements = [...eventIds, readModelId];
  
  appendEvent(EventTypes.SliceInferred, {
    sliceId,
    sliceType: 'SV',
    elements,
    complete: true
  });
  
  // Show naming prompt
  const eventNames = eventIds.map(id => state.elements[id]?.name).join(', ');
  showToast(`SV slice created with ${eventIds.length} event${eventIds.length > 1 ? 's' : ''}!`);
  
  promptSliceNaming(sliceId, `${selectedElement.name} View`);
  
  multiPickerSelection = new Set();
  multiPickerConfig = null;
  render();
}
