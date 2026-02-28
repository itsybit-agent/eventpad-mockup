// ===========================================
// FEED RENDERER
// ===========================================

import { getEventStream, getEventCount } from '../core/eventStore.js';
import { projectState, findSourceSlice, getScenariosForSlice, getSliceDetail } from '../core/projections.js';
import { typeIcons, typeLabels, elementActions, connectionLabels, reverseConnectionLabels } from '../core/constants.js';
import { showActions } from '../features/connect/actionSheet.js';
import { promptSliceName } from '../features/nameSlice/sheet.js';
import { copyEvent } from '../features/eventLog/panel.js';
// Scenarios are handled via window.EventPad.addScenario / editScenario

// Render slice elements based on slice type
// Render properties inline
function renderInlineProperties(props) {
  if (!props || props.length === 0) return '';
  return `<div class="slice-element-props">${props.map(p => 
    `<span class="prop-badge">${p.name}: ${p.type}</span>`
  ).join('')}</div>`;
}

function renderSliceElements(elements, sliceType, state) {
  if (sliceType === 'AU') {
    return renderAUSlice(elements, state);
  }
  
  // Default: vertical list - all elements tappable for editing
  return elements.map((el, i) => `
    ${i > 0 ? '<div class="slice-arrow">↓</div>' : ''}
    <div class="slice-element slice-element-tappable" onclick="window.EventPad.openElementMenu('${el.id}')">
      <div class="slice-element-icon" style="background: var(--${el.type}); color: ${el.type === 'command' || el.type === 'processor' ? '#fff' : '#000'};">${typeIcons[el.type]}</div>
      <div class="slice-element-content">
        <span class="slice-element-name">${el.name}</span>
        ${renderInlineProperties(el.properties)}
      </div>
    </div>
  `).join('');
}

// Render AU slice with special layout
function renderAUSlice(elements, state) {
  const processor = elements.find(e => e.type === 'processor');
  const command = elements.find(e => e.type === 'command');
  const readModels = elements.filter(e => e.type === 'readModel');
  
  let html = '';
  
  // Processor at top
  if (processor) {
    html += `
      <div class="slice-element slice-element-tappable" onclick="window.EventPad.openElementMenu('${processor.id}')">
        <div class="slice-element-icon" style="background: var(--processor); color: #fff;">⚙️</div>
        <span>${processor.name}</span>
      </div>
    `;
  }
  
  // ReadModels (left) + Command (right) on same row
  if (command || readModels.length > 0) {
    if (processor) html += '<div class="slice-arrow">↓</div>';
    html += '<div class="slice-row">';
    
    // ReadModels first (left)
    readModels.forEach(rm => {
      html += `
        <div class="slice-element slice-link" onclick="window.EventPad.jumpToElementSlice('${rm.id}')" title="Tap to see source slice">
          <div class="slice-element-icon" style="background: var(--readmodel); color: #000;">🟩</div>
          <span>${rm.name}</span>
          <span class="link-indicator">↗</span>
        </div>
      `;
    });
    
    // Command (right)
    if (command) {
      html += `
        <div class="slice-element slice-link" onclick="window.EventPad.jumpToElementSlice('${command.id}')" title="Tap to see source slice">
          <div class="slice-element-icon" style="background: var(--command); color: #fff;">🟦</div>
          <span>${command.name}</span>
          <span class="link-indicator">↗</span>
        </div>
      `;
    }
    html += '</div>';
  }
  
  return html;
}

// Render a single element card
function renderElementCard(el, state) {
  const connectionsFrom = state.connections.filter(c => c.from === el.id);
  const connectionsTo = state.connections.filter(c => c.to === el.id);
  
  let connectionsHtml = '';
  
  // Outgoing connections
  connectionsFrom.forEach(conn => {
    const targetEl = state.elements[conn.to];
    if (targetEl) {
      connectionsHtml += `
        <div class="connection-item">
          <span class="connection-label">${connectionLabels[conn.relation] || conn.relation}:</span>
          <div class="connection-icon" style="background: var(--${targetEl.type}); color: ${targetEl.type === 'command' || targetEl.type === 'processor' ? '#fff' : '#000'};">${typeIcons[targetEl.type]}</div>
          <span class="connection-name">${targetEl.name}</span>
        </div>
      `;
    }
  });
  
  // Incoming connections
  connectionsTo.forEach(conn => {
    const sourceEl = state.elements[conn.from];
    if (sourceEl) {
      connectionsHtml += `
        <div class="connection-item">
          <span class="connection-label">${reverseConnectionLabels[conn.relation] || 'from'}:</span>
          <div class="connection-icon" style="background: var(--${sourceEl.type}); color: ${sourceEl.type === 'command' || sourceEl.type === 'processor' ? '#fff' : '#000'};">${typeIcons[sourceEl.type]}</div>
          <span class="connection-name">${sourceEl.name}</span>
        </div>
      `;
    }
  });
  
  const actions = elementActions[el.type] || [];
  
  return `
    <div class="element-card" data-id="${el.id}">
      <div class="element-header" onclick="window.EventPad.toggleElement('${el.id}')">
        <div class="element-icon ${el.type}">${typeIcons[el.type]}</div>
        <div class="element-info">
          <div class="element-name">${el.name}</div>
          <div class="element-type">${typeLabels[el.type]}</div>
        </div>
        <div class="element-chevron">▼</div>
      </div>
      ${connectionsHtml ? `<div class="element-connections">${connectionsHtml}</div>` : ''}
      <div class="element-properties">
        ${el.properties.length ? el.properties.map(p => `
          <div class="property" onclick="window.EventPad.openPropertySheet('${el.id}', '${p.id}')" style="cursor: pointer;">
            <span class="property-name">${p.name}</span>
            <span class="property-type">${p.type || 'string'}</span>
          </div>
        `).join('') : '<div class="property" style="font-style: italic;">No properties yet</div>'}
        <div class="add-property" onclick="window.EventPad.openPropertySheet('${el.id}')">+ Add property</div>
      </div>
      <div class="element-footer">
        <span class="element-rename" onclick="window.EventPad.renameElement('${el.id}')">✏️ Rename</span>
        <span class="element-delete" onclick="window.EventPad.deleteElement('${el.id}')">🗑️ Delete</span>
      </div>
      <div class="element-actions">
        ${actions.map(action => `
          <button class="action-btn" onclick="window.EventPad.showActions('${el.id}', event)">${action.label}</button>
        `).join('')}
      </div>
    </div>
  `;
}

