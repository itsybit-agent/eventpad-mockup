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
  
  const state = projectState();
  const sliceElements = slice.elements.map(id => state.elements[id]).filter(Boolean);
  
  // Get elements by type
  const events = scenario.type === 'SV' 
    ? Object.values(state.elements).filter(e => e.type === 'event')
    : sliceElements.filter(e => e.type === 'event');
  const commands = sliceElements.filter(e => e.type === 'command');
  const readModels = sliceElements.filter(e => e.type === 'readModel');
  
  // Title
  document.getElementById('editScenarioTitle').textContent = scenario.name;
  
  // GIVEN - multi-select events
  const givenList = document.getElementById('givenEventsList');
  givenList.innerHTML = events.length ? events.map(e => {
    const isSelected = scenario.given?.some(g => g.elementId === e.id);
    return `
      <label class="checkbox-item ${isSelected ? 'selected' : ''}">
        <input type="checkbox" data-event-id="${e.id}" ${isSelected ? 'checked' : ''} onchange="this.parentElement.classList.toggle('selected', this.checked)">
        <span>${typeIcons.event} ${e.name}</span>
      </label>
    `;
  }).join('') : '<p class="empty">No events available</p>';
  
  // WHEN - command select (SC only)
  const whenSection = document.getElementById('whenSection');
  if (scenario.type === 'SC') {
    whenSection.style.display = 'block';
    const whenSelect = document.getElementById('whenCommandSelect');
    whenSelect.innerHTML = `
      <option value="">Select command...</option>
      ${commands.map(c => `
        <option value="${c.id}" ${scenario.when?.commandId === c.id ? 'selected' : ''}>
          ${typeIcons.command} ${c.name}
        </option>
      `).join('')}
    `;
  } else {
    whenSection.style.display = 'none';
  }
  
  // THEN - different for SC vs SV
  const thenOptions = document.getElementById('thenOptions');
  if (scenario.type === 'SC') {
    const isEvent = scenario.then?.type === 'event';
    const isRejection = scenario.then?.type === 'rejection';
    
    thenOptions.innerHTML = `
      <div class="then-type-toggle">
        <label class="radio-item ${isEvent || !scenario.then ? 'selected' : ''}">
          <input type="radio" name="thenType" value="event" ${isEvent || !scenario.then ? 'checked' : ''} onchange="document.getElementById('thenEventSection').style.display='block'; document.getElementById('thenRejectionSection').style.display='none'; this.parentElement.classList.add('selected'); document.querySelector('input[value=rejection]').parentElement.classList.remove('selected');">
          <span>✅ Event</span>
        </label>
        <label class="radio-item ${isRejection ? 'selected' : ''}">
          <input type="radio" name="thenType" value="rejection" ${isRejection ? 'checked' : ''} onchange="document.getElementById('thenEventSection').style.display='none'; document.getElementById('thenRejectionSection').style.display='block'; this.parentElement.classList.add('selected'); document.querySelector('input[value=event]').parentElement.classList.remove('selected');">
          <span>❌ Rejection</span>
        </label>
      </div>
      
      <div id="thenEventSection" style="${isRejection ? 'display:none' : ''}">
        <select class="sheet-input" id="thenEventSelect" style="padding: 12px; margin-top: 12px;">
          <option value="">Select event...</option>
          ${events.map(e => `
            <option value="${e.id}" ${scenario.then?.eventId === e.id ? 'selected' : ''}>
              ${typeIcons.event} ${e.name}
            </option>
          `).join('')}
        </select>
      </div>
      
      <div id="thenRejectionSection" style="${isRejection ? '' : 'display:none'}">
        <input type="text" class="sheet-input" id="rejectionReasonInput" placeholder="Rejection reason..." value="${scenario.then?.reason || ''}" style="margin-top: 12px;">
      </div>
    `;
  } else {
    // SV - read model
    thenOptions.innerHTML = `
      <select class="sheet-input" id="thenReadModelSelect" style="padding: 12px;">
        <option value="">Select read model...</option>
        ${readModels.map(rm => `
          <option value="${rm.id}" ${scenario.then?.readModelId === rm.id ? 'selected' : ''}>
            ${typeIcons.readModel} ${rm.name}
          </option>
        `).join('')}
      </select>
    `;
  }
  
  showSheet('editScenarioSheet');
}

export function saveScenario() {
  if (!editingScenarioId) return;
  
  // Save Given
  const givenCheckboxes = document.querySelectorAll('#givenEventsList input[data-event-id]:checked');
  const givenEvents = Array.from(givenCheckboxes).map(cb => ({
    elementId: cb.dataset.eventId,
    values: {}
  }));
  setGiven(editingScenarioId, givenEvents);
  
  // Save When (SC only)
  if (editingSliceType === 'SC') {
    const commandSelect = document.getElementById('whenCommandSelect');
    if (commandSelect?.value) {
      setWhen(editingScenarioId, commandSelect.value, {});
    }
  }
  
  // Save Then
  if (editingSliceType === 'SC') {
    const thenType = document.querySelector('input[name="thenType"]:checked')?.value;
    if (thenType === 'event') {
      const eventSelect = document.getElementById('thenEventSelect');
      if (eventSelect?.value) {
        setThenEvent(editingScenarioId, eventSelect.value, {});
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
      setThenReadModel(editingScenarioId, rmSelect.value, {});
    }
  }
  
  editingScenarioId = null;
  editingSliceId = null;
  editingSliceType = null;
  
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
