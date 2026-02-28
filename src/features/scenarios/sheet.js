// ===========================================
// SCENARIOS - Editor Sheet
// ===========================================

import { showSheet, hideSheet } from '../../ui/sheets.js';
import { showToast } from '../../ui/toast.js';
import { typeIcons } from '../../core/constants.js';
import { projectState, getScenariosForSlice } from '../../core/projections.js';
import { 
  addScenario, 
  deleteScenario,
  setGiven, 
  setWhen, 
  setThenEvent, 
  setThenRejection,
  setThenReadModel 
} from './command.js';

// ===========================================
// ADD SCENARIO SHEET
// ===========================================

export function showAddScenarioSheet(sliceId, sliceType, onComplete) {
  const content = `
    <div class="sheet-header">
      <h3>Add ${sliceType} Scenario</h3>
    </div>
    <div class="sheet-body">
      <input type="text" id="scenarioNameInput" placeholder="Scenario name..." class="name-input" autofocus>
      <p class="hint">${sliceType === 'SC' ? 'Given/When/Then' : 'Given/Then'}</p>
    </div>
    <div class="sheet-actions">
      <button class="btn secondary" onclick="window.scenarioSheetCancel()">Cancel</button>
      <button class="btn primary" onclick="window.scenarioSheetConfirm()">Add</button>
    </div>
  `;
  
  window.scenarioSheetCancel = () => {
    hideSheet();
    delete window.scenarioSheetCancel;
    delete window.scenarioSheetConfirm;
  };
  
  window.scenarioSheetConfirm = () => {
    const input = document.getElementById('scenarioNameInput');
    const name = input?.value?.trim();
    if (!name) {
      showToast('Enter a scenario name');
      return;
    }
    
    const scenarioId = addScenario(sliceId, name, sliceType);
    hideSheet();
    delete window.scenarioSheetCancel;
    delete window.scenarioSheetConfirm;
    
    if (onComplete) onComplete(scenarioId);
  };
  
  showSheet(content);
  
  // Focus and handle Enter
  setTimeout(() => {
    const input = document.getElementById('scenarioNameInput');
    if (input) {
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') window.scenarioSheetConfirm();
        if (e.key === 'Escape') window.scenarioSheetCancel();
      });
    }
  }, 100);
}

// ===========================================
// SCENARIO EDITOR SHEET (full editor)
// ===========================================

