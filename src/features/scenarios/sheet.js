// ===========================================
// SCENARIOS - UI Sheets
// ===========================================

import { showSheet, hideAllSheets } from '../../ui/sheets.js';
import { showToast } from '../../ui/toast.js';
import { typeIcons } from '../../core/constants.js';
import { projectState, getScenariosForSlice } from '../../core/projections.js';
import { render } from '../../ui/feed.js';
import { 
  addScenario, 
  deleteScenario as deleteScenarioCmd,
  setGiven, 
  setWhen, 
  setThenEvent, 
  setThenRejection,
  setThenReadModel 
} from './command.js';

// ===========================================
// STATE
// ===========================================

let editingSliceId = null;
let editingSliceType = null;
let editingScenarioId = null;
let editingScenario = null;
let editingState = null;

// ===========================================
// HELPERS
// ===========================================

// Render property inputs for an element
function renderPropertyInputs(element, existingValues = {}, prefix) {
  if (!element.properties || element.properties.length === 0) {
    return '<p class="property-hint">No properties defined</p>';
  }
  
  return element.properties.map(prop => {
    const value = existingValues[prop.name] ?? '';
    const inputType = prop.type === 'number' ? 'number' : 'text';
    const placeholder = `${prop.name} (${prop.type})`;
    
    return `
      <div class="property-input-row">
        <label>${prop.name}</label>
        <input type="${inputType}" 
               class="property-value-input" 
               data-prefix="${prefix}"
               data-element-id="${element.id}"
               data-prop-name="${prop.name}"
               placeholder="${placeholder}"
               value="${value}">
      </div>
    `;
  }).join('');
}

// Get values from property inputs
function getPropertyValues(prefix, elementId) {
  const inputs = document.querySelectorAll(`input[data-prefix="${prefix}"][data-element-id="${elementId}"]`);
  const values = {};
  inputs.forEach(input => {
    const val = input.value.trim();
    if (val) {
      // Try to parse as number/boolean/JSON
      if (input.type === 'number' && val) {
        values[input.dataset.propName] = parseFloat(val);
      } else if (val === 'true') {
        values[input.dataset.propName] = true;
      } else if (val === 'false') {
        values[input.dataset.propName] = false;
      } else {
        values[input.dataset.propName] = val;
      }
    }
  });
  return values;
}

// ===========================================
// ADD SCENARIO SHEET
// ===========================================

export function openAddScenarioSheet(sliceId, sliceType) {
  editingSliceId = sliceId;
  editingSliceType = sliceType;
  
  document.getElementById('addScenarioTitle').textContent = `Add ${sliceType} Scenario`;
  document.getElementById('scenarioNameInput').value = '';
  document.getElementById('scenarioTypeHint').textContent = sliceType === 'SC' ? 'Given/When/Then' : 'Given/Then';
  
  showSheet('addScenarioSheet');
  setTimeout(() => document.getElementById('scenarioNameInput').focus(), 300);
}

export function submitAddScenario() {
  const name = document.getElementById('scenarioNameInput').value.trim();
  if (!name || !editingSliceId) {
    showToast('Enter a scenario name');
    return;
  }
  
  const scenarioId = addScenario(editingSliceId, name, editingSliceType);
  
  hideAllSheets();
  showToast('Scenario added');
  
  // Open editor for the new scenario
  const state = projectState();
  const scenario = state.scenarios[scenarioId];
  const slice = state.slices[editingSliceId];
  if (scenario && slice) {
    setTimeout(() => openEditScenarioSheet(scenario, slice), 100);
  } else {
    render();
  }
}

// ===========================================
// EDIT SCENARIO SHEET
// ===========================================

