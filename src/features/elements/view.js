// ===========================================
// ELEMENTS - View (loose elements not in slices)
// ===========================================

import { typeIcons, typeLabels, elementActions, connectionLabels, reverseConnectionLabels } from '../../core/constants.js';

// Render a single element card
export function renderElementCard(el, state) {
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

// Toggle element expansion
export function toggleElement(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) card.classList.toggle('expanded');
}
