// ===========================================
// FEED RENDERER
// ===========================================

import { getEventCount } from '../core/eventStore.js';
import { projectState, findSourceSlice, getScenariosForSlice, getSliceDetail } from '../core/projections.js';
import { typeIcons, typeLabels, elementActions, connectionLabels, reverseConnectionLabels } from '../core/constants.js';

// Import feature views
import { renderScenarioSection } from '../features/scenarios/view.js';
import { renderEventLog } from '../features/eventLog/view.js';

// Type label mapping
const typeBadgeLabels = {
  screen: 'SCREEN',
  command: 'COMMAND', 
  event: 'EVENT',
  readModel: 'READ MODEL',
  processor: 'PROCESSOR'
};

// Render properties inline
function renderInlineProperties(props) {
  if (!props || props.length === 0) return '';
  return `<div class="slice-element-props">${props.map(p => 
    `<span class="prop-badge">${p.name}</span>`
  ).join('')}</div>`;
}

function renderSliceElements(elements, sliceType, state) {
  if (sliceType === 'AU') {
    return renderAUSlice(elements, state);
  }
  
  // Default: vertical list - all elements tappable for editing
  return elements.map((el, i) => `
    ${i > 0 ? '<div class="slice-arrow"></div>' : ''}
    <div class="slice-element" data-type="${el.type}" onclick="window.EventPad.openElementMenu('${el.id}')">
      <div class="slice-element-header">
        <span class="element-type-badge ${el.type}">${typeBadgeLabels[el.type] || el.type}</span>
        <span class="slice-element-name">${el.name}</span>
      </div>
      ${renderInlineProperties(el.properties)}
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

// Render a single element card (loose elements not in slices)
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
  
  // Build scenario cards HTML (from scenarios feature)
  const scenarioCardsHtml = renderScenarioSection(scenarios, state);
  
  const sliceTypeLabel = slice.type === 'SC' ? 'STATE CHANGE' : slice.type === 'SV' ? 'STATE VIEW' : 'AUTOMATION';
  
  return `
    <div class="slice-card" data-slice-id="${slice.id}">
      <div class="slice-header" onclick="window.EventPad.promptSliceName('${slice.id}', '${safeName}')">
        <span class="slice-name">${slice.name || '(tap to name)'}</span>
        <span class="slice-type ${slice.type}">${sliceTypeLabel}${slice.complete === false ? ' ⏳' : ''}</span>
      </div>
      <div class="slice-elements">
        ${renderSliceElements(sliceElements, slice.type, state)}
        <button class="add-element-btn" onclick="event.stopPropagation(); window.EventPad.openCreateSheet()">+ Add element</button>
      </div>
      ${scenarioCardsHtml || `
        <div class="scenarios-section">
          <h4>SCENARIOS (0)</h4>
          <button class="add-scenario-btn" onclick="event.stopPropagation(); window.EventPad.addScenario('${slice.id}', '${slice.type}')">+ Add scenario</button>
        </div>
      `}
    </div>
  `;
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