export function openEditScenarioSheet(scenario, slice) {
  editingScenarioId = scenario.id;
  editingSliceId = slice.id;
  editingSliceType = scenario.type;
  editingScenario = scenario;
  editingState = projectState();
  
  const state = editingState;
  const sliceElements = slice.elements.map(id => state.elements[id]).filter(Boolean);
  
  // Get elements by type
  const events = scenario.type === 'SV' 
    ? Object.values(state.elements).filter(e => e.type === 'event')
    : sliceElements.filter(e => e.type === 'event');
  const commands = sliceElements.filter(e => e.type === 'command');
  const readModels = sliceElements.filter(e => e.type === 'readModel');
  
  // Title
  document.getElementById('editScenarioTitle').textContent = scenario.name;
  
  // GIVEN - multi-select events with property inputs
  const givenList = document.getElementById('givenEventsList');
  if (events.length) {
    givenList.innerHTML = events.map(e => {
      const givenEvent = scenario.given?.find(g => g.elementId === e.id);
      const isSelected = !!givenEvent;
      const existingValues = givenEvent?.values || {};
      
      return `
        <div class="given-event-item ${isSelected ? 'selected' : ''}" data-event-id="${e.id}">
          <label class="checkbox-item">
            <input type="checkbox" data-event-id="${e.id}" ${isSelected ? 'checked' : ''} 
                   onchange="window.EventPad.toggleGivenEvent('${e.id}', this.checked)">
            <span>${typeIcons.event} ${e.name}</span>
          </label>
          <div class="property-inputs ${isSelected ? '' : 'hidden'}" id="given-props-${e.id}">
            ${renderPropertyInputs(e, existingValues, 'given')}
          </div>
        </div>
      `;
    }).join('');
  } else {
    givenList.innerHTML = '<p class="empty">No events available</p>';
  }
  
  // WHEN - command select with property inputs (SC only)
  const whenSection = document.getElementById('whenSection');
  if (scenario.type === 'SC') {
    whenSection.style.display = 'block';
    
    const selectedCmd = commands.find(c => c.id === scenario.when?.commandId);
    const whenValues = scenario.when?.values || {};
    
    whenSection.innerHTML = `
      <div class="section-label">WHEN</div>
      <select class="sheet-input" id="whenCommandSelect" style="padding: 12px;"
              onchange="window.EventPad.selectWhenCommand(this.value)">
        <option value="">Select command...</option>
        ${commands.map(c => `
          <option value="${c.id}" ${scenario.when?.commandId === c.id ? 'selected' : ''}>
            ${typeIcons.command} ${c.name}
          </option>
        `).join('')}
      </select>
      <div class="property-inputs ${selectedCmd ? '' : 'hidden'}" id="when-props">
        ${selectedCmd ? renderPropertyInputs(selectedCmd, whenValues, 'when') : ''}
      </div>
    `;
  } else {
    whenSection.style.display = 'none';
  }
  
  // THEN - different for SC vs SV
  const thenOptions = document.getElementById('thenOptions');
  if (scenario.type === 'SC') {
    const isEvent = scenario.then?.type === 'event';
    const isRejection = scenario.then?.type === 'rejection';
    const selectedEvent = isEvent ? events.find(e => e.id === scenario.then?.eventId) : null;
    const thenValues = scenario.then?.values || {};
    
    thenOptions.innerHTML = `
      <div class="then-type-toggle">
        <label class="radio-item ${isEvent || !scenario.then ? 'selected' : ''}">
          <input type="radio" name="thenType" value="event" ${isEvent || !scenario.then ? 'checked' : ''} 
                 onchange="window.EventPad.selectThenType('event')">
          <span>✅ Event</span>
        </label>
        <label class="radio-item ${isRejection ? 'selected' : ''}">
          <input type="radio" name="thenType" value="rejection" ${isRejection ? 'checked' : ''} 
                 onchange="window.EventPad.selectThenType('rejection')">
          <span>❌ Rejection</span>
        </label>
      </div>
      
      <div id="thenEventSection" style="${isRejection ? 'display:none' : ''}">
        <select class="sheet-input" id="thenEventSelect" style="padding: 12px; margin-top: 12px;"
                onchange="window.EventPad.selectThenEvent(this.value)">
          <option value="">Select event...</option>
          ${events.map(e => `
            <option value="${e.id}" ${scenario.then?.eventId === e.id ? 'selected' : ''}>
              ${typeIcons.event} ${e.name}
            </option>
          `).join('')}
        </select>
        <div class="property-inputs ${selectedEvent ? '' : 'hidden'}" id="then-event-props">
          ${selectedEvent ? renderPropertyInputs(selectedEvent, thenValues, 'then-event') : ''}
        </div>
      </div>
      
      <div id="thenRejectionSection" style="${isRejection ? '' : 'display:none'}">
        <input type="text" class="sheet-input" id="rejectionReasonInput" 
               placeholder="Rejection reason..." value="${scenario.then?.reason || ''}" 
               style="margin-top: 12px;">
      </div>
    `;
  } else {
    // SV - read model with property inputs
    const selectedRM = readModels.find(rm => rm.id === scenario.then?.readModelId);
    const thenValues = scenario.then?.values || {};
    
    thenOptions.innerHTML = `
      <select class="sheet-input" id="thenReadModelSelect" style="padding: 12px;"
              onchange="window.EventPad.selectThenReadModel(this.value)">
        <option value="">Select read model...</option>
        ${readModels.map(rm => `
          <option value="${rm.id}" ${scenario.then?.readModelId === rm.id ? 'selected' : ''}>
            ${typeIcons.readModel} ${rm.name}
          </option>
        `).join('')}
      </select>
      <div class="property-inputs ${selectedRM ? '' : 'hidden'}" id="then-rm-props">
        ${selectedRM ? renderPropertyInputs(selectedRM, thenValues, 'then-rm') : ''}
      </div>
    `;
  }
  
  showSheet('editScenarioSheet');
}