// Render a slice card
function renderSliceCard(slice, state) {
  // Use SliceDetail read model to get elements with properties
  const sliceDetail = getSliceDetail(slice.id, state);
  const sliceElements = sliceDetail ? sliceDetail.elements : [];
  const scenarios = getScenariosForSlice(slice.id, state);
  
  // Safe slice name for onclick (escape quotes)
  const safeName = (slice.name || '').replace(/'/g, "\\'");
  
  // Build scenario cards HTML
  const scenarioCardsHtml = renderScenarioSection(scenarios, state);
  
  return `
    <div class="slice-card" data-slice-id="${slice.id}">
      <div class="slice-header" onclick="window.EventPad.promptSliceName('${slice.id}', '${safeName}')" style="cursor: pointer;">
        <span class="slice-name">${slice.name || '(tap to name)'}</span>
        <span class="slice-type">${slice.type}${slice.complete === false ? ' ⏳' : ''}</span>
      </div>
      <div class="slice-elements">
        ${renderSliceElements(sliceElements, slice.type, state)}
      </div>
      ${scenarioCardsHtml}
      <button class="add-scenario-btn" onclick="window.EventPad.addScenario('${slice.id}', '${slice.type}')">
        + Add Scenario
      </button>
    </div>
  `;
}

// Render scenario section for a slice
function renderScenarioSection(scenarios, state) {
  if (!scenarios || scenarios.length === 0) return '';
  
  const cards = scenarios.map(scn => {
    const icon = scn.then?.type === 'rejection' ? '❌' : '✅';
    
    // Build preview
    let preview = '';
    if (scn.given?.length > 0) {
      const givenNames = scn.given
        .map(g => state.elements[g.elementId]?.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(', ');
      if (givenNames) preview += `Given: ${givenNames} `;
    }
    
    if (scn.type === 'SC' && scn.when?.commandId) {
      const cmdName = state.elements[scn.when.commandId]?.name;
      if (cmdName) preview += `When: ${cmdName} `;
    }
    
    if (scn.then) {
      if (scn.then.type === 'event') {
        const eventName = state.elements[scn.then.eventId]?.name;
        if (eventName) preview += `Then: ${eventName}`;
      } else if (scn.then.type === 'rejection') {
        preview += `Then: Rejected`;
      } else if (scn.then.type === 'readModel') {
        const rmName = state.elements[scn.then.readModelId]?.name;
        if (rmName) preview += `Then: ${rmName}`;
      }
    }
    
    return `
      <div class="scenario-card" onclick="window.EventPad.editScenario('${scn.id}')">
        <div class="scenario-header">
          <span class="scenario-icon">${icon}</span>
          <span class="scenario-name">${scn.name}</span>
          <span class="badge small ${scn.type}">${scn.type}</span>
        </div>
        <div class="scenario-preview">${preview || 'Tap to edit...'}</div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="scenarios-section">
      <h4>Scenarios (${scenarios.length})</h4>
      ${cards}
    </div>
  `;
}

// Render event log
function renderEventLog() {
  const eventStream = getEventStream();
  return eventStream.slice().reverse().map((evt, i) => `
    <div class="event-log-item" onclick="window.EventPad.copyEvent(${eventStream.length - 1 - i}, this)">
      <span class="event-log-type">${evt.type}</span>
      <span class="event-log-time">${new Date(evt.timestamp).toLocaleTimeString()}</span>
      <div class="event-log-data">${JSON.stringify(evt.data, null, 2)}</div>
    </div>
  `).join('');
}

// Toggle element expansion
export function toggleElement(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) card.classList.toggle('expanded');
}

// Jump to element's source slice
export function jumpToElementSlice(elementId) {
  const sourceSlice = findSourceSlice(elementId);
  
  if (sourceSlice) {
    const sliceCard = document.querySelector(`[data-slice-id="${sourceSlice.id}"]`);
    if (sliceCard) {
      sliceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sliceCard.style.outline = '2px solid var(--accent)';
      setTimeout(() => sliceCard.style.outline = '', 1500);
    }
  }
}

// Main render function
export function render() {
  const state = projectState();
  const feed = document.getElementById('feed');
  const eventCount = getEventCount();
  
  // Update event count
  document.getElementById('eventCount').textContent = eventCount;
  document.getElementById('undoBtn').disabled = eventCount === 0;
  
  // Update event log
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