export function showScenarioEditorSheet(scenario, slice, onComplete) {
  const state = projectState();
  const sliceElements = slice.elements.map(id => state.elements[id]).filter(Boolean);
  
  // Get elements by type for the slice
  const events = sliceElements.filter(e => e.type === 'event');
  const commands = sliceElements.filter(e => e.type === 'command');
  const readModels = sliceElements.filter(e => e.type === 'readModel');
  
  // For SV, we might need to get all events (not just in slice)
  const allEvents = Object.values(state.elements).filter(e => e.type === 'event');
  
  const isSC = scenario.type === 'SC';
  
  // Build Given section - multi-select events
  const givenEventsHtml = (isSC ? events : allEvents).map(e => {
    const isSelected = scenario.given?.some(g => g.elementId === e.id);
    return `
      <label class="checkbox-item ${isSelected ? 'selected' : ''}">
        <input type="checkbox" data-event-id="${e.id}" ${isSelected ? 'checked' : ''}>
        <span>${typeIcons.event} ${e.name}</span>
      </label>
    `;
  }).join('') || '<p class="empty">No events in slice</p>';
  
  // Build When section (SC only) - select command
  const whenHtml = isSC ? `
    <div class="section">
      <h4>WHEN</h4>
      <select id="whenCommandSelect" class="select-input">
        <option value="">Select command...</option>
        ${commands.map(c => `
          <option value="${c.id}" ${scenario.when?.commandId === c.id ? 'selected' : ''}>
            ${typeIcons.command} ${c.name}
          </option>
        `).join('')}
      </select>
      ${scenario.when?.commandId ? `
        <div class="values-preview">
          <code>${JSON.stringify(scenario.when.values || {}, null, 2)}</code>
        </div>
      ` : ''}
    </div>
  ` : '';
  
  // Build Then section
  let thenHtml = '';
  if (isSC) {
    // SC: event or rejection
    const isEvent = scenario.then?.type === 'event';
    const isRejection = scenario.then?.type === 'rejection';
    
    thenHtml = `
      <div class="section">
        <h4>THEN</h4>
        <div class="then-options">
          <label class="radio-item ${isEvent ? 'selected' : ''}">
            <input type="radio" name="thenType" value="event" ${isEvent ? 'checked' : ''}>
            <span>✅ Event</span>
          </label>
          <label class="radio-item ${isRejection ? 'selected' : ''}">
            <input type="radio" name="thenType" value="rejection" ${isRejection ? 'checked' : ''}>
            <span>❌ Rejection</span>
          </label>
        </div>
        
        <div id="thenEventSection" class="${isEvent ? '' : 'hidden'}">
          <select id="thenEventSelect" class="select-input">
            <option value="">Select event...</option>
            ${events.map(e => `
              <option value="${e.id}" ${scenario.then?.eventId === e.id ? 'selected' : ''}>
                ${typeIcons.event} ${e.name}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div id="thenRejectionSection" class="${isRejection ? '' : 'hidden'}">
          <input type="text" id="rejectionReasonInput" placeholder="Rejection reason..." 
                 value="${scenario.then?.reason || ''}" class="name-input">
        </div>
      </div>
    `;
  } else {
    // SV: read model state
    thenHtml = `
      <div class="section">
        <h4>THEN</h4>
        <select id="thenReadModelSelect" class="select-input">
          <option value="">Select read model...</option>
          ${readModels.map(rm => `
            <option value="${rm.id}" ${scenario.then?.readModelId === rm.id ? 'selected' : ''}>
              ${typeIcons.readModel} ${rm.name}
            </option>
          `).join('')}
        </select>
        ${scenario.then?.readModelId ? `
          <div class="values-preview">
            <code>${JSON.stringify(scenario.then.values || {}, null, 2)}</code>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  const content = `
    <div class="sheet-header">
      <h3>${scenario.name}</h3>
      <span class="badge ${scenario.type}">${scenario.type}</span>
    </div>
    <div class="sheet-body scenario-editor">
      <div class="section">
        <h4>GIVEN</h4>
        <div class="checkbox-list">
          ${givenEventsHtml}
        </div>
      </div>
      
      ${whenHtml}
      ${thenHtml}
    </div>
    <div class="sheet-actions">
      <button class="btn danger" onclick="window.scenarioDelete()">Delete</button>
      <button class="btn secondary" onclick="window.scenarioCancel()">Cancel</button>
      <button class="btn primary" onclick="window.scenarioSave()">Save</button>
    </div>
  `;
  
  window.scenarioCancel = () => {
    hideSheet();
    cleanup();
  };
  
  window.scenarioDelete = () => {
    if (confirm('Delete this scenario?')) {
      deleteScenario(scenario.id, slice.id);
      hideSheet();
      cleanup();
      if (onComplete) onComplete();
    }
  };
  
  window.scenarioSave = () => {
    // Save Given
    const givenCheckboxes = document.querySelectorAll('[data-event-id]:checked');
    const givenEvents = Array.from(givenCheckboxes).map(cb => ({
      elementId: cb.dataset.eventId,
      values: {} // TODO: property values UI
    }));
    setGiven(scenario.id, givenEvents);
    
    // Save When (SC only)
    if (isSC) {
      const commandSelect = document.getElementById('whenCommandSelect');
      if (commandSelect?.value) {
        setWhen(scenario.id, commandSelect.value, {}); // TODO: property values
      }
    }
    
    // Save Then
    if (isSC) {
      const thenType = document.querySelector('input[name="thenType"]:checked')?.value;
      if (thenType === 'event') {
        const eventSelect = document.getElementById('thenEventSelect');
        if (eventSelect?.value) {
          setThenEvent(scenario.id, eventSelect.value, {}); // TODO: property values
        }
      } else if (thenType === 'rejection') {
        const reason = document.getElementById('rejectionReasonInput')?.value?.trim();
        if (reason) {
          setThenRejection(scenario.id, reason);
        }
      }
    } else {
      const rmSelect = document.getElementById('thenReadModelSelect');
      if (rmSelect?.value) {
        setThenReadModel(scenario.id, rmSelect.value, {}); // TODO: property values
      }
    }
    
    hideSheet();
    cleanup();
    showToast('Scenario saved');
    if (onComplete) onComplete();
  };
  
  function cleanup() {
    delete window.scenarioCancel;
    delete window.scenarioDelete;
    delete window.scenarioSave;
  }
  
  showSheet(content);
  
  // Wire up Then type radio buttons
  setTimeout(() => {
    const radios = document.querySelectorAll('input[name="thenType"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        document.getElementById('thenEventSection')?.classList.toggle('hidden', radio.value !== 'event');
        document.getElementById('thenRejectionSection')?.classList.toggle('hidden', radio.value !== 'rejection');
      });
    });
  }, 100);
}

// ===========================================
// RENDER SCENARIO CARDS
// ===========================================

export function renderScenarioCards(sliceId, state, onEdit) {
  const scenarios = getScenariosForSlice(sliceId, state);
  
  if (scenarios.length === 0) {
    return '';
  }
  
  return `
    <div class="scenarios-section">
      <h4>Scenarios (${scenarios.length})</h4>
      ${scenarios.map(scn => renderScenarioCard(scn, state, onEdit)).join('')}
    </div>
  `;
}

function renderScenarioCard(scenario, state, onEdit) {
  const icon = scenario.then?.type === 'rejection' ? '❌' : '✅';
  
  // Build preview
  let preview = '';
  if (scenario.given?.length > 0) {
    const givenNames = scenario.given
      .map(g => state.elements[g.elementId]?.name)
      .filter(Boolean)
      .join(', ');
    preview += `Given: ${givenNames || '...'} `;
  }
  
  if (scenario.type === 'SC' && scenario.when?.commandId) {
    const cmdName = state.elements[scenario.when.commandId]?.name;
    preview += `When: ${cmdName || '...'} `;
  }
  
  if (scenario.then) {
    if (scenario.then.type === 'event') {
      const eventName = state.elements[scenario.then.eventId]?.name;
      preview += `Then: ${eventName || '...'}`;
    } else if (scenario.then.type === 'rejection') {
      preview += `Then: Rejected "${scenario.then.reason}"`;
    } else if (scenario.then.type === 'readModel') {
      const rmName = state.elements[scenario.then.readModelId]?.name;
      preview += `Then: ${rmName || '...'}`;
    }
  }
  
  return `
    <div class="scenario-card" onclick="window.editScenario_${scenario.id.replace(/[^a-zA-Z0-9]/g, '_')}()">
      <div class="scenario-header">
        <span class="scenario-icon">${icon}</span>
        <span class="scenario-name">${scenario.name}</span>
        <span class="badge small ${scenario.type}">${scenario.type}</span>
      </div>
      <div class="scenario-preview">${preview || 'Tap to edit...'}</div>
    </div>
  `;
}

// Wire up edit handlers
export function wireScenarioHandlers(sliceId, state, onEdit) {
  const scenarios = getScenariosForSlice(sliceId, state);
  scenarios.forEach(scn => {
    const fnName = `editScenario_${scn.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    window[fnName] = () => onEdit(scn);
  });
}

// Cleanup handlers
export function cleanupScenarioHandlers(sliceId, state) {
  const scenarios = getScenariosForSlice(sliceId, state);
  scenarios.forEach(scn => {
    const fnName = `editScenario_${scn.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    delete window[fnName];
  });
}