// Toggle Given event selection and show/hide properties
export function toggleGivenEvent(eventId, checked) {
  const container = document.querySelector(`.given-event-item[data-event-id="${eventId}"]`);
  const propsDiv = document.getElementById(`given-props-${eventId}`);
  
  if (container) container.classList.toggle('selected', checked);
  if (propsDiv) propsDiv.classList.toggle('hidden', !checked);
}

// Select When command and show properties
export function selectWhenCommand(commandId) {
  const propsDiv = document.getElementById('when-props');
  if (!commandId) {
    propsDiv.classList.add('hidden');
    propsDiv.innerHTML = '';
    return;
  }
  
  const command = editingState.elements[commandId];
  if (command) {
    propsDiv.innerHTML = renderPropertyInputs(command, {}, 'when');
    propsDiv.classList.remove('hidden');
  }
}

// Select Then type (event/rejection)
export function selectThenType(type) {
  document.getElementById('thenEventSection').style.display = type === 'event' ? '' : 'none';
  document.getElementById('thenRejectionSection').style.display = type === 'rejection' ? '' : 'none';
  
  document.querySelectorAll('.then-type-toggle .radio-item').forEach(item => {
    item.classList.toggle('selected', item.querySelector('input').value === type);
  });
}

// Select Then event and show properties
export function selectThenEvent(eventId) {
  const propsDiv = document.getElementById('then-event-props');
  if (!eventId) {
    propsDiv.classList.add('hidden');
    propsDiv.innerHTML = '';
    return;
  }
  
  const event = editingState.elements[eventId];
  if (event) {
    propsDiv.innerHTML = renderPropertyInputs(event, {}, 'then-event');
    propsDiv.classList.remove('hidden');
  }
}

// Select Then read model and show properties
export function selectThenReadModel(rmId) {
  const propsDiv = document.getElementById('then-rm-props');
  if (!rmId) {
    propsDiv.classList.add('hidden');
    propsDiv.innerHTML = '';
    return;
  }
  
  const rm = editingState.elements[rmId];
  if (rm) {
    propsDiv.innerHTML = renderPropertyInputs(rm, {}, 'then-rm');
    propsDiv.classList.remove('hidden');
  }
}

export function saveScenario() {
  if (!editingScenarioId) return;
  
  // Save Given - collect all checked events with their values
  const givenCheckboxes = document.querySelectorAll('#givenEventsList input[data-event-id]:checked');
  const givenEvents = Array.from(givenCheckboxes).map(cb => ({
    elementId: cb.dataset.eventId,
    values: getPropertyValues('given', cb.dataset.eventId)
  }));
  setGiven(editingScenarioId, givenEvents);
  
  // Save When (SC only)
  if (editingSliceType === 'SC') {
    const commandSelect = document.getElementById('whenCommandSelect');
    if (commandSelect?.value) {
      const values = getPropertyValues('when', commandSelect.value);
      setWhen(editingScenarioId, commandSelect.value, values);
    }
  }
  
  // Save Then
  if (editingSliceType === 'SC') {
    const thenType = document.querySelector('input[name="thenType"]:checked')?.value;
    if (thenType === 'event') {
      const eventSelect = document.getElementById('thenEventSelect');
      if (eventSelect?.value) {
        const values = getPropertyValues('then-event', eventSelect.value);
        setThenEvent(editingScenarioId, eventSelect.value, values);
      }
    } else if (thenType === 'rejection') {
      const reason = document.getElementById('rejectionReasonInput')?.value?.trim();
      if (reason) {
        setThenRejection(editingScenarioId, reason);
      }
    }
  } else {
    const rmSelect = document.getElementById('thenReadModelSelect');
    if (rmSelect?.value) {
      const values = getPropertyValues('then-rm', rmSelect.value);
      setThenReadModel(editingScenarioId, rmSelect.value, values);
    }
  }
  
  editingScenarioId = null;
  editingSliceId = null;
  editingSliceType = null;
  editingScenario = null;
  editingState = null;
  
  hideAllSheets();
  showToast('Scenario saved');
  render();
}

export function deleteScenario() {
  if (!editingScenarioId || !editingSliceId) return;
  
  if (!confirm('Delete this scenario?')) return;
  
  deleteScenarioCmd(editingScenarioId, editingSliceId);
  
  editingScenarioId = null;
  editingSliceId = null;
  editingSliceType = null;
  editingScenario = null;
  editingState = null;
  
  hideAllSheets();
  showToast('Scenario deleted');
  render();
}

// ===========================================
// INIT
// ===========================================

export function initScenarios() {
  const nameInput = document.getElementById('scenarioNameInput');
  if (nameInput) {
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') submitAddScenario();
    };
  }
}
